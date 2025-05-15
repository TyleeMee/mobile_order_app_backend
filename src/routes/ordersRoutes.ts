import express from "express";
import {
  createOrderHandler,
  getOrderByIdHandler,
  getOrdersByIdsHandler,
  updateOrderStatusHandler,
} from "../controllers/ordersController";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

// すべてのルートで認証ミドルウェアを使用
// router.use(authenticateUser);

// 注文の作成
router.post("/", createOrderHandler);

// 注文IDによる取得
router.get("/", getOrdersByIdsHandler);
router.get("/:orderId", getOrderByIdHandler);

// 注文ステータスの更新
router.put("/:orderId/status", updateOrderStatusHandler);

export default router;
