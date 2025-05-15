//TODO デバッグ不要になったら削除
//pg関連のモジュールがロードされる前にデバッグモードが有効になる
process.env.DEBUG = "pg*";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testDbConnection } from "./config/database";
import categoryRoutes from "./routes/categoriesRoutes";
import productsRoutes from "./routes/productsRoutes";
import shopRoutes from "./routes/shopRoutes";
import ordersRoutes from "./routes/ordersRoutes";
import { testS3Connection } from "./utils/s3";
import healthRoutes from "./routes/healthRoutes";

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 5002;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// S3接続テスト
testS3Connection()
  .then((isConnected) => {
    if (isConnected) {
      console.log("S3接続テスト成功 - アップロード機能は正常に動作します");
    } else {
      console.warn(
        "S3接続テスト失敗 - 画像アップロード機能が動作しない可能性があります"
      );
    }
  })
  .catch((err) => {
    console.error("S3接続テスト中にエラーが発生しました:", err);
    console.warn("画像アップロード機能が動作しない可能性があります");
  });

// データベース接続テスト
testDbConnection()
  .then((isConnected) => {
    if (!isConnected) {
      console.error(
        "データベース接続に失敗しました。アプリケーションを終了します。"
      );
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("データベース接続テスト中にエラーが発生しました:", err);
    process.exit(1);
  });

// ヘルスチェック用のルート（ALBのヘルスチェック用）
app.use("/health", healthRoutes);

// ルートの設定
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/orders", ordersRoutes);
// 他のルートをここに追加

// ルートエンドポイント
app.get("/", (req, res) => {
  res.send("Payment Test App API");
});

// 404エラーハンドリング
app.use((req, res) => {
  res.status(404).json({ message: "リクエストされたリソースが見つかりません" });
});

// サーバー起動
//Express.jsアプリケーションを明示的にIPv4インターフェースでリッスンするように第2引数を"0.0.0.0",に
app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`サーバーがポート ${PORT} で起動しました（IPv4）`);
});

export default app;
