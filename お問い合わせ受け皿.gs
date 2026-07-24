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

function doPost(e) {
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
