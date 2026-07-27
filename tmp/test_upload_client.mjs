import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const source = await readFile(new URL('../douga.js', import.meta.url), 'utf8');
assert.match(source, /export function getChunkBounds/);
const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
const {
  CHUNK_SIZE,
  getChunkBounds,
  buildContentRange,
  nextStartFrom308,
  sanitizeFileName,
  formatJstDateTime,
  formatBytes,
  formatProgress,
  getUploadOrigin,
  readCompletedUploadId,
  uploadFileData
} = await import(moduleUrl);

assert.equal(CHUNK_SIZE, 8388608);
assert.equal(CHUNK_SIZE % (256 * 1024), 0);

const total = CHUNK_SIZE * 2 + 12345;
const first = getChunkBounds(total, 0);
assert.deepEqual(first, { start: 0, end: 8388607, total });
const last = getChunkBounds(total, CHUNK_SIZE * 2);
assert.equal(buildContentRange(last.start, last.end, total), `bytes ${total - 12345}-${total - 1}/${total}`);

assert.equal(nextStartFrom308('bytes=0-8388607'), 8388608);
assert.equal(sanitizeFileName('../bad\\name\u0000.mp4'), '_bad_name.mp4');
assert.equal(formatJstDateTime(new Date('2026-07-23T15:30:00.000Z')), '2026-07-24_0030');
assert.equal(formatBytes(512 * 1024), '512 KB');
assert.equal(formatBytes(1024 * 1024), '1.0 MB');
assert.equal(formatBytes(12.25 * 1024 * 1024), '12.3 MB');
assert.equal(getUploadOrigin(), '');
assert.match(source, /origin:\s*getUploadOrigin\(\)/);
assert.doesNotMatch(source, /action:\s*['"]finalizeUpload['"]/);
assert.doesNotMatch(source, /action=list|\?action=list|renderGallery|openModal|video-modal/);
assert.equal(formatProgress(0, 85 * 1024 * 1024), '0 KB / 85.0 MB（0%）');
assert.equal(formatProgress(12.25 * 1024 * 1024, 85 * 1024 * 1024), '12.3 MB / 85.0 MB（14%）');
assert.equal(formatProgress(85 * 1024 * 1024, 85 * 1024 * 1024), '85.0 MB / 85.0 MB（100%）');

const unreadableFinal = await readCompletedUploadId({
  status: 200,
  json: async () => {
    throw new Error('CORS body read failed');
  }
});
assert.deepEqual(unreadableFinal, { complete: true, fileId: '' });

const fakeFile = {
  size: 1024,
  slice(start, end) {
    return { start, end };
  }
};
const progressEvents = [];
const finalResult = await uploadFileData(fakeFile, 'https://upload.example/session', {
  fetchImpl: async () => ({
    status: 200,
    json: async () => {
      throw new Error('body parse failed');
    }
  }),
  onProgress: (loaded, totalBytes) => progressEvents.push([loaded, totalBytes])
});
assert.deepEqual(finalResult, { ok: true, fileId: '' });
assert.deepEqual(progressEvents, [[1024, 1024]]);

const retryEvents = [];
let retryFetchCount = 0;
const retryResult = await uploadFileData(fakeFile, 'https://upload.example/session', {
  fetchImpl: async (url, options = {}) => {
    retryEvents.push(['fetch', options.headers['Content-Range']]);
    retryFetchCount += 1;
    if (retryFetchCount === 1) throw new Error('network down');
    return {
      status: 200,
      json: async () => ({ id: 'file123' })
    };
  },
  queryPosition: async () => {
    retryEvents.push(['query']);
    throw new Error('probe blocked by CORS');
  }
});
assert.deepEqual(retryResult, { ok: true, fileId: 'file123' });
assert.deepEqual(retryEvents, [
  ['fetch', 'bytes 0-1023/1024'],
  ['query'],
  ['fetch', 'bytes 0-1023/1024']
]);

const html = await readFile(new URL('../douga.html', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const normalizeContactText = (value) => value.replace(/\s+/g, '');
const extractContactDoneText = (value) => {
  const match = value.match(/<div id="cf_done"[\s\S]*?<\/div>/);
  assert.ok(match, 'cf_done section exists');
  return normalizeContactText(match[0]);
};
assert.match(html, /mock=1/);
assert.match(html, /動画の投稿にあたって（個人情報の取り扱い・著作権）/);
assert.match(html, /1\. 投稿できる動画/);
assert.match(html, /2\. 動画の著作権について/);
assert.match(html, /保存会に譲渡されるものとします/);
assert.match(html, /削除・返却の申し立てはできないものとします/);
assert.match(html, /3\. 写り込みへの配慮/);
assert.match(html, /4\. 個人情報の取り扱い/);
assert.match(html, /5\. お問い合わせ/);
assert.match(html, /個人情報の取り扱い・著作権に同意してアップロード/);
assert.match(html, /ボタンを押すと、上記への同意のうえ投稿されます/);
assert.match(html, /\.consent-box\{[^}]*overflow-y:auto/);
assert.match(`${html}\n${source}`, /アップロード中です。終わるまで画面を閉じたり、他のアプリに切り替えたりしないでください/);
assert.match(source, /投稿が完了しました。動画は保存会にお届けしました。画面を閉じて大丈夫です/);
assert.match(source, /files\.length\s*===\s*0/);
assert.match(source, /動画を選んでください/);
assert.match(source, /button\.disabled\s*=\s*uploading/);
assert.match(source, /アップロード中…/);
assert.match(source, /fileInput\.value\s*=\s*''/);
assert.doesNotMatch(html, /id="gallery"|id="video-modal"|action=list/);
assert.doesNotMatch(html, /投稿された動画を見る|href="gallery\.html"|>見る/);
assert.match(indexHtml, /href="douga\.html">動画を投稿/);
assert.match(html, /<section id="cf-contact"[\s\S]*?<h2>お問い合わせ<\/h2>/);
assert.match(html, /<label>お名前<input type="text" name="name" required><\/label>/);
assert.match(html, /<label>メールアドレス<input type="email" name="email" required><\/label>/);
assert.match(html, /<label>お問い合わせ内容<textarea name="message" rows="5" required><\/textarea><\/label>/);
assert.match(html, /メールが<strong>迷惑メールフォルダ<\/strong>に振り分けられている可能性があります/);
assert.ok(html.indexOf('id="upload-form"') < html.indexOf('id="cf-contact"'));
assert.ok(html.indexOf('id="upload-alert"') < html.indexOf('id="cf-contact"'));
assert.equal(extractContactDoneText(html), extractContactDoneText(indexHtml));
assert.match(html, /f\.setAttribute\('action', window\.GAS_URL\)/);
assert.match(html, /function onDougaContactSubmit\(\)/);

const browserHarness = await readFile(new URL('./browser_e2e.html', import.meta.url), 'utf8');
assert.match(browserHarness, /type="module"/);
assert.match(browserHarness, /from '\.\.\/douga\.js'/);

pathToFileURL('.');
