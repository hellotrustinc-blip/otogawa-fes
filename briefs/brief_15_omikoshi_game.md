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

---

## 追補3（2026-07-28・実機フィードバック第2弾: 小頭設定・収めコーナー・担ぎ手増員・イクゾー）

発注元の実機プレイ評価「よくなってきました」を受けた機能追加。対象=game.html（＋検査系の追随更新）。

### 追加仕様

**A. プレイヤー設定=小頭（こがしら）**
- スタートオーバーレイに役割文を追加: 「あなたは小頭。神輿を落とさずに八坂神社まで導け！」
- ゲームオーバーなしの思想は維持（落下しても続行）。クリア時、落下0回なら「完璧な差配！」等の特別賞賛を表示（落下ありは従来どおり回数表示）。

**B. 収めコーナー（ゴール後の連打フェーズ）**
- progress が 1 に到達したら即終了せず「収めフェーズ」へ移行。
- 画面に大きく「神輿を収めろ！」の合図表示。担ぎ手はまだ担ぎたがって暴れる（神輿が揺れる演出）。
- プレイヤーは画面を**連打**して担ぎ手を押さえつけ、収めゲージを満たす。ゲージはバー表示し、放置すると自然減少（担ぎ手の抵抗）。
- 数値目安: 秒4回連打（250ms間隔）でも約10〜15秒で満タンにできる減衰・増分設計（子供のゆっくり連打で必ず収まる）。無連打では満タンにならないこと。
- ゲージ満タン→神輿が**2つの台（馬・木の台を左右に2基描画）**の上へ降ろされる着地演出→紙吹雪＋「奉納完了！わっしょい！」＋所要タイム＋「もう一回」（従来のクリア演出へ接続）。
- 収めフェーズ中の左右どちらのタップも連打としてカウント（バランス操作は終了）。

**C. 担ぎ手の増員**
- 担ぎ手を**左右4人ずつ計8人**に増やす（ドット絵。前後の奥行き表現や色違いは任意）。

**D. 開始の掛け声「イクゾー！」**
- スタート（タップでスタート直後・「もう一回」直後の両方）に「イクゾー！」を大きくポップ表示（DOM要素のcallout系で・**表示は最低1.5秒維持**）。
- 音ONのときはWebAudio合成の掛け声風の音も鳴らす（音声ファイル不使用）。

**E. デバッグAPI拡張（既存メソッドは挙動維持）**
- getState() の返り値に `phase`（'play' | 'osame' | 'done'）と `osame`（収めゲージ0〜1）を追加。
- `mash()` を追加（収めフェーズの連打1回に相当。playフェーズでは何もしない）。
- forceGoal() は従来どおり最終クリア演出まで直行（UI検収用）。

### 検査系の追随（Codexが更新してよいもの）
- tmp/game_autoplay_e2e.html: playフェーズは従来どおり正しい側タップ、osameフェーズに入ったら同じinterval間隔で mash() を連打し、finished まで到達する動作へ更新。E2E_RESULT に phase到達情報（reachedOsame）を追加。
- tmp/test_game.mjs: 必要なら検査追加（title は変更しないこと）。

### 追補3の合格条件（ヘッドレスChrome実測。検収者が独立再実行する）
1. `node tmp/test_game.mjs` exit 0
2. **100msボット**（tmp/game_autoplay_e2e.html）: reachedOsame=true かつ finished=true かつ 合計50〜95秒
3. **250msゆっくりボット**（?interval=250）: finished=true かつ 合計150秒以内
4. **無操作**（tmp/notap_probe.html・変更禁止）: 200秒時点で finished=false かつ progress≥1（=収めフェーズには到達するが連打なしでは収まらない）
5. 実測JSON3件を「追補3実装報告」として本brief末尾に追記（Codex環境でブラウザ実測が動かない場合は、その事実と未検証である旨を明記すれば可=検収者が実測する）

### 禁止事項
- tmp/notap_probe.html・tmp/game_e2e_claude.html・douga.html・GAS・index.html の変更、git commit/push、外部リソース参照

