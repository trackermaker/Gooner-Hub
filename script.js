// --- FIREBASE CLOUD CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCKw_YUbxlRexXT5CSm3esvvewyqZyJMwc",
  authDomain: "tracker-caad7.firebaseapp.com",
  databaseURL: "https://tracker-caad7-default-rtdb.firebaseio.com",
  projectId: "tracker-caad7",
  storageBucket: "tracker-caad7.firebasestorage.app",
  messagingSenderId: "214665486301",
  appId: "1:214665486301:web:89288706e422c15f37a034"
};

// Initialize Firebase Realtime Database with Local Storage Fallback Sync
let dbRef = null;
let isCloudActive = false;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    dbRef = firebase.database();
    isCloudActive = true;
  }
} catch (e) {
  console.warn("Firebase not configured or offline. Running on local sync storage mode.");
}

// State Storage Keys
const STORAGE_DB = 'lc_app_db';
const STORAGE_LINKS = 'lc_questions_db';
const STORAGE_SESSION = 'lc_logged_user';

let currentUser = null;
let currentLinksSubtab = 'all';
let pendingModalAction = null;

let localUsersDB = JSON.parse(localStorage.getItem(STORAGE_DB) || '{}');
let localQuestionsDB = JSON.parse(localStorage.getItem(STORAGE_LINKS) || '[]');

// Dual Cloud / Local Synchronizer Helpers
function saveAllState() {
  localStorage.setItem(STORAGE_DB, JSON.stringify(localUsersDB));
  localStorage.setItem(STORAGE_LINKS, JSON.stringify(localQuestionsDB));
  if (isCloudActive && dbRef) {
    dbRef.ref('users').set(localUsersDB);
    dbRef.ref('questions').set(localQuestionsDB);
  }
}

// Firebase Cloud Realtime Listener
if (isCloudActive && dbRef) {
  dbRef.ref('users').on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
      localUsersDB = val;
      localStorage.setItem(STORAGE_DB, JSON.stringify(localUsersDB));
      if (currentUser && !localUsersDB[currentUser]) {
        logoutUser();
      } else if (currentUser) {
        renderDashboardData();
      }
    }
  });

  dbRef.ref('questions').on('value', (snapshot) => {
    const val = snapshot.val();
    if (val) {
      localQuestionsDB = Array.isArray(val) ? val : Object.values(val);
      localStorage.setItem(STORAGE_LINKS, JSON.stringify(localQuestionsDB));
      if (currentUser) renderDashboardData();
    }
  });
}

// DOM Elements
const authCard = document.getElementById('auth-card');
const mainApp = document.getElementById('main-app');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const tabForgot = document.getElementById('tab-forgot');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotForm = document.getElementById('forgot-form');
const authMessage = document.getElementById('auth-message');

const regUsernameInput = document.getElementById('reg-username');
const usernameStatus = document.getElementById('username-status');

const recoveryStep1 = document.getElementById('recovery-step-1');
const recoveryStep2 = document.getElementById('recovery-step-2');
const sendOtpBtn = document.getElementById('send-otp-btn');

const iconLinksBtn = document.getElementById('icon-links-btn');
const iconNotifBtn = document.getElementById('icon-notif-btn');
const iconSettingsBtn = document.getElementById('icon-settings-btn');

const linksDrawer = document.getElementById('links-drawer');
const notificationsDrawer = document.getElementById('notifications-drawer');
const settingsDrawer = document.getElementById('settings-drawer');

const closeLinksDrawer = document.getElementById('close-links-drawer');
const closeNotifDrawer = document.getElementById('close-notif-drawer');
const closeSettingsDrawer = document.getElementById('close-settings-drawer');

const navBtns = {
  home: document.getElementById('nav-home'),
  usersLeaderboard: document.getElementById('nav-users-leaderboard'),
  linksLeaderboard: document.getElementById('nav-links-leaderboard')
};

const views = {
  home: document.getElementById('view-home'),
  usersLeaderboard: document.getElementById('view-users-leaderboard'),
  linksLeaderboard: document.getElementById('view-links-leaderboard')
};

