import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const gs = await readFile(new URL('../お問い合わせ受け皿.gs', import.meta.url), 'utf8');

function makeContext() {
  const sent = [];
  const props = new Map();
  const fetchCalls = [];
  const files = [
    { id: 'old', name: 'old.mp4', createdTime: '2026-07-20T00:00:00Z', size: '1' },
    { id: 'new', name: 'new.mp4', createdTime: '2026-07-22T00:00:00Z', size: '2' },
    { id: 'mid', name: 'mid.mp4', createdTime: '2026-07-21T00:00:00Z', size: '3' }
  ];
  const context = {
    console,
    JSON,
    String,
    Number,
    Date,
    encodeURIComponent,
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(value) {
        return {
          value,
          mimeType: '',
          setMimeType(type) {
            this.mimeType = type;
            return this;
          }
        };
      }
    },
    GmailApp: {
      sendEmail(to, subject, body, options) {
        sent.push({ to, subject, body, options });
      }
    },
    UrlFetchApp: {
      fetch(url, options = {}) {
        fetchCalls.push({ url, options });
        if (url.includes('/about?fields=storageQuota')) {
          return response(200, {}, JSON.stringify({ storageQuota: { limit: String(10 * 1024 * 1024 * 1024), usage: '0' } }));
        }
        if (url.includes('upload/drive/v3/files?uploadType=resumable')) {
          return response(200, { Location: 'https://upload.example/session' }, '');
        }
        if (url.includes('/permissions')) {
          return response(200, {}, '{}');
        }
        if (url.includes('/drive/v3/files?')) {
          return response(200, {}, JSON.stringify({ files }));
        }
        return response(404, {}, '{}');
      }
    },
    DriveApp: {
      getFoldersByName() {
        let used = false;
        return {
          hasNext: () => !used,
          next: () => {
            used = true;
            return { getId: () => 'folder123' };
          }
        };
      },
      createFolder() {
        return { getId: () => 'folder123' };
      }
    },
    ScriptApp: { getOAuthToken: () => 'token' },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty: (key) => props.get(key) || '',
          setProperty: (key, value) => props.set(key, value)
        };
      }
    },
    Utilities: {
      formatDate: () => '2026-07-24_1234'
    },
    Session: {}
  };
  vm.createContext(context);
  vm.runInContext(gs, context, { filename: 'お問い合わせ受け皿.gs' });
  return { context, sent, fetchCalls };
}

function response(code, headers, body) {
  return {
    getResponseCode: () => code,
    getHeaders: () => headers,
    getAllHeaders: () => headers,
    getContentText: () => body
  };
}

function parseOutput(output) {
  return JSON.parse(output.value);
}

{
  const { context, sent } = makeContext();
  const result = context.doPost({ parameter: { name: '祭例太郎', email: 'test@example.com', message: '本文です' } });
  assert.equal(result.value, 'OK');
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, 'otogawa.fes@gmail.com');
  assert.equal(sent[0].subject, '【お問い合わせ】大戸川祭礼サイト');
  assert.equal(sent[0].body, 'お名前: 祭例太郎\nメール: test@example.com\n\n【お問い合わせ内容】\n本文です');
  assert.equal(sent[0].options.name, '大戸川祭礼サイト');
  assert.equal(sent[0].options.replyTo, 'test@example.com');
  assert.equal(sent[1].to, 'test@example.com');
  assert.equal(sent[1].subject, '【大戸川祭礼保存会】お問い合わせありがとうございます');
  assert.match(sent[1].body, /この度は大戸川祭礼へお問い合わせいただき、ありがとうございます。/);
  assert.match(sent[1].body, /本文です/);
}

{
  const { context } = makeContext();
  const output = context.doPost({ postData: { contents: JSON.stringify({
    action: 'initUpload',
    fileName: '../祭礼.mp4',
    mimeType: 'video/mp4',
    fileSize: 1024,
    uploaderName: '投稿者'
  }) } });
  const json = parseOutput(output);
  assert.equal(json.ok, true);
  assert.equal(json.sessionUri, 'https://upload.example/session');
  assert.match(json.savedName, /^2026-07-24_1234_投稿者__/);
}

{
  const { context, fetchCalls } = makeContext();
  const output = context.doPost({ postData: { contents: JSON.stringify({
    action: 'initUpload',
    fileName: 'a.mp4',
    mimeType: 'video/mp4',
    fileSize: 1024,
    origin: 'https://example.com'
  }) } });
  assert.equal(parseOutput(output).ok, true);
  const uploadCall = fetchCalls.find((call) => call.url.includes('upload/drive/v3/files?uploadType=resumable'));
  assert.equal(uploadCall.options.headers.Origin, 'https://example.com');
}

