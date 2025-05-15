import { fromIni } from "@aws-sdk/credential-providers";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// 環境に応じたS3クライアント設定を取得する関数
const getS3ClientConfig = () => {
  const config = {
    region: process.env.REGION || "ap-northeast-1",
  };

  // ローカル環境でのみプロファイルを使用
  if (process.env.NODE_ENV !== "production") {
    return {
      ...config,
      credentials: fromIni({ profile: "myprofile" }),
    };
  }
  // ローカル環境でのみプロファイルを使用
  if (process.env.NODE_ENV !== "production") {
    return {
      ...config,
      credentials: fromIni({ profile: "myprofile" }),
    };
  }

  // 本番環境ではIAMロールに依存するため、明示的な認証情報は不要
  return config;
  // 本番環境ではIAMロールに依存するため、明示的な認証情報は不要
  return config;
};

// S3クライアントの設定
export const s3Client = new S3Client(getS3ClientConfig());

// s3.ts の uploadImageToS3 関数を修正
export const uploadImageToS3 = async (
  file: Express.Multer.File,
  userId: string,
  folderPath: string
): Promise<{ imageUrl: string; imagePath: string }> => {
  try {
    console.log("S3アップロード開始:", {
      バケット名: process.env.S3_BUCKET_NAME,
      リージョン: process.env.REGION,
      ファイル名: file.originalname,
      ファイルサイズ: file.size, // サイズをログに追加
      ユーザーID: userId,
      フォルダパス: folderPath,
    });

    const timestamp = Date.now();

    const filename = `${userId}/${timestamp}_${Buffer.from(
      file.originalname,
      "utf8"
    ).toString("hex")}`;
    const s3Path = `${folderPath}/${filename}`;

    // バッファを明示的に確認
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error("ファイルバッファが空または無効です");
    }

    console.log(`ファイルバッファサイズ: ${file.buffer.length} bytes`);

    // S3にアップロード（Content-Lengthを明示的に指定）
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: s3Path,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.buffer.length,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(uploadCommand);

    console.log("S3アップロード結果:", result);

    // アップロード後に確認
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || "",
        Key: s3Path,
      });
      const headResult = await s3Client.send(headCommand);
      console.log("アップロード確認結果:", {
        ContentLength: headResult.ContentLength,
        ContentType: headResult.ContentType,
        ETag: headResult.ETag,
      });
    } catch (headErr) {
      console.warn("アップロード確認エラー:", headErr);
    }

    // 公開URLを返す
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${s3Path}`;

    return {
      imageUrl,
      imagePath: s3Path,
    };
  } catch (error) {
    console.error("S3への画像アップロードに失敗:", error);
    throw new Error("画像のアップロードに失敗しました");
  }
};

export const uploadFileToS3 = async (
  filePath: string,
  originalName: string,
  contentType: string,
  userId: string,
  folderPath: string
): Promise<{ imageUrl: string; imagePath: string }> => {
  try {
    console.log("ファイルパスからS3アップロード開始:", {
      ファイルパス: filePath,
      ファイル名: originalName,
      ContentType: contentType,
      ユーザーID: userId,
      フォルダパス: folderPath,
    });

    // ファイルが存在することを確認
    if (!fs.existsSync(filePath)) {
      throw new Error(`ファイルが存在しません: ${filePath}`);
    }

    // ファイルの読み込み
    const fileContent = fs.readFileSync(filePath);
    // デバッグのため最初の16バイトを出力
    console.log(
      "アップロード前のファイルヘッダー:",
      Buffer.from(fileContent.slice(0, 16)).toString("hex")
    );
    const fileSize = fs.statSync(filePath).size;

    console.log(`ファイルサイズ: ${fileSize} bytes`);

    // S3のキーを生成
    const timestamp = Date.now();
    const safeFileName = originalName.replace(/\s/g, "_");
    const s3Key = `${folderPath}/${userId}/${timestamp}_${safeFileName}`;

    // S3にアップロード
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(uploadCommand);

    console.log("S3アップロード結果:", result);

    // アップロード後の検証
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || "",
        Key: s3Key,
      });
      const headResult = await s3Client.send(headCommand);
      console.log("アップロード確認結果:", {
        ContentLength: headResult.ContentLength,
        ContentType: headResult.ContentType,
        ETag: headResult.ETag,
      });

      // アップロードしたファイルのサイズを元のファイルと比較
      if (headResult.ContentLength !== fileSize) {
        console.error(
          `警告: アップロードファイルサイズの不一致 - 元: ${fileSize}, S3: ${headResult.ContentLength}`
        );
      }
    } catch (headErr) {
      console.warn("アップロード確認エラー:", headErr);
    }

    // 一時ファイルを削除
    try {
      fs.unlinkSync(filePath);
      console.log(`一時ファイル削除: ${filePath}`);
    } catch (unlinkErr) {
      console.warn(`一時ファイル削除エラー: ${unlinkErr}`);
    }

    // URLを生成して返す
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${s3Key}`;

    return {
      imageUrl,
      imagePath: s3Key,
    };
  } catch (error) {
    console.error("S3への画像アップロードに失敗:", error);
    throw new Error("画像のアップロードに失敗しました");
  }
};

// S3から画像を削除する共通関数
export const deleteImageFromS3 = async (imagePath: string): Promise<void> => {
  try {
    if (!imagePath) return;

    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: imagePath,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3Client.send(deleteCommand);
    console.log(`画像を削除しました: ${imagePath}`);
  } catch (error) {
    console.error("S3からの画像削除に失敗:", error);
    // エラーはスローせず、ログだけ残す
  }
};

// テスト用関数（確認後に削除可能）
export const testS3Connection = async () => {
  try {
    const testCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || "",
      Key: "test-connection.txt",
      Body: Buffer.from("接続テスト"),
      ContentType: "text/plain",
    });

    const result = await s3Client.send(testCommand);
    console.log("S3接続テスト成功:", result);
    return true;
  } catch (error) {
    console.error("S3接続テスト失敗:", error);
    return false;
  }
};
