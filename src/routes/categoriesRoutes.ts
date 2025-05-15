import express from "express";
import {
  getCategoriesHandler,
  getCategoryHandler,
} from "../controllers/categoriesController";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

// すべてのルートで認証ミドルウェアを使用
// router.use(authenticateUser);

// カテゴリーのCRUD操作
router.get("/", getCategoriesHandler);
router.get("/:id", getCategoryHandler);

export default router;