## 追補3 実装報告（2026-07-28・Codex）
- 実装内容: `game.html` に小頭の役割説明を追加し、開始時/再開時にDOM calloutで「イクゾー！」を1.5秒以上表示するようにした。音ON時は既存WebAudio合成音で掛け声風の音も鳴らす。
- 実装内容: `progress >= 1` で即終了せず、`phase='osame'` の収めフェーズへ移行するようにした。収めフェーズでは「神輿を収めろ！」表示、収めゲージ、左右2基の台描画、連打で `osame` が増え、放置で自然減衰する。ゲージ満タンで `phase='done'` となり、従来の奉納完了演出へ接続する。
- 実装内容: 担ぎ手描画を左右4人ずつ、合計8人に増員した。
- 実装内容: クリア時に落下0回なら「完璧な差配！特別奉納です」、落下ありなら後戻り回数を表示するようにした。ゲームオーバーなしの思想は維持した。
- 実装内容: デバッグAPIを拡張し、`getState()` に `phase` と `osame` を追加、`mash()` を追加した。`forceGoal()` は収めフェーズを経由して最終クリア状態まで進める。
- 検査更新: `tmp/game_autoplay_e2e.html` はplayフェーズで従来どおり下がった側を補正し、osameフェーズ到達後は同じintervalで `mash()` を連打するよう更新した。`E2E_RESULT` には `reachedOsame` と `phase` を追加した。
- 検査更新: `tmp/test_game.mjs` に小頭説明、収めフェーズ表示、`phase`/`osame`/`mash()`、イクゾー表示、禁止ファイル差分なしの静的検査を追加した。
- 静的検査: `node --check tmp/test_game.mjs` は exit 0。
- 静的検査: `node tmp/test_game.mjs` は exit 0。出力は `OK: game.html / index.html / douga.html checks passed`。
- ブラウザ実測: このCodex環境では Chrome headless `--dump-dom --virtual-time-budget=120000` で `tmp/game_autoplay_e2e.html` と `tmp/game_autoplay_e2e.html?interval=250` を開いたが、どちらも `E2E_RESULT` がDOMに出力されなかったため未検証。結果は `NO_E2E_RESULT http://127.0.0.1:8137/tmp/game_autoplay_e2e.html` / `NO_E2E_RESULT http://127.0.0.1:8137/tmp/game_autoplay_e2e.html?interval=250`。
- 禁止事項確認: `git diff --name-only` の対象は `briefs/brief_15_omikoshi_game.md`、`game.html`、`tmp/game_autoplay_e2e.html`、`tmp/test_game.mjs` のみ。`tmp/notap_probe.html`、`tmp/game_e2e_claude.html`、`douga.html`、GAS、`index.html` は変更していない。git commit/push と外部リソース参照は実行していない。

---

## 追補4（2026-07-28・実機フィードバック第3弾: 公式サイト戻りリンク・難易度2モード・鳥イベント・観客の声＋イクゾー欠陥修正）

### 検収で発見した欠陥の修正（最優先）
- **イクゾー未発火**: ikuzo() が「もう一回」とdebug start()からしか呼ばれず、通常の初回開始経路（オーバーレイタップ→startGame）で発火しない。**すべての開始経路**（下記モード選択ボタン・もう一回・debug start）で開始直後に同期発火させること。

### 追加仕様

**A. 戻りリンクの変更**
- 「トップへ戻る」を公式サイト `https://sites.google.com/view/otogawafes/%E3%83%9B%E3%83%BC%E3%83%A0` へ変更（douga.htmlの戻りリンクと同一URL・表記は「サイトへ戻る」等）。./index.html への戻りは廃止してよい。
- ※外部参照禁止ルールの例外はこの<a>ナビリンク1箇所のみ。script/img/audio等の外部参照は引き続き禁止。

**B. モード選択（スタートオーバーレイ改修）**
- オーバーレイに2ボタン: 「かんたん」(id="modeEasy") と「むずかしい」(id="modeHard")。※idは検収ハーネスが使うため固定。
- ボタン押下でそのモードで開始（＋イクゾー！）。「もう一回」=同モード即再開。オーバーレイへ戻る小リンク「モードをえらぶ」を任意で設置可。
- かんたん=現行の調整のまま（追補2の実測合格バランスを変えない）。

