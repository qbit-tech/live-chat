class QLiveChatWidget {
  constructor(config) {
    this.config = config;
    this.chatMode = "openai";
    this.conversationHistory = [];
    this.currentConversationIndex = null;
  }

  init() {
    this.loadAssets();
    this.setupWidget();
    this.loadConversationHistory();
    this.addEventListeners();
    this.checkActiveConversations();
  }

  loadAssets() {
    this.appendLinkToHead("./chat-widget.css");
  }

  appendLinkToHead(href) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  setupWidget() {
    this.createChatWidgetContainer();
    this.cacheChatElements();
    this.handleResize();
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  createChatWidgetContainer() {
    const chatWidgetContainer = document.createElement("div");
    chatWidgetContainer.id = "chat-widget-container";
    chatWidgetContainer.innerHTML = this.getChatWidgetHTML();
    document.body.appendChild(chatWidgetContainer);
  }

  getChatWidgetHTML() {
    return `
      <div id="chat-bubble" class="chat-bubble">
        <img id="chat-icon" src="./assets/customer-service.svg" alt="Chat Bubble" width="40" height="40" />
      </div>
      <div id="chat-popup" class="chat-popup hidden">
        ${this.getLandingPageHTML()}
        ${this.getFAQAnswerPageHTML()}
        ${this.getUserFormPageHTML()}
        ${this.getChatHeaderHTML()}
        ${this.getChatMessagesHTML()}
        ${this.getEditUserPageHTML()}
        ${this.getEmailTranscriptPageHTML()}
      </div>
    `;
  }

  getLandingPageHTML() {
    return `
      <div id="landing-page" class="landing-page">
        <div class="landing-header">
          <div id="close-chat-popup" class="back-button">
            <img src="./assets/close.svg" alt="Close" width="20" height="20" />
            </div>
            <h2>Hi there <span role="img" aria-label="wave">👋</span></h2>
            <p>Need help? Search our help center for answers or start a conversation:</p>
        </div>
        <div class="search-box">
          <input type="text" placeholder="Search for answers" />
          <button class="search-button">Search</button>
          <div class="search-results-container"></div>
        </div>
        <div class="conversation-list"></div>
        <div class="new-conversation">
          <button id="new-conversation">New Conversation</button>
        </div>
      </div>
    `;
  }

  getFAQAnswerPageHTML() {
    return `
      <div id="faq-answer-page" class="faq-answer-page hidden">
        <div class="chat-header">
          <button id="back-to-search" class="back-button">
            <img src="./assets/arrow.svg" alt="Back" width="20" height="20" />
          </button>
          <h3 id="faq-question"></h3>
        </div>
        <div class="chat-messages">
          <div class="faq-answer">
            <p id="faq-answer"></p>
          </div>
        </div>
      </div>
    `;
  }

  getUserFormPageHTML() {
    return `
      <div id="user-form-page" class="form-page hidden">
        <div class="chat-header">
          <button id="back-to-landing" class="back-button">
            <img src="./assets/arrow.svg" alt="Back" width="20" height="20" />
          </button>
          <h3>User Information</h3>
        </div>
        <div class="chat-messages">
          ${this.getUserInfoConfirmationHTML()}
          ${this.getUserFormHTML()}
        </div>
      </div>
    `;
  }

  getUserInfoConfirmationHTML() {
    return `
      <div id="user-info-confirmation" class="hidden">
        <div>
          <p>Are you :</p>
          <h2 id="user-name-display"></h2>
        </div>
        <div>
          <label for="message-confirmation">Message:</label>
          <textarea id="message-confirmation" name="message" rows="3" required></textarea>
        </div>
        <button type="submit" class="btn-start-chat" id="start-chat">Start Chat</button>
        <button type="button" class="btn-edit" id="edit-info">Edit</button>
      </div>
    `;
  }

  getUserFormHTML() {
    return `
      <div class="user-form hidden">
        <form id="conversation-form">
          <div>
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div>
            <label for="phone">Phone:</label>
            <input type="tel" id="phone" name="phone" required />
          </div>
          <div>
            <label for="message">Message:</label>
            <textarea id="message" name="message" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn-start-chat">Start Chat</button>
        </form>
      </div>
    `;
  }

  getChatHeaderHTML() {
    return `
      <div id="chat-header" class="chat-header hidden">
        <button id="back-to-landing" class="back-button">
          <img src="./assets/arrow.svg" alt="Back" width="20" height="20" />
        </button>
        <h3 id="chat-header-title"></h3>
        ${this.getDropdownHTML()}
      </div>
    `;
  }

  getDropdownHTML() {
    return `
      <div class="dropdown">
        <button class="dropdown-toggle">
          <img src="./assets/more.svg" alt="More" width="25" height="25" />
        </button>
        <div class="dropdown-menu hidden">
          <button id="edit-profile" class="dropdown-item dropdown-item-1">Edit Profile</button>
          <button id="email-transcript" class="dropdown-item dropdown-item-2">Email Transcript</button>
          <button id="end-conversation" class="dropdown-item dropdown-item-3">End Conversation</button>
        </div>
      </div>
    `;
  }

  getChatMessagesHTML() {
    return `
      <div id="chat-messages" class="chat-messages hidden"></div>
      <div id="chat-input-container" class="chat-input-container hidden">
        <input type="text" id="chat-input" class="chat-input" placeholder="Type your message..." />
        <button id="chat-submit" class="chat-submit">Send</button>
        <button id="go-to-latest" class="go-to-latest hidden">Go to Latest</button>
      </div>
      <div id="chat-ended-message" class="chat-ended-message hidden">
        <p>Chat has ended</p>
      </div>
    `;
  }

  getEditUserPageHTML() {
    return `
      <div id="edit-user-page" class="hidden">
        <div class="chat-header">
          <button id="back-to-chat-edit" class="back-button">
            <img src="./assets/arrow.svg" alt="Back" width="20" height="20" />
          </button>
          <h3>Edit Profile</h3>
        </div>
        <div class="chat-messages">
          ${this.getEditFormHTML()}
        </div>
      </div>
    `;
  }

  getEditFormHTML() {
    return `
      <form id="edit-form" class="user-form">
        <div>
          <label for="edit-name">Name:</label>
          <input type="text" id="edit-name" name="name" required />
        </div>
        <div>
          <label for="edit-email">Email:</label>
          <input type="email" id="edit-email" name="email" required />
        </div>
        <div>
          <label for="edit-phone">Phone:</label>
          <input type="tel" id="edit-phone" name="phone" required />
        </div>
        <button type="submit" class="edit-user">Save</button>
      </form>
    `;
  }

  getEmailTranscriptPageHTML() {
    return `
      <div id="email-transcript-page" class="hidden">
        <div class="chat-header">
          <button id="back-to-chat" class="back-button">
            <img src="./assets/arrow.svg" alt="Back" width="20" height="20" />
          </button>
          <h3>Email Transcript</h3>
        </div>
        <div class="chat-messages">
          ${this.getTranscriptFormHTML()}
        </div>
      </div>
    `;
  }

  getTranscriptFormHTML() {
    return `
      <form id="transcript-form" class="user-form">
        <div>
          <label for="email">Your chat transcript will be sent here:</label>
          <input type="email" required />
        </div>
        <button type="submit" class="btn-start-chat">Send</button>
      </form>
    `;
  }

  cacheChatElements() {
    this.chatElements = {
      chatInput: document.getElementById("chat-input"),
      chatSubmit: document.getElementById("chat-submit"),
      chatMessages: document.getElementById("chat-messages"),
      chatBubble: document.getElementById("chat-bubble"),
      chatPopup: document.getElementById("chat-popup"),
      chatIcon: document.getElementById("chat-icon"),
      landingPage: document.getElementById("landing-page"),
      startConversationButton: document.getElementById("start-conversation"),
      newConversationButton: document.getElementById("new-conversation"),
      chatHeader: document.getElementById("chat-header"),
      chatHeaderTitle: document.getElementById("chat-header-title"),
      chatInputContainer: document.getElementById("chat-input-container"),
      chatEndedMessage: document.getElementById("chat-ended-message"),
      backButton: document.querySelectorAll("#back-to-landing"),
      conversationList: document.querySelector(".conversation-list"),
      userFormPage: document.getElementById("user-form-page"),
      conversationForm: document.getElementById("conversation-form"),
      goToLatestButton: document.getElementById("go-to-latest"),
      emailTranscriptButton: document.getElementById("email-transcript"),
      backToChatButton: document.getElementById("back-to-chat"),
      faqAnswerPage: document.getElementById("faq-answer-page"),
      faqQuestionElement: document.getElementById("faq-question"),
      faqAnswerElement: document.getElementById("faq-answer"),
      backToSearchButton: document.getElementById("back-to-search"),
      editProfileButton: document.getElementById("edit-profile"),
      backToChatEditButton: document.getElementById("back-to-chat-edit"),
      editUserPage: document.getElementById("edit-user-page"),
      editForm: document.getElementById("edit-form"),
      closeChatPopupButton: document.getElementById("close-chat-popup"),
      searchBox: document.querySelector(".search-box"),
      endConversationButton: document.getElementById("end-conversation"),
    };
  }

  addEventListeners() {
    this.chatElements.chatBubble.addEventListener(
      "click",
      this.togglePopup.bind(this)
    );
    this.chatElements.closeChatPopupButton.addEventListener(
      "click",
      this.closeChatPopup.bind(this)
    );
    this.chatElements.newConversationButton.addEventListener(
      "click",
      this.showUserForm.bind(this)
    );
    this.chatElements.chatSubmit.addEventListener(
      "click",
      this.handleUserSubmit.bind(this)
    );
    this.chatElements.chatInput.addEventListener(
      "keyup",
      this.handleKeyUp.bind(this)
    );
    this.chatElements.conversationForm.addEventListener(
      "submit",
      this.handleFormSubmit.bind(this)
    );
    this.chatElements.goToLatestButton.addEventListener(
      "click",
      this.scrollToLatest.bind(this)
    );
    this.chatElements.emailTranscriptButton.addEventListener(
      "click",
      this.showEmailTranscriptPage.bind(this)
    );
    this.chatElements.backToSearchButton.addEventListener("click", () => {
      this.chatElements.faqAnswerPage.classList.add("hidden");
      this.chatElements.landingPage.classList.remove("hidden");
    });

    this.chatElements.editProfileButton.addEventListener(
      "click",
      this.showEditProfile.bind(this)
    );
    this.chatElements.backToChatEditButton.addEventListener(
      "click",
      this.backToChatFromEdit.bind(this)
    );
    this.chatElements.backToChatButton.addEventListener(
      "click",
      this.backToChat.bind(this)
    );
    this.chatElements.editForm.addEventListener(
      "submit",
      this.saveProfileEdits.bind(this)
    );
    this.chatElements.backButton.forEach((button) => {
      button.addEventListener("click", this.handleBackButton.bind(this));
    });

    const dropdownToggle = document.querySelector(".dropdown-toggle");
    dropdownToggle.addEventListener("click", this.toggleDropdown.bind(this));
    document.addEventListener(
      "click",
      this.closeDropdownOnClickOutside.bind(this)
    );

    const searchInput = this.chatElements.searchBox.querySelector("input");
    searchInput.addEventListener("input", this.handleSearchInput.bind(this));

    this.chatElements.endConversationButton.addEventListener(
      "click",
      this.endCurrentConversation.bind(this)
    );
  }

  handleResize() {
    if (window.innerWidth <= 768) {
      this.chatElements.closeChatPopupButton.style.display = "block";
    } else {
      this.chatElements.closeChatPopupButton.style.display = "none";
    }
  }

  togglePopup() {
    if (this.chatElements.chatPopup.classList.contains("visible")) {
      this.closeChatPopup();
    } else {
      this.openChatPopup();
    }
  }

  openChatPopup() {
    this.chatElements.chatPopup.classList.remove("hidden");
    this.chatElements.chatPopup.classList.add("visible");
    this.chatElements.chatIcon.style.transform = "rotate(180deg)";
    this.chatElements.chatIcon.src = "./assets/delete.svg";
    this.chatElements.chatInput.focus();
    if (window.innerWidth <= 768) {
      this.chatElements.chatBubble.classList.add("hidden");
    }
  }

  closeChatPopup() {
    this.chatElements.chatIcon.style.transform = "rotate(0)";
    this.chatElements.chatIcon.src = "./assets/customer-service.svg";
    this.chatElements.chatPopup.classList.add("closing");
    this.chatElements.chatPopup.addEventListener(
      "animationend",
      this.onPopupCloseAnimationEnd.bind(this),
      { once: true }
    );
    if (window.innerWidth <= 768) {
      this.chatElements.chatBubble.classList.remove("hidden");
    }
  }

  onPopupCloseAnimationEnd() {
    if (this.chatElements.chatPopup.classList.contains("closing")) {
      this.chatElements.chatPopup.classList.remove("visible", "closing");
      this.chatElements.chatPopup.classList.add("hidden");
      this.resetToLandingPage();
    }
  }

  loadConversationHistory() {
    const savedHistory = localStorage.getItem("conversationHistory");
    if (savedHistory) {
      this.conversationHistory = JSON.parse(savedHistory);
    }
    this.updateConversationList();
  }

  saveConversationHistory() {
    localStorage.setItem(
      "conversationHistory",
      JSON.stringify(this.conversationHistory)
    );
  }

  clearConversationHistory() {
    this.conversationHistory = [];
    this.saveConversationHistory();
    this.updateConversationList();
  }

  resetToLandingPage() {
    this.chatElements.landingPage.classList.remove("hidden");
    this.chatElements.chatHeader.classList.add("hidden");
    this.chatElements.chatMessages.classList.add("hidden");
    this.chatElements.chatInputContainer.classList.add("hidden");
    this.chatElements.chatEndedMessage.classList.add("hidden");
    this.chatElements.userFormPage.classList.add("hidden");
    this.chatElements.editUserPage.classList.add("hidden");
    const emailTranscriptPage = document.getElementById(
      "email-transcript-page"
    );
    emailTranscriptPage.classList.add("hidden");
    this.chatMode = "openai";
    this.chatElements.backButton.forEach((button) => {
      button.style.display = "none";
    });
    this.updateConversationList();
  }

  handleBackButton() {
    if (!this.chatElements.chatHeader.classList.contains("hidden")) {
      this.resetToLandingPage();
    } else {
      this.chatElements.userFormPage.classList.add("hidden");
      this.chatElements.editUserPage.classList.add("hidden");
      this.chatElements.landingPage.classList.remove("hidden");
    }
    this.chatElements.backButton.forEach((button) => {
      button.style.display = "none";
    });
  }

  showUserForm() {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    if (name && email && phone) {
      document.getElementById("user-name-display").textContent = name;
      document
        .getElementById("user-info-confirmation")
        .classList.remove("hidden");
      document.getElementById("conversation-form").classList.add("hidden");
    } else {
      this.loadUserForm();
    }

    this.chatElements.landingPage.classList.add("hidden");
    this.chatElements.userFormPage.classList.remove("hidden");
    this.chatElements.chatHeader.classList.add("hidden");
    this.chatElements.chatMessages.classList.add("hidden");
    this.chatElements.chatInputContainer.classList.add("hidden");
    this.chatElements.backButton.forEach((button) => {
      button.style.display = "inline-block";
    });

    this.startChatFromConfirmation();
    document
      .getElementById("edit-info")
      .addEventListener("click", this.loadUserForm.bind(this));
  }

  loadUserForm() {
    document.getElementById("user-info-confirmation").classList.add("hidden");
    document.getElementById("conversation-form").classList.remove("hidden");

    document.getElementById("name").value =
      localStorage.getItem("userName") || "";
    document.getElementById("email").value =
      localStorage.getItem("userEmail") || "";
    document.getElementById("phone").value =
      localStorage.getItem("userPhone") || "";
  }

  startChatFromConfirmation() {
    const startChatButton = document.getElementById("start-chat");

    startChatButton.removeEventListener(
      "click",
      this.handleConfirmationStartChat
    );

    startChatButton.addEventListener(
      "click",
      this.handleConfirmationStartChat.bind(this)
    );
  }

  handleConfirmationStartChat() {
    const message = document
      .getElementById("message-confirmation")
      .value.trim();

    if (message) {
      if (
        !this.conversationHistory.some((conversation) => conversation.active)
      ) {
        this.startNewConversation(message);
      } else {
        console.log(
          "There is already an active conversation. Please end the current conversation before starting a new one."
        );
      }
    }
  }

  handleFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const message = document.getElementById("message").value;

    this.saveFormValues(name, email, phone);
    this.startNewConversation(message);
  }

  saveFormValues(name, email, phone) {
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", phone);
  }

  startNewConversation(initialMessage) {
    this.resetChatMessages();

    const timestamp = new Date().toISOString();
    this.conversationHistory.push({
      status: "OpenAI",
      preview: "New conversation started...",
      timestamp,
      active: true,
      messages: [],
    });
    this.currentConversationIndex = this.conversationHistory.length - 1;
    this.startConversation();
    this.reply("Hello! How can I assist you today?");
    if (initialMessage) {
      this.onUserRequest(initialMessage);
    }
    this.updateConversationList();
    this.saveConversationHistory();
    this.checkActiveConversations();
  }

  startConversation() {
    this.chatElements.landingPage.classList.add("hidden");
    this.chatElements.userFormPage.classList.add("hidden");
    this.chatElements.chatHeader.classList.remove("hidden");
    this.chatElements.chatMessages.classList.remove("hidden");
    this.chatElements.chatInputContainer.classList.remove("hidden");
    this.chatElements.chatEndedMessage.classList.add("hidden");
    this.chatElements.backButton.forEach((button) => {
      button.style.display = "inline-block";
    });
    this.updateChatHeaderTitle();
  }

  handleUserSubmit() {
    const message = this.chatElements.chatInput.value.trim();
    if (!message) return;
    this.chatElements.chatInput.value = "";
    this.onUserRequest(message);
  }

  handleKeyUp(event) {
    if (event.key === "Enter") {
      this.chatElements.chatSubmit.click();
    }
  }

  onUserRequest(message) {
    const messageTimestamp = new Date().toISOString();
    this.appendMessage("user", message, messageTimestamp);
    this.updateCurrentConversation(message, "user", messageTimestamp);
    if (this.chatMode === "openai") {
      setTimeout(() => {
        this.reply("Hello! This is a sample reply from OpenAI.");
        this.offerRealAgentOption();
      }, 200);
    } else {
      setTimeout(
        () => this.reply("You are now chatting with a real agent."),
        200
      );
    }
  }

  appendMessage(type, content, timestamp) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;

    let imageSrc = "";
    if (type === "user") {
      imageSrc = "./assets/user.png";
    } else if (type === "reply") {
      imageSrc =
        this.chatMode === "openai" ? "./assets/bot.png" : "./assets/admin.png";
    }

    const previousMessage = this.chatElements.chatMessages.lastElementChild;
    const isSameSender =
      previousMessage && previousMessage.classList.contains(type);

    if (isSameSender) {
      const previousIcon = previousMessage.querySelector(".bubble-icon");
      if (previousIcon) previousIcon.style.display = "none";
    }

    messageElement.innerHTML = `
      <div class="bubble" data-timestamp="${timestamp}">${content}</div>
      <img src="${imageSrc}" alt="${type}" class="bubble-icon" width="30" height="30">
    `;

    this.chatElements.chatMessages.appendChild(messageElement);
    this.chatElements.chatMessages.scrollTop =
      this.chatElements.chatMessages.scrollHeight;
  }

  reply(message) {
    const messageTimestamp = new Date().toISOString();
    this.appendMessage("reply", message, messageTimestamp);
    this.updateCurrentConversation(message, "reply", messageTimestamp);
  }

  offerRealAgentOption() {
    const optionElement = document.createElement("div");
    optionElement.className = "message reply";
    optionElement.innerHTML = `
      <div class="bubble">
        If you need further assistance, you can <button id="switch-agent" class="switch-agent-button">Chat with a real agent</button>.
      </div>
    `;
    this.chatElements.chatMessages.appendChild(optionElement);
    this.chatElements.chatMessages.scrollTop =
      this.chatElements.chatMessages.scrollHeight;
    document
      .getElementById("switch-agent")
      .addEventListener("click", this.switchToRealAgent.bind(this));
  }

  switchToRealAgent() {
    this.chatMode = "agent";
    this.updateCurrentConversationStatus("Live Agent");
    this.resetChatMessages();
    this.reply(
      "You have been transferred to a real agent. Please start your conversation."
    );
    this.chatElements.chatInput.value = "";
    this.chatElements.chatInput.focus();
    this.updateConversationList();
    this.saveConversationHistory();
    this.updateChatHeaderTitle();
  }

  resetChatMessages() {
    this.chatElements.chatMessages.innerHTML = "";
  }

  resumeConversation(index) {
    this.currentConversationIndex = index;
    this.chatMode =
      this.conversationHistory[index].status === "OpenAI" ? "openai" : "agent";
    this.startConversation();
    this.resetChatMessages();
    this.conversationHistory[index].messages.forEach((message) =>
      this.appendMessage(message.type, message.content, message.timestamp)
    );
    if (this.conversationHistory[index].active) {
      this.chatElements.chatInputContainer.classList.remove("hidden");
      this.chatElements.chatEndedMessage.classList.add("hidden");
    } else {
      this.chatElements.chatInputContainer.classList.add("hidden");
      this.chatElements.chatEndedMessage.classList.remove("hidden");
    }
    this.chatElements.chatMessages.scrollTop =
      this.chatElements.chatMessages.scrollHeight;
  }

  endCurrentConversation() {
    if (this.currentConversationIndex !== null) {
      this.conversationHistory[this.currentConversationIndex].active = false;
      this.updateConversationList();
      this.saveConversationHistory();
      this.chatElements.chatInputContainer.classList.add("hidden");
      this.chatElements.chatEndedMessage.classList.remove("hidden");
      this.resetToLandingPage();
      this.checkActiveConversations();
    }
  }

  updateConversationList() {
    this.chatElements.conversationList.innerHTML = "";
    if (this.conversationHistory.length === 0) {
      this.addNoHistoryMessage();
      this.removeClearButton();
    } else {
      this.renderConversationItems();
      this.addClearButton();
    }
    this.checkActiveConversations();
  }

  addNoHistoryMessage() {
    const noHistoryMessage = document.createElement("p");
    noHistoryMessage.className = "no-history-message";
    noHistoryMessage.textContent = "No chat history";
    this.chatElements.conversationList.appendChild(noHistoryMessage);
  }

  renderConversationItems() {
    this.conversationHistory.forEach((conversation, index) => {
      const conversationItem = this.createConversationItem(conversation, index);
      this.chatElements.conversationList.appendChild(conversationItem);
    });
    document.querySelectorAll(".btn-active").forEach((button) => {
      button.addEventListener("click", () => {
        const index = parseInt(button.getAttribute("data-index"));
        this.resumeConversation(index);
      });
    });
  }

  createConversationItem(conversation, index) {
    let iconSrc = "";

    if (conversation.status === "OpenAI") {
      iconSrc = "./assets/bot.png";
    } else if (conversation.status === "Live Agent") {
      iconSrc = "./assets/admin.png";
    }

    const lastMessage =
      conversation.messages.length > 0
        ? conversation.messages[conversation.messages.length - 1].content
        : "(no messages)";

    const lastMessageTimestamp =
      conversation.messages.length > 0
        ? conversation.messages[conversation.messages.length - 1].timestamp
        : conversation.timestamp;

    const relativeTime = this.getRelativeTime(lastMessageTimestamp);

    const conversationItem = document.createElement("div");
    conversationItem.className = "conversation-item";
    conversationItem.innerHTML = `
      <div class="conversation-icon">
        <img src="${iconSrc}" alt="User Icon" width="40" height="40">
      </div>
      <div class="conversation-content">
        <p class="conversation-status">${
          conversation.status
        } - <span class="status-dot" data-status="${
      conversation.active ? "active" : "inactive"
    }">${conversation.active ? "active" : "ended"}</span></p>
        <div class="status">
          <p>${lastMessage}</p>
        </div>
      </div>
      <div class="conversation-action">
        <span class="relative-time">${relativeTime}</span>
        <button class="btn-active" data-index="${index}">
          <img src="./assets/next.svg" alt="Resume" width="20" height="20" />
        </button>
      </div>
    `;
    return conversationItem;
  }

  updateCurrentConversation(message, type, timestamp) {
    if (this.currentConversationIndex !== null) {
      this.conversationHistory[this.currentConversationIndex].messages.push({
        type,
        content: message,
        timestamp,
      });
      this.saveConversationHistory();
    }
  }

  updateCurrentConversationStatus(status) {
    if (this.currentConversationIndex !== null) {
      this.conversationHistory[this.currentConversationIndex].status = status;
    }
  }

  checkActiveConversations() {
    const activeConversationExists = this.conversationHistory.some(
      (conversation) => conversation.active
    );
    this.toggleNewConversationButton(activeConversationExists);
    this.toggleClearButton(activeConversationExists);
  }

  toggleNewConversationButton(isActive) {
    this.chatElements.newConversationButton.disabled = isActive;
    this.chatElements.newConversationButton.textContent = isActive
      ? "Conversation Active"
      : "New Conversation";
    this.chatElements.newConversationButton.classList.toggle(
      "disabled",
      isActive
    );
  }

  toggleClearButton(isActive) {
    const clearButton = document.getElementById("clear-conversations");
    if (clearButton) {
      clearButton.disabled = isActive;
      clearButton.classList.toggle("disabled", isActive);
    }
  }

  addClearButton() {
    this.removeClearButton();

    const clearButton = document.createElement("button");
    clearButton.id = "clear-conversations";
    clearButton.className = "btn-clear";
    clearButton.textContent = "Clear History";
    clearButton.addEventListener(
      "click",
      this.clearConversationHistory.bind(this)
    );

    this.chatElements.conversationList.appendChild(clearButton);
  }

  removeClearButton() {
    const clearButton = document.getElementById("clear-conversations");
    if (clearButton) {
      clearButton.remove();
    }
  }

  updateChatHeaderTitle() {
    this.chatElements.chatHeaderTitle.textContent =
      this.chatMode === "openai" ? "OpenAI" : "Live Agent";
  }

  getRelativeTime(timestamp) {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - messageTime) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    for (const interval in intervals) {
      const count = Math.floor(diffInSeconds / intervals[interval]);
      if (count >= 1) {
        return `${count} ${interval}${count !== 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  }

  fetchFAQSuggestions(query) {
    const url = `${this.config.endpointFAQ}?query=${encodeURIComponent(query)}`;
    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (data && data.payload && data.payload.results) {
          const filteredResults = data.payload.results.filter((item) =>
            item.question.toLowerCase().includes(query)
          );
          this.displaySearchResults(filteredResults);
        } else {
          this.clearSearchResults();
        }
      })
      .catch((error) => {
        console.error("Error fetching FAQ suggestions:", error);
        this.clearSearchResults();
      });
  }

  displaySearchResults(results) {
    let searchResultsContainer = this.chatElements.searchBox.querySelector(
      ".search-results-container"
    );

    if (!searchResultsContainer) {
      searchResultsContainer = document.createElement("div");
      searchResultsContainer.classList.add("search-results-container");
      this.chatElements.searchBox.appendChild(searchResultsContainer);
    }

    searchResultsContainer.innerHTML = "";

    if (results.length > 0) {
      results.forEach((result) => {
        const resultItem = document.createElement("div");
        resultItem.classList.add("search-result-item");
        resultItem.textContent = result.question;
        resultItem.addEventListener("click", () => {
          this.showFAQAnswer(result);
          this.clearSearchResults();
        });
        searchResultsContainer.appendChild(resultItem);
      });
      searchResultsContainer.style.display = "block";
    } else {
      searchResultsContainer.style.display = "none";
    }
  }

  clearSearchResults() {
    const searchResultsContainer = this.chatElements.searchBox.querySelector(
      ".search-results-container"
    );
    searchResultsContainer.innerHTML = "";
    searchResultsContainer.style.display = "none";
  }

  handleSearchInput() {
    const searchInput = this.chatElements.searchBox.querySelector("input");
    const query = searchInput.value.trim().toLowerCase();
    if (query.length > 0) {
      this.fetchFAQSuggestions(query);
    } else {
      this.clearSearchResults();
    }
  }

  showFAQAnswer(faq) {
    this.chatElements.faqQuestionElement.textContent = faq.question;
    this.chatElements.faqAnswerElement.innerHTML = faq.answer;

    this.chatElements.landingPage.classList.add("hidden");
    this.chatElements.faqAnswerPage.classList.remove("hidden");
  }

  scrollToLatest() {
    this.chatElements.chatMessages.scrollTop =
      this.chatElements.chatMessages.scrollHeight;
    this.hideGoToLatestButton();
  }

  showGoToLatestButton() {
    this.chatElements.goToLatestButton.classList.remove("hidden");
    this.chatElements.goToLatestButton.classList.add("visible");
  }

  hideGoToLatestButton() {
    this.chatElements.goToLatestButton.classList.remove("visible");
    this.chatElements.goToLatestButton.classList.add("hidden");
  }

  showEmailTranscriptPage() {
    this.chatElements.landingPage.classList.add("hidden");
    this.chatElements.userFormPage.classList.add("hidden");
    this.chatElements.chatHeader.classList.add("hidden");
    this.chatElements.chatMessages.classList.add("hidden");
    this.chatElements.chatInputContainer.classList.add("hidden");
    this.chatElements.chatEndedMessage.classList.add("hidden");
    const emailTranscriptPage = document.getElementById(
      "email-transcript-page"
    );
    emailTranscriptPage.classList.remove("hidden");

    const email = localStorage.getItem("userEmail");
    const emailInput = emailTranscriptPage.querySelector('input[type="email"]');
    if (email) {
      emailInput.value = email;
    }
    const transcriptForm = document.getElementById("transcript-form");
    transcriptForm.addEventListener(
      "submit",
      this.sendEmailTranscript.bind(this)
    );
  }

  sendEmailTranscript(event) {
    event.preventDefault();

    const email = document.querySelector(
      '#email-transcript-page input[type="email"]'
    ).value;
    const selectedConversation =
      this.conversationHistory[this.currentConversationIndex];

    if (selectedConversation && !selectedConversation.active) {
      let chatContent = `Chat Type: ${selectedConversation.status}\n`;
      selectedConversation.messages.forEach((message) => {
        chatContent += `${
          message.type === "user"
            ? "User"
            : selectedConversation.status === "OpenAI"
            ? "Bot"
            : "Real Agent"
        }: ${message.content}\n`;
      });

      console.log(`Email tujuan: ${email}`);
      console.log(`Isi chat:\n${chatContent}`);
    } else if (selectedConversation && selectedConversation.active) {
      console.log(
        "Percakapan yang dipilih masih aktif. Email transcript tidak dapat dikirim."
      );
    } else {
      console.log("Percakapan yang dipilih tidak tersedia atau masih aktif.");
    }

    this.resetToLandingPage();
  }

  backToChat() {
    const emailTranscriptPage = document.getElementById(
      "email-transcript-page"
    );
    emailTranscriptPage.classList.add("hidden");

    this.chatElements.chatHeader.classList.remove("hidden");
    this.chatElements.chatMessages.classList.remove("hidden");

    if (this.conversationHistory[this.currentConversationIndex]?.active) {
      this.chatElements.chatInputContainer.classList.remove("hidden");
      this.chatElements.chatEndedMessage.classList.add("hidden");
    } else {
      this.chatElements.chatInputContainer.classList.add("hidden");
      this.chatElements.chatEndedMessage.classList.remove("hidden");
    }
  }

  showEditProfile() {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    document.getElementById("edit-name").value = name || "";
    document.getElementById("edit-email").value = email || "";
    document.getElementById("edit-phone").value = phone || "";

    this.chatElements.landingPage.classList.add("hidden");
    this.chatElements.chatHeader.classList.add("hidden");
    this.chatElements.chatMessages.classList.add("hidden");
    this.chatElements.chatInputContainer.classList.add("hidden");
    this.chatElements.userFormPage.classList.add("hidden");
    this.chatElements.editUserPage.classList.remove("hidden");
    this.chatElements.chatEndedMessage.classList.add("hidden");
  }

  saveProfileEdits(event) {
    event.preventDefault();

    const newName = document.getElementById("edit-name").value;
    const newEmail = document.getElementById("edit-email").value;
    const newPhone = document.getElementById("edit-phone").value;

    localStorage.setItem("userName", newName);
    localStorage.setItem("userEmail", newEmail);
    localStorage.setItem("userPhone", newPhone);

    this.backToChatFromEdit();
  }

  backToChatFromEdit() {
    this.chatElements.editUserPage.classList.add("hidden");
    this.chatElements.chatHeader.classList.remove("hidden");
    this.chatElements.chatMessages.classList.remove("hidden");

    if (this.conversationHistory[this.currentConversationIndex]?.active) {
      this.chatElements.chatInputContainer.classList.remove("hidden");
      this.chatElements.chatEndedMessage.classList.add("hidden");
    } else {
      this.chatElements.chatInputContainer.classList.add("hidden");
      this.chatElements.chatEndedMessage.classList.remove("hidden");
    }
  }

  toggleDropdown() {
    const dropdownMenu = document.querySelector(".dropdown-menu");
    dropdownMenu.classList.toggle("hidden");
    this.chatElements.chatHeader
      .querySelector(".dropdown")
      .classList.toggle("open");
  }

  closeDropdownOnClickOutside(e) {
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    if (!dropdownToggle.parentElement.contains(e.target)) {
      const dropdownMenu = document.querySelector(".dropdown-menu");
      dropdownMenu.classList.add("hidden");
      dropdownToggle.parentElement.classList.remove("open");
    }
  }

  handleChatScroll() {
    const atBottom =
      this.chatElements.chatMessages.scrollHeight -
        this.chatElements.chatMessages.scrollTop ===
      this.chatElements.chatMessages.clientHeight;
    if (atBottom) {
      this.hideGoToLatestButton();
    } else {
      this.showGoToLatestButton();
    }
  }
}

// Tambahkan QLiveChatWidget ke global scope (window)
window.QLiveChatWidget = QLiveChatWidget;
