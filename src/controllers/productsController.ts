import { Request, Response } from "express";
import {
  getProduct,
  getSortedProductsInCategory,
  getProductsByIds,
} from "../services/productsService";

// 特定のカテゴリ内の商品一覧取得
export const getProductsInCategoryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    const categoryId = req.params.categoryId;
    if (!categoryId) {
      return res.status(400).json({ message: "カテゴリIDが必要です" });
    }

    const products = await getSortedProductsInCategory(ownerId, categoryId);
    return res.status(200).json(products);
  } catch (error) {
    console.error("商品一覧取得エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};

// 特定の商品を取得
export const getProductHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({ message: "商品IDが必要です" });
    }

    const product = await getProduct(ownerId, productId);
    if (!product) {
      return res.status(404).json({ message: "商品が見つかりません" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("商品取得エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};

// 複数の商品IDから商品を取得（より堅牢なバージョン）
export const getProductsByIdsHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    // クエリパラメータから商品IDの配列を取得して正規化
    let productIds: string[] = [];
    const idsParam = req.query.ids;

    if (Array.isArray(idsParam)) {
      // ids[]形式で複数のIDが渡された場合
      productIds = idsParam.filter((id) => typeof id === "string") as string[];
    } else if (typeof idsParam === "string") {
      // カンマ区切りまたは単一のIDが渡された場合
      productIds = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }

    if (productIds.length === 0) {
      return res.status(400).json({ message: "有効な商品IDが必要です" });
    }

    const products = await getProductsByIds(ownerId, productIds);
    return res.status(200).json(products);
  } catch (error) {
    console.error("複数商品取得エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};
