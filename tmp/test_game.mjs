import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const fail = (message) => {
  console.error(`NG: ${message}`);
  process.exitCode = 1;
};

if (!existsSync(new URL('game.html', root))) fail('game.html が存在しません');

const game = read('game.html');
const index = read('index.html');

if (!/<title>\s*祭｜おみこしわっしょい\s*<\/title>/.test(game)) fail('title が指定どおりではありません');
if (!/<canvas\b/i.test(game)) fail('canvas 要素がありません');
if (!/addEventListener\(['"](?:pointerdown|touchstart|click)['"]/.test(game)) fail('タッチまたはクリックのハンドラがありません');
if (!/href=["']https:\/\/sites\.google\.com\/view\/otogawafes\/%E3%83%9B%E3%83%BC%E3%83%A0["']/.test(game)) fail('サイトへ戻る公式URLリンクがありません');
if (!/あなたは小頭/.test(game)) fail('小頭の役割説明がありません');
if (!/id=["']modeEasy["']/.test(game)) fail('かんたんモードボタン modeEasy がありません');
if (!/id=["']modeHard["']/.test(game)) fail('むずかしいモードボタン modeHard がありません');
if (!/神輿を収めろ/.test(game)) fail('収めフェーズの表示がありません');
if (!/phase:\s*state\.phase/.test(game)) fail('getState() に phase がありません');
if (!/osame:\s*state\.osame/.test(game)) fail('getState() に osame がありません');
if (!/mode:\s*state\.mode/.test(game)) fail('getState() に mode がありません');
if (!/bird:\s*state\.bird/.test(game)) fail('getState() に bird がありません');
if (!/\bmash\b/.test(game)) fail('debug API mash() がありません');
if (!/\bforceBird\b/.test(game)) fail('debug API forceBird() がありません');
if (!/イクゾー！/.test(game)) fail('開始時のイクゾー表示がありません');
if (!/しっかりしろよー/.test(game)) fail('観客の声がありません');
if (!/トリだ/.test(game)) fail('鳥イベント表示がありません');
if (/<(?:script|img|audio|source|iframe|link)\b[^>]*(?:src|href)=["']https?:\/\/(?!sites\.google\.com\/view\/otogawafes\/%E3%83%9B%E3%83%BC%E3%83%A0)/i.test(game)) fail('game.html に許可以外の外部URL参照があります');
if (/\bfetch\s*\(\s*["']https?:\/\//i.test(game)) fail('game.html に外部 fetch があります');
if (!/href=["']game\.html["']/.test(index)) fail('index.html に game.html へのリンクがありません');

let diffNameOnly = '';
try {
  diffNameOnly = execSync('git diff --name-only -- douga.html', { cwd: new URL('.', root), encoding: 'utf8' }).trim();
} catch (error) {
  fail(`douga.html の差分確認に失敗しました: ${error.message}`);
}
if (diffNameOnly) fail('douga.html に git diff 上の変更があります');

// 検収者側計測器(tmp/notap_probe.html・tmp/game_e2e_claude.html)は検収者が正当に更新するため対象外
let prohibitedDiff = '';
try {
  prohibitedDiff = execSync('git diff --name-only -- douga.html index.html', { cwd: new URL('.', root), encoding: 'utf8' }).trim();
} catch (error) {
  fail(`禁止ファイルの差分確認に失敗しました: ${error.message}`);
}
if (prohibitedDiff) fail(`禁止ファイルに git diff 上の変更があります: ${prohibitedDiff}`);

if (!process.exitCode) console.log('OK: game.html / index.html / douga.html checks passed');
