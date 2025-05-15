import { pool } from "../config/database";
import { Product } from "../models/Product";

/**
 * 商品のデータアクセス層
 */

//=====取得メソッド=====

// 全商品取得
export const fetchProducts = async (uid: string): Promise<Product[]> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id as "ownerId", category_id as "categoryId", title, 
         image_url as "imageUrl", image_path as "imagePath", description, price,
         is_visible as "isVisible", is_order_accepting as "isOrderAccepting", 
         created_at as "createdAt", updated_at as "updatedAt"
         FROM products
         WHERE owner_id = $1`,
        [uid]
      );

      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("商品の取得に失敗しました:", error);
    throw new Error("商品の取得に失敗しました");
  }
};

// カテゴリ内の商品取得
export const fetchProductsInCategory = async (
  ownerId: string,
  categoryId: string
): Promise<Product[]> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id as "ownerId", category_id as "categoryId", title, 
         image_url as "imageUrl", image_path as "imagePath", description, price,
         is_visible as "isVisible", is_order_accepting as "isOrderAccepting", 
         created_at as "createdAt", updated_at as "updatedAt"
         FROM products
         WHERE owner_id = $1 AND category_id = $2`,
        [ownerId, categoryId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      `カテゴリID: ${categoryId} 内の商品取得に失敗しました:`,
      error
    );
    throw new Error("カテゴリ内の商品取得に失敗しました");
  }
};

// 商品ID指定で取得
export const fetchProductById = async (
  ownerId: string,
  productId: string
): Promise<Product | null> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id as "ownerId", category_id as "categoryId", title, 
         image_url as "imageUrl", image_path as "imagePath", description, price,
         is_visible as "isVisible", is_order_accepting as "isOrderAccepting", 
         created_at as "createdAt", updated_at as "updatedAt"
         FROM products
         WHERE owner_id = $1 AND id = $2`,
        [ownerId, productId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`商品ID: ${productId} の取得に失敗しました:`, error);
    throw new Error("商品の取得に失敗しました");
  }
};

// 複数商品IDから商品を取得
export const fetchProductsByIds = async (
  ownerId: string,
  productIds: string[]
): Promise<Product[]> => {
  try {
    // 空の配列の場合は早期リターン
    if (!productIds.length) {
      return [];
    }

    const client = await pool.connect();
    try {
      // プレースホルダーを作成 ($2, $3, ...)
      const placeholders = productIds
        .map((_, index) => `$${index + 2}`)
        .join(",");

      const query = `
        SELECT id, owner_id as "ownerId", category_id as "categoryId", title, 
         image_url as "imageUrl", image_path as "imagePath", description, price,
         is_visible as "isVisible", is_order_accepting as "isOrderAccepting", 
         created_at as "createdAt", updated_at as "updatedAt"
         FROM products
         WHERE owner_id = $1 AND id IN (${placeholders})`;

      const result = await client.query(query, [ownerId, ...productIds]);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      `複数商品ID: [${productIds.join(", ")}] の取得に失敗しました:`,
      error
    );
    throw new Error("複数商品の取得に失敗しました");
  }
};

// 商品IDからタイトルを取得
export const fetchProductTitleById = async (
  uid: string,
  productId: string
): Promise<string | null> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT title FROM products WHERE owner_id = $1 AND id = $2`,
        [uid, productId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].title;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`商品ID: ${productId} のタイトル取得に失敗しました:`, error);
    throw new Error("商品タイトルの取得に失敗しました");
  }
};
