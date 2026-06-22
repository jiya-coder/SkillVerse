// SkillVerse Mobile Application State Management & Logic

// Seed Data for Fresh Experience
const DEFAULT_USER_STATE = {
  name: "",
  dept: "",
  year: "",
  bio: "",
  rating: "5.0",
  streak: "0",
  sessionsTaught: 0,
  skillsLearned: 0,
  skillsTeach: [],
  skillsLearn: [],
  prefEmail: true,
  prefMatches: true,
  isOnboarded: false
};

const DEFAULT_CHATS = {};

const PARTNER_DATA = {
  alex_chen: {
    name: "CS Peer (Year 3)",
    teach: "React.js",
    learn: "UI/UX Design",
    dept: "CS Dept",
    year: "Year 3",
    percentage: "94%",
    avatarColor: "var(--accent-yellow)",
    textColor: "var(--dark-stroke)"
  },
  david_kim: {
    name: "CS Peer (Year 2)",
    teach: "CSS Grid",
    learn: "Figma",
    dept: "CS Dept",
    year: "Year 2",
    percentage: "89%",
    avatarColor: "var(--accent-red)",
    textColor: "#ffffff"
  }
};

// Global App State
let state = {
  user: { ...DEFAULT_USER_STATE },
  chats: { ...DEFAULT_CHATS },
  activeScreen: "screen-login",
  activeChatPartner: null,
  activeProposalPartner: null,
  activeCallSessionIndex: null,
  proposal: {
    duration: "4 Weeks",
    format: "2x / Week"
  },
  upcomingSessions: [],
  callTimerInterval: null,
  callTimerSeconds: 120, // 2:00
  audioEnabled: false,
  videoEnabled: false,
  inCall: false
};