const subtabAllLinks = document.getElementById('subtab-all-links');
const subtabYourLinks = document.getElementById('subtab-your-links');
const subtabSavedLinks = document.getElementById('subtab-saved-links');
const drawerLinksContent = document.getElementById('drawer-links-content');

const userDisplay = document.getElementById('user-display');
const userSolvedDisplay = document.getElementById('user-solved-count');
const topGoonerBanner = document.getElementById('top-gooner-banner');
const topLikedLinkBanner = document.getElementById('top-liked-link-banner');
const leaderboardBody = document.getElementById('leaderboard-body');
const linksLeaderboardList = document.getElementById('links-leaderboard-list');
const notifList = document.getElementById('notifications-list');
const notifBadge = document.getElementById('notif-badge');

const solveQuestionForm = document.getElementById('solve-question-form');
const dynamicLinksContainer = document.getElementById('dynamic-links-container');
const addLinkBtn = document.getElementById('add-link-btn');

const newUsernameInput = document.getElementById('new-username-input');
const newUserStatus = document.getElementById('new-user-status');
const triggerChangeUsernameBtn = document.getElementById('trigger-change-username-btn');

const currentBfDisplay = document.getElementById('current-bf-display');
const newBfInput = document.getElementById('new-bf-input');
const triggerChangeBfBtn = document.getElementById('trigger-change-bf-btn');
const breakFriendshipBtn = document.getElementById('break-friendship-btn');

const logoutBtn = document.getElementById('logout-btn');
const toggleDeleteBoxBtn = document.getElementById('toggle-delete-box-btn');
const deleteAccountFormContainer = document.getElementById('delete-account-form-container');
const triggerDeleteAccountBtn = document.getElementById('trigger-delete-account-btn');

const confirmModal = document.getElementById('confirm-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

// Startup Session Load
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem(STORAGE_SESSION);
  if (savedUser && localUsersDB[savedUser]) {
    currentUser = savedUser;
    openDashboard();
  }
});

tabLogin.addEventListener('click', () => switchAuthTab('login'));
tabRegister.addEventListener('click', () => switchAuthTab('register'));
tabForgot.addEventListener('click', () => switchAuthTab('forgot'));

function switchAuthTab(tab) {
  hideMessage();
  tabLogin.classList.toggle('active', tab === 'login');
  tabRegister.classList.toggle('active', tab === 'register');
  tabForgot.classList.toggle('active', tab === 'forgot');

  loginForm.classList.toggle('hidden', tab !== 'login');
  registerForm.classList.toggle('hidden', tab !== 'register');
  forgotForm.classList.toggle('hidden', tab !== 'forgot');

  if (tab === 'forgot') {
    recoveryStep1.classList.remove('hidden');
    recoveryStep2.classList.add('hidden');
  }
}

Object.keys(navBtns).forEach(key => {
  navBtns[key].addEventListener('click', () => switchDashboardView(key));
});

function switchDashboardView(targetView) {
  Object.keys(navBtns).forEach(key => {
    navBtns[key].classList.toggle('active', key === targetView);
    views[key].classList.toggle('hidden', key !== targetView);
  });
  renderDashboardData();
}

iconLinksBtn.addEventListener('click', () => {
  renderLinksDrawerContent();
  linksDrawer.classList.remove('hidden');
});
closeLinksDrawer.addEventListener('click', () => linksDrawer.classList.add('hidden'));

iconNotifBtn.addEventListener('click', () => notificationsDrawer.classList.remove('hidden'));
closeNotifDrawer.addEventListener('click', () => notificationsDrawer.classList.add('hidden'));

iconSettingsBtn.addEventListener('click', () => settingsDrawer.classList.remove('hidden'));
closeSettingsDrawer.addEventListener('click', () => settingsDrawer.classList.add('hidden'));

subtabAllLinks.addEventListener('click', () => switchLinksSubtab('all'));
subtabYourLinks.addEventListener('click', () => switchLinksSubtab('yours'));
subtabSavedLinks.addEventListener('click', () => switchLinksSubtab('saved'));

