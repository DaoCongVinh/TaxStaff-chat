const socket = io();

const joinContainer = document.getElementById('join-container');
const chatContainer = document.getElementById('chat-container');
const joinForm = document.getElementById('join-form');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
const userList = document.getElementById('user-list');
const roomNameEl = document.getElementById('room-name');
const chatRoomTitle = document.getElementById('chat-room-title');
const leaveBtn = document.getElementById('leave-btn');

let currentUsername = '';
let currentRoom = '';

// Join room
joinForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const room = document.getElementById('room').value.trim();

  if (!username || !room) return;

  currentUsername = username;
  currentRoom = room;

  socket.emit('joinRoom', { username, room });

  joinContainer.classList.add('hidden');
  chatContainer.classList.remove('hidden');

  roomNameEl.textContent = room;
  chatRoomTitle.textContent = `#${room}`;
  messageInput.focus();
});

// Send message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  socket.emit('chatMessage', text);
  messageInput.value = '';
  messageInput.focus();
});

// Leave room
leaveBtn.addEventListener('click', () => {
  socket.emit('leaveRoom');

  chatContainer.classList.add('hidden');
  joinContainer.classList.remove('hidden');
  messagesDiv.innerHTML = '';
  userList.innerHTML = '';
  currentUsername = '';
  currentRoom = '';
});

// Receive message
socket.on('message', (msg) => {
  appendMessage(msg);
});

// Update user list
socket.on('roomUsers', ({ users }) => {
  userList.innerHTML = users.map((u) => `<li>${escapeHtml(u)}</li>`).join('');
});

function appendMessage({ username, text, time }) {
  const isOwn = username === currentUsername;
  const isSystem = username === 'System';

  const div = document.createElement('div');
  div.classList.add('message');

  if (isSystem) {
    div.classList.add('system');
    div.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
  } else {
    div.classList.add(isOwn ? 'own' : 'other');
    div.innerHTML = `
      <div class="message-meta">${escapeHtml(username)} · ${time}</div>
      <div class="message-bubble">${escapeHtml(text)}</div>
    `;
  }

  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