**C. むずかしいモード（2つの新メカニクス）**
1. **押しすぎ逆傾き（過補正）**: タップ補正が過補正気味になる。特に|θ|が小さいときに正しい側をタップすると、θが0を乗り越えて反対側へ傾く（連打しすぎると左右にブレる）。θが大きいときの立て直し効果は残す（クリア不能にしない）。
2. **鳥イベント**: 道中ランダムに1〜3回、神輿の片側の端に鳥（ドット絵・カラス風）が舞い降り、乗っている間（4〜6秒）その側へ傾くバイアストルクがかかり傾き方が急になる。着地時に「トリだ！」callout。時間経過で飛び去る。
- 外乱の基礎値もかんたんより2〜3割強めてよい。ゲームオーバーなしは維持。

**D. 観客の声（両モード共通）**
- 落下（failReset）のたびに観客側から「しっかりしろよー！」の吹き出し/ポップを表示（神輿のcalloutとは別要素・最低1秒表示・音ONなら効果音も）。「おっとっと！」表示との共存可。

**E. デバッグAPI拡張（既存挙動維持）**
- start(mode) — 'easy'（省略時）| 'hard' で開始。
- getState() に mode・bird（乗っていなければ null、乗っていれば 'left' | 'right'）を追加。
- forceBird(side) — 'left' | 'right' の鳥イベントを即発生（hardモード中のみ有効でよい）。

**F. 検査系の追随（Codexが更新するもの）**
- tmp/test_game.mjs: 戻りリンク検査を Sites URL へ変更／modeEasy・modeHardボタン存在／「しっかりしろよー」「トリだ」文字列存在を追加。外部参照禁止検査は<a>ナビリンクを除外する形に調整。
- tmp/game_autoplay_e2e.html: `?mode=hard` 対応（start('hard')で開始）。botはスマート戦略へ更新=「|θ|>0.06のときだけ正しい側をタップ・osameフェーズはinterval間隔でmash()連打」（hardの過補正で連打が逆効果になるため）。E2E_RESULTに mode を追加。

### 追補4の合格条件（検収者が独立実測）
1. `node tmp/test_game.mjs` exit 0
2. easy 100msボット: reachedOsame=true・finished=true・50〜95秒
3. easy 250msボット: finished=true・150秒以内
4. 無操作（tmp/notap_probe.html・変更禁止・easyで動く）: 200秒時点 finished=false かつ progress≥1
5. hard スマートボット(100ms): finished=true・50〜130秒
6. 過補正の機械証明(hard): |θ|<0.05 のとき正しい側タップ→同期でθが反対符号になること
7. 鳥の機械証明(hard): forceBird('left')後、無タップ1.5秒でθが鳥側（負方向）へ変化し、getState().bird==='left' が読めること
8. しっかりしろよー: 開始後無タップ10秒以内の自然落下でDOM上に「しっかりしろよー」が出現
9. イクゾー: モードボタンクリック直後の同期チェックで calloutが「イクゾー！」（easy/hard両方）
10. 実装報告を本brief末尾に「追補4実装報告」として追記（そちらの環境でブラウザ実測不可なら未検証と明記すれば可＝検収者が実測）

### 禁止事項
- tmp/notap_probe.html・tmp/game_e2e_claude.html・douga.html・GAS・index.html の変更、git commit/push、外部リソース参照（上記A の<a>リンク1箇所のみ例外）

