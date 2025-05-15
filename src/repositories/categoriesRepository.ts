import { pool } from "../config/database";
import { Category } from "../models/Category";

/**
 * カテゴリーのデータアクセス層
 */

//=====取得メソッド=====
export const fetchCategories = async (ownerId: string): Promise<Category[]> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id as "ownerId", title, created_at as "createdAt", updated_at as "updatedAt"
         FROM categories
         WHERE owner_id = $1`,
        [ownerId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        ownerId: row.ownerId,
        title: row.title,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("カテゴリの取得に失敗しました:", error);
    throw new Error("カテゴリの取得に失敗しました");
  }
};

export const fetchCategoryById = async (
  ownerId: string,
  categoryId: string
): Promise<Category> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id as "ownerId", title, created_at as "createdAt", updated_at as "updatedAt"
         FROM categories
         WHERE owner_id = $1 AND id = $2`,
        [ownerId, categoryId]
      );

      if (result.rows.length === 0) {
        throw new Error("指定されたカテゴリが見つかりません");
      }

      return {
        id: result.rows[0].id,
        ownerId: result.rows[0].ownerId,
        title: result.rows[0].title,
        createdAt: result.rows[0].createdAt,
        updatedAt: result.rows[0].updatedAt,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`カテゴリID: ${categoryId} の取得に失敗しました:`, error);
    throw new Error("カテゴリの取得に失敗しました");
  }
};
