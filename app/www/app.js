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
