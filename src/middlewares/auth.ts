import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import dotenv from "dotenv";

// 環境変数の読み込み
dotenv.config();

// Cognito設定
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_REGION = process.env.COGNITO_REGION || "ap-northeast-1";

// JWKSを格納する変数
let jwks: any = null;
let jwkCache: { [key: string]: string } = {};

// リクエストにユーザー情報を追加する型拡張
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        groups?: string[];
      };
    }
  }
}

/**
 * Cognitoの公開鍵を取得する関数
 */
const getPublicKeys = async (): Promise<{ [key: string]: string }> => {
  if (jwks !== null && Object.keys(jwkCache).length > 0) {
    return jwkCache;
  }

  try {
    // JWKSエンドポイントからキーを取得
    const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
    const response = await fetch(url);
    jwks = await response.json();

    // JWKをPEMに変換してキャッシュ
    const keys: { [key: string]: string } = {};
    jwks.keys.forEach((key: any) => {
      keys[key.kid] = jwkToPem(key);
    });

    jwkCache = keys;
    return keys;
  } catch (error) {
    console.error("Cognitoの公開鍵取得に失敗しました:", error);
    throw new Error("認証サーバーとの通信に失敗しました");
  }
};

/**
 * トークンのペイロードを検証する関数
 */
const validateToken = (token: string, pem: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, pem, { algorithms: ["RS256"] }, (err, decodedToken) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(decodedToken);
    });
  });
};

/**
 * JWTトークンヘッダーからkidを取得する関数
 */
const getKidFromToken = (token: string): string | null => {
  try {
    const tokenHeader = token.split(".")[0];
    const decodedHeader = JSON.parse(
      Buffer.from(tokenHeader, "base64").toString("utf8")
    );
    return decodedHeader.kid;
  } catch (error) {
    console.error("トークンヘッダーの解析に失敗しました:", error);
    return null;
  }
};

/**
 * Amazon Cognito認証ミドルウェア
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "認証トークンがありません" });
    }

    // Bearer スキーマの確認
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "認証形式が正しくありません" });
    }

    const token = parts[1];

    // トークンからkidを取得
    const kid = getKidFromToken(token);
    if (!kid) {
      return res.status(401).json({ message: "無効なトークン形式です" });
    }

    // 公開鍵を取得
    const keys = await getPublicKeys();
    const pem = keys[kid];

    if (!pem) {
      return res
        .status(401)
        .json({ message: "トークン検証に必要な鍵が見つかりません" });
    }

    // トークン検証
    const decodedToken = await validateToken(token, pem);

    // トークンのクレームを検証
    if (
      decodedToken.token_use !== "access" &&
      decodedToken.token_use !== "id"
    ) {
      return res.status(401).json({ message: "無効なトークンタイプです" });
    }

    // ユーザー情報の取得方法はトークンタイプによって異なる
    const userId = decodedToken.sub || decodedToken.client_id;
    const email = decodedToken.email || "";
    const groups = decodedToken["cognito:groups"] || [];

    // リクエストオブジェクトにユーザー情報を追加
    req.user = {
      id: userId,
      email: email,
      groups: groups,
    };

    // 次のミドルウェアへ
    next();
  } catch (error) {
    console.error("認証エラー:", error);
    return res.status(401).json({ message: "無効な認証トークンです" });
  }
};
