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
assert.match(html, /mock=1/);
assert.match(`${html}\n${source}`, /アップロード中です。終わるまで画面を閉じたり、他のアプリに切り替えたりしないでください/);
assert.match(source, /投稿が完了しました。動画は保存会にお届けしました。画面を閉じて大丈夫です/);
assert.doesNotMatch(html, /id="gallery"|id="video-modal"|action=list/);
assert.doesNotMatch(html, /投稿された動画を見る|href="gallery\.html"|>見る/);
assert.match(indexHtml, /href="douga\.html">動画を投稿/);

const browserHarness = await readFile(new URL('./browser_e2e.html', import.meta.url), 'utf8');
assert.match(browserHarness, /type="module"/);
assert.match(browserHarness, /from '\.\.\/douga\.js'/);

pathToFileURL('.');
