import { ProductID } from "./Product";

/**
 * 注文ステータスの列挙型
 */
export enum OrderStatus {
  NEW_ORDER = "newOrder",
  CONFIRMED = "confirmed",
  CANCELED = "canceled",
  COOKING = "cooking",
  PREPARED = "prepared",
  SERVED = "served",
}

/**
 * 注文ステータスの表示名マッピング
 */
export const OrderStatusDisplayName: Record<OrderStatus, string> = {
  [OrderStatus.NEW_ORDER]: "未対応",
  [OrderStatus.CONFIRMED]: "確認済み",
  [OrderStatus.CANCELED]: "キャンセル",
  [OrderStatus.COOKING]: "調理中",
  [OrderStatus.PREPARED]: "準備完了",
  [OrderStatus.SERVED]: "提供済み",
};

export function orderStatusFromString(statusString: string): OrderStatus {
  switch (statusString) {
    case "newOrder":
      return OrderStatus.NEW_ORDER;
    case "confirmed":
      return OrderStatus.CONFIRMED;
    case "canceled":
      return OrderStatus.CANCELED;
    case "cooking":
      return OrderStatus.COOKING;
    case "prepared":
      return OrderStatus.PREPARED;
    case "served":
      return OrderStatus.SERVED;
    default:
      return OrderStatus.NEW_ORDER; // デフォルト値
  }
}

/**
 * 型エイリアスの定義
 */
export type OrderID = string;
export type PickupID = string;

/**
 * 注文の型定義
 */
export type Order = {
  id: string;
  ownerId: string;
  userId?: string; // 注文者のID
  pickupId: string;
  items: Record<ProductID, number>;
  productIds: ProductID[];
  orderStatus: OrderStatus;
  orderDate: Date;
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 注文作成時のデータ型
 */
export type OrderData = {
  ownerId: string;
  userId?: string;
  pickupId: string;
  items: Record<ProductID, number>;
  productIds: ProductID[];
  orderStatus: OrderStatus;
  orderDate: Date;
  total: number;
};

/**
 * 注文に製品タイトル情報を追加した拡張型
 */
export type OrderWithProductTitles = Order & {
  productTitles: Record<ProductID, string>;
};

/**
 * 注文操作の結果型
 */
export type OrderResult = {
  id?: string;
  order?: Order;
  error?: boolean;
  message?: string;
};
