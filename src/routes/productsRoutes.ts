import express from "express";
import {
  getProductsInCategoryHandler,
  getProductHandler,
  getProductsByIdsHandler,
} from "../controllers/productsController";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

// すべてのルートで認証ミドルウェアを使用
// router.use(authenticateUser);

// 商品のCRUD操作
router.get("/category/:categoryId", getProductsInCategoryHandler);
router.get("/", getProductsByIdsHandler);
router.get("/:id", getProductHandler);

export default router;
