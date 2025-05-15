import { Request, Response } from "express";
import {
  getCategory,
  getSortedCategories,
} from "../services/categoriesService";

/**
 * カテゴリーコントローラー
 * リクエスト処理とレスポンス生成を担当
 */

// カテゴリーの一覧取得
export const getCategoriesHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    const categories = await getSortedCategories(ownerId);
    return res.status(200).json(categories);
  } catch (error) {
    console.error("カテゴリー取得エラー:", error);
    return res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
};

// 特定のカテゴリーを取得
export const getCategoryHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(401).json({ message: "オーナーIDが必要です" });
    }

    const categoryId = req.params.id;
    const category = await getCategory(ownerId, categoryId);

    if (!category) {
      return res.status(404).json({ message: "カテゴリーが見つかりません" });
    }

    return res.status(200).json(category);
  } catch (error) {
    console.error("カテゴリー取得エラー:", error);
    return res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
};
