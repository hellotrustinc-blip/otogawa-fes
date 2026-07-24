// E2E実アップロード試験: initUpload → チャンクPUT → finalize互換確認 → privatizeAll
// 使い方: node tmp/e2e_upload_test.mjs <GAS_EXEC_URL>
const EXEC = process.argv[2];
if (!EXEC) { console.error('usage: node e2e_upload_test.mjs <exec url>'); process.exit(1); }

const SIZE = 262144; // 256KiB（チャンク倍数の最小単位）
const body = Buffer.alloc(SIZE, 7);

async function postJson(payload) {
  const r = await fetch(EXEC, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { throw new Error('JSONでない応答: ' + t.slice(0, 200)); }
}

const fail = (m) => { console.error('FAIL:', m); process.exit(1); };

// 1) initUpload
const init = await postJson({
  action: 'initUpload',
  fileName: '接続テスト.mp4',
  mimeType: 'video/mp4',
  fileSize: SIZE,
  uploaderName: '接続テスト',
});
if (!init.ok || !init.sessionUri) fail('initUpload: ' + JSON.stringify(init));
console.log('1) initUpload OK / savedName=', init.savedName);

// 2) チャンクPUT（1チャンク完結）
const put = await fetch(init.sessionUri, {
  method: 'PUT',
  headers: { 'Content-Range': `bytes 0-${SIZE - 1}/${SIZE}` },
  body,
});
if (put.status !== 200 && put.status !== 201) fail('PUT status=' + put.status + ' ' + (await put.text()).slice(0, 200));
const meta = await put.json();
if (!meta.id) fail('PUT応答にidなし: ' + JSON.stringify(meta).slice(0, 200));
console.log('2) チャンクPUT OK / fileId=', meta.id);

// 3) finalize（後方互換のno-op）
const fin = await postJson({ action: 'finalizeUpload', fileId: meta.id });
if (!fin.ok) fail('finalize: ' + JSON.stringify(fin));
console.log('3) finalize no-op OK');

// 4) 公開剥がしアクションが動くか
const priv = await postJson({ action: 'privatizeAll' });
if (!priv.ok) fail('privatizeAll: ' + JSON.stringify(priv));
console.log('4) privatizeAll OK / checked=', priv.checked, '/ privatized=', priv.privatized);

// 5) listアクションが外部メタデータを返さないか
const list = await postJson({ action: 'list' });
if (list.ok) fail('listが有効なままです: ' + JSON.stringify(list).slice(0, 200));
console.log('5) list disabled OK');

console.log('E2E_ALL_PASS fileId=' + meta.id);
