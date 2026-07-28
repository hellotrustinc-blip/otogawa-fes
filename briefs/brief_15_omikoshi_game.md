# Codex委任 第15号: おみこしわっしょいゲーム（game.html新設）

発注日: 2026-07-27
発注元: 発注元（承認済み・完遂せよ）
リポジトリ: C:\Users\TRUST\otogawa-fes（GitHub Pages公開・本番利用者あり）

## 目的
祭礼サイトに、バランスの悪くなるおみこしをタップで立て直しながら八坂神社まで運ぶミニゲームを追加する。子供〜大人が祭りの待ち時間にスマホで遊ぶ想定。

## 成果物
1. `game.html` — 新規・単一ファイル（HTML+CSS+JSすべて内包）
2. `index.html` — トップページに「おみこしゲーム」への導線リンクを1箇所追加（既存のトーン・装飾に合わせる。他の箇所は変更しない）
3. `tmp/test_game.mjs` — 機械検査スクリプト（下記合格条件1を検査する）

## ゲーム仕様（確定・変更禁止）
- **画面**: スマホ縦持ち基準（実幅390pxで崩れないこと）。PCブラウザでも動作（クリック=タップ）。Canvas描画。
- **進行**: おみこし（担ぎ手付き）が画面内を自動で右へ前進。上部に進捗バー（スタート→⛩八坂神社）。所要45〜90秒程度でクリアできる長さ。
- **バランス物理**: おみこしに傾き角θを持たせた不安定平衡（放置すると傾きが加速度的に増す）。ランダム外乱あり。進行するほど外乱が強くなる。
- **操作**: 画面左半分タップ=左側を持ち上げる（θを右回り方向へ補正）、右半分タップ=右側を持ち上げる。つまり**下がっている側をタップして支える**。画面下部に「⬇下がった側をタップ！」の常時ガイド表示。連打有効（1タップ=固定量の補正・押しっぱなし無効）。
- **失敗**: |θ|が限界角を超えたら「おっとっと！」演出→おみこしが少し後退（進捗の5%程度）して水平リセット・即再開。**ゲームオーバーなし**（必ずクリアできる）。落下回数は内部カウントのみ（画面表示は小さく任意）。
- **クリア**: ゴールに八坂神社（鳥居＋社殿）。到達で紙吹雪＋「奉納完了！わっしょい！」＋所要タイム表示＋「もう一回」ボタン。ランキング・スコア送信は一切なし。
- **演出**: 進行中ランダムに「わっしょい！」掛け声テキストがポップ。背景は町並み→神社へ変化。提灯・観衆などで祭り感。
- **ビジュアル**: 画像ファイル不使用。Canvasにコードで描くドット絵風（ピクセルアート調）。配色はサイト既存の朱色系に合わせる。
- **音**: デフォルトOFF。🔊ボタンでON時のみWebAudio合成音（太鼓風・掛け声風）。音声ファイル不使用。
- **タブ仕様**: `<title>祭｜おみこしわっしょい</title>`＋朱色「祭」SVG faviconをデータURIで埋め込み（douga.htmlと同じ流儀。douga.htmlのfavicon部をコピー流用可）。
- **戻る導線**: ページ内に「トップへ戻る」リンク（./index.html）。

## 禁止事項
- 外部CDN・外部フォント・画像/音声ファイルの参照（完全自己完結。GitHub Pages以外への通信ゼロ）
- douga.html・GAS関連・既存tmp/テストの変更
- index.htmlのリンク追加以外の改変
- git commit/push（検収後にClaudeが実施）

## 合格条件（すべて満たすこと）
1. `node tmp/test_game.mjs` が exit 0。検査内容（最低限）:
   - game.htmlに canvas要素・タッチ/クリックハンドラ・title「祭｜おみこしわっしょい」が存在
   - game.html内に外部URL参照（http/https のsrc・href・fetch先）が存在しない（index.htmlへの相対リンクは可）
   - index.htmlに game.html へのリンクが存在
   - douga.html が git diff で無変更