function switchLinksSubtab(subtab) {
  currentLinksSubtab = subtab;
  subtabAllLinks.classList.toggle('active', subtab === 'all');
  subtabYourLinks.classList.toggle('active', subtab === 'yours');
  subtabSavedLinks.classList.toggle('active', subtab === 'saved');
  renderLinksDrawerContent();
}

regUsernameInput.addEventListener('input', () => validateUsernameInput(regUsernameInput.value, usernameStatus));
newUsernameInput.addEventListener('input', () => validateUsernameInput(newUsernameInput.value, newUserStatus));

function validateUsernameInput(val, statusElement) {
  const username = val.trim().toLowerCase();

  if (username.length === 0) {
    statusElement.textContent = '';
    statusElement.className = 'status-hint';
    return;
  }

  if (username.length < 5) {
    statusElement.textContent = `❌ Minimum 5 characters required (${username.length}/5)`;
    statusElement.className = 'status-hint invalid';
    return;
  }

  if (localUsersDB[username]) {
    statusElement.textContent = '❌ Username is already taken';
    statusElement.className = 'status-hint invalid';
  } else {
    statusElement.textContent = '✓ Username is available!';
    statusElement.className = 'status-hint valid';
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!localUsersDB[username] || localUsersDB[username].password !== password) {
    showMessage('Invalid username or password.', 'error');
    return;
  }

  currentUser = username;
  localStorage.setItem(STORAGE_SESSION, currentUser);
  openDashboard();
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = regUsernameInput.value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;
  const bestfriend = document.getElementById('reg-bestfriend').value.trim().toLowerCase();

  if (username.length < 5) {
    showMessage('Username must be at least 5 characters.', 'error');
    return;
  }

  if (localUsersDB[username]) {
    showMessage('Username already taken.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match.', 'error');
    return;
  }

  if (bestfriend) {
    if (username === bestfriend) {
      showMessage('Best friend cannot be yourself.', 'error');
      return;
    }
    if (!localUsersDB[bestfriend]) {
      showMessage(`User '${bestfriend}' does not exist.`, 'error');
      return;
    }
  }

  localUsersDB[username] = {
    password: password,
    solved: 0,
    createdAt: Date.now(),
    bestfriend: null,
    notifications: [{ id: 'sys_1', type: 'system', text: 'Welcome to LeetCode Peer-Track!' }],
    usernameChanges: [],
    savedLinks: []
  };

  if (bestfriend && localUsersDB[bestfriend]) {
    if (!localUsersDB[bestfriend].notifications) localUsersDB[bestfriend].notifications = [];
    localUsersDB[bestfriend].notifications.unshift({
      id: 'req_' + Date.now(),
      type: 'bf_request',
      from: username,
      text: `@${username} sent you a Best Friend Request!`
    });
  }

  saveAllState();
  currentUser = username;
  localStorage.setItem(STORAGE_SESSION, currentUser);
  openDashboard();
});

sendOtpBtn.addEventListener('click', () => {
  const username = document.getElementById('recover-username').value.trim().toLowerCase();

  if (!localUsersDB[username]) {
    showMessage('Username not found.', 'error');
    return;
  }

  const friend = localUsersDB[username].bestfriend;
  if (!friend || !localUsersDB[friend]) {
    showMessage('No valid Best Friend linked to this user.', 'error');
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem('temp_otp_' + username, otp);

  if (!localUsersDB[friend].notifications) localUsersDB[friend].notifications = [];
  localUsersDB[friend].notifications.unshift({
    id: 'notif_' + Date.now(),
    type: 'system',
    text: `Recovery code requested by @${username}. Share OTP: ${otp}`
  });

  saveAllState();
  hideMessage();
  recoveryStep1.classList.add('hidden');
  recoveryStep2.classList.remove('hidden');
});

forgotForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('recover-username').value.trim().toLowerCase();
  const otp = document.getElementById('recover-otp').value.trim();
  const newPass = document.getElementById('recover-new-pass').value;
  const confirmPass = document.getElementById('recover-confirm-pass').value;

  const validOtp = localStorage.getItem('temp_otp_' + username);

  if (validOtp !== otp) {
    showMessage('Invalid or expired OTP code.', 'error');
    return;
  }

  if (newPass !== confirmPass) {
    showMessage('Passwords do not match.', 'error');
    return;
  }

  localUsersDB[username].password = newPass;
  localStorage.removeItem('temp_otp_' + username);
  saveAllState();

  showMessage('Password reset successfully!', 'success');
  setTimeout(() => switchAuthTab('login'), 2000);
});

