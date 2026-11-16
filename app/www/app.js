'use strict';

const CFG = Object.assign({ supabaseUrl: '', supabaseAnonKey: '', mapsEmbedKey: '', stripePaymentLink: '', stripePaymentLinkEn: '' }, window.DOOR_CONFIG || {});
const DEMO = !CFG.supabaseUrl || !CFG.supabaseAnonKey;
const DEMO_FREE_LIMIT = 5;
const SESSION_KEY = 'door.session.v1';
const SEEN_KEY = 'door.seenReplies.v1';
const LANG_KEY = 'door.lang.v1';
const REF_KEY = 'door.ref.v1';
const FIRST_KEY = 'door.first.v1';
const SURVEY_KEY = 'door.survey.v1';
const AIOK_KEY = 'door.aiok.v1';
const RESUME_KEY = 'door.resume.v1'; // 決済ページへ行く前の「街と会話」。戻ったときに続きから再開する
const PAID_KEY = 'door.paidAt.v1';

const I18N = {
  ja: {
    tagline: '扉を開くと、日本のどこかへ。',
    open: '扉を開く',
    move: '移動する →',
    loading: '扉の向こうを覗いています...',
    placeholder: '日本やこの街について質問…',
    humanPlaceholder: '日本の担当者に聞きたいことを入力…',
    guideOf: n => n + 'のガイド',
    subAi: 'AIガイド',
    hello: '質問できます。この街のことや、日本旅行について聞いてください。',
    quotaFree: n => 'AIへの無料質問：あと' + n + '回',
    quotaPass: n => '今日のAI質問：あと' + n + '回',
    quotaDaily: n => '今日の無料質問：あと' + n + '回',
    paywallDaily: '今日の無料質問は終わりました。明日また1回、無料で質問できます。今すぐ続けるなら、7日間パス（¥980）で、AIへの質問が1日100回までできます。',
    askHuman: '人に聞く',
    cancelHuman: 'キャンセル',
    humanHint: '日本の担当者に直接聞けます。質問を入力して送信してください。',
    toHuman: '担当者への質問',
    subHuman: '日本の担当者に質問中',
    surveyPass: '7日パス（予定）：AIへの質問が1日100回まで、日本の担当者への質問が1日3回までできます。',
    staffOnline: '● 担当者：オンライン',
    staffOffline: '○ 担当者：オフライン（日本時間10〜18時）',
    humanSentOnline: '担当者に送りました。オンラインなので、順に返信します。このチャットでお待ちください。',
    humanSentOffline: '担当者に送りました。担当者は日本時間の10〜18時に返信します。通常は数時間以内に、このチャットに届きます。',
    humanReply: '担当者からの返信',
    humanLimit: '「人に聞く」の回数の上限に達しました。',
    paywall: '無料のAI質問は終わりました。7日間パス（¥980）を準備中です。AIへの質問が1日100回まで、日本の担当者への質問も1日3回までできるようになります。',
    paywallBuy: '無料のAI質問は終わりました。7日間パス（¥980）なら、AIへの質問が1日100回まで、日本の担当者への質問も1日3回までできます。',
    buy: '7日パスを購入する（¥980）',
    buyThanks: 'ご購入ありがとうございます。続きから質問できます。パスはこのブラウザに紐づきます。',
    interest: '7日パスに興味あり',
    interestThanks: 'ありがとうございます。購入できるようになったらお知らせします。',
    dailyLimit: '今日のAI質問の上限に達しました。明日また使えます。',
    errGeneric: 'うまく送れませんでした。少し待ってから、もう一度お試しください。',
    typing: '…',
    time: t => '日本時刻 ' + t,
    svMissing: '街の風景は右上の「Street View」から開けます。',
    demoNote: '（デモ表示：サーバー未接続）',
    demoAi: q => 'これはデモの回答です。「' + q.slice(0, 40) + '」への実際の回答は、サーバー接続後に表示されます。',
    demoHumanReply: 'これはデモの返信です。',
    surveyTitle: '3つだけ教えてください',
    surveyLead: 'Door Travelをよくするためのアンケートです。',
    surveyQ1: '日本への旅行は？',
    trip_planning: 'これから行く予定',
    trip_now: '今、日本にいる',
    trip_past: '行ったことがある',
    trip_none: '予定はない',
    surveyQ2: '旅行で一番困ること（自由記入）',
    surveyQ3: '7日間980円なら使いたいですか？',
    pay_yes: '使いたい',
    pay_maybe: '内容による',
    pay_no: '使わない',
    surveyEmail: 'Googleアカウントのメール（Android版のテスト用）',
    surveyAndroid: 'Android版のテストに協力する',
    surveySend: '送信',
    surveyLater: 'あとで',
    surveyNeedEmail: 'テスト協力には、Googleアカウントのメールアドレスを入力してください。',
    surveyThanks: 'ありがとうございます。いただいた内容は、改善に使います。',
    surveyConsent: '送信すると、次の内容に同意したものとみなします：',
    legalPrivacy: 'プライバシーポリシー',
    legalTerms: '利用規約',
    legalTokusho: '特定商取引法に基づく表記'
  },
  en: {
    tagline: 'Open the door to somewhere in Japan.',
    open: 'Open the door',
    move: 'Move on →',
    loading: 'Looking through the door...',
    placeholder: 'Ask about this place or Japan…',
    humanPlaceholder: 'Type what you want to ask a person in Japan…',
    guideOf: n => 'Guide to ' + n,
    subAi: 'AI guide',
    hello: 'Ask me about this place, or about travel in Japan.',
    quotaFree: n => 'Free AI questions left: ' + n,
    quotaPass: n => 'AI questions left today: ' + n,
    quotaDaily: n => 'Free questions left today: ' + n,
    paywallDaily: "You've used today's free question. You get one more free question tomorrow. To keep going now, a 7-day pass ($6.99) gives you up to 100 AI questions a day.",
    askHuman: 'Ask a person',
    cancelHuman: 'Cancel',
    humanHint: 'You can ask a person in Japan directly. Type your question and send it.',
    toHuman: 'Question for our team',
    subHuman: 'Asking our team in Japan',
    surveyPass: '7-day pass (planned): up to 100 AI questions a day and up to 3 questions a day to our team in Japan.',
    staffOnline: '● Our team: online',
    staffOffline: '○ Our team: offline (10:00-18:00 Japan time)',
    humanSentOnline: "Sent. Our team is online and will reply here soon. Please stay on this chat.",
    humanSentOffline: 'Sent. Our team replies between 10:00 and 18:00 Japan time, usually within a few hours, right here in this chat.',
    humanReply: 'Reply from our team',
    humanLimit: 'You have reached the limit for "Ask a person".',
    paywall: 'Your free AI questions are used up. A 7-day pass ($6.99) is coming soon: up to 100 AI questions a day and up to 3 questions a day to our team in Japan.',
    paywallBuy: 'Your free AI questions are used up. With a 7-day pass ($6.99) you get up to 100 AI questions a day and up to 3 questions a day to our team in Japan.',
    buy: 'Get the 7-day pass ($6.99)',
    buyThanks: 'Thank you for your purchase. You can pick up where you left off. The pass is tied to this browser.',
    interest: "I'm interested in the 7-day pass",
    interestThanks: "Thank you. We'll let you know when it is available.",
    dailyLimit: "You've reached today's AI question limit. Come back tomorrow.",
    errGeneric: 'Something went wrong. Please wait a moment and try again.',
    typing: '…',
    time: t => 'Japan time ' + t,
    svMissing: 'Open the street view with "Street View" at the top right.',
    demoNote: '(Demo mode: server not connected)',
    demoAi: q => 'This is a demo answer. A real answer to "' + q.slice(0, 40) + '" appears once the server is connected.',
    demoHumanReply: 'This is a demo reply.',
    surveyTitle: 'Three quick questions',
    surveyLead: 'Help us make Door Travel better.',
    surveyQ1: 'Your trip to Japan?',
    trip_planning: 'Planning to go',
    trip_now: "I'm in Japan now",
    trip_past: "I've been before",
    trip_none: 'No plans',
    surveyQ2: "What's your biggest problem when travelling? (free text)",
    surveyQ3: 'Would you use a 7-day pass for $6.99?',
    pay_yes: 'Yes',
    pay_maybe: 'Depends',
    pay_no: 'No',
    surveyEmail: 'Google account email (for Android testing)',
    surveyAndroid: 'Help test the Android app',
    surveySend: 'Send',
    surveyLater: 'Later',
    surveyNeedEmail: 'Please enter your Google account email to help with testing.',
    surveyThanks: 'Thank you. We will use this to improve the app.',
    surveyConsent: 'By sending, you agree to our',
    legalPrivacy: 'Privacy Policy',
    legalTerms: 'Terms of Use',
    legalTokusho: 'Legal notice (Japan)'
  }
};

