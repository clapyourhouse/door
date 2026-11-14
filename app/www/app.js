const places = [
  { name: '東京・浅草', point: '35.7111,139.7964', intro: '浅草へようこそ。雷門から仲見世を抜けると浅草寺に着きます。' },
  { name: '京都・祇園', point: '35.0035,135.7751', intro: '京都の祇園へようこそ。このあたりでは町家が並ぶ通りを歩けます。' },
  { name: '大阪・道頓堀', point: '34.6687,135.5014', intro: '大阪の道頓堀へようこそ。戎橋の周りには看板が並び、川沿いも歩けます。' },
  { name: '北海道・札幌', point: '43.0605,141.3564', intro: '札幌へようこそ。大通公園の東端にはさっぽろテレビ塔があります。' }
];
const get = id => document.getElementById(id);
let current;
let opening = false;

function message(text, sender) {
  const row = document.createElement('div');
  row.className = sender ? 'msg me' : 'msg';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  row.append(bubble);
  get('messages').append(row);
  get('messages').scrollTop = get('messages').scrollHeight;
}

function nextDoor() {
  const pool = places.filter(place => place !== current);
  current = pool[Math.floor(Math.random() * pool.length)];
  const point = encodeURIComponent(current.point);
  get('overlayCountry').textContent = '🇯🇵 ' + current.name;
  get('overlayCoords').textContent = current.point;
  get('overlayTime').textContent = '日本時刻 ' + new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit'
  }).format(new Date());
  get('mapsLink').href = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + point;
  const key = document.querySelector('meta[name="door-maps-embed-key"]')?.content;
  get('svLoading').classList.add('hidden');
  if (key) {
    const params = new URLSearchParams({ key, location: current.point });
    get('sv-iframe').src = 'https://www.google.com/maps/embed/v1/streetview?' + params;
  }
  get('chatName').textContent = current.name + 'のガイド';
  get('chatSub').textContent = 'プレビュー · ガイド紹介';
  get('chatPanel').classList.remove('hidden', 'collapsed');
  get('chatOpenBtn').classList.add('hidden');
  get('messages').replaceChildren();
  get('chatInput').value = '';
  message(current.intro + ' この街のことや、日本旅行について質問できます。');
  if (!key) message('街の風景は右上の「Street View」から開けます。');
}

function openDoorAndLaunch() {
  if (opening) return;
  opening = true;
  get('doorPanel').classList.add('open');
  get('doorGlow').classList.add('show');
  setTimeout(() => {
    get('s-landing').classList.add('gone');
    const app = get('s-app');
    app.classList.remove('gone');
    app.classList.add('visible');
    app.style.display = 'flex';
    nextDoor();
  }, 700);
}

function toggleChat() {
  const closed = get('chatPanel').classList.toggle('hidden');
  get('chatOpenBtn').classList.toggle('hidden', !closed);
}

function sendMessage() {
  const input = get('chatInput');
  const value = input.value.trim();
  if (!value) return;
  message(value, true);
  input.value = '';
  message('このプレビューでは質問の入力を試せます。AIへの送信と回答は接続準備中です。');
}
