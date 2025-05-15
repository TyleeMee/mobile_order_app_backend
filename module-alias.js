// 本番環境でパスエイリアスを使うために必要
const moduleAlias = require("module-alias");
const path = require("path");

moduleAlias.addAliases({
  "@": path.join(__dirname, "dist"),
});