// Load data from localStorage if exists
function loadState() {
  const savedUser = localStorage.getItem("skillverse_user");
  const savedChats = localStorage.getItem("skillverse_chats");
  const savedSessions = localStorage.getItem("skillverse_sessions");
  
  if (savedUser) {
    state.user = JSON.parse(savedUser);
  }
  if (savedChats) {
    state.chats = JSON.parse(savedChats);
  }
  if (savedSessions) {
    state.upcomingSessions = JSON.parse(savedSessions);
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem("skillverse_user", JSON.stringify(state.user));
  localStorage.setItem("skillverse_chats", JSON.stringify(state.chats));
  localStorage.setItem("skillverse_sessions", JSON.stringify(state.upcomingSessions));
}

// Reset State (Logout)
function resetState() {
  localStorage.removeItem("skillverse_user");
  localStorage.removeItem("skillverse_chats");
  localStorage.removeItem("skillverse_sessions");
  state.user = { ...DEFAULT_USER_STATE };
  state.chats = { ...DEFAULT_CHATS };
  state.upcomingSessions = [];
}

// Navigation Handler
function navigateTo(screenId) {
  state.activeScreen = screenId;
  
  // Hide all screens
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  
  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add("active");
    
    // Check if bottom nav should be hidden
    const hideNav = targetScreen.getAttribute("data-hide-nav") === "true";
    const device = document.getElementById("app-device");
    if (hideNav) {
      device.classList.add("hide-nav");
    } else {
      device.classList.remove("hide-nav");
    }
  }

  // Update Bottom Nav active tab state
  document.querySelectorAll(".bottom-nav-item").forEach(item => {
    if (item.getAttribute("data-target") === screenId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Perform screen specific setups
  if (screenId === "screen-profile") {
    renderProfileView();
  } else if (screenId === "screen-edit-profile") {
    populateEditProfileForm();
  } else if (screenId === "screen-messages") {
    renderChatsList();
  } else if (screenId === "screen-home") {
    renderHomeView();
  } else if (screenId === "screen-matches") {
    renderMatchesView();
  }
}

// Render Views
function renderHomeView() {
  document.getElementById("home-user-name").innerText = state.user.name || "Student";
  document.getElementById("home-sessions-count").innerText = String(state.user.sessionsTaught).padStart(2, '0');
  document.getElementById("home-skills-count").innerText = String(state.user.skillsLearned).padStart(2, '0');

  const container = document.getElementById("home-sessions-container");
  container.innerHTML = "";

  if (state.upcomingSessions.length === 0) {
    // Show empty state
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 24px; border: 3px dashed var(--dark-stroke); box-shadow: none;">
        <p style="font-weight: 700; font-size: 13px; margin-bottom: 16px; text-transform: uppercase;">No upcoming sessions yet.</p>
        <button class="btn btn-secondary" id="btn-home-go-match" style="width: 100%;">Find a Study Partner</button>
      </div>
    `;
    document.getElementById("btn-home-go-match").addEventListener("click", () => {
      navigateTo("screen-matches");
    });
  } else {
    // Render session cards
    state.upcomingSessions.forEach((session, index) => {
      const card = document.createElement("div");
      card.className = "session-card";
      card.innerHTML = `
        <div class="session-time">
          <span>Today &bull; 4:00 PM</span>
          <span class="dot"></span>
        </div>
        <h4 class="session-title">${session.title}</h4>
        <div class="session-partner">With ${session.partnerName}</div>
        <button class="btn btn-secondary btn-join-call-action" data-index="${index}">Join Call</button>
      `;
      
      card.querySelector(".btn-join-call-action").addEventListener("click", () => {
        state.activeCallSessionIndex = index;
        navigateTo("screen-waiting");
        startWaitingRoomTimer(session.partnerName, session.title);
      });

      container.appendChild(card);
    });
  }
}

function renderProfileView() {
  document.getElementById("profile-display-name").innerText = state.user.name || "Your Name";
  document.getElementById("profile-meta-dept").innerHTML = `${state.user.dept || "Department"} &bull; ${state.user.year || "Year"}`;
  document.getElementById("profile-streak-val").innerText = state.user.streak;
  
  // Update initials avatar
  const initials = state.user.name ? state.user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "ME";
  document.getElementById("profile-avatar-letters").innerText = initials;

  // Render tags
  const teachContainer = document.getElementById("profile-teach-tags");
  teachContainer.innerHTML = "";
  if (state.user.skillsTeach && state.user.skillsTeach.length > 0) {
    state.user.skillsTeach.forEach(skill => {
      const span = document.createElement("span");
      span.className = "badge teach-badge";
      span.innerText = skill;
      teachContainer.appendChild(span);
    });
  } else {
    teachContainer.innerHTML = `<span style="font-size: 12px; color: #777;">No skills specified yet.</span>`;
  }

  const learnContainer = document.getElementById("profile-learn-tags");
  learnContainer.innerHTML = "";
  if (state.user.skillsLearn && state.user.skillsLearn.length > 0) {
    state.user.skillsLearn.forEach(skill => {
      const span = document.createElement("span");
      span.className = "badge learn-badge";
      span.innerText = skill;
      learnContainer.appendChild(span);
    });
  } else {
    learnContainer.innerHTML = `<span style="font-size: 12px; color: #777;">No skills specified yet.</span>`;
  }
}

function populateEditProfileForm() {
  document.getElementById("edit-display-name").value = state.user.name;
  document.getElementById("edit-bio").value = state.user.bio;
  document.getElementById("edit-dept").value = `${state.user.dept} (${state.user.year})`;
  document.getElementById("pref-email").checked = state.user.prefEmail;
  document.getElementById("pref-matches").checked = state.user.prefMatches;
}

function renderMatchesView() {
  const container = document.getElementById("matches-list-container");
  container.innerHTML = "";

  if (!state.user.isOnboarded) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <p style="font-weight: 700; font-size: 13px; color: #666; text-transform: uppercase;">Profile Setup Required</p>
        <p style="font-size: 11px; color: #999; margin-top: 8px; text-transform: uppercase; line-height: 1.4;">Please set up your profile to discover matching study partners.</p>
      </div>
    `;
    return;
  }

  Object.keys(PARTNER_DATA).forEach((key, index) => {
    const partner = PARTNER_DATA[key];
    const card = document.createElement("div");
    card.className = "match-card";
    card.setAttribute("data-partner-id", key);
    
    const btnClass = index === 0 ? "btn-primary" : "btn-outline";

    card.innerHTML = `
      <div class="match-header">
        <div class="match-info">
          <h3>${partner.name}</h3>
          <p>${partner.dept} &bull; ${partner.year}</p>
        </div>
        <div class="match-percentage">${partner.percentage}</div>
      </div>
      
      <div class="match-tags-container">
        <div class="match-tags-section">
          <h4>Offers</h4>
          <div class="badge-group" style="margin: 0;">
            <span class="badge learn-badge">${partner.teach}</span>
          </div>
        </div>
        <div class="match-tags-section">
          <h4>Wants</h4>
          <div class="badge-group" style="margin: 0;">
            <span class="badge teach-badge">${partner.learn}</span>
          </div>
        </div>
      </div>

      <button class="btn ${btnClass} btn-propose-action" data-partner-id="${key}">Propose Exchange</button>
    `;

    card.querySelector(".btn-propose-action").addEventListener("click", () => {
      state.activeProposalPartner = key;
      
      // Update Proposal Screen
      document.getElementById("proposal-you-teach").innerText = partner.learn;
      document.getElementById("proposal-partner-teaches").innerText = partner.teach;
      document.getElementById("btn-proposal-back").innerHTML = `<span>&larr; Back to Matches</span>`;
      
      navigateTo("screen-proposal");
    });

    container.appendChild(card);
  });
}

function renderChatsList(searchTerm = "") {
  const container = document.getElementById("chats-list");
  container.innerHTML = "";

  const chatKeys = Object.keys(state.chats);

  if (chatKeys.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <p style="font-weight: 700; font-size: 13px; color: #666; text-transform: uppercase;">No conversations yet.</p>
        <p style="font-size: 11px; color: #999; margin-top: 8px; text-transform: uppercase; line-height: 1.4;">Go to Match and send a proposal to start chatting!</p>
      </div>
    `;
    return;
  }

  chatKeys.forEach(key => {
    const chat = state.chats[key];
    
    // Simple filter
    if (searchTerm && !chat.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return;
    }

    const lastMsg = chat.messages[chat.messages.length - 1];
    const previewText = lastMsg ? (lastMsg.sender === "user" ? "You: " : "") + lastMsg.text : "No messages yet";

    const chatRow = document.createElement("div");
    chatRow.className = "chat-row-item";
    chatRow.setAttribute("data-chat-id", key);
    
    chatRow.innerHTML = `
      <div class="chat-row-avatar" style="background-color: ${chat.avatarColor}; color: ${chat.textColor};">${chat.avatar}</div>
      <div class="chat-row-content">
        <div class="chat-row-header">
          <span class="chat-row-name">${chat.name}</span>
          <span class="chat-row-time">${chat.time}</span>
        </div>
        <div class="chat-row-preview">${previewText}</div>
      </div>
      ${chat.online ? '<div class="chat-row-badge"></div>' : ''}
    `;

    chatRow.addEventListener("click", () => {
      openChatWith(key);
    });

    container.appendChild(chatRow);
  });
}

function openChatWith(partnerId) {
  state.activeChatPartner = partnerId;
  const chat = state.chats[partnerId];
  if (!chat) return;

  chat.online = false;

  navigateTo("screen-chat-convo");
  
  // Update header
  document.getElementById("chat-header-title").innerText = chat.name;
  
  // Render messages
  renderConversationMessages();
}

function renderConversationMessages() {
  const container = document.getElementById("convo-messages");
  container.innerHTML = "";

  const chat = state.chats[state.activeChatPartner];
  if (!chat) return;

  chat.messages.forEach(msg => {
    const wrapper = document.createElement("div");
    wrapper.className = `message-bubble-wrapper ${msg.sender === "user" ? "sent" : "received"}`;
    
    wrapper.innerHTML = `
      <div class="message-bubble">${msg.text}</div>
    `;
    container.appendChild(wrapper);
  });

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Send Message
function sendMessage() {
  const input = document.getElementById("chat-message-input");
  const text = input.value.trim();
  if (!text || !state.activeChatPartner) return;

  const chat = state.chats[state.activeChatPartner];
  if (!chat) return;

  // Add message
  chat.messages.push({
    sender: "user",
    text: text
  });
  
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  chat.time = `${hours}:${minutes} ${ampm}`;

  input.value = "";
  renderConversationMessages();
  saveState();

  const partnerIdToReply = state.activeChatPartner;

  // Simulate automatic bot reply after 1.5s
  setTimeout(() => {
    if (state.activeChatPartner === partnerIdToReply) {
      const chatPartner = PARTNER_DATA[partnerIdToReply] || { name: "Study Partner", teach: "skills", learn: "skills" };
      const userMessage = text.toLowerCase();
      let botResponse = "";

      if (userMessage.includes("hello") || userMessage.includes("hi") || userMessage.includes("hey")) {
        botResponse = `Hey ${state.user.name || 'there'}! Ready to swap some skills? What would you like to focus on first? I'm excited to teach you ${chatPartner.teach}!`;
      } else if (userMessage.includes("free") || userMessage.includes("time") || userMessage.includes("when") || userMessage.includes("meet")) {
        botResponse = `I'm usually free on Thursdays around 4:00 PM or Friday afternoons. Do either of those work for you to set up our syllabus?`;
      } else if (userMessage.includes("where") || userMessage.includes("location") || userMessage.includes("online")) {
        botResponse = `We can meet at the campus library study rooms, or we can just jump on a video session right here in SkillVerse!`;
      } else if (userMessage.includes("figma") || userMessage.includes("ui") || userMessage.includes("ux") || userMessage.includes("design")) {
        botResponse = `I really want to learn Figma and wireframing basics! I've got some draft wireframes I'd love your feedback on.`;
      } else if (userMessage.includes("react") || userMessage.includes("hooks") || userMessage.includes("javascript") || userMessage.includes("js") || userMessage.includes("css") || userMessage.includes("grid")) {
        botResponse = `For ${chatPartner.teach}, we can cover the core building blocks first. I've got some codebase examples ready!`;
      } else {
        botResponse = `That sounds awesome! Let's cover that when we sync up. Do you want to set a time to connect?`;
      }

      chat.messages.push({
        sender: "partner",
        text: botResponse
      });
      renderConversationMessages();
      saveState();
    }
  }, 1500);
}

