import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";
import { fromIni } from "@aws-sdk/credential-providers";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import fs from "fs";
import path from "path";

// 環境変数の読み込み
dotenv.config();

// SSL設定（環境に応じて動的に設定）
let sslConfig: any = {
  rejectUnauthorized: false, // SSL証明書の検証をスキップ
  // ssl: true, // SSL接続を要求
};

// 本番環境で証明書を読み込む
if (process.env.NODE_ENV === "production") {
  // CA証明書パスの設定
  console.log("証明書ファイルのパス:読み込み開始");
  const caCertPath = path.join(__dirname, "../certs/ap-northeast-1-bundle.pem");
  console.log("証明書ファイル存在確認:", fs.existsSync(caCertPath));

  try {
    // 証明書ファイルが存在するか確認
    if (fs.existsSync(caCertPath)) {
      const caCert = fs.readFileSync(caCertPath).toString();

      // SSL設定を明示的に構成
      sslConfig = {
        ca: caCert,
        rejectUnauthorized: true,
        // 追加: 証明書の検証方法を厳密に指定
        checkServerIdentity: (host: string, cert: any) => {
          // ホスト名の検証をするか、nullを返して通常の検証を行う
          return null;
        },
      };

      console.log("本番環境: SSL証明書を設定しました");
    } else {
      console.warn(
        "警告: SSL証明書ファイルが見つかりません。証明書検証をスキップします"
      );
    }
  } catch (error) {
    console.error("SSL証明書の読み込みに失敗しました:", error);
    console.warn(
      "警告: SSL接続でもエラー発生を防ぐため、証明書検証をスキップします"
    );
  }
}

// データベース接続設定（基本設定）
const dbConfig = {
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslConfig,
};

// 既存のプール - 環境変数のホストを使用
export const pool = new Pool({
  host: process.env.DB_HOST,
  ...dbConfig,
  // デバッグレベルを追加
  ssl: {
    ...sslConfig,
    debug: console.log, // SSL関連のデバッグ情報を出力
  },
});

// 動的プール生成関数
export const getPool = async (): Promise<Pool> => {
  // 開発環境ではAWS SDKを使わず直接接続
  if (process.env.NODE_ENV !== "production") {
    console.log("開発環境: 直接DB_HOSTを使用します");
    return pool;
  }
  // AWS SDKを使用しない場合は既存のプールを返す
  if (process.env.NODE_ENV === "production") {
    console.log("本番環境: 直接DB_HOSTを使用します");
    return pool;
  }

  // AWS SDKを使用する場合はRDSエンドポイントを取得
  try {
    const rdsClient = new RDSClient({
      region: process.env.REGION || "ap-northeast-1",
      credentials: fromIni({ profile: "myprofile" }),
    });

    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: process.env.DB_INSTANCE_ID,
    });

    const response = await rdsClient.send(command);
    const endpoint = response.DBInstances?.[0]?.Endpoint?.Address;

    if (!endpoint) {
      console.warn(
        "RDSエンドポイントが見つかりません。環境変数のDBホストを使用します。"
      );
      return pool;
    }

    console.log(`RDSエンドポイントを取得しました: ${endpoint}`);
    return new Pool({
      host: endpoint,
      ...dbConfig,
    });
  } catch (error) {
    console.error("RDSエンドポイントの取得に失敗しました:", error);
    console.warn("環境変数のDBホストを使用します。");
    return pool;
  }
};

// データベース接続テスト
export const testDbConnection = async (): Promise<boolean> => {
  let client: PoolClient | null = null;
  try {
    console.log("接続設定:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      // パスワードはセキュリティのため表示しない
    });

    const dynamicPool = await getPool();
    console.log("プール取得成功、接続を試みます...");
    client = await dynamicPool.connect();
    console.log("PostgreSQL データベース接続成功");
    return true;
  } catch (err) {
    console.error("データベース接続エラー:", err);
    return false;
  } finally {
    if (client) client.release();
  }
};
