import { Shop } from "../models/Shop";
import { fetchShop } from "../repositories/shopRepository";

/**
 * ショップのサービス層
 * ビジネスロジックとリポジトリ層の橋渡しを担当
 */
export const getShop = async (ownerId: string): Promise<Shop | null> => {
  try {
    // ここでビジネスロジックを追加できます
    // 例えば、キャッシュの確認、複数リポジトリの結合、権限確認など

    const shop = await fetchShop(ownerId);

    // ここで取得したショップデータに対する加工や検証を行える
    // 例：isVisibleがtrueの場合のみ返すなど

    return shop;
  } catch (error) {
    console.error("ショップサービスエラー:", error);
    throw new Error("ショップ情報の取得に失敗しました");
  }
};