// Timer Countdown in Waiting Room
function startWaitingRoomTimer(partnerName, topic) {
  clearInterval(state.callTimerInterval);
  state.callTimerSeconds = 120; // 2 minutes
  
  const roomTimer = document.querySelector(".waiting-timer");
  if (roomTimer) {
    roomTimer.innerHTML = `
      <div class="timer-tag">Starts in 2:00</div>
      <h2>${topic}</h2>
      <p>With ${partnerName}</p>
    `;
  }

  const initials = partnerName.split(" ").map(n => n[0]).join("").toUpperCase();
  const avatar = document.getElementById("waiting-avatar");
  if (avatar) avatar.innerText = initials;

  state.callTimerInterval = setInterval(() => {
    if (state.callTimerSeconds > 0) {
      state.callTimerSeconds--;
      const timerTag = document.querySelector(".timer-tag");
      if (timerTag) {
        const m = Math.floor(state.callTimerSeconds / 60);
        const s = String(state.callTimerSeconds % 60).padStart(2, '0');
        timerTag.innerText = `Starts in ${m}:${s}`;
      }
    } else {
      clearInterval(state.callTimerInterval);
    }
  }, 1000);
}

// Media Toggles
function toggleAudio() {
  state.audioEnabled = !state.audioEnabled;
  const audioBtn = document.getElementById("btn-toggle-audio");
  const audioLabel = document.getElementById("label-audio");
  
  if (state.audioEnabled) {
    audioBtn.classList.remove("active");
    audioBtn.style.backgroundColor = "var(--accent-green)";
    audioLabel.innerText = "Mute";
    document.getElementById("icon-audio").innerHTML = `
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
    `;
  } else {
    audioBtn.classList.add("active");
    audioBtn.style.backgroundColor = "";
    audioLabel.innerText = "Unmute";
    document.getElementById("icon-audio").innerHTML = `
      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .11 0 .22-.01.33-.02l2.28 2.28c-.8.53-1.74.87-2.77.93v3h2v-3c.59-.04 1.15-.17 1.67-.37l3.22 3.22L20 20.73 4.27 3zM12 16c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c-.34-.05-.67-.14-.98-.26l1.45 1.45c.53.25 1.1.41 1.71.49l-2.18-2.6z"/>
    `;
  }
}