// Local fallback so the app still works if the cities table cannot be read.
const LOCAL_CITIES = [
  { id: "tokyo-shibuya", name_ja: "東京・渋谷", name_en: "Tokyo · Shibuya", lat: 35.65907020237839, lng: 139.7004739629136, pano_id: "C4Fb1Jo2Gc10WBB3W5_clQ",
    intro_ja: "渋谷へようこそ。ここは駅前で、スクランブル交差点はすぐそばです。",
    intro_en: "Welcome to Shibuya. You are in front of the station, right by the famous scramble crossing." },
  { id: "tokyo-asakusa", name_ja: "東京・浅草", name_en: "Tokyo · Asakusa", lat: 35.7105738555828, lng: 139.7961864989535, pano_id: "bMrp7vpiNBWiu2zk8MxwMg",
    intro_ja: "浅草へようこそ。雷門の近くです。仲見世通りを抜けると浅草寺に着きます。",
    intro_en: "Welcome to Asakusa. You are near Kaminarimon gate. Walk down Nakamise street to reach Senso-ji temple." },
  { id: "tokyo-shinjuku", name_ja: "東京・新宿 歌舞伎町", name_en: "Tokyo · Shinjuku Kabukicho", lat: 35.69419920827744, lng: 139.7032366469576, pano_id: "DwtausUYpqGP_dOImT2dFw",
    intro_ja: "新宿の歌舞伎町のあたりへようこそ。飲食店やネオンの看板が並ぶ、夜もにぎやかな街です。",
    intro_en: "Welcome to Kabukicho in Shinjuku. Restaurants and neon signs line the streets of this lively nightlife district." },
  { id: "kamakura-komachi", name_ja: "神奈川・鎌倉 小町通り", name_en: "Kamakura · Komachi-dori", lat: 35.32001198776832, lng: 139.5517174684008, pano_id: "Si0Pg7v9DVz2hRNU54_ZPA",
    intro_ja: "鎌倉の小町通りへようこそ。駅から鶴岡八幡宮の方へ続く、食べ歩きの人気の通りです。",
    intro_en: "Welcome to Komachi-dori in Kamakura, a popular snack street leading from the station toward Tsurugaoka Hachimangu shrine." },
  { id: "kyoto-gion", name_ja: "京都・祇園", name_en: "Kyoto · Gion", lat: 35.0032216786772, lng: 135.7750014353892, pano_id: "8Yx_sgJixW821xV2H9vbrg",
    intro_ja: "京都の祇園へようこそ。このあたりでは町家が並ぶ通りを歩けます。",
    intro_en: "Welcome to Gion in Kyoto. Streets here are lined with traditional machiya townhouses." },
  { id: "kyoto-fushimi", name_ja: "京都・伏見稲荷大社周辺", name_en: "Kyoto · Near Fushimi Inari Shrine", lat: 34.96757459517679, lng: 135.7723004213781, pano_id: "qVKWd1UxQZk9HUNWlEPC0w",
    intro_ja: "京都の伏見稲荷の近くへようこそ。千本鳥居で知られる神社は、すぐそばです。",
    intro_en: "Welcome to the area near Fushimi Inari Shrine in Kyoto, famous for its thousands of red torii gates." },
  { id: "osaka-dotonbori", name_ja: "大阪・道頓堀", name_en: "Osaka · Dotonbori", lat: 34.66872487244701, lng: 135.5010233904262, pano_id: "2XQNY3SSxlFwcnrxbJwDHQ",
    intro_ja: "大阪の道頓堀へようこそ。看板が並び、食べ歩きの店が続くにぎやかなエリアです。",
    intro_en: "Welcome to Dotonbori in Osaka, a lively area of bright signs and street food." },
  { id: "osaka-castle", name_ja: "大阪・大阪城", name_en: "Osaka · Osaka Castle", lat: 34.68730367922188, lng: 135.5254540681785, pano_id: "0Bi781Owm_K6R2ANWYX3yg",
    intro_ja: "大阪城へようこそ。天守閣を中心に、広い公園になっています。",
    intro_en: "Welcome to Osaka Castle. The main keep stands in the middle of a large park." },
  { id: "nara-park", name_ja: "奈良・奈良公園", name_en: "Nara · Nara Park", lat: 34.68509732059267, lng: 135.842646007272, pano_id: "zjLqYYoxlNJyTZ_n21UNvw",
    intro_ja: "奈良公園へようこそ。鹿が自由に歩く広い公園で、東大寺や春日大社が近くにあります。",
    intro_en: "Welcome to Nara Park, a large park where deer roam freely. Todai-ji and Kasuga Taisha are nearby." },
  { id: "kobe-motomachi", name_ja: "兵庫・神戸 元町", name_en: "Kobe · Motomachi", lat: 34.68904301401889, lng: 135.1890776200576, pano_id: "kkZjbgbQZbsK1VYc1C6QAg",
    intro_ja: "神戸の元町へようこそ。商店街が続き、南京町（中華街）も近くです。",
    intro_en: "Welcome to Motomachi in Kobe, a long shopping district close to Nankinmachi, the Chinese quarter." },
  { id: "kanazawa-kenroku", name_ja: "石川・金沢 兼六園", name_en: "Kanazawa · Kenrokuen Garden", lat: 36.56210779579367, lng: 136.6626976262752, pano_id: "MnQLP_6LQMT5HkqPfr-BcA",
    intro_ja: "金沢の兼六園へようこそ。日本三名園の一つで、季節ごとの景色が楽しめます。",
    intro_en: "Welcome to Kenrokuen in Kanazawa, counted as one of the three great gardens of Japan, beautiful in every season." },
  { id: "kanazawa-higashi", name_ja: "石川・金沢 ひがし茶屋街", name_en: "Kanazawa · Higashi Chaya District", lat: 36.57275038949604, lng: 136.6655809556834, pano_id: "tLkC03y0a2Nff3AYex3aNA",
    intro_ja: "金沢のひがし茶屋街へようこそ。古い茶屋の町並みが残る、石畳の通りです。",
    intro_en: "Welcome to the Higashi Chaya district in Kanazawa, with preserved old teahouse streets." },
  { id: "kurashiki-bikan", name_ja: "岡山・倉敷 美観地区", name_en: "Okayama · Kurashiki Bikan District", lat: 34.59635597415637, lng: 133.7725461466362, pano_id: "AkSj9C-2h05__eSVqkBOTA",
    intro_ja: "倉敷の美観地区へようこそ。白壁の蔵や、柳が並ぶ運河沿いの町並みです。",
    intro_en: "Welcome to the Bikan Historical Quarter in Kurashiki, with white-walled storehouses and a willow-lined canal." },
  { id: "hiroshima-peace-park", name_ja: "広島・原爆ドーム", name_en: "Hiroshima · Atomic Bomb Dome", lat: 34.39549744186948, lng: 132.4535920961856, pano_id: "UK9I8gZuBrx0DzOSUJLDIA",
    intro_ja: "広島の原爆ドームへようこそ。すぐ近くに平和記念公園があります。",
    intro_en: "Welcome to the Atomic Bomb Dome in Hiroshima. Peace Memorial Park is right next to it." },
  { id: "miyajima", name_ja: "広島・宮島", name_en: "Hiroshima · Miyajima", lat: 34.29554261065283, lng: 132.3204272940036, pano_id: "O2ZB5OFlT5jscs_55U5Zlg",
    intro_ja: "宮島へようこそ。海に立つ大鳥居で知られる、厳島神社の島です。",
    intro_en: "Welcome to Miyajima, the island of Itsukushima Shrine and its famous torii gate standing in the sea." },
  { id: "sapporo-odori", name_ja: "北海道・札幌 時計台周辺", name_en: "Hokkaido · Sapporo Clock Tower area", lat: 43.06212993371935, lng: 141.3533078185712, pano_id: "5VJ4k55aSrVy4ePP1TdW9Q",
    intro_ja: "札幌へようこそ。ここは時計台の近くで、大通公園は南へ歩いてすぐです。",
    intro_en: "Welcome to Sapporo. You are near the Clock Tower, and Odori Park is a short walk south." },
  { id: "fukuoka-tenjin", name_ja: "福岡・天神", name_en: "Fukuoka · Tenjin", lat: 33.59098774822968, lng: 130.3989574990601, pano_id: "I-H-ik_RTk82urI6ZXB42g",
    intro_ja: "福岡の天神へようこそ。九州でも指折りの繁華街で、地下街やショッピングビルが並びます。",
    intro_en: "Welcome to Tenjin in Fukuoka, one of Kyushu's biggest shopping and dining districts." },
  { id: "dazaifu", name_ja: "福岡・太宰府", name_en: "Fukuoka · Dazaifu", lat: 33.52139218519632, lng: 130.5345120031818, pano_id: "D_UeKBRx67erd2EjI0d8Jw",
    intro_ja: "太宰府へようこそ。学問の神様をまつる太宰府天満宮への参道のあたりです。",
    intro_en: "Welcome to Dazaifu, near the approach to Dazaifu Tenmangu, the shrine of the god of learning." },
  { id: "kumamoto-castle", name_ja: "熊本・熊本城", name_en: "Kumamoto · Kumamoto Castle", lat: 32.80631391252409, lng: 130.7054145646807, pano_id: "A2-jeXP34B-MGrqF0vdr0w",
    intro_ja: "熊本城へようこそ。石垣の大きな城で、復旧の工事が続く場所もあります。",
    intro_en: "Welcome to Kumamoto Castle, known for its tall stone walls. Some areas are still being restored." },
  { id: "naha-kokusai-dori", name_ja: "沖縄・那覇 牧志市場", name_en: "Okinawa · Naha Makishi Market", lat: 26.21495936361764, lng: 127.6887845996086, pano_id: "vHQGtjLfI_GyfPE8CAVR-A",
    intro_ja: "那覇の牧志市場のあたりへようこそ。国際通りのすぐ近くの、屋根のある商店街です。",
    intro_en: "Welcome to the Makishi Market area in Naha, a covered shopping arcade right next to Kokusai-dori." }
];

