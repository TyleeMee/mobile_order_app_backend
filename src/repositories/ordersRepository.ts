import { pool } from "../config/database";
import {
  Order,
  OrderData,
  OrderID,
  OrderStatus,
  OrderWithProductTitles,
} from "../models/Order";
import { orderStatusFromString } from "../models/Order";
import { ProductID } from "../models/Product";

/**
 * 注文のデータアクセス層
 */

// =====ヘルパー関数=====

/**
 * レコードからOrderオブジェクトに変換する関数
 */
const toOrder = (row: any): Order => {
  return {
    id: row.id,
    ownerId: row.owner_id,
    userId: row.user_id,
    pickupId: row.pickup_id,
    items: row.items,
    productIds: row.product_ids,
    orderStatus: orderStatusFromString(row.order_status),
    orderDate: row.order_date,
    total: row.total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// =====作成メソッド=====

/**
 * 注文を作成する
 */
export const addOrder = async (orderData: OrderData): Promise<Order> => {
  try {
    const client = await pool.connect();
    try {
      const now = new Date();
      // RETURNING句を使用して、挿入と同時に全フィールドを取得
      const result = await client.query(
        `INSERT INTO orders 
         (owner_id, user_id, pickup_id, items, product_ids, order_status, order_date, total, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING id, owner_id, user_id, pickup_id, items, product_ids, order_status, order_date, total, created_at, updated_at`,
        [
          orderData.ownerId,
          orderData.userId || null,
          orderData.pickupId,
          JSON.stringify(orderData.items),
          orderData.productIds,
          orderData.orderStatus,
          orderData.orderDate,
          orderData.total,
          now,
          now,
        ]
      );

      // 挿入した結果を直接Order型に変換して返す
      return toOrder(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("注文の作成に失敗しました:", error);
    throw new Error("注文の作成に失敗しました");
  }
};

// =====取得メソッド=====

export const fetchOrdersByIds = async (
  ownerId: string,
  orderIds: string[]
): Promise<Order[]> => {
  try {
    if (!orderIds.length) {
      return [];
    }

    const client = await pool.connect();
    try {
      const placeholders = orderIds
        .map((_, index) => `$${index + 2}`)
        .join(",");

      const query = `
        SELECT id, owner_id, user_id, pickup_id, items, product_ids, 
               order_status, order_date, total, created_at, updated_at 
        FROM orders 
        WHERE owner_id = $1 AND id IN (${placeholders})`;

      const result = await client.query(query, [ownerId, ...orderIds]);

      // orderIdsの順序に合わせて注文を取得
      const ordersMap = new Map(
        result.rows.map((row) => [row.id, toOrder(row)])
      );
      const sortedOrders: Order[] = [];

      for (const id of orderIds) {
        if (ordersMap.has(id)) {
          sortedOrders.push(ordersMap.get(id)!);
        }
      }

      return sortedOrders;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      `複数注文ID: [${orderIds.join(", ")}] の取得に失敗しました:`,
      error
    );
    throw new Error("複数注文の取得に失敗しました");
  }
};

/**
 * 注文IDで取得
 */
export const fetchOrderById = async (
  ownerId: string,
  orderId: string
): Promise<Order | null> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id, user_id, pickup_id, items, product_ids, 
         order_status, order_date, total, created_at, updated_at 
         FROM orders 
         WHERE owner_id = $1 AND id = $2`,
        [ownerId, orderId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return toOrder(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`注文ID: ${orderId} の取得に失敗しました:`, error);
    throw new Error("注文の取得に失敗しました");
  }
};

/**
 * ユーザーの注文を取得する関数
 */
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, owner_id, user_id, pickup_id, items, product_ids, 
         order_status, order_date, total, created_at, updated_at 
         FROM orders 
         WHERE user_id = $1
         ORDER BY order_date DESC`,
        [userId]
      );

      return result.rows.map(toOrder);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("ユーザー注文の取得に失敗しました:", error);
    throw new Error("ユーザー注文の取得に失敗しました");
  }
};

// =====更新メソッド=====

/**
 * 注文ステータスを更新する
 */
export const updateOrderStatus = async (
  ownerId: string,
  orderId: string,
  newStatus: OrderStatus
): Promise<void> => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE orders 
         SET order_status = $1, updated_at = NOW() 
         WHERE owner_id = $2 AND id = $3`,
        [newStatus, ownerId, orderId]
      );

      if (result.rowCount === 0) {
        throw new Error("注文が見つからないか、更新する権限がありません");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      `注文ID: ${orderId} の注文ステータスの更新に失敗しました:`,
      error
    );
    throw new Error("注文ステータスの更新に失敗しました");
  }
};
