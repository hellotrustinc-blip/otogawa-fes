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

---

## 追補3（本番障害の恒久対策／承認済み・完遂せよ）

**実障害**: スマホ実投稿（243MB .mov）でデータ送信は完全成功したが、最終チャンクPUT応答の読取り〜finalizeUpload呼び出しの区間で失敗し、(a)動画が非公開のまま残り（preview 401）(b)UIが「アップロード中」のまま完了表示に遷移しなかった。原因候補=最終PUT応答ボディのCORS読取り不可またはパース例外が完了処理全体を巻き込んだ。

### 1. クライアント完了判定の頑健化（douga.js）
- 最終チャンクのPUTがHTTP 200/201なら、**レスポンスボディが読めなくても・パースに失敗しても、その時点でそのファイルを「完了」扱い**にする（fileId取得はtry-catchで任意化）
- finalizeUploadはfileIdが取れた場合のみ呼ぶ。**finalizeの成否・例外はUIの完了表示に影響させない**（失敗はconsoleに記録のみ。公開権限はサーバ側修復〔下記2〕が保証する）
- 全ファイルのデータ送信完了で必ず「✅ 投稿が完了しました。画面を閉じて大丈夫です」へ遷移し、beforeunload解除・WakeLock releaseを実行（この遷移経路に応答読取り・finalize・list更新への依存を残さない）
- 完了後のギャラリー再読込は行ってよいが、失敗しても完了表示は維持

### 2. サーバ側の自動修復（お問い合わせ受け皿.gs — 今回のみ変更許可）
- `listVideos_` で一覧を返す前に、**新しい順20件について anyone/reader 権限を保証**する（権限が無ければ付与。既に有る場合の重複作成がエラーになる実装なら握りつぶして続行）。冪等・1件の失敗で他を巻き込まない
- お問い合わせ処理・メール文言・既存アクションの入出力仕様は変更禁止

### 3. ブラウザ実機E2Eハーネス（tmp/browser_e2e.html 新規）
- douga.jsのアップロード実行部を再利用可能な形でexportし、ハーネスページが `?gas=<URLエンコード済みexec URL>&size=<バイト数>` を受けて**合成Blobを実アップロード**→各段階の結果と最終判定を `document.title`（PASS/FAIL）と `#result` 要素に書く（headless Chromeの--dump-domで機械判定するため）
- 本物のブラウザCORS経路（最終PUT応答読取り含む）を通ることが目的。ハーネス自体はGAS URL未指定なら「URL未指定」表示で終了

### 合格条件（すべて exit 0・実行して確認）
1. `node --check douga.js` および全 `.js`/`.mjs`
2. `node tmp/test_gas_router.mjs`（お問い合わせ完全温存assert含め全PASS。権限保証の新ロジック分のassertを追加）
3. `node tmp/test_upload_client.mjs`（「PUT 200で応答ボディ読取り失敗でも完了扱い」を純関数またはスタブで機械検証するassertを追加）
4. tmp/browser_e2e.html が存在し douga.js を読み込む構造であること（実ブラウザ実行はClaude側で行う）

---

## 追補4（発注元指示: 投稿ページと閲覧ページの分離／承認済み・完遂せよ）

発注元指示「アップローダーに、アップ済みの動画の表示はいらない」。以下のとおり分離する。

### 1. douga.html = 投稿専用ページ化
- ギャラリー（投稿動画一覧・モーダル再生）を douga.html から**撤去**。投稿フォーム・進捗・注意帯・完了表示のみ残す
- ページ下部に控えめな導線1つ:「投稿された動画を見る →」（gallery.html へのリンク）
- **既存の配布済みURLを壊さないこと**（douga.html のパス・投稿機能はそのまま）

### 2. gallery.html = 閲覧専用ページ新設
- 現行ギャラリー（一覧・新しい順・サムネイル・モーダル再生・`?mock=1`対応）をそのまま移設。デザイントーン統一
- 上部に控えめな導線1つ:「動画を投稿する →」（douga.html へのリンク）
- アップロード関連のコード・UIは含めない（ページを軽くする）

### 3. 共通化と結線
- douga.js は投稿用と閲覧用が共有する定数・純関数を保ちつつ、閲覧専用ロジックの分離は任せる（別ファイル gallery.js 可）。GAS_URL定数は両ページで同一値を参照（douga.html の現行値をコピー）
- index.html のナビ「みんなの動画」リンク先を gallery.html に変更（閲覧が主動線）
- GASファイルは変更禁止