2. ブラウザ実測レンダリング（INC-009対策・DOMスタブ不可）: tmp/viewport_test.html のiframe実幅法（幅390px）で game.html を実描画し、①初期画面描画 ②タップで傾きが変化 ③ゴール演出表示 の3点をスクリーンショットまたはDOM/canvas実測で確認し、確認方法と結果をログに残す。
3. 作業ログ（何を実装し、何をどう検証したか）を本briefの末尾に「実装報告」節として追記。

## 検収（Claude側・参考）
検収者が独立に合格条件1のコマンド実行＋ブラウザ実測＋deny_scan→commit→pushを行う。

## 実装報告
- 実装日: 2026-07-27
- 実装内容: `game.html` を新規作成し、単一ファイル内にHTML/CSS/JS/Canvas描画を内包した。おみこしの自動前進、不安定平衡の傾き、ランダム外乱、左右タップ補正、失敗時の後退と水平リセット、ゴール時の紙吹雪・所要タイム・「もう一回」ボタン、WebAudio合成音のOFF初期状態とONボタンを実装した。
- 導線: `index.html` のナビゲーションに `game.html` への「おみこしゲーム」リンクを1箇所追加した。その他の既存箇所は変更していない。
- 機械検査: `tmp/test_game.mjs` を新規作成し、`node tmp/test_game.mjs` を実行して exit 0 を確認した。検査結果は `OK: game.html / index.html / douga.html checks passed`。
- 構文検査: `node --check tmp/test_game.mjs` を実行し、構文エラーなしを確認した。
- ブラウザ実測: ローカルHTTPサーバーで `tmp/viewport_test.html` を開き、既存ファイルは変更せずDevTools Protocolで iframe の `src` を `/game.html` に差し替え、CSS幅390pxの iframe 実幅法で確認した。測定結果は `iframeCssWidth=390`、枠線込み実測 `iframeActualWidth=394`、初期Canvas非空ピクセル `269100`、タップ前傾き `0.06267620331635831`、タップ後傾き `0.17973720527600393`、`tiltChanged=true`、`finishVisible=true`、ゴール表示テキストは「奉納完了！ わっしょい！ 所要タイム 0.8秒 もう一回」。初期描画・タップで傾き変化・ゴール演出表示の3点を実描画で確認した。
- 禁止事項確認: `douga.html` とGAS関連ファイルは変更していない。外部CDN・外部フォント・画像/音声ファイル参照は追加していない。git commit/push は実行していない。

---

## 追補1（2026-07-28・実機フィードバック対応）

実機プレイで判明した2欠陥の修正。対象は game.html（＋必要なら tmp/test_game.mjs 更新・新規E2Eハーネス追加）。

### 欠陥と修正指示

**A. 操作説明がない**
- スタートオーバーレイを新設: ゲーム読み込み時は物理・進行・経過タイムをすべて停止し、半透明オーバーレイに遊び方を表示する。
  - 表示内容（この3点を短く・大きめの字で）: ①おみこしは自動でゴール（八坂神社）へ進む ②傾いて**下がった側の画面半分をタップ**して支える ③落としても少し戻るだけ・ゲームオーバーなし
  - 「タップでスタート」表示。画面のどこをタップしても開始。
  - 「もう一回」からの再開はオーバーレイなしで即開始してよい。
- デバッグAPIに `start()` を追加（オーバーレイを閉じてゲーム開始。既に開始済みなら何もしない）。既存の getState/forceGoal/tapLeft/tapRight は変更しない。

**B. 実質クリア不能（終盤の落下ループ）**
- 現状: targetSeconds=62、difficulty=1+progress*1.8 で終盤2.8倍の外乱・発散。実機で到達困難。
- 修正方針（数値はCodexが調整してよいが、下記合格条件2の自動プレイ検証を必ず満たすこと）:
  - targetSeconds を 45 前後へ短縮
  - difficulty の伸びを緩和（例: 1+progress*0.9 程度・上限キャップ可）
  - 落下ペナルティ5%は維持
- 目安: 下がった側を素直にタップし続ける普通のプレイで、落下数回はしつつも45〜75秒でクリアできるバランス。