addLinkBtn.addEventListener('click', () => {
  const newRow = document.createElement('div');
  newRow.className = 'link-input-row';
  newRow.innerHTML = `
<input type="url" class="question-link-field" placeholder="https://pornhub.com/sunnyleone..." required>
    <button type="button" class="btn-remove-link" onclick="removeLinkInput(this)">-</button>
  `;
  dynamicLinksContainer.appendChild(newRow);
  updateRemoveButtonsVisibility();
});

window.removeLinkInput = function(btn) {
  const row = btn.closest('.link-input-row');
  if (row) {
    row.remove();
    updateRemoveButtonsVisibility();
  }
};

function updateRemoveButtonsVisibility() {
  const rows = dynamicLinksContainer.querySelectorAll('.link-input-row');
  rows.forEach((row) => {
    const removeBtn = row.querySelector('.btn-remove-link');
    if (removeBtn) {
      removeBtn.classList.toggle('hidden', rows.length <= 1);
    }
  });
}

function openDashboard() {
  authCard.classList.add('hidden');
  mainApp.classList.remove('hidden');
  userDisplay.textContent = currentUser;
  switchDashboardView('home');
  renderDashboardData();
}

function renderDashboardData() {
  const user = localUsersDB[currentUser] || {};

  userSolvedDisplay.textContent = user.solved || 0;

  const currentBf = user.bestfriend;
  currentBfDisplay.textContent = currentBf ? `@${currentBf}` : 'None';
  breakFriendshipBtn.classList.toggle('hidden', !currentBf);

  const notifs = user.notifications || [];
  notifBadge.textContent = notifs.length;
  if (notifs.length === 0) {
    notifList.innerHTML = `<span style="color:var(--text-muted)">No new notifications</span>`;
  } else {
    notifList.innerHTML = notifs.map(n => renderNotificationCard(n, localQuestionsDB)).join('');
  }

  const usersArray = Object.entries(localUsersDB).map(([name, data]) => ({
    username: name,
    solved: data.solved || 0,
    createdAt: data.createdAt || Date.now()
  }));

  if (usersArray.length > 0) {
    usersArray.sort((a, b) => b.solved - a.solved);
    const topUser = usersArray[0];
    const diffDays = Math.max(1, Math.floor((Date.now() - topUser.createdAt) / (1000 * 60 * 60 * 24)));
    topGoonerBanner.textContent = `@${topUser.username} has gooned maximum time in the ${diffDays} days his account has been created.`;
  }

  leaderboardBody.innerHTML = usersArray.map((u, i) => `
    <tr ${u.username === currentUser ? 'style="color: var(--primary-accent); font-weight: bold;"' : ''}>
      <td>#${i + 1}</td>
      <td>${u.username} ${u.username === currentUser ? '(You)' : ''}</td>
      <td>${u.solved}</td>
    </tr>
  `).join('');

  const sortedQuestions = [...localQuestionsDB].sort((a, b) => (b.likes || []).length - (a.likes || []).length);

  if (sortedQuestions.length > 0) {
    const topQuestion = sortedQuestions[0];
    const topLikeCount = (topQuestion.likes || []).length;
    topLikedLinkBanner.innerHTML = `
      <div><strong>Link:</strong> <a class="notif-link-url" href="${topQuestion.url}" target="_blank" rel="noopener noreferrer">${topQuestion.url}</a></div>
      <div style="font-size: 0.8rem; margin-top:4px;">Submitted by @${topQuestion.author} | ❤️ ${topLikeCount} Likes</div>
    `;
  } else {
    topLikedLinkBanner.textContent = "No question links submitted yet.";
  }

  linksLeaderboardList.innerHTML = sortedQuestions.map((q, idx) => renderQuestionLinkCard(q, idx + 1)).join('');
}

