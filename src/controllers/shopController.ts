import { getShop } from "../services/shopService";
import { Request, Response } from "express";

// ショップの取得
export const getShopHandler = async (req: Request, res: Response) => {
  try {
    const ownerId = req.params.ownerId;
    if (!ownerId) {
      return res.status(400).json({ message: "オーナーIDが必要です" });
    }

    const shop = await getShop(ownerId);

    if (!shop) {
      return res.status(404).json({ message: "店舗情報が見つかりません" });
    }

    return res.status(200).json(shop);
  } catch (error) {
    console.error("ショップ取得エラー:", error);
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "サーバーエラーが発生しました",
    });
  }
};