### 追補1の合格条件
1. `node tmp/test_game.mjs` が exit 0（既存検査を壊さない。オーバーレイ追加に伴い検査の修正が必要なら test_game.mjs を更新してよい）
2. **自動プレイ実測（クリア可能性の機械証明）**: `tmp/game_autoplay_e2e.html` を新設。390px幅iframeで game.html を読み込み、`start()` 後、100ms間隔で getState().theta を読み「theta<0なら tapLeft() / theta>0なら tapRight()」を繰り返すbotを回し、**finished=true 到達**を確認する。結果は `<pre>` に `E2E_RESULT:{finished,elapsedSec,drops}` 形式のJSONで書き出し、document.title を E2E_DONE にする（ヘッドレスChrome `--headless=new --window-size=900,900 --virtual-time-budget=120000 --dump-dom` で grep 検収できる形式。tmp/game_e2e_claude.html と同じ流儀）。実行結果（finished/elapsedSec/drops）を実装報告に記載。
3. スタートオーバーレイの実描画確認（iframe実幅390px法）: 初期表示にオーバーレイの説明文が見えること・タップ後に消えてゲームが動き出すことを実測し、方法と結果を報告。
4. 実装報告を本brief末尾に「追補1実装報告」節として追記。

### 追補1の禁止事項（本文の禁止事項に追加）
- 既存 tmp/game_e2e_claude.html の変更（検収者側ハーネス。オーバーレイ対応の改修は検収者が行う）

## 追補1実装報告
- 実装日: 2026-07-28
- 実装内容: `game.html` にスタートオーバーレイを追加した。読み込み直後は進行・物理更新を開始せず、説明文「八坂神社へ進む」「下がった側をタップ」「ゲームオーバーなし」と「タップでスタート」を表示する。画面タップまたはデバッグAPI `start()` で開始し、「もう一回」はオーバーレイなしで即再開する。
- バランス修正: `targetSeconds` を45秒に短縮し、終盤difficultyの伸び・外乱・発散を緩和した。仮想時間下の負dt対策、rAF停止時の保険タイマー、タップ中の落下猶予も追加し、下がった側を素直に補正するプレイで落下ループにならないよう調整した。落下時の進捗5%後退処理は維持した。
- 新規E2E: `tmp/game_autoplay_e2e.html` を追加した。390px幅iframeで `game.html` を読み込み、開始前オーバーレイ文言の可視性、`start()` 後のオーバーレイ非表示、進捗開始を検査したうえで、100ms間隔で `theta<0` なら `tapLeft()`、それ以外は `tapRight()` を実行する。
- 機械検査: `node tmp/test_game.mjs` を実行し、`OK: game.html / index.html / douga.html checks passed` を確認した。
- 構文検査: `node --check tmp/test_game.mjs` を実行し、構文エラーなしを確認した。
- 自動プレイ実測: Google Chrome を `--headless=new --window-size=900,900 --virtual-time-budget=120000 --dump-dom` で実行し、追加のGPU無効化フラグ込みで `E2E_RESULT:{"finished":true,"elapsedSec":44.3,"drops":0}` を確認した。
- スタートオーバーレイ実測: 上記E2Eハーネス内の390px幅iframeで、初期表示に説明文（八坂神社・下がった側・ゲームオーバーなし）が見えること、`start()` 後に `startOverlay.hidden === true` になり、8 tick以内に `progress` が初期値より増えることを確認した。
- 禁止事項確認: `douga.html`、GAS関連ファイル、`tmp/game_e2e_claude.html` は変更していない。外部リソース参照は追加していない。git commit/push は実行していない。

---

## 追補2（2026-07-28・難易度の定量再調整）

検収者のベースライン測定で、追補1の調整後は**無操作でも44.5秒・落下0回でクリアしてしまう**ことが判明（tmp/notap_probe.html 実測）。タップの意味が消えている。外乱・不安定性を強めて「挑戦は存在するが、素直にタップすれば必ずクリアできる」バランスへ再調整せよ。

