import express from "express";
import { getShopHandler } from "@/controllers/shopController";
import { authenticateUser } from "@/middlewares/auth";

const router = express.Router();

// すべてのルートで認証ミドルウェアを使用
// router.use(authenticateUser);

// ショップのルート
router.get("/:ownerId", getShopHandler);

export default router;
