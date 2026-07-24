export const CHUNK_SIZE = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024;

export function getChunkBounds(totalBytes, start, chunkSize = CHUNK_SIZE) {
  if (!Number.isInteger(totalBytes) || totalBytes < 0) {
    throw new Error('totalBytes must be a non-negative integer');
  }
  if (!Number.isInteger(start) || start < 0) {
    throw new Error('start must be a non-negative integer');
  }
  if (!Number.isInteger(chunkSize) || chunkSize <= 0 || chunkSize % (256 * 1024) !== 0) {
    throw new Error('chunkSize must be a positive multiple of 256KiB');
  }
  if (totalBytes === 0 || start >= totalBytes) {
    return null;
  }
  return {
    start,
    end: Math.min(start + chunkSize, totalBytes) - 1,
    total: totalBytes
  };
}

export function buildContentRange(start, end, totalBytes) {
  return `bytes ${start}-${end}/${totalBytes}`;
}

export function buildProbeContentRange(totalBytes) {
  return `bytes */${totalBytes}`;
}

export function nextStartFrom308(rangeHeader) {
  if (!rangeHeader) return 0;
  const match = String(rangeHeader).match(/bytes\s*=\s*(\d+)\s*-\s*(\d+)/i);
  if (!match) return 0;
  return Number(match[2]) + 1;
}

export function sanitizeFileName(name) {
  const cleaned = String(name || 'video')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 120);
  return cleaned || 'video';
}

