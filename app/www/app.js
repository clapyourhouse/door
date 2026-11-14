const examples = {
  arrival: ['I land at Haneda late. What should I check first?', 'Check your arrival terminal and the last airport train or bus for your date before choosing a hotel. How late do you land, and which area are you staying in?'],
  rain: ['It’s raining. What can I do this afternoon?', 'Start with one indoor stop near where you already are. Around Ueno, look at the museums and check opening hours before you go. Which neighborhood are you in?'],
  stay: ['Where should I stay on my first trip?', 'Start with the places you plan to visit and your airport route. Ueno, Shinjuku and Tokyo Station give you different connections. What are your first two stops?']
};
const question = document.querySelector('#question');
const conversation = document.querySelector('#conversation');

function addMessage(speaker, value, className) {
  const message = document.createElement('div');
  message.className = 'message ' + className;
  const label = document.createElement('strong');
  label.textContent = speaker;
  message.append(label, document.createTextNode(value));
  conversation.append(message);
}

document.querySelectorAll('[data-topic]').forEach(button => {
  button.addEventListener('click', () => {
    question.value = examples[button.dataset.topic][0];
    question.focus();
  });
});

document.querySelector('#trip').addEventListener('submit', event => {
  event.preventDefault();
  const value = question.value.trim();
  if (!value) return;
  const example = Object.values(examples).find(([prompt]) => value === prompt);
  addMessage('You', value, 'ask');
  addMessage('Door · sample reply', example?.[1] || 'Live replies are unavailable in this preview. Choose one of the sample questions above to see how the conversation works.', '');
  question.value = '';
});

const places = [
  { name: 'Shibuya, Tokyo', region: 'Asia', point: '35.6595,139.7005', guide: 'Start at the crossing, then look for the side streets leading toward Center Gai.' },
  { name: 'Colosseum, Rome', region: 'Europe', point: '41.8902,12.4922', guide: 'Look along Via dei Fori Imperiali to see how the Colosseum sits next to the ancient forums.' },
  { name: 'Arc de Triomphe, Paris', region: 'Europe', point: '48.8738,2.295', guide: 'Turn down the Champs-Élysées to see the long avenue stretching toward central Paris.' },
  { name: 'Times Square, New York', region: 'Americas', point: '40.758,-73.9855', guide: 'Find the red steps and look south to take in the busiest stretch of the square.' }
];
let currentPlace;
document.querySelector('#random').addEventListener('click', () => {
  const region = document.querySelector('#region').value;
  const pool = places.filter(place => !region || place.region === region);
  const available = pool.length > 1 ? pool.filter(place => place !== currentPlace) : pool;
  currentPlace = available[Math.floor(Math.random() * available.length)];
  document.querySelector('#place').hidden = false;
  document.querySelector('#destination').textContent = currentPlace.name;
  document.querySelector('#guide').textContent = currentPlace.guide;
  const link = document.querySelector('#street-view');
  link.href = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' + encodeURIComponent(currentPlace.point);
  const mapsKey = document.querySelector('meta[name="door-maps-embed-key"]')?.content;
  if (mapsKey) {
    const panorama = document.querySelector('#panorama');
    const params = new URLSearchParams({ key: mapsKey, location: currentPlace.point });
    panorama.src = 'https://www.google.com/maps/embed/v1/streetview?' + params;
    panorama.hidden = false;
  }
});
