import { Product } from "./../models/Product";
import {
  fetchOrdersByIds,
  fetchOrderById,
  updateOrderStatus,
  addOrder,
} from "../repositories/ordersRepository";
import { fetchProductsByIds } from "../repositories/productsRepository";
import {
  Order,
  OrderData,
  OrderWithProductTitles,
  OrderStatus,
  OrderResult,
} from "../models/Order";
import {
  formatZodError,
  orderSchema,
  orderStatusUpdateSchema,
} from "../validation/orderSchema";

/**
 * 注文を作成する
 */
/**
 * 注文を作成する
 */
export const createOrder = async (
  orderData: Partial<OrderData>
): Promise<OrderWithProductTitles | null> => {
  try {
    // バリデーション
    const validation = orderSchema.safeParse(orderData);
    if (!validation.success) {
      // バリデーションエラーの場合はnullを返す
      console.error("バリデーションエラー:", validation.error);
      return null;
    }

    // 注文を作成
    const newOrder = await addOrder(orderData as OrderData);

    // 製品タイトル情報を付加
    const ordersWithTitles = await enrichOrdersWithProductTitles(
      orderData.ownerId!,
      [newOrder]
    );
    return ordersWithTitles[0];
  } catch (error) {
    console.error("注文作成エラー:", error);
    return null;
  }
};

/**
 * 複数の注文IDから注文を取得し、製品タイトル情報を付加する
 */
export const getOrdersByIds = async (
  ownerId: string,
  orderIds: string[]
): Promise<OrderWithProductTitles[]> => {
  try {
    // 注文IDが空の場合は早期リターン
    if (!orderIds.length) {
      return [];
    }

    // 指定された注文IDの注文を取得
    const orders = await fetchOrdersByIds(ownerId, orderIds);

    // 製品タイトル情報を付加
    return await enrichOrdersWithProductTitles(ownerId, orders);
  } catch (error) {
    console.error(
      `複数注文ID: [${orderIds.join(", ")}] の取得に失敗しました:`,
      error
    );
    throw new Error("複数注文の取得に失敗しました");
  }
};

/**
 * 注文IDで取得し、製品タイトル情報を付加する
 */
export const getOrderById = async (
  ownerId: string,
  orderId: string
): Promise<OrderWithProductTitles | null> => {
  try {
    // 注文を取得
    const order = await fetchOrderById(ownerId, orderId);

    if (!order) {
      return null;
    }

    // 製品タイトル情報を付加
    const ordersWithTitles = await enrichOrdersWithProductTitles(ownerId, [
      order,
    ]);
    return ordersWithTitles[0];
  } catch (error) {
    console.error(`注文ID: ${orderId} の取得に失敗しました:`, error);
    throw new Error("注文の取得に失敗しました");
  }
};

/**
 * 注文ステータスを更新する
 */
export const changeOrderStatus = async (
  ownerId: string,
  orderId: string,
  newStatus: string
): Promise<OrderResult> => {
  try {
    // バリデーション
    const validation = orderStatusUpdateSchema.safeParse({
      orderStatus: newStatus,
    });
    if (!validation.success) {
      return formatZodError(validation.error);
    }

    await updateOrderStatus(ownerId, orderId, newStatus as OrderStatus);
    return { id: orderId };
  } catch (error) {
    console.error(`注文ステータスの更新に失敗しました:`, error);
    return {
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "注文ステータスの更新に失敗しました",
    };
  }
};

/**
 * 注文データに製品タイトル情報を付加するヘルパー関数（最適化版）
 */
async function enrichOrdersWithProductTitles(
  ownerId: string,
  orders: Order[]
): Promise<OrderWithProductTitles[]> {
  // 注文がない場合は早期リターン
  if (orders.length === 0) {
    return [];
  }

  // すべての注文から一意の製品IDを抽出
  const uniqueProductIds = new Set<string>();
  orders.forEach((order) => {
    Object.keys(order.items).forEach((productId) => {
      uniqueProductIds.add(productId);
    });
  });

  // 製品IDの配列を作成
  const productIdsArray = Array.from(uniqueProductIds);

  // 一度のクエリですべての製品情報を取得
  let products: Product[] = [];
  try {
    products = await fetchProductsByIds(ownerId, productIdsArray);
  } catch (error) {
    console.error(`製品情報の一括取得に失敗しました:`, error);
    // エラーが発生しても処理を続行（製品情報がない場合はIDをそのまま表示）
  }

  // 製品IDからタイトルへのマッピングを作成
  const productTitleMap: Record<string, string> = {};

  // 取得した製品情報からタイトルマップを作成
  products.forEach((product) => {
    productTitleMap[product.id] = product.title;
  });

  // 各注文に製品タイトル情報を付加
  return orders.map((order) => {
    const productTitles: Record<string, string> = {};

    Object.keys(order.items).forEach((productId) => {
      // マップに存在しない製品IDの場合は、IDそのものを表示
      productTitles[productId] = productTitleMap[productId] || productId;
    });

    return {
      ...order,
      productTitles,
    };
  });
}