const get = id => document.getElementById(id);
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
};

let cities = LOCAL_CITIES;
let current = null;
let opening = false;
let busy = false;
let humanMode = false;
let history = []; // {role, content} for the current city
let quota = { kind: 'free', left: DEMO ? DEMO_FREE_LIMIT : null };
const langParam = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
let lang = (langParam === 'ja' || langParam === 'en') ? langParam
  : (store.get(LANG_KEY) || ((navigator.language || 'en').toLowerCase().startsWith('ja') ? 'ja' : 'en'));
let demoFreeUsed = 0;
let pollTimer = null;
let tick = 0;
let pendingHuman = false;
let staffOnline = DEMO;
let aiOk = Number(store.get(AIOK_KEY)) || 0;
let justPaid = false;
let refInfo = {};

const t = () => I18N[lang];
const isMobile = () => !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);
function setDrawer(open) {
  get('chatPanel').classList.toggle('open', open);
  get('s-app').classList.toggle('drawer-open', open);
}
const cityName = c => (lang === 'ja' ? c.name_ja : c.name_en);
const cityIntro = c => (lang === 'ja' ? c.intro_ja : c.intro_en);

/* ---------- supabase (plain fetch, no SDK) ---------- */
async function sbFetch(path, opts) {
  const o = opts || {};
  const headers = Object.assign({ apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json' }, o.headers || {});
  const res = await fetch(CFG.supabaseUrl + path, Object.assign({}, o, { headers }));
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  return { status: res.status, ok: res.ok, data };
}

function sessionFrom(d) {
  return { access_token: d.access_token, refresh_token: d.refresh_token,
    expires_at: d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600)), user_id: d.user && d.user.id };
}

