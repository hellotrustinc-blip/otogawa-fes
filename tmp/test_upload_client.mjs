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
  formatProgress
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
assert.equal(formatProgress(0, 85 * 1024 * 1024), '0 KB / 85.0 MB（0%）');
assert.equal(formatProgress(12.25 * 1024 * 1024, 85 * 1024 * 1024), '12.3 MB / 85.0 MB（14%）');
assert.equal(formatProgress(85 * 1024 * 1024, 85 * 1024 * 1024), '85.0 MB / 85.0 MB（100%）');

const html = await readFile(new URL('../douga.html', import.meta.url), 'utf8');
assert.match(html, /mock=1/);
assert.match(`${html}\n${source}`, /アップロード中です。終わるまで画面を閉じたり、他のアプリに切り替えたりしないでください/);
assert.match(source, /MOCK_ITEMS[\s\S]*mock006/);

pathToFileURL('.');
