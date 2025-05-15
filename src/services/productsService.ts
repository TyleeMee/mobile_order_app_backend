import { fetchProductSequence } from "../repositories/productSequencesRepository";
import {
  fetchProductById,
  fetchProductsInCategory,
  fetchProductsByIds,
} from "../repositories/productsRepository";

// =====取得メソッド=====
//TODO バックエンドのservice層の全ての取得メソッド（product以外も）でTimestamp型→Date型 Integer→number型に（多分priceだけ）
//TODO createやupdateでは逆のことはしなくて平気？

// 特定の商品をIDで取得
export const getProduct = async (uid: string, productId: string) => {
  try {
    // データリポジトリから商品を取得
    const product = await fetchProductById(uid, productId);
    return product;
  } catch (error) {
    console.error(`商品ID: ${productId} の取得に失敗しました:`, error);
    return null;
  }
};

// カテゴリ内の製品を並び順で取得
export const getSortedProductsInCategory = async (
  ownerId: string,
  categoryId: string
) => {
  try {
    // 製品データと順序情報を並行して取得
    const [products, sortedIds] = await Promise.all([
      fetchProductsInCategory(ownerId, categoryId),
      fetchProductSequence(ownerId, categoryId),
    ]);

    // 順序情報がない場合はデフォルトの順序（更新日時など）で製品を返す
    if (!sortedIds || sortedIds.length === 0) {
      return products.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    // 製品をマップに変換して検索を効率化
    const productMap = new Map(
      products.map((product) => [product.id, product])
    );

    // 指定された順序で製品を並び替え
    const sortedProducts = sortedIds
      .filter((id) => productMap.has(id)) // 存在する製品のみフィルタリング
      .map((id) => productMap.get(id)!);

    // 順序情報にない製品（新しく追加されたものなど）を末尾に追加
    const unsortedProducts = products.filter(
      (product) => !sortedIds.includes(product.id)
    );

    return [...sortedProducts, ...unsortedProducts];
  } catch (error) {
    console.error(
      `カテゴリID: ${categoryId} の並び順製品取得に失敗しました:`,
      error
    );
    return [];
  }
};

// 複数の商品IDから商品リストを取得
export const getProductsByIds = async (
  ownerId: string,
  productIds: string[]
) => {
  try {
    // 空の配列の場合は早期リターン
    if (!productIds.length) {
      return [];
    }

    // データリポジトリから商品を取得
    const products = await fetchProductsByIds(ownerId, productIds);
    return products;
  } catch (error) {
    console.error(
      `複数商品ID: [${productIds.join(", ")}] の取得に失敗しました:`,
      error
    );
    return [];
  }
};