async function ensureSession() {
  let s = store.get(SESSION_KEY);
  const now = Math.floor(Date.now() / 1000);
  if (s && s.access_token && s.expires_at - 60 > now) return s;
  if (s && s.refresh_token) {
    const r = await sbFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (r.ok && r.data && r.data.access_token) { s = sessionFrom(r.data); store.set(SESSION_KEY, s); return s; }
  }
  const r = await sbFetch('/auth/v1/signup', { method: 'POST', body: JSON.stringify({}) });
  if (!r.ok || !r.data || !r.data.access_token) throw new Error('signup failed');
  s = sessionFrom(r.data); store.set(SESSION_KEY, s); return s;
}

async function authed(path, opts) {
  const s = await ensureSession();
  const o = opts || {};
  return sbFetch(path, Object.assign({}, o, { headers: Object.assign({ Authorization: 'Bearer ' + s.access_token }, o.headers || {}) }));
}

async function loadCities() {
  if (DEMO) return;
  try {
    const r = await sbFetch('/rest/v1/cities?select=*&active=eq.true&order=sort', { headers: { Authorization: 'Bearer ' + CFG.supabaseAnonKey } });
    if (r.ok && Array.isArray(r.data) && r.data.length) cities = r.data;
  } catch (e) { /* keep local fallback */ }
}

/* ---------- attribution, events, staff presence ---------- */
function captureRef() {
  const clean = v => { v = (v || '').trim(); return /^[\w.\-]{1,40}$/.test(v) ? v : null; };
  let r = store.get(REF_KEY) || {};
  if (!r.ref && !r.campaign) {
    const q = new URLSearchParams(location.search);
    const ref = clean(q.get('ref')) || clean(q.get('utm_source'));
    const campaign = clean(q.get('utm_campaign'));
    if (ref || campaign) { r = { ref, campaign }; store.set(REF_KEY, r); }
  }
  return r;
}

