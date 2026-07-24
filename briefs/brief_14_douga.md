# Codex委任 第14号: 大戸川祭礼サイト 動画投稿ページ（承認済み・完遂せよ）

## ゴール（一文）
祭礼の動画を、**Googleアカウント不要・スマホのブラウザだけ**で投稿でき、誰でも閲覧できるページを追加する。保存先は otogawa.fes@gmail.com の Googleドライブ。

## 背景
- 既存サイト: `index.html`（1ページ・和風デザイン=明朝体×朱色・スマホ対応）
- 既存GAS: `お問い合わせ受け皿.gs`（フォーム形式POSTを受けメール2通送信。**未デプロイ**）
- 方式: GAS Webアプリ（実行=自分/アクセス=全員）が Drive **resumable upload session** をサーバ側で発行し、ブラウザは session URI へ直接チャンクPUT。OAuthトークンはGAS内のみで使用しクライアントへ渡さない。

## 成果物（すべてこのリポジトリ内）
1. **`douga.html`** — 動画投稿＋ギャラリーの1ページ
   - デザインは index.html の配色・フォント（明朝体×朱色）を踏襲し統一感を出す。スマホ最優先レイアウト
   - 外部CDN・外部ライブラリ禁止（自己完結。GitHub Pages配信前提）
   - 冒頭に `const GAS_URL = '';` 定数。空のときは投稿UIを「準備中です」表示に
   - 構成: 見出し／投稿の説明（Googleアカウント不要・動画のみ・1本4GBまで）／お名前欄（ニックネーム可・省略可）／ファイル選択（`accept="video/*"` multiple）／各ファイルの進捗バー＋状態表示／ギャラリー（サムネイルグリッド・新しい順・タップでモーダル再生 `<iframe src="https://drive.google.com/file/d/{id}/preview" allowfullscreen>`）
   - `?mock=1` クエリで **GAS未接続でも** fixture 6件でギャラリー描画＋投稿UIを表示（検収用モックモード）
   - 投稿マナー・注意書き（例: 祭礼と無関係な動画は削除します）を短く記載
2. **`douga.js`** — アップロードロジック（`type="module"` で douga.html から読込）
   - **純関数を分離して export**（nodeテスト用）: チャンク境界計算／Content-Rangeヘッダ生成／308レスポンスのRangeヘッダ解析（次の開始位置算出）／ファイル名sanitize／JST日時文字列整形
   - フロー: ①GASへ `initUpload` → `sessionUri` 受領 ②sessionUriへ **8MiB（8388608バイト=256KiBの倍数）** チャンクを順次PUT（`Content-Range: bytes start-end/total`）③308なら継続、200/201なら完了→レスポンスJSONの `id` で `finalizeUpload` を呼ぶ
   - ネットワークエラー時: `Content-Range: bytes */total` のPUTで現在位置を照会して再開。自動リトライ3回、以後は「再開」ボタン
   - GASへのfetchは **`Content-Type: text/plain;charset=utf-8` のPOST**（GASはOPTIONSプリフライトに応答できないため simple request 必須）。redirect追従
3. **`祭礼受け皿.gs`**（`お問い合わせ受け皿.gs` を改修・リネームはせず同ファイルを更新）
   - **ルーター化**:
     - `doPost`: `e.postData.contents` がJSONで `action` があれば動画API。それ以外（フォーム形式）は**既存お問い合わせ処理を文言・宛先・件名まで完全温存**
     - `doGet`: `?action=list` → 動画一覧JSON。それ以外 → 簡易ステータス文字列
   - `CONFIG` を冒頭に: `FOLDER_NAME='大戸川祭礼 動画投稿2026'`／`MAX_BYTES=4*1024*1024*1024`／`PASSWORD=''`（空=合言葉無効が既定）／`MIN_QUOTA_BYTES=2*1024*1024*1024`
   - `initUpload` `{action,fileName,mimeType,fileSize,uploaderName?,password?}`:
     検証（mimeTypeが `video/` 始まり／fileSize≦MAX_BYTES／Drive残容量がMIN_QUOTA未満なら拒否／PASSWORD設定時は一致必須）→ 保存名を「`YYYY-MM-DD_HHmm_投稿者名_元ファイル名`」（JST・sanitize済）で組み → `UrlFetchApp` で `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`（header: `Authorization: Bearer ScriptApp.getOAuthToken()`、body: `{name, parents:[folderId], mimeType}`）→ レスポンスの `Location` ヘッダを `{ok:true, sessionUri, savedName}` で返す
   - フォルダ: `FOLDER_NAME` を検索し無ければ作成。IDは `PropertiesService.getScriptProperties()` にキャッシュ
   - `finalizeUpload` `{action,fileId}`: Drive API `permissions.create`（`role:reader, type:anyone`）で誰でも閲覧可に → `{ok:true}`
   - `list`: フォルダ内ファイルを **createdTime降順** で `[{id,name,createdTime,size}]` のJSON返却。サムネイルはクライアント側で `https://drive.google.com/thumbnail?id={id}&sz=w400` を使う
   - 残容量照会: Drive API `about.get?fields=storageQuota`（UrlFetchApp）
   - すべての応答は `ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)`。エラーは `{ok:false, error:'日本語の丁寧な理由'}`