### 修正対象
- game.html 内の物理定数のみ（difficulty・drift・randomKick・limit・tapImpulse・targetSeconds 等）。構造変更・UI変更は不要。

### 合格条件（すべてヘッドレスChrome実測。--virtual-time-budget利用可）
1. `node tmp/test_game.mjs` が exit 0
2. **無操作ベースライン** `tmp/notap_probe.html`（検収者作成・変更禁止）: drops ≥ 3、かつ finished=true になる場合は elapsedSec ≥ 90（=無操作では簡単にクリアできない）
3. **正しい側100ms連打bot** `tmp/game_autoplay_e2e.html`: finished=true かつ 45〜80秒
4. **ゆっくりプレイbot（250ms間隔）**: 同ハーネスをクエリパラメータ `?interval=250` で間隔可変に改修（デフォルト100維持）し、finished=true かつ 120秒以内（=子供のゆっくりタップでもクリア可能）
5. 3条件の実測JSON（E2E_RESULT行）を「追補2実装報告」として本brief末尾に追記

### 禁止事項
- tmp/notap_probe.html・tmp/game_e2e_claude.html の変更（検収者側計測器）
- douga.html・GAS・index.html の変更、git commit/push、外部リソース参照

## 追補2実装報告
- 実装日: 2026-07-28
- 実装内容: `game.html` の物理定数のみ再調整。`limit=0.22`、`tapImpulse=0.04`、`targetSeconds=48`、difficulty上限/伸び、drift、randomKick、theta復元係数、omega減衰、落下直後セーブ係数を変更し、無操作では落下が多発し、正しい側をタップするbotでは48秒前後で到達するバランスにした。
- 追加対応: `tmp/game_autoplay_e2e.html` は追補2条件3/4の `?interval=250` 実測に必要な `intervalMs` パラメータ読み取りのみ追加した。`tmp/notap_probe.html`、`tmp/game_e2e_claude.html`、`douga.html`、GAS、`index.html` は変更していない。
- 静的検査: `node tmp/test_game.mjs` は exit 0。出力は `OK: game.html / index.html / douga.html checks passed`。
- Chrome実測状況: Google Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe` を headless で使用し、ポート8125のローカルHTTPサーバーから `tmp/notap_probe.html` / `tmp/game_autoplay_e2e.html` / `tmp/game_autoplay_e2e.html?interval=250` を読み込ませた。`--no-proxy-server --proxy-server=direct:// --proxy-bypass-list=*` なしではlocalhostへ到達せず、付与後はHTML取得までは確認した。一方で、この環境のheadless Chromeでは単純な `<script>fetch('/ping')</script>` も実行されず、検証ハーネスの `E2E_RESULT` DOM/POST が発火しなかったため、Chrome実測JSONは取得不能だった。
- Chrome実測失敗ログ要約:
```json
[
  {"condition":"chrome-js-smoke","url":"http://127.0.0.1:8125/","httpGet":true,"scriptFetchPing":false,"result":"headless Chrome did not execute page JavaScript"},
  {"condition":"notap_probe","url":"http://127.0.0.1:8125/tmp/notap_probe.html","httpGet":true,"e2eResult":null,"result":"timeout"},
  {"condition":"virtual_time_probe","flag":"--virtual-time-budget=20000","httpGet":false,"e2eResult":null,"result":"navigation did not reach local server with this Chrome/flag combination"}
]
```
- 参考: 同一物理式をNodeで再現した検算JSON（Chrome実測ではない）:
```json
[
  {"condition":"notap_baseline","finished":true,"elapsedSec":94.7,"drops":20,"progress":1},
  {"condition":"bot_100ms","finished":true,"elapsedSec":48,"drops":0,"progress":1},
  {"condition":"bot_250ms","finished":true,"elapsedSec":48,"drops":0,"progress":1}
]
```
- 禁止事項確認: `tmp/notap_probe.html`、`tmp/game_e2e_claude.html`、`douga.html`、GAS、`index.html` は今回変更していない。git commit/push、外部リソース参照は行っていない。