export function formatJstDateTime(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}_${parts.hour}${parts.minute}`;
}

export function formatBytes(bytes) {
  const value = Math.max(0, Number(bytes) || 0);
  const mb = 1024 * 1024;
  if (value < mb) {
    return `${Math.round(value / 1024)} KB`;
  }
  return `${(value / mb).toFixed(1)} MB`;
}

export function formatProgress(loadedBytes, totalBytes) {
  const total = Math.max(0, Number(totalBytes) || 0);
  const loaded = Math.min(Math.max(0, Number(loadedBytes) || 0), total || Math.max(0, Number(loadedBytes) || 0));
  const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
  return `${formatBytes(loaded)} / ${formatBytes(total)}（${percent}%）`;
}

const MOCK_ITEMS = [
  { id: 'mock001', name: '2026-07-24_0900_山車の出発.mp4', createdTime: '2026-07-24T00:00:00Z', size: '73400320' },
  { id: 'mock002', name: '2026-07-23_1845_太鼓と神輿.mp4', createdTime: '2026-07-23T09:45:00Z', size: '125829120' },
  { id: 'mock003', name: '2026-07-23_1710_境内の様子.mp4', createdTime: '2026-07-23T08:10:00Z', size: '58720256' },
  { id: 'mock004', name: '2026-07-22_2030_夜の巡行.mp4', createdTime: '2026-07-22T11:30:00Z', size: '184549376' },
  { id: 'mock005', name: '2026-07-22_1500_子どもたち.mp4', createdTime: '2026-07-22T06:00:00Z', size: '46137344' },
  { id: 'mock006', name: '2026-07-21_1000_準備風景.mp4', createdTime: '2026-07-21T01:00:00Z', size: '39845888' }
];

let activeUploadCount = 0;
let wakeLock = null;
let wakeLockReleaseHandler = null;

const UPLOAD_ALERT_TEXT = '⚠ アップロード中です。終わるまで画面を閉じたり、他のアプリに切り替えたりしないでください';
const UPLOAD_DONE_TEXT = '✅ 投稿が完了しました。画面を閉じて大丈夫です';

function getUploadAlert() {
  if (typeof document === 'undefined') return null;
  return document.getElementById('upload-alert');
}

function beforeUnloadHandler(event) {
  event.preventDefault();
  event.returnValue = '';
}

async function requestWakeLock() {
  if (typeof navigator === 'undefined' || !navigator.wakeLock || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLockReleaseHandler = () => {
      wakeLock = null;
    };
    wakeLock.addEventListener('release', wakeLockReleaseHandler);
  } catch (err) {
    wakeLock = null;
  }
}

async function releaseWakeLock() {
  if (!wakeLock) return;
  const current = wakeLock;
  wakeLock = null;
  try {
    if (wakeLockReleaseHandler) current.removeEventListener('release', wakeLockReleaseHandler);
    await current.release();
  } catch (err) {
    // 非対応機種や解除済みの場合は何もしません。
  } finally {
    wakeLockReleaseHandler = null;
  }
}

function showUploadAlert(text = UPLOAD_ALERT_TEXT, done = false) {
  const alert = getUploadAlert();
  if (!alert) return;
  alert.textContent = text;
  alert.classList.toggle('done', done);
  alert.hidden = false;
}

function hideUploadAlert() {
  const alert = getUploadAlert();
  if (!alert) return;
  alert.hidden = true;
  alert.classList.remove('done');
}

async function beginUploadGuard() {
  activeUploadCount += 1;
  if (activeUploadCount === 1) {
    showUploadAlert();
    window.addEventListener('beforeunload', beforeUnloadHandler);
    await requestWakeLock();
  }
}

async function endUploadGuard({ completed = false } = {}) {
  activeUploadCount = Math.max(0, activeUploadCount - 1);
  if (activeUploadCount !== 0) return;
  window.removeEventListener('beforeunload', beforeUnloadHandler);
  await releaseWakeLock();
  if (completed) {
    showUploadAlert(UPLOAD_DONE_TEXT, true);
  } else {
    hideUploadAlert();
  }
}

function handleVisibilityChange() {
  if (activeUploadCount > 0 && document.visibilityState === 'visible') {
    requestWakeLock();
  }
}

function postToGas(gasUrl, payload) {
  return fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  }).then(readJson);
}

export function getUploadOrigin() {
  if (typeof location === 'undefined' || !location.origin) return '';
  return location.origin;
}

function readJson(response) {
  return response.text().then((text) => {
    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch (err) {
      throw new Error('サーバーから正しいJSONが返りませんでした。');
    }
    if (!response.ok || json.ok === false) {
      throw new Error(json.error || '通信に失敗しました。');
    }
    return json;
  });
}

export async function readCompletedUploadId(response) {
  if (!response || (response.status !== 200 && response.status !== 201)) {
    return { complete: false, fileId: '' };
  }
  try {
    const body = await response.json();
    return { complete: true, fileId: body && body.id ? String(body.id) : '' };
  } catch (err) {
    return { complete: true, fileId: '' };
  }
}

async function queryUploadPosition(sessionUri, totalBytes) {
  const response = await fetch(sessionUri, {
    method: 'PUT',
    headers: { 'Content-Range': buildProbeContentRange(totalBytes) }
  });
  if (response.status === 308) {
    return nextStartFrom308(response.headers.get('Range'));
  }
  if (response.status === 200 || response.status === 201) {
    return totalBytes;
  }
  throw new Error('アップロード位置を確認できませんでした。');
}

async function putChunk(sessionUri, file, bounds) {
  const blob = file.slice(bounds.start, bounds.end + 1);
  return fetch(sessionUri, {
    method: 'PUT',
    headers: { 'Content-Range': buildContentRange(bounds.start, bounds.end, bounds.total) },
    body: blob
  });
}

export async function uploadFileData(file, sessionUri, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const onRetryNeeded = typeof options.onRetryNeeded === 'function' ? options.onRetryNeeded : null;
  const queryPosition = options.queryPosition || queryUploadPosition;
  let start = Number(options.start || 0);
  let retries = 0;
  let finalId = '';

  const run = async () => {
    while (start < file.size) {
      const bounds = getChunkBounds(file.size, start);
      try {
        const blob = file.slice(bounds.start, bounds.end + 1);
        const response = await fetchImpl(sessionUri, {
          method: 'PUT',
          headers: { 'Content-Range': buildContentRange(bounds.start, bounds.end, bounds.total) },
          body: blob
        });
        if (response.status === 308) {
          start = nextStartFrom308(response.headers.get('Range')) || bounds.end + 1;
        } else if (response.status === 200 || response.status === 201) {
          const done = await readCompletedUploadId(response);
          finalId = done.fileId || '';
          start = file.size;
        } else {
          throw new Error(`アップロードに失敗しました（${response.status}）。`);
        }
        retries = 0;
        onProgress(start, file.size);
      } catch (err) {
        retries += 1;
        if (retries > 3) {
          if (onRetryNeeded) {
            onRetryNeeded(err, async () => {
              start = await queryPosition(sessionUri, file.size);
              retries = 0;
              return run();
            });
            return { ok: false, fileId: finalId };
          }
          throw err;
        }
        try {
          start = await queryPosition(sessionUri, file.size);
        } catch (probeErr) {
          start = bounds.start;
        }
      }
    }
    return { ok: true, fileId: finalId };
  };

  return run();
}

async function uploadVideo(file, uploaderName, ui, gasUrl) {
  const init = await postToGas(gasUrl, {
    action: 'initUpload',
    fileName: sanitizeFileName(file.name),
    mimeType: file.type || 'video/mp4',
    fileSize: file.size,
    uploaderName,
    origin: getUploadOrigin()
  });

  const result = await uploadFileData(file, init.sessionUri, {
    onProgress: (loaded, total) => {
      ui.update(Math.round((loaded / total) * 100), 'アップロード中', loaded, total);
    },
    onRetryNeeded: (err, retry) => {
      ui.fail('通信が途切れました。「再開」を押してください。', retry);
    }
  });

  if (!result.ok) return false;
  ui.update(100, '完了しました', file.size, file.size);

  if (result.fileId) {
    postToGas(gasUrl, { action: 'finalizeUpload', fileId: result.fileId }).catch((err) => {
      console.warn('finalizeUpload failed', err);
    });
  }
  return true;
}

function createUploadRow(file) {
  const row = document.createElement('div');
  row.className = 'upload-row';
  row.innerHTML = `
    <div class="upload-meta">
      <span class="upload-name"></span>
      <span class="upload-status">待機中</span>
    </div>
    <span class="upload-progress-text"></span>
    <div class="progress" aria-hidden="true"><span></span></div>
    <button class="retry-btn" type="button" hidden>再開</button>
  `;
  row.querySelector('.upload-name').textContent = file.name;
  const bar = row.querySelector('.progress span');
  const status = row.querySelector('.upload-status');
  const progressText = row.querySelector('.upload-progress-text');
  const retry = row.querySelector('.retry-btn');
  progressText.textContent = formatProgress(0, file.size);
  return {
    element: row,
    update(percent, text, loadedBytes = Math.round((file.size * percent) / 100), totalBytes = file.size) {
      bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
      status.textContent = text;
      progressText.textContent = formatProgress(loadedBytes, totalBytes);
      retry.hidden = true;
    },
    fail(text, onRetry) {
      status.textContent = text;
      retry.hidden = typeof onRetry !== 'function';
      retry.onclick = async () => {
        if (typeof onRetry !== 'function') return;
        await beginUploadGuard();
        try {
          const ok = await onRetry();
          await endUploadGuard({ completed: ok !== false });
        } catch (err) {
          status.textContent = err.message || '再開に失敗しました。';
          await endUploadGuard({ completed: false });
        }
      };
    }
  };
}

function renderMockUpload(list) {
  const file = { name: '検収用ダミー動画.mp4', size: 85 * 1024 * 1024, type: 'video/mp4' };
  const row = createUploadRow(file);
  list.appendChild(row.element);
  row.update(50, 'アップロード中', Math.round(file.size * 0.5), file.size);
  showUploadAlert();
}

function renderGallery(items, root) {
  root.innerHTML = '';
  items.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-card';
    button.dataset.id = item.id;
    button.innerHTML = `
      <img alt="" loading="lazy">
      <span class="video-title"></span>
      <span class="video-date"></span>
    `;
    button.querySelector('img').src = item.id.startsWith('mock')
      ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"><rect width="400" height="225" fill="#8f2c22"/><circle cx="200" cy="112" r="40" fill="#f7f1e6"/><path d="M190 88v48l40-24z" fill="#b23a2e"/></svg>`)
      : `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.id)}&sz=w400`;
    button.querySelector('.video-title').textContent = item.name;
    button.querySelector('.video-date').textContent = formatJstDateTime(item.createdTime).replace('_', ' ');
    button.addEventListener('click', () => openModal(item.id));
    root.appendChild(button);
  });
}