function renderLinksDrawerContent() {
  const userSavedLinks = localUsersDB[currentUser]?.savedLinks || [];

  let filtered = [];
  if (currentLinksSubtab === 'all') {
    filtered = [...localQuestionsDB];
  } else if (currentLinksSubtab === 'yours') {
    filtered = localQuestionsDB.filter(q => q.author === currentUser);
  } else if (currentLinksSubtab === 'saved') {
    filtered = localQuestionsDB.filter(q => userSavedLinks.includes(q.id));
  }

  if (filtered.length === 0) {
    drawerLinksContent.innerHTML = `<span style="color:var(--text-muted); padding:10px;">No links found in this category.</span>`;
    return;
  }

  drawerLinksContent.innerHTML = filtered.map((q, idx) => renderQuestionLinkCard(q, idx + 1)).join('');
}

function renderNotificationCard(n, questionsList) {
  if (n.type === 'bf_request') {
    return `
      <div class="notif-item request-card">
        <div class="notif-header-text">${n.text}</div>
        <div class="req-actions">
          <button class="btn btn-sm btn-accept" onclick="acceptBfRequest('${n.id}', '${n.from}')">Accept</button>
          <button class="btn btn-sm btn-reject" onclick="rejectBfRequest('${n.id}', '${n.from}')">Reject</button>
        </div>
      </div>
    `;
  }

  if (n.type === 'system') {
    return `<div class="notif-item"><div>${n.text}</div></div>`;
  }

  const linkRowsHTML = (n.links || []).map((linkObj, index) => {
    const liveLink = questionsList.find(q => q.id === linkObj.id) || linkObj;
    return renderLinkRow(liveLink, index + 1);
  }).join('');

  return `
    <div class="notif-item">
      <div class="notif-header-text">${n.text}</div>
      <div class="notif-link-list">${linkRowsHTML}</div>
    </div>
  `;
}

window.acceptBfRequest = function(reqId, senderName) {
  if (!localUsersDB[senderName]) {
    alert("User no longer exists.");
    return;
  }

  const user = localUsersDB[currentUser];
  user.bestfriend = senderName;
  localUsersDB[senderName].bestfriend = currentUser;

  user.notifications = user.notifications.filter(n => n.id !== reqId);

  if (!localUsersDB[senderName].notifications) localUsersDB[senderName].notifications = [];
  localUsersDB[senderName].notifications.unshift({
    id: 'notif_' + Date.now(),
    type: 'system',
    text: `@${currentUser} accepted your Best Friend Request! Friendship is now mutual.`
  });

  saveAllState();
  renderDashboardData();
  alert(`You are now mutual Best Friends with @${senderName}!`);
};

window.rejectBfRequest = function(reqId, senderName) {
  const user = localUsersDB[currentUser];
  user.notifications = user.notifications.filter(n => n.id !== reqId);

  if (localUsersDB[senderName]) {
    if (!localUsersDB[senderName].notifications) localUsersDB[senderName].notifications = [];
    localUsersDB[senderName].notifications.unshift({
      id: 'notif_' + Date.now(),
      type: 'system',
      text: `@${currentUser} rejected your Best Friend Request.`
    });
  }

  saveAllState();
  renderDashboardData();
};

