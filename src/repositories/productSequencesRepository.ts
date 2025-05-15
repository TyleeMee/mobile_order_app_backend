import { pool } from "../config/database";

/**
 * 商品順序管理のデータアクセス層
 */

// =====取得メソッド=====

// カテゴリ内の商品順序を取得
export const fetchProductSequence = async (
  ownerId: string,
  categoryId: string
): Promise<string[] | null> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT product_ids FROM product_sequences WHERE owner_id = $1 AND category_id = $2",
        [ownerId, categoryId]
      );

      if (result.rows.length === 0) {
        return null; // 順序情報がまだ存在しない場合
      }

      return result.rows[0].product_ids || [];
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      `カテゴリID: ${categoryId} の商品順序取得に失敗しました:`,
      error
    );
    return null;
  }
};
