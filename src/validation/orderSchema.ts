import { z } from "zod";
import { OrderStatus } from "../models/Order";

/**
 * 注文のバリデーションスキーマ
 */
export const orderSchema = z.object({
  userId: z
    .string()
    .max(255, "ユーザーIDは255文字以内で入力してください")
    .nullable()
    .optional(),
  pickupId: z.string().min(1, "ピックアップIDは必須です"),
  items: z.record(z.string(), z.number().int().positive()),
  productIds: z.array(z.string()),
  orderStatus: z.nativeEnum(OrderStatus).default(OrderStatus.NEW_ORDER),
  orderDate: z.date().default(() => new Date()),
  total: z.number().int().nonnegative(),
});

/**
 * 注文ステータス更新のバリデーションスキーマ
 */
export const orderStatusUpdateSchema = z.object({
  orderStatus: z.nativeEnum(OrderStatus),
});

/**
 * バリデーションエラーを整形する関数
 */
export const formatZodError = (error: z.ZodError) => {
  const formattedErrors = error.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));

  return {
    error: true,
    validationErrors: formattedErrors,
    message:
      formattedErrors[0]?.message || "バリデーションエラーが発生しました",
  };
};