4. **`appsscript.json`** — `timeZone: "Asia/Tokyo"`、`oauthScopes`: `https://mail.google.com/`（GmailApp用）・`https://www.googleapis.com/auth/drive`・`https://www.googleapis.com/auth/script.external_request`、`webapp: {executeAs: "USER_DEPLOYING", access: "ANYONE_ANONYMOUS"}`
5. **`index.html` への動線追加** — ナビまたは適所に douga.html へのリンクを1箇所（最小差分。例:「📹 みんなの動画」）
6. **テスト** `tmp/test_gas_router.mjs`・`tmp/test_upload_client.mjs`（下記合格条件）
7. **作業ログ** `tmp/codex_log_14.md`（何を作ったか／検証済みと未検証の区別／既知の制約）

## 制約・作法
- 日付処理で `toISOString()` のUTC値をそのまま使わない（JSTは `getFullYear()` 系またはGASの `Utilities.formatDate(date,'Asia/Tokyo',...)` で組む）
- APIキー・トークン・個人情報をコードに書かない（OAuthトークンは実行時取得のみ）
- 日本語ファイルはUTF-8
- 変更対象外: `briefs/` 配下、`お問い合わせ受け皿.gs` のメール文言

## 合格条件（すべて exit 0 必須。自分で実行して確認後、Claudeが独立再実行して検収する）
1. `node --check douga.js` および作成した全 `.js`/`.mjs`
2. `node tmp/test_gas_router.mjs` — `.gs` をテキストで読みGASグローバル（`ContentService`/`GmailApp`/`UrlFetchApp`/`DriveApp`/`ScriptApp`/`PropertiesService`/`Utilities`/`Session`）をスタブして評価し、以下を機械検証:
   (a) フォーム形式POST → お問い合わせメール2通の宛先・件名・本文が改修前と同一
   (b) `initUpload` 正常系 → `sessionUri` が返る
   (c) mimeType不正／サイズ超過／残容量不足／合言葉不一致（PASSWORD設定時）→ `ok:false`
   (d) `action=list` → createdTime降順のJSON
3. `node tmp/test_upload_client.mjs` — douga.js の純関数を import し: チャンク境界が256KiBの倍数／最終チャンクのContent-Range が `bytes (total-last)-（total-1)/total` 形式／`Range: bytes=0-8388607` の308応答から次開始位置=8388608／sanitize（パス区切り・制御文字除去）／JST整形
4. テスト2または3の中で、douga.html に `?mock=1` モックモード（fixture参照）が存在することを機械確認

## 完了報告に含めること
- 合格条件1〜4の実行結果（コマンドと exit code）
- 検証済み／未検証（例: 実Driveへのアップロードはデプロイ後でないと不可）の区別

---

## 追補1（Claude検収指摘・修正ラウンド／承認済み・完遂せよ）

Chromeヘッドレス実測（幅390px）で以下の不合格を検出した。修正せよ。

1. **ギャラリーが390pxで2カラムになり右端が見切れる** → 幅520px以下では1カラムにする（grid minmaxの下限見直し または media query）
2. **ヒーローの説明文・投稿説明文が右端で切れる** — コンテナがビューポート幅を超えている。横はみ出しの根本原因（固定幅・min-width・大きすぎるminmax・box-sizing漏れ等）を特定して除去する。`overflow-x: hidden` で隠すだけの対処は不可
3. 幅390px・360pxの両方で、全要素（ヘッダー・ヒーロー・フォーム・ギャラリー・モーダル）がビューポート内に収まること

制約:
- 修正対象は douga.html / douga.js のレイアウト・CSSのみ。GASファイル・既存テストのロジックは変更禁止（テストの追加は可）
- 修正後、`node --check douga.js`・`node tmp/test_gas_router.mjs`・`node tmp/test_upload_client.mjs` がすべて exit 0 のままであること（ブラウザ再実測はClaude側で行う）

---

## 追補2（発注元要望・機能追加ラウンド／承認済み・完遂せよ）

サイトは公開済み・GASは本番稼働中。**GASファイルは一切変更禁止**（再デプロイ不要を維持）。douga.html / douga.js のみ変更。

### 1. アップロード進捗の数値表示
- 各ファイルの進捗バー付近に「**12.3 MB / 85.0 MB（14%）**」形式で数値を出し、送信中は随時更新する
- 1MB未満はKB表示（例: 512 KB）。小数1桁。バイト整形（formatBytes）と進捗文字列生成（formatProgress等）は**純関数としてexport**し、tmp/test_upload_client.mjs にassertを追加する（KB/MB境界・0%・100%・途中%）

### 2. アップロード中の離脱防止
- 送信中は目立つ注意帯を表示: 「⚠ アップロード中です。終わるまで**画面を閉じたり、他のアプリに切り替えたり**しないでください」
- 送信中のみ `beforeunload` で離脱確認ダイアログを有効化（全ファイル完了・失敗・中断で必ず解除）
- 対応ブラウザでは Screen Wake Lock（`navigator.wakeLock.request('screen')`）で画面消灯を防ぐ。**try-catchで包み非対応機種では何もしない**。`visibilitychange` で復帰時に再取得。送信終了で release
- 全ファイル完了時: 注意帯を消し「✅ 投稿が完了しました。画面を閉じて大丈夫です」を表示

### 3. モックモード拡張（検収用）
- `?mock=1` のとき、進捗50%相当のダミーアップロード項目1件（数値表示つき）と注意帯を**表示状態でレンダリング**する（Claudeが画面実測で検収するため）

### 合格条件（すべて exit 0）
1. `node --check douga.js`
2. `node tmp/test_gas_router.mjs`（既存・変更禁止のまま全PASS）
3. `node tmp/test_upload_client.mjs`（新関数のassert追加込みで全PASS）
4. テスト内で「注意帯文言がdouga.html/douga.jsに存在すること」を機械確認
