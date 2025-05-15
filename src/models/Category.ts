/**
 * カテゴリーの型定義
 */
export type Category = {
  id: string;
  ownerId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * カテゴリー作成時のデータ型
 */
export type CategoryData = {
  title: string;
};

/**
 * カテゴリー操作の結果型
 */
export type CategoryResult = {
  id?: string;
  error?: boolean;
  message?: string;
};