function toggleVideo() {
  state.videoEnabled = !state.videoEnabled;
  const videoBtn = document.getElementById("btn-toggle-video");
  const videoLabel = document.getElementById("label-video");
  const camStatus = document.getElementById("camera-status-label");
  const videoContainer = document.querySelector(".video-container");
  const waitingAvatar = document.getElementById("waiting-avatar");

  if (state.videoEnabled) {
    videoBtn.style.backgroundColor = "var(--accent-green)";
    videoBtn.style.color = "#ffffff";
    videoLabel.innerText = "Stop Video";
    camStatus.innerText = "Camera On";
    videoContainer.style.background = "radial-gradient(circle, #333333 0%, #111111 100%)";
    waitingAvatar.style.borderColor = "var(--accent-green)";
    waitingAvatar.style.boxShadow = "0px 0px 15px var(--accent-green)";
    document.getElementById("icon-video").innerHTML = `
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    `;
  } else {
    videoBtn.style.backgroundColor = "";
    videoBtn.style.color = "";
    videoLabel.innerText = "Video";
    camStatus.innerText = "Camera Off";
    videoContainer.style.background = "#000000";
    waitingAvatar.style.borderColor = "#ffffff";
    waitingAvatar.style.boxShadow = "none";
    document.getElementById("icon-video").innerHTML = `
      <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2zM5 16V8h3.73l8 8H5z"/>
    `;
  }
}

