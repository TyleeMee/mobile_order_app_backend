import { shopSchema } from "../validation/shopSchema";
import { z } from "zod";

/**
 * 店舗の型定義
 */
export type Shop = {
  id: string;
  ownerId: string;
  title: string;
  imageUrl: string;
  imagePath: string;
  description?: string;
  prefecture: z.infer<typeof shopSchema.shape.prefecture>;
  city: string;
  streetAddress: string;
  building?: string;
  isVisible: boolean;
  isOrderAccepting: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 店舗作成時のデータ型
 */
export type ShopData = {
  title: string;
  imageUrl: string;
  imagePath: string;
  description?: string;
  prefecture: z.infer<typeof shopSchema.shape.prefecture>;
  city: string;
  streetAddress: string;
  building?: string;
  isVisible: boolean;
  isOrderAccepting: boolean;
};

/**
 * 店舗フォーム値の型
 */
export type ShopFormValues = z.infer<typeof shopSchema> & {
  ownerId: string;
};

/**
 * 店舗操作の結果型
 */
export type ShopResult = {
  id?: string;
  error?: boolean;
  message?: string;
};
