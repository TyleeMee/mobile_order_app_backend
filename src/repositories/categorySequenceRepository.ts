import { pool } from "../config/database";

/**
 * カテゴリー順序管理のデータアクセス層
 */

// =====取得メソッド=====
// カテゴリ順序情報を取得
export const fetchCategorySequence = async (
  ownerId: string
): Promise<string[]> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT category_ids FROM category_sequence WHERE owner_id = $1",
        [ownerId]
      );

      if (result.rows.length === 0) {
        return [];
      }

      return result.rows[0].category_ids || [];
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("カテゴリ順序の取得に失敗しました:", error);
    return [];
  }
};