// Event Bindings & Initializer
document.addEventListener("DOMContentLoaded", () => {
  loadState();

  // Onboarding tags selections
  document.querySelectorAll("#onboard-teach-chips .selectable-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
  });

  document.querySelectorAll("#onboard-learn-chips .selectable-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
  });

  // Onboarding form submit
  document.getElementById("btn-onboard-submit").addEventListener("click", () => {
    const name = document.getElementById("onboard-display-name").value.trim();
    const dept = document.getElementById("onboard-dept").value.trim();
    const year = document.getElementById("onboard-year").value.trim();
    const bio = document.getElementById("onboard-bio").value.trim();

    if (!name || !dept || !year) {
      alert("Name, Department, and Year are required!");
      return;
    }

    state.user.name = name;
    state.user.dept = dept;
    state.user.year = year;
    state.user.bio = bio;

    // Collect selectable skills
    state.user.skillsTeach = [];
    document.querySelectorAll("#onboard-teach-chips .selectable-chip.active").forEach(chip => {
      state.user.skillsTeach.push(chip.getAttribute("data-skill"));
    });

    state.user.skillsLearn = [];
    document.querySelectorAll("#onboard-learn-chips .selectable-chip.active").forEach(chip => {
      state.user.skillsLearn.push(chip.getAttribute("data-skill"));
    });

    state.user.isOnboarded = true;
    state.user.streak = "1";

    saveState();
    navigateTo("screen-home");
  });

  // Bottom Navigation tabs routing
  document.querySelectorAll(".bottom-nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (!state.user.isOnboarded) {
        alert("Please set up your profile first!");
        return;
      }
      const target = item.getAttribute("data-target");
      navigateTo(target);
    });
  });

  // Login Screen triggers
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.user.isOnboarded) {
      navigateTo("screen-home");
    } else {
      navigateTo("screen-onboarding");
    }
  });

  document.getElementById("btn-login-google").addEventListener("click", () => {
    if (state.user.isOnboarded) {
      navigateTo("screen-home");
    } else {
      navigateTo("screen-onboarding");
    }
  });

  // Waiting Room Controls
  document.getElementById("btn-waiting-back").addEventListener("click", () => {
    clearInterval(state.callTimerInterval);
    navigateTo("screen-home");
  });

  document.getElementById("btn-toggle-audio").addEventListener("click", toggleAudio);
  document.getElementById("btn-toggle-video").addEventListener("click", toggleVideo);

  document.getElementById("btn-waiting-join-session").addEventListener("click", () => {
    clearInterval(state.callTimerInterval);
    alert("Connecting call stream to study partner...");
    
    // Increment sessions taught mock stat
    state.user.sessionsTaught++;
    state.user.skillsLearned++;
    
    // Remove the finished session from list
    if (state.activeCallSessionIndex !== null && state.activeCallSessionIndex !== undefined) {
      state.upcomingSessions.splice(state.activeCallSessionIndex, 1);
      state.activeCallSessionIndex = null;
    }
    
    saveState();
    navigateTo("screen-home");
  });

  // Profile triggers
  document.getElementById("btn-profile-edit").addEventListener("click", () => {
    navigateTo("screen-edit-profile");
  });

  // Edit Profile triggers
  document.getElementById("btn-edit-cancel").addEventListener("click", () => {
    navigateTo("screen-profile");
  });

  document.getElementById("btn-edit-save").addEventListener("click", () => {
    const inputName = document.getElementById("edit-display-name").value.trim();
    if (inputName) {
      state.user.name = inputName;
    }
    state.user.bio = document.getElementById("edit-bio").value.trim();
    
    const inputDept = document.getElementById("edit-dept").value.trim();
    state.user.dept = inputDept;

    state.user.prefEmail = document.getElementById("pref-email").checked;
    state.user.prefMatches = document.getElementById("pref-matches").checked;
    
    saveState();
    navigateTo("screen-profile");
  });

  document.getElementById("btn-edit-logout").addEventListener("click", () => {
    resetState();
    navigateTo("screen-login");
  });

  document.getElementById("btn-proposal-back").addEventListener("click", () => {
    navigateTo("screen-matches");
  });

  // Select configurations in Proposal
  document.querySelectorAll("#grid-duration .proposal-select-box").forEach(box => {
    box.addEventListener("click", () => {
      document.querySelectorAll("#grid-duration .proposal-select-box").forEach(el => el.classList.remove("active"));
      box.classList.add("active");
      state.proposal.duration = box.getAttribute("data-value");
    });
  });

  document.querySelectorAll("#grid-format .proposal-select-box").forEach(box => {
    box.addEventListener("click", () => {
      document.querySelectorAll("#grid-format .proposal-select-box").forEach(el => el.classList.remove("active"));
      box.classList.add("active");
      state.proposal.format = box.getAttribute("data-value");
    });
  });

  // Send Proposal -> Status Modal
  document.getElementById("btn-proposal-send").addEventListener("click", () => {
    const partnerId = state.activeProposalPartner || "alex_chen";
    const partnerName = PARTNER_DATA[partnerId]?.name || "CS Peer";
    
    document.getElementById("status-partner-name").innerText = partnerName;
    document.getElementById("status-overlay").classList.add("active");
  });

  // Status Modal Close Action
  const closeStatus = () => {
    document.getElementById("status-overlay").classList.remove("active");
  };
  
  document.getElementById("btn-status-close").addEventListener("click", closeStatus);
  
  // Status Modal Actions
  const handleProposalSubmissionSuccess = (partnerId) => {
    const partner = PARTNER_DATA[partnerId] || { name: "CS Peer", teach: "React.js", learn: "UI/UX Design" };
    
    if (!state.chats[partnerId]) {
      state.chats[partnerId] = {
        name: partner.name,
        avatar: partner.name.split(" ").map(n => n[0]).join("").toUpperCase(),
        avatarColor: partnerId === "alex_chen" ? "var(--accent-yellow)" : "var(--accent-red)",
        textColor: "var(--dark-stroke)",
        time: "Just Now",
        messages: [
          { sender: "user", text: `PROPOSAL: I'd like to propose a skill exchange! I can teach you ${partner.learn} and you teach me ${partner.teach} for ${state.proposal.duration} (${state.proposal.format}).` }
        ],
        online: true
      };

      setTimeout(() => {
        const chat = state.chats[partnerId];
        if (chat) {
          chat.messages.push({
            sender: "partner",
            text: `Hey ${state.user.name}! I saw your request for ${partner.teach}. I'd love to help you out if you can teach me some ${partner.learn} basics.`
          });
          if (state.activeChatPartner === partnerId) {
            renderConversationMessages();
          }
          saveState();
        }
      }, 2500);
    }

    const exists = state.upcomingSessions.some(s => s.partnerId === partnerId);
    if (!exists) {
      state.upcomingSessions.push({
        title: partner.teach,
        partnerName: partner.name,
        partnerId: partnerId
      });
    }

    saveState();
  };

  document.getElementById("btn-status-home").addEventListener("click", () => {
    closeStatus();
    const partnerId = state.activeProposalPartner || "alex_chen";
    handleProposalSubmissionSuccess(partnerId);
    navigateTo("screen-home");
  });

  document.getElementById("btn-status-chat").addEventListener("click", () => {
    closeStatus();
    const partnerId = state.activeProposalPartner || "alex_chen";
    handleProposalSubmissionSuccess(partnerId);
    openChatWith(partnerId);
  });

  // Messages / Chat triggers
  document.getElementById("btn-chat-convo-back").addEventListener("click", () => {
    navigateTo("screen-messages");
  });

  // Search input filter
  document.getElementById("chat-search-input").addEventListener("input", (e) => {
    renderChatsList(e.target.value);
  });

  // Send message triggers
  document.getElementById("btn-chat-send").addEventListener("click", sendMessage);
  document.getElementById("chat-message-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Kick off view
  if (state.user.isOnboarded) {
    navigateTo("screen-home");
  } else {
    navigateTo("screen-login");
  }
});
