import { z } from "zod";

/**
 * 商品のバリデーションスキーマ
 */
export const productSchema = z.object({
  title: z
    .string()
    .min(1, "入力してください")
    .max(255, "タイトルは255文字以内で入力してください"),
  imageUrl: z
    .string()
    .min(1, "画像をアップロードしてください")
    .max(2048, "URLが長すぎます"),
  imagePath: z
    .string()
    .min(1, "画像をアップロードしてください")
    .max(1024, "パスが長すぎます"),
  description: z
    .string()
    .max(1000, "説明は1000文字以内で入力してください")
    .nullable()
    .optional()
    .default(""),
  price: z
    .number()
    .int("整数で入力してください")
    .min(0, "0以上の値を入力してください"),
  categoryId: z.string().min(1, "カテゴリを選択してください"),
  ownerId: z.string().min(1, "ユーザーIDが必要です"),
  isVisible: z.boolean().default(false),
  isOrderAccepting: z.boolean().default(false),
});

/**
 * 商品更新用のバリデーションスキーマ（部分更新可能）
 */
export const productUpdateSchema = productSchema.partial();

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