function renderQuestionLinkCard(q, rank) {
  return `
    <div class="link-card">
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">${rank ? `Rank #${rank} • ` : ''}Posted by @${q.author}</div>
      ${renderLinkRow(q, null)}
    </div>
  `;
}

function renderLinkRow(q, linkNum) {
  const likesArr = q.likes || [];
  const savedArr = localUsersDB[currentUser]?.savedLinks || [];

  const isLiked = likesArr.includes(currentUser);
  const isSaved = savedArr.includes(q.id);
  const numPrefix = linkNum ? `<strong>${linkNum}.</strong> ` : '';

  return `
    <div class="notif-link-row">
      <div>${numPrefix}<a class="notif-link-url" href="${q.url}" target="_blank" rel="noopener noreferrer">${q.url}</a></div>
      <div class="link-actions">
        <div class="like-box">
          <button class="heart-btn" onclick="toggleLike('${q.id}')" title="${isLiked ? 'Unlike' : 'Like'}">${isLiked ? '❤️' : '🤍'}</button>
          <span class="likes-count" onclick="toggleLikersPopup('${q.id}')">${likesArr.length} Likes</span>
          <button class="save-btn" onclick="toggleSave('${q.id}')" title="${isSaved ? 'Unsave' : 'Save'}">${isSaved ? '🔖' : '📑'}</button>
        </div>
        <button class="copy-btn" onclick="copyToClipboard('${q.url}')">Copy for Incognito</button>
      </div>
      <div id="likers-popup-${q.id}" class="likers-list-popup hidden">
        Liked by: ${likesArr.length > 0 ? likesArr.map(u => `@${u}`).join(', ') : 'No likes yet'}
      </div>
    </div>
  `;
}

solveQuestionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const inputFields = document.querySelectorAll('.question-link-field');
  const validUrls = Array.from(inputFields).map(input => input.value.trim()).filter(url => url.length > 0);

  if (validUrls.length === 0) return;

  const newLinkObjects = [];

  validUrls.forEach(url => {
    const linkObj = {
      id: 'link_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      url: url,
      author: currentUser,
      likes: [],
      timestamp: Date.now()
    };
    localQuestionsDB.push(linkObj);
    newLinkObjects.push(linkObj);
  });

  localUsersDB[currentUser].solved = (localUsersDB[currentUser].solved || 0) + validUrls.length;

  Object.keys(localUsersDB).forEach(uname => {
    const notificationText = (uname === currentUser)
      ? `You solved ${validUrls.length} question(s):`
      : `@${currentUser} solved ${validUrls.length} question(s):`;

    if (!localUsersDB[uname].notifications) localUsersDB[uname].notifications = [];
    localUsersDB[uname].notifications.unshift({
      id: 'notif_' + Date.now() + '_' + Math.random(),
      type: 'question_update',
      text: notificationText,
      links: newLinkObjects
    });
  });

  saveAllState();

  dynamicLinksContainer.innerHTML = `
    <div class="link-input-row">
      <input type="url" class="question-link-field" placeholder="https://leetcode.com/problems/..." required>
      <button type="button" class="btn-remove-link hidden" onclick="removeLinkInput(this)">-</button>
    </div>
  `;

  renderDashboardData();
  alert(`Submitted ${validUrls.length} link proof(s) successfully!`);
});

window.toggleLike = function(linkId) {
  const targetLink = localQuestionsDB.find(q => q.id === linkId);
  if (!targetLink) return;

  if (!targetLink.likes) targetLink.likes = [];
  const userIdx = targetLink.likes.indexOf(currentUser);

  if (userIdx > -1) {
    targetLink.likes.splice(userIdx, 1);
  } else {
    targetLink.likes.push(currentUser);

    if (targetLink.author !== currentUser && localUsersDB[targetLink.author]) {
      if (!localUsersDB[targetLink.author].notifications) localUsersDB[targetLink.author].notifications = [];
      localUsersDB[targetLink.author].notifications.unshift({
        id: 'notif_' + Date.now(),
        type: 'question_update',
        text: `@${currentUser} liked your question link:`,
        links: [targetLink]
      });
    }
  }

  saveAllState();
  renderDashboardData();
  if (!linksDrawer.classList.contains('hidden')) renderLinksDrawerContent();
};

window.toggleSave = function(linkId) {
  const user = localUsersDB[currentUser];
  if (!user.savedLinks) user.savedLinks = [];

  const savedIdx = user.savedLinks.indexOf(linkId);
  if (savedIdx > -1) {
    user.savedLinks.splice(savedIdx, 1);
  } else {
    user.savedLinks.push(linkId);
  }

  saveAllState();
  renderDashboardData();
  if (!linksDrawer.classList.contains('hidden')) renderLinksDrawerContent();
};

window.toggleLikersPopup = function(linkId) {
  const popup = document.getElementById(`likers-popup-${linkId}`);
  if (popup) popup.classList.toggle('hidden');
};

// --- CONFIRMATION MODAL POPUP EXECUTION SYSTEM ---
function openConfirmModal(title, msg, onConfirmAction) {
  modalTitle.textContent = title;
  modalMessage.textContent = msg;
  pendingModalAction = onConfirmAction;
  confirmModal.classList.remove('hidden');
}

modalCancelBtn.onclick = () => {
  pendingModalAction = null;
  confirmModal.classList.add('hidden');
};

modalConfirmBtn.onclick = () => {
  confirmModal.classList.add('hidden');
  if (typeof pendingModalAction === 'function') {
    const actionToRun = pendingModalAction;
    pendingModalAction = null;
    actionToRun();
  }
};

// Username Change with Best Friend Notification & Cloud Sync
triggerChangeUsernameBtn.addEventListener('click', () => {
  const newName = newUsernameInput.value.trim().toLowerCase();
  const userData = localUsersDB[currentUser] || {};

  if (newName.length < 5) return alert('Username must be at least 5 characters long.');
  if (localUsersDB[newName]) return alert('Username already taken.');

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (!userData.usernameChanges) userData.usernameChanges = [];

  const recentChanges = userData.usernameChanges.filter(ts => (now - ts) < thirtyDays);

  if (recentChanges.length >= 2) return alert('Username cannot be changed more than 2 times in a month.');

  openConfirmModal(
    "Confirm Username Change",
    `Are you sure you want to change your username to '@${newName}'?`,
    () => executeUsernameChange(newName, recentChanges, now)
  );
});

function executeUsernameChange(newName, recentChanges, now) {
  recentChanges.push(now);
  const oldName = currentUser;
  const userData = localUsersDB[oldName];
  userData.usernameChanges = recentChanges;

  // 1. Transfer user record
  delete localUsersDB[oldName];
  localUsersDB[newName] = userData;

  // 2. Update bestfriend references in all users
  Object.keys(localUsersDB).forEach(uname => {
    if (localUsersDB[uname].bestfriend === oldName) {
      localUsersDB[uname].bestfriend = newName;
    }
  });

  // 3. Update author on all submitted question links
  localQuestionsDB.forEach(q => {
    if (q.author === oldName) q.author = newName;
  });

  // 4. Send notification to Best Friend
  const friend = userData.bestfriend;
  if (friend && localUsersDB[friend]) {
    if (!localUsersDB[friend].notifications) localUsersDB[friend].notifications = [];
    localUsersDB[friend].notifications.unshift({
      id: 'notif_' + Date.now(),
      type: 'system',
      text: `Your best friend @${oldName} changed their username to @${newName}.`
    });
  }

  currentUser = newName;
  localStorage.setItem(STORAGE_SESSION, currentUser);
  saveAllState();

  newUsernameInput.value = '';
  newUserStatus.textContent = '';
  settingsDrawer.classList.add('hidden');
  userDisplay.textContent = currentUser;
  renderDashboardData();
  alert('Username updated successfully!');
}

// Best Friend Request Trigger
triggerChangeBfBtn.addEventListener('click', () => {
  const targetFriend = newBfInput.value.trim().toLowerCase();

  if (!targetFriend) return;
  if (targetFriend === currentUser) return alert('Cannot add yourself.');
  if (!localUsersDB[targetFriend]) return alert(`User '@${targetFriend}' does not exist.`);

  openConfirmModal(
    "Confirm Best Friend Request",
    `Send a Best Friend Request to '@${targetFriend}'?`,
    () => executeBfRequest(targetFriend)
  );
});

function executeBfRequest(targetFriend) {
  if (!localUsersDB[targetFriend].notifications) localUsersDB[targetFriend].notifications = [];
  localUsersDB[targetFriend].notifications.unshift({
    id: 'req_' + Date.now(),
    type: 'bf_request',
    from: currentUser,
    text: `@${currentUser} sent you a Best Friend Request!`
  });

  saveAllState();
  newBfInput.value = '';
  renderDashboardData();
  alert(`Best Friend Request sent to @${targetFriend}!`);
}

// Break Friendship Connection
breakFriendshipBtn.addEventListener('click', () => {
  const friend = localUsersDB[currentUser]?.bestfriend;
  if (!friend) return;

  openConfirmModal(
    "Break Friendship Connection",
    `Are you sure you want to break friendship with @${friend}?`,
    () => executeBreakFriendship(friend)
  );
});

function executeBreakFriendship(friend) {
  localUsersDB[currentUser].bestfriend = null;

  if (localUsersDB[friend]) {
    localUsersDB[friend].bestfriend = null;
    if (!localUsersDB[friend].notifications) localUsersDB[friend].notifications = [];
    localUsersDB[friend].notifications.unshift({
      id: 'notif_' + Date.now(),
      type: 'system',
      text: `@${currentUser} broke the Best Friend connection.`
    });
  }

  saveAllState();
  renderDashboardData();
  alert('Connection broken.');
}

// Account Deletion Trigger with Password Check & Notification
toggleDeleteBoxBtn.addEventListener('click', () => {
  deleteAccountFormContainer.classList.toggle('hidden');
});

triggerDeleteAccountBtn.addEventListener('click', () => {
  const pass1 = document.getElementById('del-pass-1').value;
  const pass2 = document.getElementById('del-pass-2').value;
  const user = localUsersDB[currentUser] || {};

  if (!user.password || pass1 !== user.password || pass2 !== user.password) {
    return alert("Incorrect password verification! Both password entries must match your current password.");
  }

  openConfirmModal(
    "⚠️ PERMANENT ACCOUNT DELETION",
    "Are you absolute sure you want to delete your account? All data will be permanently removed.",
    () => executeAccountDeletion()
  );
});

function executeAccountDeletion() {
  const oldName = currentUser;
  const user = localUsersDB[oldName];
  const friend = user.bestfriend;

  // 1. Notify Best Friend & unlink
  if (friend && localUsersDB[friend]) {
    localUsersDB[friend].bestfriend = null;
    if (!localUsersDB[friend].notifications) localUsersDB[friend].notifications = [];
    localUsersDB[friend].notifications.unshift({
      id: 'notif_' + Date.now(),
      type: 'system',
      text: `⚠️ Your Best Friend @${oldName} has deleted their account.`
    });
  }

  // 2. Remove user reference from all bestfriends
  Object.keys(localUsersDB).forEach(uname => {
    if (localUsersDB[uname].bestfriend === oldName) {
      localUsersDB[uname].bestfriend = null;
    }
  });

  // 3. Mark solution links as [Deleted User]
  localQuestionsDB.forEach(q => {
    if (q.author === oldName) q.author = '[Deleted User]';
  });

  // 4. Delete user record & sync
  delete localUsersDB[oldName];
  saveAllState();

  // 5. Reset UI & Logout
  logoutUser();
  alert("Your account has been permanently deleted.");
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem(STORAGE_SESSION);
  loginForm.reset();
  registerForm.reset();
  forgotForm.reset();
  document.getElementById('del-pass-1').value = '';
  document.getElementById('del-pass-2').value = '';

  settingsDrawer.classList.add('hidden');
  notificationsDrawer.classList.add('hidden');
  linksDrawer.classList.add('hidden');
  mainApp.classList.add('hidden');
  authCard.classList.remove('hidden');
  switchAuthTab('login');
}

window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => alert('Link copied for Incognito Mode!'));
};

logoutBtn.addEventListener('click', logoutUser);

function showMessage(msg, type) {
  authMessage.textContent = msg;
  authMessage.className = `message-box ${type}`;
}

function hideMessage() {
  authMessage.className = 'message-box hidden';
}
