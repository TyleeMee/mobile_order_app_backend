import { Request, Response } from "express";
import {
  createOrder,
  getOrderById,
  getOrdersByIds,
  changeOrderStatus,
} from "../services/ordersService";
import { OrderData, OrderStatus, orderStatusFromString } from "../models/Order";

/**
 * 注文を作成する
 */
export const createOrderHandler = async (req: Request, res: Response) => {
  try {
    let userId = undefined;
    //TODO 認証からuserIdを設定する
    // const userId = req.user?.id;
    // if (!userId) {
    //   return res.status(401).json({ message: "認証されていません" });
    // }

    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    const orderData: Partial<OrderData> = {
      ownerId: ownerId,
      userId: userId,
      pickupId: req.body.pickupId,
      items: req.body.items,
      productIds: req.body.productIds,
      orderStatus: req.body.orderStatus
        ? orderStatusFromString(req.body.orderStatus)
        : OrderStatus.NEW_ORDER,
      orderDate: req.body.orderDate ? new Date(req.body.orderDate) : new Date(),
      total: Number(req.body.total),
    };

    const newOrderWithTitles = await createOrder(orderData);

    if (!newOrderWithTitles) {
      return res.status(400).json({
        message: "注文の作成に失敗しました",
        error: true,
      });
    }

    // 作成された注文と製品タイトル情報を含めたデータを返す
    return res.status(201).json(newOrderWithTitles);
  } catch (error) {
    console.error("注文作成エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};

/**
 * 注文IDで取得する
 */
export const getOrderByIdHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "注文IDが指定されていません" });
    }

    const orderWithProductTitles = await getOrderById(ownerId, orderId);
    if (!orderWithProductTitles) {
      return res.status(404).json({ message: "注文が見つかりません" });
    }

    return res.status(200).json(orderWithProductTitles);
  } catch (error) {
    console.error("注文取得エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};

/**
 * 複数の注文IDを指定して注文を取得する
 */
export const getOrdersByIdsHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    // クエリパラメータから注文IDの配列を取得して正規化
    let orderIds: string[] = [];
    const idsParam = req.query.ids;

    if (Array.isArray(idsParam)) {
      // ids[]形式で複数のIDが渡された場合
      orderIds = idsParam.filter((id) => typeof id === "string") as string[];
    } else if (typeof idsParam === "string") {
      // カンマ区切りまたは単一のIDが渡された場合
      orderIds = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }

    if (orderIds.length === 0) {
      return res.status(400).json({ message: "有効な注文IDが必要です" });
    }

    const ordersWithProductTitles = await getOrdersByIds(ownerId, orderIds);
    return res.status(200).json(ordersWithProductTitles);
  } catch (error) {
    console.error("複数注文取得エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};

/**
 * 注文ステータスを更新する
 */
export const updateOrderStatusHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ message: "注文IDが指定されていません" });
    }

    const newStatus = req.body.orderStatus;
    if (!newStatus) {
      return res
        .status(400)
        .json({ message: "新しい注文ステータスが指定されていません" });
    }

    const result = await changeOrderStatus(ownerId, orderId, newStatus);

    if ("error" in result) {
      return res.status(400).json({
        message: result.message,
        error: true,
      });
    }

    return res.status(200).json({ message: "注文ステータスが更新されました" });
  } catch (error) {
    console.error("注文ステータス更新エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};