function track(name, props) {
  if (DEMO) return;
  try {
    authed('/rest/v1/events', { method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ name, ref: refInfo.ref || null, campaign: refInfo.campaign || null, city_id: current ? current.id : null, lang, props: props || {} }) }).catch(() => {});
  } catch (e) { /* never block the UI */ }
}

function renderStaff() {
  const el = get('staffBadge');
  if (!el) return;
  el.className = 'staff ' + (staffOnline ? 'on' : 'off');
  el.textContent = staffOnline ? t().staffOnline : t().staffOffline;
}

async function loadStaff() {
  if (!DEMO) {
    try {
      const r = await sbFetch('/rest/v1/staff_status?select=online&id=eq.1', { headers: { Authorization: 'Bearer ' + CFG.supabaseAnonKey } });
      if (r.ok && Array.isArray(r.data) && r.data[0]) staffOnline = !!r.data[0].online;
    } catch (e) { /* keep last known */ }
  }
  renderStaff();
}

async function buildCheckoutUrl() {
  const s = await ensureSession();
  const u = new URL((lang === 'en' && CFG.stripePaymentLinkEn) || CFG.stripePaymentLink);
  u.searchParams.set('client_reference_id', s.user_id);
  return u.toString();
}

/* ---------- UI helpers ---------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t()[el.dataset.i18n]; });
  get('chatInput').placeholder = humanMode ? t().humanPlaceholder : t().placeholder;
  get('langBtn').textContent = lang === 'ja' ? 'EN' : '日本語';
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t()[el.dataset.i18nPh]; });
  document.querySelectorAll('a[data-legal]').forEach(el => { el.href = el.dataset.legal + '?lang=' + lang; });
  get('humanBtn').textContent = humanMode ? t().cancelHuman : t().askHuman;
  get('chatPanel').classList.toggle('human-mode', humanMode);
  renderQuota();
  renderStaff();
  document.querySelectorAll('#messages .msg').forEach(row => {
    if (row._render) row._textNode.textContent = row._render();
    if (row._label) row._label.textContent = row._labelKind === 'human' ? t().humanReply : t().toHuman;
  });
  if (current) renderCityHeader();
}

function toggleLang() {
  lang = lang === 'ja' ? 'en' : 'ja';
  store.set(LANG_KEY, lang);
  applyLang();
}

function message(text, kind, extra) {
  const render = typeof text === 'function' ? text : null;
  if (render) text = render();
  const row = document.createElement('div');
  row.className = 'msg' + (kind === 'me' || kind === 'meh' ? ' me' : '') + (kind === 'human' ? ' human' : '') + (kind === 'meh' ? ' to-human' : '') + (kind === 'sys' ? ' sys' : '');
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  if (kind === 'human' || kind === 'meh') {
    const label = document.createElement('strong');
    label.className = 'msg-label';
    label.textContent = kind === 'human' ? t().humanReply : t().toHuman;
    row._labelKind = kind;
    row._label = label;
    bubble.append(label);
  }
  const textNode = document.createTextNode(text);
  bubble.append(textNode);
  if (render) { row._render = render; row._textNode = textNode; }
  if (extra) bubble.append(extra);
  row.append(bubble);
  get('messages').append(row);
  get('messages').scrollTop = get('messages').scrollHeight;
  return row;
}

function renderQuota() {
  const el = get('quota');
  if (!el) return;
  if (quota.left === null || quota.left === undefined) { el.textContent = ''; return; }
  el.textContent = quota.kind === 'pass' ? t().quotaPass(quota.left) : quota.kind === 'daily' ? t().quotaDaily(quota.left) : t().quotaFree(quota.left);
}

function renderCityHeader() {
  const ja = new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }).format(new Date());
  get('overlayCountry').textContent = '🇯🇵 ' + cityName(current);
  get('overlayCoords').textContent = current.lat + ',' + current.lng;
  get('overlayTime').textContent = t().time(ja);
  get('chatName').textContent = t().guideOf(cityName(current));
  get('chatSub').textContent = humanMode ? t().subHuman : t().subAi + (DEMO ? ' ' + t().demoNote : '');
  get('chatAvatar').textContent = humanMode ? '👤' : '🌍';
}

function paywallMessage(daily) {
  track('paywall_view');
  const canBuy = !!CFG.stripePaymentLink && !DEMO;
  const btn = document.createElement('button');
  btn.className = 'msg-action';
  if (canBuy) {
    btn.textContent = t().buy;
    btn.onclick = async () => {
      btn.disabled = true;
      track('buy_click');
      try {
        const url = await buildCheckoutUrl();
        if (current) store.set(RESUME_KEY, { city: current.id, history: history.slice(-8), ts: Date.now() });
        window.location.assign(url);
      }
      catch (e) { btn.disabled = false; message(() => t().errGeneric, 'sys'); }
    };
  } else {
    btn.textContent = t().interest;
    btn.onclick = async () => {
      btn.disabled = true;
      track('interest_click');
      try {
        if (!DEMO) await authed('/rest/v1/pass_interest', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ city_id: current && current.id, lang }) });
      } catch (e) { /* best effort */ }
      message(() => t().interestThanks, 'sys');
      maybeSurvey(600);
    };
  }
  const row = message(() => (daily ? t().paywallDaily : canBuy ? t().paywallBuy : t().paywall), 'sys', document.createElement('br'));
  row.querySelector('.msg-bubble').append(btn);
  if (canBuy) {
    const lk = document.createElement('a');
    lk.dataset.legal = 'tokusho.html'; lk.dataset.i18n = 'legalTokusho'; lk.href = 'tokusho.html?lang=' + lang;
    lk.target = '_blank'; lk.rel = 'noopener'; lk.textContent = t().legalTokusho;
    lk.style.cssText = 'display:block;margin-top:8px;font-size:11px;color:#9fb4ff;';
    row.querySelector('.msg-bubble').append(lk);
  }
}

