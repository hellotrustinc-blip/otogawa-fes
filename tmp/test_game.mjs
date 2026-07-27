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
if (!/href=["']\.\/index\.html["']/.test(game)) fail('トップへ戻る相対リンクがありません');
if (/<(?:script|img|audio|source|iframe|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(game)) fail('game.html に外部URL参照があります');
if (/\bfetch\s*\(\s*["']https?:\/\//i.test(game)) fail('game.html に外部 fetch があります');
if (!/href=["']game\.html["']/.test(index)) fail('index.html に game.html へのリンクがありません');

let diffNameOnly = '';
try {
  diffNameOnly = execSync('git diff --name-only -- douga.html', { cwd: new URL('.', root), encoding: 'utf8' }).trim();
} catch (error) {
  fail(`douga.html の差分確認に失敗しました: ${error.message}`);
}
if (diffNameOnly) fail('douga.html に git diff 上の変更があります');

if (!process.exitCode) console.log('OK: game.html / index.html / douga.html checks passed');