function openModal(fileId) {
  const modal = document.getElementById('video-modal');
  const frame = document.getElementById('video-frame');
  frame.src = fileId.startsWith('mock')
    ? 'about:blank'
    : `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
  modal.hidden = false;
}

function closeModal() {
  const modal = document.getElementById('video-modal');
  const frame = document.getElementById('video-frame');
  frame.src = 'about:blank';
  modal.hidden = true;
}

async function loadGallery(gasUrl, isMock) {
  if (isMock) return MOCK_ITEMS;
  if (!gasUrl) return [];
  const response = await fetch(`${gasUrl}?action=list`, { redirect: 'follow' });
  const json = await readJson(response);
  return json.items || [];
}

function initPage() {
  const gasUrl = (globalThis.GAS_URL || '').trim();
  const params = new URLSearchParams(location.search);
  const isMock = params.get('mock') === '1';
  const form = document.getElementById('upload-form');
  const ready = document.getElementById('upload-ready');
  const waiting = document.getElementById('upload-waiting');
  const list = document.getElementById('upload-list');
  const gallery = document.getElementById('gallery');

  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (!gasUrl && !isMock) {
    ready.hidden = true;
    waiting.hidden = false;
  } else {
    ready.hidden = false;
    waiting.hidden = true;
  }

  loadGallery(gasUrl, isMock)
    .then((items) => renderGallery(items, gallery))
    .catch(() => {
      gallery.innerHTML = '<p class="muted">動画一覧を読み込めませんでした。</p>';
    });

  if (isMock) {
    renderMockUpload(list);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const files = Array.from(document.getElementById('video-files').files || []);
    const uploaderName = document.getElementById('uploader-name').value.trim();
    if (isMock) {
      alert('モックモードのため、実際のアップロードは行いません。');
      return;
    }
    const uploadTargets = [];
    let completedAll = files.length > 0;
    for (const file of files) {
      const row = createUploadRow(file);
      list.appendChild(row.element);
      if (!file.type.startsWith('video/')) {
        row.fail('動画ファイルを選んでください。', null);
        completedAll = false;
        continue;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        row.fail('1本4GBまでです。', null);
        completedAll = false;
        continue;
      }
      uploadTargets.push({ file, row });
    }
    if (uploadTargets.length > 0) {
      await beginUploadGuard();
      let currentTarget = null;
      try {
        for (const target of uploadTargets) {
          currentTarget = target;
          const ok = await uploadVideo(target.file, uploaderName, target.row, gasUrl);
          if (!ok) completedAll = false;
        }
      } catch (err) {
        if (currentTarget) currentTarget.row.fail(err.message || 'アップロードに失敗しました。', null);
        completedAll = false;
      } finally {
        await endUploadGuard({ completed: completedAll });
      }
    }
    loadGallery(gasUrl, false)
      .then((items) => renderGallery(items, gallery))
      .catch((err) => console.warn('gallery reload failed', err));
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('video-modal').addEventListener('click', (event) => {
    if (event.target.id === 'video-modal') closeModal();
  });
}

export async function runBrowserE2EUpload({ gasUrl, size = 256 * 1024, fileName = 'browser-e2e.mp4', log = () => {} }) {
  if (!gasUrl) {
    return { ok: false, reason: 'URL未指定' };
  }
  const blob = new Blob([new Uint8Array(size)], { type: 'video/mp4' });
  blob.name = fileName;
  const init = await postToGas(gasUrl, {
    action: 'initUpload',
    fileName,
    mimeType: 'video/mp4',
    fileSize: size,
    uploaderName: 'browser-e2e',
    origin: getUploadOrigin()
  });
  log(`initUpload OK: ${init.savedName || fileName}`);
  const result = await uploadFileData(blob, init.sessionUri, {
    onProgress: (loaded, total) => log(`upload ${loaded}/${total}`)
  });
  if (result.fileId) {
    postToGas(gasUrl, { action: 'finalizeUpload', fileId: result.fileId })
      .then(() => log('finalizeUpload OK'))
      .catch((err) => log(`finalizeUpload failed: ${err.message || err}`));
  } else {
    log('fileIdなし: データ送信完了として扱います');
  }
  return { ok: result.ok, fileId: result.fileId || '' };
}

if (typeof document !== 'undefined' && document.getElementById('upload-form')) {
  initPage();
}