/* ---------- survey ---------- */
function maybeSurvey(delay) {
  if (store.get(SURVEY_KEY)) return;
  store.set(SURVEY_KEY, 'shown');
  setTimeout(() => { get('survey').classList.remove('hidden'); track('survey_shown'); }, delay || 1200);
}

function closeSurvey() { get('survey').classList.add('hidden'); }

function toggleSvEmail() { get('svEmailWrap').classList.toggle('hidden', !get('svAndroid').checked); }

async function submitSurvey() {
  const val = id => get(id).value.trim();
  const tester = get('svAndroid').checked;
  const email = tester ? val('svEmail') : '';
  const err = get('svError');
  err.textContent = '';
  if ((tester && !email) || (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) { err.textContent = t().surveyNeedEmail; return; }
  const row = { trip_when: val('svTrip') || null, pain: val('svPain').slice(0, 1000) || null, would_pay: val('svPay') || null,
    email: email || null, android_tester: tester, lang, ref: refInfo.ref || null };
  store.set(SURVEY_KEY, 'done');
  closeSurvey();
  try { if (!DEMO) await authed('/rest/v1/feedback', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) }); } catch (e) { /* best effort */ }
  track('survey_submit');
  message(() => t().surveyThanks, 'sys');
}

/* ---------- navigation ---------- */
function nextDoor(forceCity, restored) {
  const others = cities.filter(c => !current || c.id !== current.id);
  const pool = others.length ? others : cities; // only one active city: stay put
  current = forceCity || pool[Math.floor(Math.random() * pool.length)];
  humanMode = false;
  history = restored ? restored.slice() : [];
  renderCityHeader();
  get('mapsLink').href = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + encodeURIComponent(current.lat + ',' + current.lng) + (current.pano_id ? '&pano=' + encodeURIComponent(current.pano_id) : '');
  get('svLoading').classList.add('hidden');
  if (CFG.mapsEmbedKey) {
    const params = new URLSearchParams(current.pano_id ? { key: CFG.mapsEmbedKey, pano: current.pano_id } : { key: CFG.mapsEmbedKey, location: current.lat + ',' + current.lng });
    get('sv-iframe').src = 'https://www.google.com/maps/embed/v1/streetview?' + params;
  } else {
    get('sv-iframe').removeAttribute('src');
  }
  get('chatPanel').classList.remove('hidden', 'collapsed');
  get('chatOpenBtn').classList.add('hidden');
  if (isMobile()) setDrawer(true);
  get('messages').replaceChildren();
  get('chatInput').value = '';
  applyLang();
  const here = current;
  message(() => cityIntro(here) + ' ' + t().hello);
  history.forEach(h => message(h.content, h.role === 'user' ? 'me' : undefined));
  if (!CFG.mapsEmbedKey) message(() => t().svMissing, 'sys');
  if (justPaid) { message(() => t().buyThanks, 'sys'); justPaid = false; }
}

/* 着地の演出。delayMs：光や扉が消え始めるまでの待ち時間（初回のみ長い） */
let arriveTimer = null;
function arrive(delayMs, first) {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !current) return;
  const frame = get('sv-iframe');
  const arr = get('arrival');
  const hud = [get('chatPanel'), document.querySelector('.sv-overlay')].filter(Boolean);
  get('arrivalName').textContent = cityName(current);
  get('arrivalSub').textContent = lang === 'ja' ? '日本' : 'JAPAN';
  frame.style.setProperty('--fp', ((delayMs + (first ? 1100 : 1300)) / 1000) + 's');
  hud.forEach(el => el.style.setProperty('--hd', (delayMs + 900) + 'ms'));
  arr.style.animationDelay = delayMs + 'ms';
  [frame, arr, ...hud].forEach(el => el.classList.remove('focus-pull', 'show', 'arrive-in'));
  void frame.offsetWidth; // 演出を、最初からやり直す
  frame.classList.add('focus-pull');
  arr.classList.add('show');
  hud.forEach(el => el.classList.add('arrive-in'));
  // 連打したとき、前回のタイマーが今回の演出を消さないようにする
  clearTimeout(arriveTimer);
  arriveTimer = setTimeout(() => { [frame, arr, ...hud].forEach(el => el.classList.remove('focus-pull', 'show', 'arrive-in')); }, delayMs + 4500);
}
function goNext() { nextDoor(); arrive(0, false); }

