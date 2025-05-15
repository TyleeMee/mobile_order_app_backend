import { testDbConnection } from "../config/database";
import { initializeTables } from "../config/db-init";

/**
 * データベース初期化スクリプト
 * 手動実行用
 //* npm run init-dbコマンド（package.json）で実行
 */
async function main() {
  try {
    // データベース接続テスト
    const isConnected = await testDbConnection();
    if (!isConnected) {
      console.error("Failed to connect to database. Aborting initialization.");
      process.exit(1);
    }

    // テーブル初期化の実行
    await initializeTables();

    console.log("Database initialization completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

// スクリプト実行
main();
