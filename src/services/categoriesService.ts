import {
  fetchCategories,
  fetchCategoryById,
} from "../repositories/categoriesRepository";
import { fetchCategorySequence } from "../repositories/categorySequenceRepository";

/**
 * カテゴリー関連のビジネスロジック
 */

//=====取得系メソッド=====
// カテゴリーをIDで取得
export const getCategory = async (ownerId: string, categoryId: string) => {
  try {
    const category = await fetchCategoryById(ownerId, categoryId);
    return category;
  } catch (error) {
    console.error(
      `商品カテゴリーID: ${categoryId} の取得に失敗しました:`,
      error
    );
    return null;
  }
};

// カテゴリを順序情報に基づいて取得する関数
export const getSortedCategories = async (ownerId: string) => {
  try {
    // カテゴリデータと順序情報を並行して取得
    const [categories, categoryIds] = await Promise.all([
      fetchCategories(ownerId),
      fetchCategorySequence(ownerId),
    ]);

    // 順序情報がない場合はデフォルトの順序（更新日時の降順）でカテゴリを返す
    if (!categoryIds || categoryIds.length === 0) {
      return categories.sort(
        (a, b) =>
          (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime()
      );
    }

    // カテゴリをマップに変換して検索を効率化
    const categoryMap = new Map(
      categories.map((category) => [category.id, category])
    );

    // 指定された順序でカテゴリを並び替え
    const sortedCategories = categoryIds
      .filter((id) => categoryMap.has(id)) // 存在するカテゴリのみフィルタリング
      .map((id) => categoryMap.get(id)!);

    // 順序情報にないカテゴリ（新しく追加されたものなど）を末尾に追加
    const unsortedCategories = categories.filter(
      (category) => !categoryIds.includes(category.id)
    );

    return [...sortedCategories, ...unsortedCategories];
  } catch (error) {
    console.error("並び替えしたカテゴリの取得に失敗しました", error);
    return [];
  }
};
