# Codex作業ログ 第14号

## 作成・変更したもの
- `douga.html`: 動画投稿フォーム、準備中表示、`?mock=1` の6件ギャラリー、Driveプレビュー用モーダルを追加。
- `douga.js`: 8MiBチャンクアップロード、GAS simple request、再開照会、純関数exportを実装。
- `お問い合わせ受け皿.gs`: 既存お問い合わせメール処理を保持し、動画API用ルーター、Drive resumable upload、公開設定、一覧取得を追加。
- `appsscript.json`: GASのタイムゾーン、OAuthスコープ、Webアプリ設定を追加。
- `index.html`: `douga.html` へのナビリンクを1箇所追加。
- `tmp/test_gas_router.mjs` / `tmp/test_upload_client.mjs`: 合格条件の機械検証を追加。

## 検証済み
- `node --check` で作成・変更したJavaScript/MJSの構文確認。
- GASルーターのフォームPOST互換、`initUpload`、異常系、`list` 降順をスタブ環境で確認。
- `douga.js` のチャンク境界、Content-Range、308 Range解析、ファイル名sanitize、JST整形を確認。
- `douga.html` に `?mock=1` モックモードとfixture参照があることを確認。

## 実行した合格条件
- `node --check douga.js`: exit 0
- `node --check tmp/test_gas_router.mjs`: exit 0
- `node --check tmp/test_upload_client.mjs`: exit 0
- `node tmp/test_gas_router.mjs`: exit 0
- `node tmp/test_upload_client.mjs`: exit 0

## 未検証
- 実際のGoogle Apps Scriptデプロイ、OAuth許可、Google Driveへの実アップロードは未検証。WebアプリURL設定とデプロイ後に実環境で確認が必要。

## 既知の制約
- `douga.html` 冒頭の `GAS_URL` が空の間、通常アクセスでは投稿UIは準備中表示。
- `?mock=1` は表示検収用で、実ファイルのアップロードは行わない。
