// Door Travel: new survey answers and "Ask a person" questions -> Gmail.
// Paste this into a new Google Apps Script project, set SECRET, then deploy as a Web app
// (Execute as: Me / Who has access: Anyone). See docs/m1-setup.md ("Gmailへの通知").

const TO = 'clapyourhouse@gmail.com';
const SECRET = 'ここに自分で決めた長い文字列を入れる'; // the same value goes after ?key= in the URLs
const DASHBOARD = 'https://supabase.com/dashboard/project/ghhozbptwkqhrhdfcwwp/editor';

function doPost(e) {
  try {
    if (!e || !e.parameter || e.parameter.key !== SECRET) return out('forbidden');
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    let subject, text, options = {};

    if (body.table === 'feedback' && body.record) {
      // Supabase Database Webhook (INSERT on public.feedback)
      const r = body.record;
      subject = '[Door] アンケート: 購入意向=' + (r.would_pay || '-') + (r.android_tester ? ' / Androidテスター希望' : '');
      text = [
        '旅行: ' + (r.trip_when || '-'),
        '困りごと: ' + (r.pain || '-'),
        '7日パス: ' + (r.would_pay || '-'),
        'メール: ' + (r.email || '-'),
        'Androidテスター: ' + (r.android_tester ? 'はい' : 'いいえ'),
        '言語: ' + (r.lang || '-') + ' / 流入元: ' + (r.ref || '-'),
        '',
        DASHBOARD,
      ].join('\n');
      if (r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) options.replyTo = r.email;
    } else if (body.text) {
      // "Ask a person": sent by the handoff Edge Function (NOTIFY_WEBHOOK_URL)
      subject = '[Door] 人への新しい質問';
      text = String(body.text).slice(0, 2000) + '\n\n返信: Table Editor → handoffs → reply に書く\n' + DASHBOARD;
    } else {
      subject = '[Door] 通知';
      text = JSON.stringify(body).slice(0, 2000);
    }
    MailApp.sendEmail(TO, subject, text, options);
    return out('ok');
  } catch (err) {
    return out('error');
  }
}

function out(s) { return ContentService.createTextOutput(s); }
