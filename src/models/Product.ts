export type ProductID = string;

/**
 * 商品の型定義
 */
export type Product = {
  id: string;
  ownerId: string;
  categoryId: string;
  title: string;
  imageUrl: string;
  imagePath: string;
  description?: string;
  price: number;
  isVisible: boolean;
  isOrderAccepting: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 商品作成時のデータ型
 */
export type ProductData = {
  ownerId: string;
  categoryId: string;
  title: string;
  imageUrl: string;
  imagePath: string;
  description?: string;
  price: number;
  isVisible: boolean;
  isOrderAccepting: boolean;
};

/**
 * 商品フォーム値の型
 */
export type ProductFormValues = {
  categoryId: string;
  title: string;
  imageUrl: string;
  imagePath: string;
  description?: string;
  price: number | undefined;
  isVisible: boolean;
  isOrderAccepting: boolean;
};

/**
 * 商品操作の結果型
 */
export type ProductResult = {
  id?: string;
  error?: boolean;
  message?: string;
};