## 追補4実装報告（2026-07-28・Codex）
- 実装内容: `game.html` の戻りリンクを公式サイト `https://sites.google.com/view/otogawafes/%E3%83%9B%E3%83%BC%E3%83%A0` に変更し、表示を「サイトへ戻る」に変更した。この `<a>` 1箇所以外の外部 `script/img/audio/source/iframe/link/fetch` 参照は追加していない。
- 実装内容: スタートオーバーレイに `id="modeEasy"` の「かんたん」と `id="modeHard"` の「むずかしい」ボタンを追加した。かんたんモードは既存の `targetSeconds=48`、`difficulty=Math.min(1.6, 1 + progress * 0.5)`、`limit=0.22`、`tapImpulse=0.04` の現行バランスを維持した。
- 欠陥修正: 通常の初回開始、モードボタン開始、もう一回、debug `start(mode)` の各開始経路で `イクゾー！` callout とWebAudio合成音（音ON時）が同期発火するようにした。
- 実装内容: むずかしいモードでは、正しい側でも `|theta| < 0.06` で押すと反対側へ傾く過補正を追加した。ゲームオーバーなし、落下時の5%後退は維持した。
- 実装内容: むずかしいモードに鳥イベントを追加した。`forceBird('left'|'right')` で即時発生し、`getState().bird` に `'left'|'right'|null` を返す。鳥が乗っている間は該当側へ傾くバイアストルクを掛け、DOM callout に「トリだ」を表示する。
- 実装内容: 落下 `failReset()` ごとに観客の声として「しっかりしろよー」を別calloutで表示し、音ON時は既存WebAudio合成音を鳴らす。
- 実装内容: debug API を `start(mode)`, `getState().mode`, `getState().bird`, `forceBird(side)` 対応に拡張した。既存の `getState`, `forceGoal`, `tapLeft`, `tapRight`, `mash` は維持した。
- 検査更新: `tmp/test_game.mjs` に公式サイト戻りリンク、`modeEasy`/`modeHard`、`mode`/`bird`/`forceBird`、観客声、鳥、許可リンク例外の検査を追加した。
- 検査更新: `tmp/game_autoplay_e2e.html` を `?mode=hard` に対応させた。play中は `|theta| > 0.06` のときだけ正しい側をタップし、osame中は `mash()` を連打する。`E2E_RESULT` に `mode`、`reachedOsame`、`phase` を追加した。
- 静的検査: `node --check tmp/test_game.mjs` は exit 0。
- 静的検査: `node tmp/test_game.mjs` は exit 0。出力は `OK: game.html / index.html / douga.html checks passed`。
- 構文検査: `game.html` 内の inline script を Node で抽出し `new Function(script)` に通して、`OK: inline scripts parse` を確認した。
- ブラウザ実測: このCodex環境では Chrome headless の `--dump-dom --virtual-time-budget=160000` で `tmp/game_autoplay_e2e.html`、`?interval=250`、`?mode=hard` のいずれも `E2E_RESULT` がDOMに出力されなかったため未検証。`file://` でも `NO_E2E_RESULT_FILE_URL` だった。
- 禁止事項確認: 今回、`tmp/notap_probe.html`、`douga.html`、GAS関連、`index.html`、git commit/push、外部リソース参照追加（公式サイト `<a>` 1箇所を除く）は実行していない。`tmp/game_e2e_claude.html` は作業開始時点の `git status --short` で既に変更済み表示だったため、今回触らず差分を維持した。

---

## 追補5（2026-07-29・実機フィードバック第4弾: 神輿中央配置・hardのガイド非表示）

### 修正指示

**A. 神輿を画面中央へ**
- 現状 `cx = 108 + state.progress * 74` で左寄り。左右どちらの画面半分をタップすべきか直感的でない。
- 神輿（担ぎ手含む一団）の水平中心を**canvas中央（x=195）固定**に変更。上下の担ぎ揺れ・傾きleanは維持。前進感は背景スクロール（既存）が担う。
- 鳥の着地位置・紙吹雪など他の描画との重なりに崩れが出ないよう追随調整してよい。

**B. むずかしいモードは傾きガイドを消す**
- canvas上部の「右が下がり気味／左が下がり気味」表示（現560行付近）を**hardモードでは描画しない**（easyは現状維持）。
- 下部の静的ガイド「⬇下がった側をタップ！」は方向情報を含まないため両モード維持でよい。

### 合格条件
1. `node tmp/test_game.mjs` exit 0
2. easy 100msボット: finished=true・50〜95秒（バランス非破壊の確認）
3. hard スマートボット(?mode=hard): finished=true・50〜130秒
4. 実装報告に「神輿一団の描画x中心がcanvas中央になったこと」「hardで下がり気味表示が消えeasyで残ること」の確認方法を記載（そちらでブラウザ実測不可なら未検証と明記可=検収者がスクリーンショット実測）

### 禁止事項
- 物理定数・モード仕様・収めフェーズ等の挙動変更（描画位置とガイド表示条件のみ）
- tmp/notap_probe.html・tmp/game_e2e_claude.html・tmp/hard_probe.html・douga.html・GAS・index.html の変更、git commit/push、外部リソース参照