### 合格条件（すべて exit 0）
1. `node --check` 全 `.js`
2. `node tmp/test_gas_router.mjs`・`node tmp/test_upload_client.mjs` 全PASS（既存assertの構成変更は最小限）
3. テストで機械確認: douga.html にギャラリーDOM/一覧取得コードが無いこと・gallery.html に投稿フォームが無いこと・両ページの相互リンクが存在すること・index.html のリンク先が gallery.html であること
4. 両ページとも `?mock=1` でレンダリング可能（実測はClaude側）

---

## 追補5（発注元決定: 「集めるだけ・非公開」へ転換／承認済み・完遂せよ）

発注元の確定判断=「動画は集めるだけ。見るのは保存会（otogawa.fesのDrive）だけ。プライバシー重視」。公開機能を全廃する。

### 1. 閲覧機能の撤去（サイト側）
- `gallery.html` を**削除**
- `douga.html` の「投稿された動画を見る →」リンクを撤去。投稿完了メッセージは「✅ 投稿が完了しました。動画は保存会にお届けしました。画面を閉じて大丈夫です」に変更
- `index.html` のナビリンクは「動画を投稿」の文言で douga.html 向きに変更
- `douga.js` から一覧取得・ギャラリー描画・モーダル関連コードを撤去（投稿機能と進捗・注意帯・mockの投稿UI部分は維持）

### 2. 公開処理の全廃（GAS: お問い合わせ受け皿.gs — 変更許可）
- `finalizeUpload`: **anyone権限付与を行わない**。後方互換のためアクション自体は残し、何もせず `{ok:true}` を返す
- `listVideos_` の自動修復（anyone付与）と `action=list` を**削除**（未知アクション扱いのエラー応答に）。動画名などのメタデータを外部に出さない
- **新アクション `privatizeAll`**（引数不要・認証不要でよい: 公開を「剥がす」方向のみの安全な操作）: フォルダ内全ファイルについて anyone 権限があれば削除する。結果 `{ok:true, checked:N, privatized:M}`。1件の失敗で他を止めない
- クライアント（douga.js）からの finalize 呼び出しは撤去してよい（完了判定は既に独立している）

### 3. お問い合わせ・投稿機能は無変更
- お問い合わせ処理・メール文言・initUpload（Origin転送含む）・チャンクアップロード・進捗表示・注意帯は一切変更しない

### 合格条件（すべて exit 0）
1. `node --check` 全 `.js`/`.mjs`
2. `node tmp/test_gas_router.mjs` — 追加/変更assert: `finalizeUpload` が権限付与のfetchを呼ばず`{ok:true}`／`action=list` がエラー応答／`privatizeAll` がanyone権限を剥がす（スタブで機械検証）／お問い合わせ2通は従来どおり完全一致
3. `node tmp/test_upload_client.mjs` — 変更assert: finalize呼び出しが存在しない／完了表示文言の更新を機械確認
4. テストで機械確認: gallery.html が存在しない・douga.html に「見る」リンクが無い・index.html のリンクが douga.html 向き
5. mockモード（投稿UI）でレンダリング可能（実測はClaude側）

---

## 追補6（発注元指示: 同意UI＝個人情報の取り扱い＋著作権／承認済み・完遂せよ／追補5の完了後に実施）

douga.html の投稿フォームに同意UIを追加する。GASは変更禁止。

### 1. 規約テキストボックス
- ファイル選択欄と投稿ボタンの間に、**高さ約180pxでスクロールできる枠**（`overflow-y:auto`・白背景・細枠線・font-size .85rem 程度・sans）を置き、見出し「動画の投稿にあたって（個人情報の取り扱い・著作権）」と以下の本文を**一字一句このまま**掲載する:

---
**1. 投稿できる動画**
ご自身が撮影した、大戸川祭礼に関する動画のみ投稿できます。第三者が撮影した動画や、他人の権利を侵害する動画は投稿しないでください。

**2. 動画の利用について（著作権）**
投稿された動画は、大戸川祭礼保存会が祭礼の記録・保存および保存会の活動（記録集・広報・サイト掲載等）のために、無償で利用（保管・複製・編集・上映・掲載）することがあります。動画の著作権は投稿者に残ります。

