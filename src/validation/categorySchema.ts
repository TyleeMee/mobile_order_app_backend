import { z } from "zod";

/**
 * カテゴリーのバリデーションスキーマ
 */
export const categorySchema = z.object({
  title: z
    .string()
    .min(1, "入力してください")
    .max(255, "タイトルは255文字以内で入力してください"),
});

/**
 * カテゴリー更新用のバリデーションスキーマ（部分更新に対応）
 */
export const categoryUpdateSchema = categorySchema.partial();

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