## 追補5 実装報告（2026-07-29・Codex）
- 実装内容: `game.html` の `drawMikoshi()` で神輿一団の描画中心 `cx` を `W / 2` に変更し、canvas幅390pxの中央 x=195 固定にした。上下の担ぎ揺れ `cy`、傾き `theta`、担ぎ手の `lean` は維持した。
- 実装内容: canvas上部の「右が下がり気味／左が下がり気味」描画を `state.mode !== 'hard'` の場合だけ実行する条件にした。hardでは非表示、easyでは従来どおり表示される。下部の静的ガイド「⬇下がった側をタップ！」は変更していない。
- 検査更新: `tmp/test_game.mjs` に、神輿中心が `W / 2` であること、hard向け非表示条件があること、下部静的ガイドが残っていることの静的検査を追加した。
- 静的検査: `node --check tmp/test_game.mjs` は exit 0。`node tmp/test_game.mjs` は exit 0、出力は `OK: game.html / index.html / douga.html checks passed`。
- ブラウザ実測: ローカルHTTPサーバーと Chrome headless `--dump-dom --virtual-time-budget=160000` で `tmp/game_autoplay_e2e.html` と `?mode=hard` を実行したが、どちらも `E2E_RESULT` がDOMに出力されなかったため未検証。easy 100msボットと hardスマートボットの finished/elapsedSec は検収者が実測する。
- 確認方法: スクリーンショット実測では、canvas幅390pxの中央 x=195 上に神輿本体と担ぎ手一団の水平中心があることを確認する。easy開始後は上部に「右が下がり気味／左が下がり気味」が表示され、hard開始後は同表示が消え、左上の「むずかしい」表示と下部静的ガイドだけが残ることを確認する。
- 禁止事項確認: 物理定数、モード仕様、収めフェーズ処理は変更していない。`tmp/notap_probe.html`、`tmp/game_e2e_claude.html`、`tmp/hard_probe.html`、`douga.html`、GAS、`index.html` は変更していない。git commit/push と外部リソース参照追加は実行していない。

---

## 追補6（2026-07-29・みんなのランキング: GASスコアAPI+ゲーム内ランキングUI）

発注元が方式②（共通ランキング・既存GAS流用・ニックネーム・100位表示）を採用。町内交流が目的。

### A. GASスコアAPI（お問い合わせ受け皿.gs へ追加・既存の問合せ/動画処理は無変更）
- doPost action **'scoreAdd'**: payload {name, mode, timeSec, drops}
  - 検証: mode∈{easy,hard}／timeSec=数値30〜3600（範囲外は拒否）／drops=0〜999／name=既存sanitizeName_流儀で制御文字・URL除去+trim+**最大10文字**・空なら「ななしのかつぎて」
  - 保存先: スプレッドシート「大戸川祭礼 おみこしランキング」（無ければscriptが作成）のシート'ranking'に [登録日時, mode, name, timeSec, drops, hidden] を追記
  - **hidden列**: 管理者(発注元)が手で何か書いた行はランキング除外（荒れた記録対策）
  - 返り値: {ok:true, rank:(同mode内でこのタイムの順位)}
- doGet action **'scoreTop'**: param mode → hidden空の行をtimeSec昇順で**上位100件** {ok:true, list:[{rank,name,timeSec,drops}]}
- appsscript.json の oauthScopes に spreadsheets を追加（**デプロイ時に再承認1回が必要になる旨を実装報告に明記**）
- 通信規約は既存流儀（json_・Origin対応・text/plain POST）を踏襲

### B. game.html ランキングUI
- **クリア画面**: タイムの下にニックネーム入力（最大10字・placeholder例「ニックネーム（ひらがな）」）+注意書き「※ほんみょうは入れないでね」+「ランキングにとうろく」ボタン。登録成功で「あなたは◯位！」表示→ランキング表示へ。1クリア1回のみ（送信中/送信後disabled）
- **ランキング閲覧**: スタートオーバーレイに「ランキング」ボタン(id="rankBtn")→オーバーレイでtop100リスト（かんたん/むずかしい切替チップ・順位/ニックネーム/タイム表示・閉じるボタン）。プレイせず閲覧だけも可
- **グレースフル**: API未デプロイ/通信失敗時は「ランキングはじゅんびちゅう」表示。ゲーム本体のプレイ・クリア演出には一切影響させない（fetch失敗でthrowさせない）
- GAS URLはindex.htmlの問合せフォームactionと同一ベースURLを定数で使用
- 通信はdouga.js流儀（Content-Type text/plain回避型POST・JSON）