**3. 写り込みへの配慮**
祭礼の様子には周囲の方が写り込むことがあります。投稿の際は周囲の方への配慮をお願いします。不適切と判断した動画は、保存会の判断で削除することがあります。

**4. 個人情報の取り扱い**
入力されたお名前（任意）は、動画の整理および必要な場合の連絡のみに使用し、それ以外の目的で利用したり第三者に提供したりすることはありません。

**5. お問い合わせ**
大戸川祭礼保存会 otogawa.fes@gmail.com

以上に同意のうえ、アップロードしてください。
---

### 2. 投稿ボタンの文言変更
- 「投稿する」→「**個人情報の取り扱い・著作権に同意してアップロード**」（2行になってよい。同意チェックボックスは設けず、ボタン押下＝同意の設計）
- ボタン直上に補足1行（小さめ）:「ボタンを押すと、上記への同意のうえ投稿されます」

### 3. 二重投稿の防止（発注元の実地指摘）
- **実挙動の不具合**: 送信完了後もファイル選択欄に動画が残り、もう一度ボタンを押すと同じ動画を二重投稿できてしまう
- 対策: ①全ファイルの送信完了時に `input[type=file]` の値と投稿者名以外のフォーム状態をクリアする（完了メッセージは維持） ②送信中は投稿ボタンを disabled＋「アップロード中…」表示にし、終了（完了・失敗とも）で復帰 ③ファイル未選択で押した場合は投稿処理をせず「動画を選んでください」の案内のみ表示

### 4. その他
- mockモードでも規約枠・新ボタン文言が表示されること
- 規約本文はHTML内に直接記載（外部ファイル化しない）

### 合格条件（すべて exit 0）
1. `node --check` 全 `.js`/`.mjs`・既存テスト2本全PASS
2. テストで機械確認: douga.html に規約見出し・第1〜5条の見出し文言・新ボタン文言が存在すること／規約枠に `overflow-y:auto`（またはscroll）指定があること
3. テストで機械確認: 完了時にファイル入力をクリアする処理・送信中のボタンdisabled処理・未選択時ガードが douga.js に存在すること（関数分離またはソース検査で）
4. mockレンダリングはClaude側で実測

---

## 追補3b（実ブラウザ検収FAILの根本修正・CORS Origin／承認済み・完遂せよ／追補4より先に実施）

**実測事実**: tmp/browser_e2e.html の実ブラウザ実行で `initUpload OK` 直後に `TypeError: Failed to fetch at queryUploadPosition` で FAIL（headless Chrome・本番GAS）。原因=Drive resumable セッションを**Originヘッダー無しで作成**しているため、セッションURIへのブラウザからのCORSリクエストが許可されない（Google公式ドキュメントの既知仕様: ブラウザから継続するセッションは、開始リクエストに Origin ヘッダーを含める）。

### 修正内容
1. **douga.js**: initUpload のリクエストペイロードに `origin: location.origin` を追加して送る
2. **お問い合わせ受け皿.gs**: `initUpload` がペイロードの `origin`（文字列・`https://` または `http://127.` / `http://localhost` で始まる場合のみ採用、それ以外は無視）を受け取り、resumableセッション作成の UrlFetchApp 呼び出しヘッダーに `Origin: <その値>` を付与する。origin未指定なら従来どおり
3. **douga.js のアップロード手順**: 初回アップロード試行は**位置照会（queryUploadPosition）を経由せず**、直接先頭チャンクのPUTから始める。位置照会はエラー後の再開時のみ使用し、照会自体の失敗も致命化しない（キャッチして最初からのリトライにフォールバック）
4. 追補3の頑健化（PUT 200/201で本文不読でも完了・finalize失敗をUIに波及させない）は維持

### 合格条件（すべて exit 0）
1. `node --check` 全 `.js`/`.mjs`
2. `node tmp/test_gas_router.mjs` — 追加assert: initUpload に origin を渡すとセッション作成 fetch のヘッダーに `Origin` が入る／不正な origin（`javascript:` 等）は無視される／origin無しでも従来動作
3. `node tmp/test_upload_client.mjs` — 追加assert: 初回試行が位置照会を経ずチャンクPUTから始まる（呼び出し順を記録するスタブで機械検証）
4. 実ブラウザ判定はClaude側で tmp/browser_e2e.html を再実行（title=PASS が合格）
