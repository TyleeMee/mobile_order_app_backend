import { pool } from "../config/database";
import { Shop, ShopData } from "../models/Shop";

/**
 * ショップのデータアクセス層
 */

//=====取得メソッド=====
export const fetchShop = async (ownerId: string): Promise<Shop | null> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id as "ownerId", title, image_url as "imageUrl", 
         image_path as "imagePath", description, prefecture, city, 
         street_address as "streetAddress", building, is_visible as "isVisible", 
         is_order_accepting as "isOrderAccepting", created_at as "createdAt", updated_at as "updatedAt"
         FROM shops
         WHERE owner_id = $1`,
        [ownerId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        id: result.rows[0].id,
        ownerId: result.rows[0].ownerId,
        title: result.rows[0].title,
        imageUrl: result.rows[0].imageUrl,
        imagePath: result.rows[0].imagePath,
        description: result.rows[0].description,
        prefecture: result.rows[0].prefecture,
        city: result.rows[0].city,
        streetAddress: result.rows[0].streetAddress,
        building: result.rows[0].building,
        isVisible: result.rows[0].isVisible,
        isOrderAccepting: result.rows[0].isOrderAccepting,
        createdAt: result.rows[0].createdAt,
        updatedAt: result.rows[0].updatedAt,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("店舗情報の取得に失敗しました:", error);
    throw new Error("店舗情報の取得に失敗しました");
  }
};