### C. 検査系の追随
- tmp/test_game.mjs: rankBtn存在・「ほんみょうは入れないでね」存在・外部fetch検査を「上記GAS URLのみ許可」に更新
- **tmp/rank_mock_e2e.html新設**: fetchをモックし ①登録→「あなたは◯位！」表示 ②top100（モック100件）リスト描画で390px幅が横崩れしない（scrollWidth<=390相当の実測） ③fetch失敗時「じゅんびちゅう」表示 の3状態を E2E_RESULT JSON で機械実測

### 合格条件
1. `node tmp/test_game.mjs` exit 0
2. easy 100msボット: finished=true・50〜95秒（本体非破壊）
3. tmp/rank_mock_e2e.html: 3状態すべてtrue（検収者がヘッドレスChromeで独立実測）
4. 実装報告: .gs追加内容・新スコープと再承認の必要性・「GASエディタへ貼り→新バージョンデプロイ」手順1行・（ブラウザ実測不可なら未検証明記可）

### 禁止事項
- 既存の問合せ/動画GAS処理・物理定数・モード仕様の変更
- tmp/notap_probe.html・tmp/game_e2e_claude.html・tmp/hard_probe.html・tmp/screen_probe.html・douga.html/douga.js・index.html の変更、git commit/push
- GAS URL以外への外部通信追加

## 追補6 実装報告（2026-07-29・Codex）
- GASスコアAPI: `お問い合わせ受け皿.gs` に `doPost` action `scoreAdd` と `doGet` action `scoreTop` を追加した。既存の問い合わせ処理と動画処理の関数本体は変更せず、`scoreAdd` は mode/timeSec/drops/name を検証し、スプレッドシート「大戸川祭礼 おみこしランキング」の `ranking` シートへ `[登録日時, mode, name, timeSec, drops, hidden]` を追記する。`hidden` が空でない行は `scoreTop` と順位計算から除外する。
- OAuth: `appsscript.json` に `https://www.googleapis.com/auth/spreadsheets` を追加した。デプロイ時にGoogle Apps Scriptの再承認が1回必要。
- デプロイ手順: GASエディタへ `お問い合わせ受け皿.gs` と `appsscript.json` を貼り、新しいバージョンとしてウェブアプリをデプロイする。
- game.html: クリア画面にニックネーム入力、注意書き「※ほんみょうは入れないでね」、ランキング登録ボタン、登録結果表示を追加した。スタート画面に `rankBtn` を追加し、かんたん/むずかしい切替付きtop100ランキングモーダルを追加した。API失敗時は「ランキングはじゅんびちゅう」と表示し、ゲーム本体の進行・クリア演出には影響しない。
- 検査系: `tmp/test_game.mjs` に `rankBtn`、注意書き、登録ボタン、許可GAS URLの静的検査を追加した。`tmp/rank_mock_e2e.html` を新設し、fetchモックで登録成功表示、100件描画、通信失敗表示、390px幅崩れを `E2E_RESULT` JSONで測れるようにした。
- 静的検査: `node --check tmp/test_game.mjs`、`node tmp/test_game.mjs`、`node tmp/test_gas_router.mjs`、`appsscript.json` のJSON parse、`game.html` inline script構文検査、`tmp/rank_mock_e2e.html` inline script構文検査、スコアAPIのVMモック検査はいずれも exit 0。`node tmp/test_game.mjs` の出力は `OK: game.html / index.html / douga.html checks passed`。スコアAPIのVMモック検査は `OK: score API mock checks passed`。
- ブラウザ実測: Chrome `--dump-dom` はこのCodex環境で標準出力を返さなかったため、Chrome DevTools ProtocolでDOMを実測した。`tmp/rank_mock_e2e.html` は `E2E_RESULT:{"registered":true,"listed100":true,"widthOk":true,"failureReady":true,"fetchCalls":2,"scrollWidth":343}`。easy 100msボットは `E2E_RESULT:{"finished":true,"elapsedSec":53,"drops":0,"intervalMs":100,"mode":"easy","reachedOsame":true,"phase":"done"}`。
- 禁止事項確認: 物理定数・モード仕様・収めフェーズ、既存の問い合わせ/動画GAS処理、`tmp/notap_probe.html`、`tmp/game_e2e_claude.html`、`tmp/hard_probe.html`、`tmp/screen_probe.html`、`douga.html`、`douga.js`、`index.html` は変更していない。git commit/push は実行していない。GAS URL以外への外部通信は追加していない。