function openDoorAndLaunch() {
  if (opening) return;
  opening = true;
  track('door_open');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const landing = get('s-landing');
  // 街の映像は、扉の奥で先に読み込む（扉が広がったときには、もう映像が出ている）
  const app = get('s-app');
  app.classList.remove('gone');
  app.classList.add('visible');
  app.style.display = 'flex';
  nextDoor();
  startPolling();
  const mode = (!reduce && new URLSearchParams(location.search).get('anim') === 'light') ? 'light' : 'portal';
  landing.dataset.anim = mode;
  arrive(mode === 'light' ? 2300 : 1500, true);
  const dr = get('doorWrap').getBoundingClientRect();
  landing.style.setProperty('--cx', (dr.left + dr.width / 2) + 'px');
  landing.style.setProperty('--cy', (dr.top + dr.height / 2) + 'px');
  landing.classList.add('entering');
  get('doorPanel').classList.add('open');
  if (reduce) {
    setTimeout(() => { landing.classList.add('fadeout'); setTimeout(() => landing.classList.add('gone'), 1600); }, 900);
    return;
  }
  if (mode === 'light') {
    requestAnimationFrame(() => requestAnimationFrame(() => landing.classList.add('spread')));
    setTimeout(() => landing.classList.add('fadeout'), 2500);
    setTimeout(() => landing.classList.add('gone'), 4100);
    return;
  }
  get('doorWrap').classList.add('zoom');
  // 広がりきる前から、ゆっくり消し始める（映像が、じわっと現れる）
  setTimeout(() => landing.classList.add('fadeout'), 1600);
  setTimeout(() => landing.classList.add('gone'), 3250);
}

function toggleChat() {
  const closed = get('chatPanel').classList.toggle('hidden');
  get('chatOpenBtn').classList.toggle('hidden', !closed);
  get('s-app').classList.toggle('chat-closed', closed);
}

/* ---------- human handoff ---------- */
function toggleHuman() {
  humanMode = !humanMode;
  applyLang();
  if (humanMode) { loadStaff(); message(() => t().humanHint, 'sys'); get('chatInput').focus(); }
}

async function sendToHuman(question) {
  const ctx = history.slice(-6);
  const wasOnline = staffOnline;
  const sent = () => message(() => (wasOnline ? t().humanSentOnline : t().humanSentOffline), 'sys');
  if (DEMO) {
    sent();
    setTimeout(() => message(t().demoHumanReply, 'human'), 2500);
    return;
  }
  const r = await authed('/functions/v1/handoff', { method: 'POST', body: JSON.stringify({ city_id: current.id, question, lang, context: ctx }) });
  if (r.ok) { track('human_sent', { staff_online: staffOnline }); pendingHuman = true; sent(); pollReplies(); return; }
  if (r.status === 429) { message(() => t().humanLimit, 'sys'); return; }
  message(() => t().errGeneric, 'sys');
}

async function pollReplies() {
  if (DEMO) return;
  try {
    const r = await authed('/rest/v1/handoffs?select=id,reply,status&status=eq.answered&order=replied_at.asc');
    if (!r.ok || !Array.isArray(r.data)) return;
    const seen = store.get(SEEN_KEY) || [];
    for (const h of r.data) {
      if (h.reply && seen.indexOf(h.id) === -1) { message(h.reply, 'human'); seen.push(h.id); pendingHuman = false; }
    }
    store.set(SEEN_KEY, seen);
  } catch (e) { /* try again next tick */ }
}

function startPolling() {
  if (pollTimer || DEMO) return;
  // Every 10s while waiting for a person, otherwise every 30s; staff presence once a minute.
  pollTimer = setInterval(() => {
    if (document.hidden) return;
    tick += 1;
    if (pendingHuman || tick % 3 === 0) pollReplies();
    if (tick % 6 === 0) loadStaff();
  }, 10000);
}

/* ---------- AI chat ---------- */
function noteAiAnswer() {
  aiOk += 1;
  store.set(AIOK_KEY, aiOk);
  if (aiOk >= 3) maybeSurvey(1500);
}

// AIが付けた [PLACE: 店名] を、Googleマップ検索のリンクに変える（座標は使わない＝誤った場所へ飛ばない）
function splitPlaces(reply) {
  const items = [];
  const text = String(reply).replace(/\[\s*(PLACE|SEARCH)\s*:\s*([^\]\n]{1,80}?)\s*\]/gi, (_, kind, n) => {
    const k = kind.toUpperCase() === 'SEARCH' ? 'search' : 'place';
    if (items.length < 3 && !items.some(x => x.name === n)) items.push({ kind: k, name: n });
    return '';
  }).replace(/\n{3,}/g, '\n\n').trim();
  return { text, items };
}
// 店名が確かなもの＝扉の場所からの経路／確かでないもの＝Googleマップの検索（座標は使わない）
function placeLinks(items) {
  if (!items.length || !current) return null;
  const wrap = document.createElement('div');
  wrap.className = 'place-links';
  items.forEach(it => {
    const a = document.createElement('a');
    if (it.kind === 'search') {
      a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(it.name);
      a.textContent = '🔍 ' + it.name + (lang === 'en' ? ' · search on Google Maps →' : '（Googleマップで探す）→');
    } else {
      a.href = 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(current.lat + ',' + current.lng) + '&travelmode=transit&destination=' + encodeURIComponent(it.name + ' ' + cityName(current));
      a.textContent = '📍 ' + it.name + (lang === 'en' ? ' · directions from here →' : '（ここから行き方）→');
    }
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', () => track(it.kind === 'search' ? 'search_link' : 'place_link'));
    wrap.append(a);
  });
  return wrap;
}