{
  const { context, fetchCalls } = makeContext();
  const output = context.doPost({ postData: { contents: JSON.stringify({
    action: 'initUpload',
    fileName: 'a.mp4',
    mimeType: 'video/mp4',
    fileSize: 1024,
    origin: 'javascript:alert(1)'
  }) } });
  assert.equal(parseOutput(output).ok, true);
  const uploadCall = fetchCalls.find((call) => call.url.includes('upload/drive/v3/files?uploadType=resumable'));
  assert.equal(Object.prototype.hasOwnProperty.call(uploadCall.options.headers, 'Origin'), false);
}

{
  const { context, fetchCalls } = makeContext();
  const output = context.doPost({ postData: { contents: JSON.stringify({
    action: 'initUpload',
    fileName: 'a.mp4',
    mimeType: 'video/mp4',
    fileSize: 1024
  }) } });
  assert.equal(parseOutput(output).ok, true);
  const uploadCall = fetchCalls.find((call) => call.url.includes('upload/drive/v3/files?uploadType=resumable'));
  assert.equal(Object.prototype.hasOwnProperty.call(uploadCall.options.headers, 'Origin'), false);
}

{
  const badMime = makeContext().context.doPost({ postData: { contents: JSON.stringify({ action: 'initUpload', fileName: 'a.txt', mimeType: 'text/plain', fileSize: 1 }) } });
  assert.equal(parseOutput(badMime).ok, false);

  const tooLarge = makeContext().context.doPost({ postData: { contents: JSON.stringify({ action: 'initUpload', fileName: 'a.mp4', mimeType: 'video/mp4', fileSize: 5 * 1024 * 1024 * 1024 }) } });
  assert.equal(parseOutput(tooLarge).ok, false);

  const lowQuota = makeContext();
  lowQuota.context.UrlFetchApp.fetch = (url) => {
    if (url.includes('/about?fields=storageQuota')) {
      return response(200, {}, JSON.stringify({ storageQuota: { limit: String(10 * 1024 * 1024 * 1024), usage: String(9 * 1024 * 1024 * 1024) } }));
    }
    return response(200, { Location: 'https://upload.example/session' }, '');
  };
  const quotaResult = lowQuota.context.doPost({ postData: { contents: JSON.stringify({ action: 'initUpload', fileName: 'a.mp4', mimeType: 'video/mp4', fileSize: 1 }) } });
  assert.equal(parseOutput(quotaResult).ok, false);

  const password = makeContext();
  password.context.CONFIG.PASSWORD = 'secret';
  const passResult = password.context.doPost({ postData: { contents: JSON.stringify({ action: 'initUpload', fileName: 'a.mp4', mimeType: 'video/mp4', fileSize: 1, password: 'wrong' }) } });
  assert.equal(parseOutput(passResult).ok, false);
}

{
  const { context, fetchCalls } = makeContext();
  const output = context.doGet({ parameter: { action: 'list' } });
  const json = parseOutput(output);
  assert.equal(json.ok, true);
  assert.deepEqual(json.items.map((item) => item.id), ['new', 'mid', 'old']);
  const permissionCalls = fetchCalls.filter((call) => call.url.includes('/permissions'));
  assert.deepEqual(
    permissionCalls.map((call) => call.url.match(/files\/([^/]+)\/permissions/)[1]),
    ['new', 'mid', 'old']
  );
}

{
  const { context } = makeContext();
  context.UrlFetchApp.fetch = (url, options = {}) => {
    if (url.includes('/drive/v3/files?')) {
      return response(200, {}, JSON.stringify({
        files: [
          { id: 'a', name: 'a.mp4', createdTime: '2026-07-24T00:00:00Z', size: '1' },
          { id: 'b', name: 'b.mp4', createdTime: '2026-07-23T00:00:00Z', size: '1' }
        ]
      }));
    }
    if (url.includes('/permissions')) {
      throw new Error('permission create failed');
    }
    return response(200, {}, '{}');
  };
  const output = context.doGet({ parameter: { action: 'list' } });
  const json = parseOutput(output);
  assert.equal(json.ok, true);
  assert.deepEqual(json.items.map((item) => item.id), ['a', 'b']);
}

const html = await readFile(new URL('../douga.html', import.meta.url), 'utf8');
assert.match(html, /mock=1/);
