import fs from "fs";
import { deleteImageFromS3, uploadFileToS3 } from "@/utils/s3";
import { ShopData } from "../models/Shop";
import { addShop, updateShop } from "../repositories/shopRepository";
import { formatZodError, shopSchema } from "../validation/shopSchema";

// ショップの作成（画像処理を含む）
export const createShopWithImage = async (
  userId: string,
  shopData: Partial<ShopData>,
  imageFile?: Express.Multer.File
): Promise<{ id: string } | { error: boolean; message: string }> => {
  try {
    console.log("サービス層: 受信したデータ", {
      userId,
      shopData,
      ファイル: imageFile ? "あり" : "なし",
    });
    // バリデーション（画像ファイルがある場合は画像URLとパスの検証をスキップ）
    const validationSchema = imageFile
      ? shopSchema.omit({ imageUrl: true, imagePath: true })
      : shopSchema;

    const validation = validationSchema.safeParse(shopData);
    console.log("バリデーション結果:", validation.success ? "成功" : "失敗");
    if (!validation.success) {
      return formatZodError(validation.error);
    }

    // 新しい画像ファイルがある場合は処理
    // 新しい画像ファイルがある場合は処理
    if (imageFile) {
      try {
        // ファイルの存在を確認
        const fileStat = fs.statSync(imageFile.path);
        console.log(
          `アップロードするファイル: ${imageFile.path}, サイズ: ${fileStat.size}バイト`
        );

        // JPEGファイルの検証（オプション）
        if (imageFile.mimetype === "image/jpeg") {
          const header = Buffer.alloc(2);
          const fd = fs.openSync(imageFile.path, "r");
          fs.readSync(fd, header, 0, 2, 0);
          fs.closeSync(fd);

          if (header[0] !== 0xff || header[1] !== 0xd8) {
            console.error("⚠️ 警告: 無効なJPEGシグネチャです");
          } else {
            console.log("✓ 有効なJPEGシグネチャを確認しました");
          }
        }

        // S3にアップロード
        const result = await uploadFileToS3(
          imageFile.path,
          imageFile.originalname,
          imageFile.mimetype,
          userId,
          "shops"
        );

        shopData.imageUrl = result.imageUrl;
        shopData.imagePath = result.imagePath;
      } catch (error) {
        return {
          error: true,
          message:
            error instanceof Error
              ? error.message
              : "画像のアップロードに失敗しました",
        };
      }
    }

    // ショップを作成
    const shopId = await addShop(userId, shopData as ShopData);

    return { id: shopId };
  } catch (error) {
    console.error("ショップ作成エラー:", error);
    return {
      error: true,
      message:
        error instanceof Error ? error.message : "店舗の作成に失敗しました",
    };
  }
};

// ショップの更新（画像処理を含む）
export const updateShopWithImage = async (
  userId: string,
  shopData: Partial<ShopData>,
  imageFile?: Express.Multer.File,
  oldImagePath?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    // バリデーション（部分更新可能）
    const validationSchema = shopSchema.partial();
    const validation = validationSchema.safeParse(shopData);
    if (!validation.success) {
      return {
        success: false,
        message: formatZodError(validation.error).message,
      };
    }

    // 新しい画像ファイルがある場合は処理
    if (imageFile) {
      try {
        // ファイルの存在を確認
        const fileStat = fs.statSync(imageFile.path);
        console.log(
          `更新用アップロードファイル: ${imageFile.path}, サイズ: ${fileStat.size}バイト`
        );

        // JPEGファイルの検証（オプション）
        if (imageFile.mimetype === "image/jpeg") {
          const header = Buffer.alloc(2);
          const fd = fs.openSync(imageFile.path, "r");
          fs.readSync(fd, header, 0, 2, 0);
          fs.closeSync(fd);

          if (header[0] !== 0xff || header[1] !== 0xd8) {
            console.error("⚠️ 警告: 無効なJPEGシグネチャです");
          } else {
            console.log("✓ 有効なJPEGシグネチャを確認しました");
          }
        }

        // S3にアップロード
        const result = await uploadFileToS3(
          imageFile.path,
          imageFile.originalname,
          imageFile.mimetype,
          userId,
          "shops"
        );

        shopData.imageUrl = result.imageUrl;
        shopData.imagePath = result.imagePath;

        // 古い画像が存在する場合は削除
        if (oldImagePath && oldImagePath !== result.imagePath) {
          await deleteImageFromS3(oldImagePath);
        }
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "画像の処理に失敗しました",
        };
      }
    }

    // ショップを更新
    await updateShop(userId, shopData);

    return { success: true };
  } catch (error) {
    console.error("ショップ更新エラー:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "店舗の更新に失敗しました",
    };
  }
};