async function askAi(question) {
  history.push({ role: 'user', content: question });
  if (!store.get(FIRST_KEY)) { store.set(FIRST_KEY, 1); track('first_question'); }
  track('ask_ai');
  if (DEMO) {
    if (demoFreeUsed >= DEMO_FREE_LIMIT) { history.pop(); paywallMessage(); return; }
    demoFreeUsed += 1;
    quota = { kind: 'free', left: DEMO_FREE_LIMIT - demoFreeUsed };
    renderQuota();
    const reply = t().demoAi(question);
    history.push({ role: 'assistant', content: reply });
    message(reply);
    noteAiAnswer();
    return;
  }
  const callChat = () => authed('/functions/v1/chat', { method: 'POST', body: JSON.stringify({ city_id: current.id, lang, messages: history }) });
  let r = await callChat();
  // 支払い直後は、支払い完了の通知(webhook)が数秒遅れることがある。少し待って、数回やり直す
  for (let i = 0; i < 4 && !r.ok && r.data && (r.data.error === 'free_limit' || r.data.error === 'free_daily_limit') && Date.now() - (Number(store.get(PAID_KEY)) || 0) < 120000; i++) {
    await new Promise(res => setTimeout(res, 2500));
    r = await callChat();
  }
  if (r.ok && r.data && r.data.reply) {
    const parts = splitPlaces(r.data.reply);
    history.push({ role: 'assistant', content: parts.text });
    if (r.data.mode === 'pass') quota = { kind: 'pass', left: r.data.daily_remaining };
    else if (r.data.mode === 'free_daily') quota = { kind: 'daily', left: r.data.daily_remaining };
    else quota = { kind: 'free', left: r.data.free_remaining };
    renderQuota();
    message(parts.text, undefined, placeLinks(parts.items));
    noteAiAnswer();
    return;
  }
  history.pop();
  const err = r.data && r.data.error;
  if (err === 'free_daily_limit') { quota = { kind: 'daily', left: 0 }; renderQuota(); paywallMessage(true); }
  else if (err === 'free_limit') { quota = { kind: 'free', left: 0 }; renderQuota(); paywallMessage(); }
  else if (err === 'daily_limit') { message(() => t().dailyLimit, 'sys'); }
  else message(() => t().errGeneric, 'sys');
}

async function sendMessage() {
  if (busy) return;
  const input = get('chatInput');
  const value = input.value.trim();
  if (!value) return;
  busy = true;
  input.value = '';
  message(value, humanMode ? 'meh' : 'me');
  const typing = message(t().typing);
  try {
    if (humanMode) { humanMode = false; applyLang(); await sendToHuman(value); }
    else await askAi(value);
  } catch (e) {
    message(() => t().errGeneric, 'sys');
  } finally {
    typing.remove();
    busy = false;
  }
}

/* ---------- boot ---------- */
// 支払いから戻ったら、扉の画面を飛ばして、さっきの街・会話の続きから再開する（1時間以内）
function resumeAfterPayment() {
  if (!justPaid) return;
  const r = store.get(RESUME_KEY);
  store.set(RESUME_KEY, null);
  if (!r || !r.city || Date.now() - (Number(r.ts) || 0) > 3600000) return; // 別のブラウザ等：通常どおり扉から
  const city = cities.find(c => c.id === r.city);
  if (!city) return;
  opening = true;
  const app = get('s-app');
  app.classList.remove('gone');
  app.classList.add('visible');
  app.style.display = 'flex';
  get('s-landing').classList.add('gone');
  nextDoor(city, Array.isArray(r.history) ? r.history.filter(h => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string') : []);
  startPolling();
}

function history_replace() {
  const u = new URL(location.href);
  u.searchParams.delete('paid');
  window.history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
}

window.addEventListener('DOMContentLoaded', () => {
  get('chatPanel').querySelector('.chat-panel-header').addEventListener('click', () => {
    if (isMobile()) setDrawer(!get('chatPanel').classList.contains('open'));
  });
  refInfo = captureRef();
  const q = new URLSearchParams(location.search);
  if (q.get('paid') === '1') {
    justPaid = true;
    store.set(PAID_KEY, Date.now());
    try { history_replace(); } catch (e) { /* ignore */ }
  }
  applyLang();
  loadCities().then(resumeAfterPayment);
  loadStaff();
  if (!DEMO) ensureSession().then(() => { track('land_view'); if (justPaid) track('pass_return'); pollReplies(); }).catch(() => {});
});
Object.assign(window, { openDoorAndLaunch, nextDoor, goNext, arrive, toggleChat, sendMessage, toggleHuman, toggleLang, pollReplies, submitSurvey, closeSurvey, toggleSvEmail, onChatKey, buildCheckoutUrl, loadStaff, CFG });

// Phones: keep the chat drawer above the on-screen keyboard and stop the page from drifting.
(function () {
  const vv = window.visualViewport;
  if (!vv) return;
  const sync = () => {
    const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    document.documentElement.style.setProperty('--kb', kb + 'px');
    if (kb > 0) window.scrollTo(0, 0);
  };
  vv.addEventListener('resize', sync);
  vv.addEventListener('scroll', sync);
})();

/* Phone: swipe down on (or tap) the chat header to close it. Also stops the browser's pull-to-refresh from reloading the app. */
(function () {
  const hd = document.querySelector('.chat-panel-header');
  if (!hd) return;
  let y0 = null;
  hd.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
  hd.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  hd.addEventListener('touchend', e => {
    if (y0 === null) return;
    const dy = e.changedTouches[0].clientY - y0; y0 = null;
    if (dy > 30 && window.innerWidth <= 640) { document.activeElement && document.activeElement.blur(); if (!get('chatPanel').classList.contains('hidden')) toggleChat(); }
  }, { passive: true });
  hd.addEventListener('click', e => {
    if (window.innerWidth > 640 || e.target.closest('button')) return;
    if (!get('chatPanel').classList.contains('hidden')) toggleChat();
  });
})();

/* Chat input: Enter sends, but not while an IME (e.g. Japanese) is still converting text. */
let imeEndAt = 0;
(function () {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  inp.addEventListener('compositionend', () => { imeEndAt = Date.now(); });
})();
function onChatKey(e) {
  if (e.key !== 'Enter') return;
  if (e.isComposing || e.keyCode === 229 || Date.now() - imeEndAt < 80) return;
  sendMessage();
}
