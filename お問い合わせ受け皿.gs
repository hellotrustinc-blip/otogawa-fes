/**
 * 大戸川祭礼サイト お問い合わせ受け皿（Google Apps Script）
 * ------------------------------------------------------------
 * 役割:
 *   1) サイトのフォーム送信を受け取り、otogawa.fes@gmail.com へ通知
 *   2) 送信者本人へ「受付しました」の自動返信を送る
 *
 * 設置は otogawa.fes@gmail.com でログインした状態で行うこと。
 * （送信メールが otogawa.fes 名義で届くようにするため）
 */

var OWNER = 'otogawa.fes@gmail.com';   // 保存会の受信先
var ORG   = '大戸川祭礼保存会';
var CONFIG = {
  FOLDER_NAME: '大戸川祭礼 動画投稿2026',
  MAX_BYTES: 4 * 1024 * 1024 * 1024,
  PASSWORD: '',
  MIN_QUOTA_BYTES: 2 * 1024 * 1024 * 1024
};

function doPost(e) {
  var route = parseJsonPost_(e);
  if (route && route.action) {
    return json_(handleVideoAction_(route));
  }
  return handleContactPost_(e);
}

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  if (p.action === 'list') {
    return json_(listVideos_());
  }
  return ContentService.createTextOutput('大戸川祭礼サイト 動画投稿API');
}

function handleContactPost_(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var name    = (p.name    || '').toString().trim();
    var email   = (p.email   || '').toString().trim();
    var message = (p.message || '').toString().trim();

    // 1) 保存会への通知メール
    GmailApp.sendEmail(
      OWNER,
      '【お問い合わせ】大戸川祭礼サイト',
      'お名前: ' + name + '\n' +
      'メール: ' + email + '\n\n' +
      '【お問い合わせ内容】\n' + message,
      { name: '大戸川祭礼サイト', replyTo: email || OWNER }
    );

    // 2) 送信者本人への自動返信（メール形式が正しい場合のみ）
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      GmailApp.sendEmail(
        email,
        '【' + ORG + '】お問い合わせありがとうございます',
        (name ? name + ' 様' : 'お問い合わせいただいた皆さま') + '\n\n' +
        'この度は大戸川祭礼へお問い合わせいただき、ありがとうございます。\n' +
        '以下の内容で受け付けいたしました。担当者より数日以内に改めてご返信いたします。\n\n' +
        '----------------------------------------\n' +
        message + '\n' +
        '----------------------------------------\n\n' +
        '※ 本メールは自動送信です。ご返信いただいても対応できない場合があります。\n' +
        '※ 数日経っても当方からの返信が届かない場合、このメールが迷惑メールフォルダに\n' +
        '　 振り分けられている可能性があります。ご確認のうえ、お手数ですが再度\n' +
        '　 お問い合わせくださいますようお願いいたします。\n\n' +
        ORG,
        { name: ORG }
      );
    }

    return ContentService.createTextOutput('OK');
  } catch (err) {
    // 失敗時も自分に控えを残す
    try { GmailApp.sendEmail(OWNER, '【お問い合わせ・送信エラー】大戸川祭礼サイト', String(err)); } catch (e2) {}
    return ContentService.createTextOutput('ERROR');
  }
}

function parseJsonPost_(e) {
  try {
    var body = e && e.postData && e.postData.contents;
    if (!body) return null;
    return JSON.parse(body);
  } catch (err) {
    return null;
  }
}

function handleVideoAction_(payload) {
  try {
    if (payload.action === 'initUpload') return initUpload_(payload);
    if (payload.action === 'finalizeUpload') return finalizeUpload_(payload);
    return { ok: false, error: '指定された操作を確認できませんでした。' };
  } catch (err) {
    return { ok: false, error: err.message || '処理中に問題が発生しました。' };
  }
}

function initUpload_(payload) {
  var fileName = sanitizeName_(payload.fileName || 'video');
  var mimeType = String(payload.mimeType || '');
  var fileSize = Number(payload.fileSize || 0);
  var uploaderName = sanitizeName_(payload.uploaderName || '匿名');

  if (mimeType.indexOf('video/') !== 0) {
    return { ok: false, error: '動画ファイルのみ投稿できます。' };
  }
  if (!fileSize || fileSize > CONFIG.MAX_BYTES) {
    return { ok: false, error: '動画は1本4GBまでです。' };
  }
  if (CONFIG.PASSWORD && String(payload.password || '') !== CONFIG.PASSWORD) {
    return { ok: false, error: '合言葉が一致しません。' };
  }
  if (getRemainingQuotaBytes_() < CONFIG.MIN_QUOTA_BYTES) {
    return { ok: false, error: '保存先の空き容量が不足しています。時間をおいてお試しください。' };
  }

  var folderId = getUploadFolderId_();
  var savedName = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd_HHmm') + '_' + uploaderName + '_' + fileName;
  var response = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(fileSize)
    },
    payload: JSON.stringify({ name: savedName, parents: [folderId], mimeType: mimeType }),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var sessionUri = response.getHeaders().Location || response.getAllHeaders().Location;
  if (code < 200 || code >= 300 || !sessionUri) {
    return { ok: false, error: 'アップロード準備に失敗しました。' };
  }
  return { ok: true, sessionUri: sessionUri, savedName: savedName };
}

function finalizeUpload_(payload) {
  var fileId = String(payload.fileId || '').trim();
  if (!fileId) return { ok: false, error: '動画IDを確認できませんでした。' };
  var url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) + '/permissions';
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ role: 'reader', type: 'anyone' }),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    return { ok: false, error: '動画の公開設定に失敗しました。' };
  }
  return { ok: true };
}

function listVideos_() {
  try {
    var folderId = getUploadFolderId_();
    var query = "'" + folderId + "' in parents and trashed=false";
    var url = 'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(query) +
      '&fields=files(id,name,createdTime,size)&orderBy=createdTime desc&pageSize=100';
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      return { ok: false, error: '動画一覧を取得できませんでした。' };
    }
    var data = JSON.parse(response.getContentText() || '{"files":[]}');
    var items = (data.files || []).map(function(file) {
      return {
        id: file.id,
        name: file.name,
        createdTime: file.createdTime,
        size: file.size || ''
      };
    }).sort(function(a, b) {
      return String(b.createdTime).localeCompare(String(a.createdTime));
    });
    return { ok: true, items: items };
  } catch (err) {
    return { ok: false, error: '動画一覧を取得できませんでした。' };
  }
}

function getUploadFolderId_() {
  var props = PropertiesService.getScriptProperties();
  var cached = props.getProperty('VIDEO_FOLDER_ID');
  if (cached) return cached;
  var folders = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(CONFIG.FOLDER_NAME);
  var id = folder.getId();
  props.setProperty('VIDEO_FOLDER_ID', id);
  return id;
}

function getRemainingQuotaBytes_() {
  var response = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) return 0;
  var quota = JSON.parse(response.getContentText() || '{}').storageQuota || {};
  var limit = Number(quota.limit || 0);
  var usage = Number(quota.usage || 0);
  if (!limit) return CONFIG.MIN_QUOTA_BYTES;
  return limit - usage;
}

function sanitizeName_(value) {
  var name = String(value || 'video')
    .replace(/[\\\/:*?"<>|]/g, '_')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 120);
  return name || 'video';
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
