const form = document.querySelector('#trip');
const question = document.querySelector('#question');
const status = document.querySelector('#status');
const draft = document.querySelector('#draft');
const saved = document.querySelector('#saved');
const storageKey = 'door.travel.tokyo.question.v1';

function displayDraft(value) {
  question.value = value;
  saved.textContent = value;
  draft.hidden = !value;
}

try {
  displayDraft(localStorage.getItem(storageKey) || '');
} catch {
  status.textContent = 'Local storage is unavailable.';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const value = question.value.trim();
  if (!value) {
    status.textContent = 'Enter your question first.';
    question.focus();
    return;
  }
  try {
    localStorage.setItem(storageKey, value);
    displayDraft(value);
    status.textContent = 'Draft saved on this device.';
  } catch {
    status.textContent = 'The draft could not be saved.';
  }
});

document.querySelector('#remove').addEventListener('click', () => {
  try {
    localStorage.removeItem(storageKey);
    displayDraft('');
    status.textContent = 'Draft deleted.';
    question.focus();
  } catch {
    status.textContent = 'The draft could not be deleted.';
  }
});

const places = [
  { name: 'Shibuya, Tokyo', latitude: 35.6595, longitude: 139.7005 },
  { name: 'Colosseum, Rome', latitude: 41.8902, longitude: 12.4922 },
  { name: 'Arc de Triomphe, Paris', latitude: 48.8738, longitude: 2.295 },
  { name: 'Times Square, New York', latitude: 40.758, longitude: -73.9855 }
];
let currentPlace;
document.querySelector('#random').addEventListener('click', () => {
  const available = places.filter(place => place !== currentPlace);
  currentPlace = available[Math.floor(Math.random() * available.length)];
  document.querySelector('#destination').textContent = currentPlace.name;
  const link = document.querySelector('#street-view');
  link.href = 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='
    + encodeURIComponent(currentPlace.latitude + ',' + currentPlace.longitude);
  link.hidden = false;
});
