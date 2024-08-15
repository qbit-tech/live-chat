window.onload = function () {
  const chatElements = {
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
  };

  const searchInput = document.querySelector(".search-box input");
  const searchResultsContainer = document.createElement("div");
  searchResultsContainer.classList.add("search-results-container");
  searchInput.parentNode.appendChild(searchResultsContainer);

  let chatMode = "openai";
  let conversationHistory = [];
  let currentConversationIndex = null;

  init();

  function init() {
    loadConversationHistory();
    addEventListeners();
    startChatFromConfirmation();
    updateConversationList();
  }

  function addEventListeners() {
    chatElements.chatBubble.addEventListener("click", togglePopup);
    chatElements.startConversationButton.addEventListener("click", startConversation);
    chatElements.newConversationButton.addEventListener("click", showUserForm);
    chatElements.backButton.forEach((button) => {
      button.addEventListener("click", resetToLandingPage);
    });
    chatElements.chatSubmit.addEventListener("click", handleUserSubmit);
    chatElements.chatInput.addEventListener("keyup", handleKeyUp);
    chatElements.conversationForm.addEventListener("submit", handleFormSubmit);
    searchInput.addEventListener("input", handleSearchInput);

    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const dropdownMenu = document.querySelector(".dropdown-menu");

    dropdownToggle.addEventListener("click", toggleDropdown);
    document.addEventListener("click", closeDropdownOnClickOutside);

    const endConversationButton = document.getElementById("end-conversation");
    endConversationButton.addEventListener("click", endCurrentConversation);

    chatElements.chatMessages.addEventListener("scroll", handleChatScroll);
    chatElements.goToLatestButton.addEventListener("click", scrollToLatest);

    chatElements.emailTranscriptButton.addEventListener("click", showEmailTranscriptPage);

    if (chatElements.backToChatButton) {
      chatElements.backToChatButton.addEventListener("click", backToChat);
    }

    chatElements.editProfileButton.addEventListener("click", showEditProfile);
    chatElements.backToChatEditButton.addEventListener("click", backToChatFromEdit);
    chatElements.editForm.addEventListener("submit", saveProfileEdits);
  }

  function startChatFromConfirmation() {
    const startChatButton = document.getElementById("start-chat");
    startChatButton.addEventListener("click", handleConfirmationStartChat, {
      once: true,
    });
  }

  function handleConfirmationStartChat() {
    const startChatButton = document.getElementById("start-chat");
    startChatButton.disabled = true;

    const message = document.getElementById("message-confirmation").value;
    startNewConversation(message);

    setTimeout(() => {
      startChatButton.disabled = false;
    }, 2000);
  }

  function togglePopup() {
    if (chatElements.chatPopup.classList.contains("visible")) {
      closeChatPopup();
    } else {
      openChatPopup();
    }
  }

  function openChatPopup() {
    chatElements.chatPopup.classList.remove("hidden");
    chatElements.chatPopup.classList.add("visible");
    chatElements.chatIcon.style.transform = "rotate(180deg)";
    chatElements.chatIcon.src = "./assets/delete.svg";
    chatElements.chatInput.focus();
  }

  function closeChatPopup() {
    chatElements.chatIcon.style.transform = "rotate(0)";
    chatElements.chatIcon.src = "./assets/customer-service.svg";
    chatElements.chatPopup.classList.add("closing");
    chatElements.chatPopup.addEventListener("animationend", onPopupCloseAnimationEnd, {
      once: true,
    });
  }

  function onPopupCloseAnimationEnd() {
    if (chatElements.chatPopup.classList.contains("closing")) {
      chatElements.chatPopup.classList.remove("visible", "closing");
      chatElements.chatPopup.classList.add("hidden");
      resetToLandingPage();
    }
  }

  function showUserForm() {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    if (name && email && phone) {
      document.getElementById("user-name-display").textContent = name;

      document.getElementById("user-info-confirmation").classList.remove("hidden");
      document.getElementById("conversation-form").classList.add("hidden");
    } else {
      loadUserForm();
    }

    chatElements.landingPage.classList.add("hidden");
    chatElements.userFormPage.classList.remove("hidden");
    chatElements.chatHeader.classList.add("hidden");
    chatElements.chatMessages.classList.add("hidden");
    chatElements.chatInputContainer.classList.add("hidden");
    chatElements.backButton.forEach((button) => {
      button.style.display = "inline-block";
    });

    startChatFromConfirmation();

    document.getElementById("edit-info").addEventListener("click", loadUserForm);
  }

  function loadUserForm() {
    document.getElementById("user-info-confirmation").classList.add("hidden");
    document.getElementById("conversation-form").classList.remove("hidden");

    document.getElementById("name").value = localStorage.getItem("userName") || "";
    document.getElementById("email").value = localStorage.getItem("userEmail") || "";
    document.getElementById("phone").value = localStorage.getItem("userPhone") || "";

    chatElements.conversationForm.addEventListener("submit", handleFormSubmit);
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const message = document.getElementById("message").value;

    saveFormValues(name, email, phone);
    startNewConversation(message);
  }

  function saveFormValues(name, email, phone) {
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", phone);
  }

  function startNewConversation(initialMessage) {
    resetChatMessages();

    const timestamp = new Date().toLocaleString();
    conversationHistory.push({
      status: "OpenAI",
      preview: "New conversation started...",
      timestamp,
      active: true,
      messages: [],
    });
    currentConversationIndex = conversationHistory.length - 1;
    startConversation();
    reply("Hello! How can I assist you today?");
    if (initialMessage) {
      onUserRequest(initialMessage);
    }
    updateConversationList();
    saveConversationHistory();
    checkActiveConversations();
  }

  function startConversation() {
    chatElements.landingPage.classList.add("hidden");
    chatElements.userFormPage.classList.add("hidden");
    chatElements.chatHeader.classList.remove("hidden");
    chatElements.chatMessages.classList.remove("hidden");
    chatElements.chatInputContainer.classList.remove("hidden");
    chatElements.chatEndedMessage.classList.add("hidden");
    chatElements.backButton.forEach((button) => {
      button.style.display = "inline-block";
    });
    updateChatHeaderTitle();
  }

  function handleUserSubmit() {
    const message = chatElements.chatInput.value.trim();
    if (!message) return;
    chatElements.chatInput.value = "";
    onUserRequest(message);
  }

  function handleKeyUp(event) {
    if (event.key === "Enter") {
      chatElements.chatSubmit.click();
    }
  }

  function onUserRequest(message) {
    appendMessage("user", message);
    updateCurrentConversation(message, "user");
    if (chatMode === "openai") {
      setTimeout(() => {
        reply("Hello! This is a sample reply from OpenAI.");
        offerRealAgentOption();
      }, 200);
    } else {
      setTimeout(() => reply("You are now chatting with a real agent."), 200);
    }
  }

  function appendMessage(type, content) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;

    let imageSrc = "";
    if (type === "user") {
      imageSrc = "./assets/user.png";
    } else if (type === "reply") {
      imageSrc = chatMode === "openai" ? "./assets/bot.png" : "./assets/admin.png";
    }

    const previousMessage = chatElements.chatMessages.lastElementChild;
    const isSameSender = previousMessage && previousMessage.classList.contains(type);

    if (isSameSender) {
      const previousIcon = previousMessage.querySelector(".bubble-icon");
      if (previousIcon) previousIcon.style.display = "none";
    }

    messageElement.innerHTML = `
      <div class="bubble">${content}</div>
      <img src="${imageSrc}" alt="${type}" class="bubble-icon">
    `;

    chatElements.chatMessages.appendChild(messageElement);
    chatElements.chatMessages.scrollTop = chatElements.chatMessages.scrollHeight;
  }

  function reply(message) {
    appendMessage("reply", message);
    updateCurrentConversation(message, "reply");
  }

  function offerRealAgentOption() {
    const optionElement = document.createElement("div");
    optionElement.className = "message reply";
    optionElement.innerHTML = `
      <div class="bubble">
        If you need further assistance, you can <button id="switch-agent" class="switch-agent-button">Chat with a real agent</button>.
      </div>
    `;
    chatElements.chatMessages.appendChild(optionElement);
    chatElements.chatMessages.scrollTop = chatElements.chatMessages.scrollHeight;
    document.getElementById("switch-agent").addEventListener("click", switchToRealAgent);
  }

  function switchToRealAgent() {
    chatMode = "agent";
    updateCurrentConversationStatus("Live Agent");
    resetChatMessages();
    reply("You have been transferred to a real agent. Please start your conversation.");
    chatElements.chatInput.value = "";
    chatElements.chatInput.focus();
    updateConversationList();
    saveConversationHistory();
    updateChatHeaderTitle();
  }

  function resetChatMessages() {
    chatElements.chatMessages.innerHTML = "";
  }

  function resumeConversation(index) {
    currentConversationIndex = index;
    chatMode = conversationHistory[index].status === "OpenAI" ? "openai" : "agent";
    startConversation();
    resetChatMessages();
    conversationHistory[index].messages.forEach((message) =>
      appendMessage(message.type, message.content)
    );
    if (conversationHistory[index].active) {
      chatElements.chatInputContainer.classList.remove("hidden");
      chatElements.chatEndedMessage.classList.add("hidden");
    } else {
      chatElements.chatInputContainer.classList.add("hidden");
      chatElements.chatEndedMessage.classList.remove("hidden");
    }
    chatElements.chatMessages.scrollTop = chatElements.chatMessages.scrollHeight;
  }

  function endCurrentConversation() {
    if (currentConversationIndex !== null) {
      conversationHistory[currentConversationIndex].active = false;
      updateConversationList();
      saveConversationHistory();
      chatElements.chatInputContainer.classList.add("hidden");
      chatElements.chatEndedMessage.classList.remove("hidden");
      resetToLandingPage();
      checkActiveConversations();
    }
  }

  function resetToLandingPage() {
    chatElements.landingPage.classList.remove("hidden");
    chatElements.chatHeader.classList.add("hidden");
    chatElements.chatMessages.classList.add("hidden");
    chatElements.chatInputContainer.classList.add("hidden");
    chatElements.chatEndedMessage.classList.add("hidden");
    chatElements.userFormPage.classList.add("hidden");
    chatElements.editUserPage.classList.add("hidden");
    const emailTranscriptPage = document.getElementById("email-transcript-page");
    emailTranscriptPage.classList.add("hidden");
    chatMode = "openai";
    chatElements.backButton.forEach((button) => {
      button.style.display = "none";
    });
    updateConversationList();
  }

  function updateConversationList() {
    chatElements.conversationList.innerHTML = "";
    if (conversationHistory.length === 0) {
      addNoHistoryMessage();
      removeClearButton();
    } else {
      renderConversationItems();
      addClearButton();
    }
    checkActiveConversations();
  }

  function addNoHistoryMessage() {
    const noHistoryMessage = document.createElement("p");
    noHistoryMessage.className = "no-history-message";
    noHistoryMessage.textContent = "No chat history";
    chatElements.conversationList.appendChild(noHistoryMessage);
  }

  function renderConversationItems() {
    conversationHistory.forEach((conversation, index) => {
      const conversationItem = createConversationItem(conversation, index);
      chatElements.conversationList.appendChild(conversationItem);
    });
    document.querySelectorAll(".btn-active").forEach((button) => {
      button.addEventListener("click", function () {
        const index = parseInt(this.getAttribute("data-index"));
        resumeConversation(index);
      });
    });
  }

  function createConversationItem(conversation, index) {
    const statusColor = conversation.active ? "green" : "red";
    let iconSrc = "";

    if (conversation.status === "OpenAI") {
      iconSrc = "./assets/bot.png";
    } else if (conversation.status === "Live Agent") {
      iconSrc = "./assets/admin.png";
    }

    const conversationItem = document.createElement("div");
    conversationItem.className = "conversation-item";
    conversationItem.innerHTML = `
      <div class="conversation-icon">
        <img src="${iconSrc}" alt="User Icon">
      </div>
      <div class="conversation-content">
        <p class="conversation-status">${conversation.status} - ${conversation.timestamp}</p>
        <p class="status-dot" data-status="${conversation.active ? "active" : "inactive"}">•</p>
      </div>
      <div class="conversation-action">
        <button class="btn-active" data-index="${index}">&gt;</button>
      </div>
    `;
    return conversationItem;
  }

  function updateCurrentConversation(message, type) {
    if (currentConversationIndex !== null) {
      conversationHistory[currentConversationIndex].messages.push({
        type,
        content: message,
      });
      saveConversationHistory();
    }
  }

  function updateCurrentConversationStatus(status) {
    if (currentConversationIndex !== null) {
      conversationHistory[currentConversationIndex].status = status;
    }
  }

  function checkActiveConversations() {
    const activeConversationExists = conversationHistory.some((conversation) => conversation.active);
    toggleNewConversationButton(activeConversationExists);
    toggleClearButton(activeConversationExists);
  }

  function toggleNewConversationButton(isActive) {
    chatElements.newConversationButton.disabled = isActive;
    chatElements.newConversationButton.textContent = isActive ? "Conversation Active" : "New Conversation";
    chatElements.newConversationButton.classList.toggle("disabled", isActive);
  }

  function toggleClearButton(isActive) {
    const clearButton = document.getElementById("clear-conversations");
    if (clearButton) {
      clearButton.disabled = isActive;
      clearButton.classList.toggle("disabled", isActive);
    }
  }

  function saveConversationHistory() {
    localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));
  }

  function loadConversationHistory() {
    const savedHistory = localStorage.getItem("conversationHistory");
    if (savedHistory) {
      conversationHistory = JSON.parse(savedHistory);
    }
  }

  function clearConversationHistory() {
    conversationHistory = [];
    saveConversationHistory();
    updateConversationList();
  }

  function addClearButton() {
    removeClearButton();

    const clearButton = document.createElement("button");
    clearButton.id = "clear-conversations";
    clearButton.className = "btn-clear";
    clearButton.textContent = "Clear History";
    clearButton.addEventListener("click", clearConversationHistory);

    chatElements.conversationList.appendChild(clearButton);
  }

  function removeClearButton() {
    const clearButton = document.getElementById("clear-conversations");
    if (clearButton) {
      clearButton.remove();
    }
  }

  function updateChatHeaderTitle() {
    chatElements.chatHeaderTitle.textContent = chatMode === "openai" ? "OpenAI" : "Live Agent";
  }

  async function fetchFAQSuggestions(query) {
    try {
      const response = await fetch("https://base-api-development.qbit.co.id/faqs");
      const data = await response.json();
      const filteredResults = data.payload.results.filter((item) =>
        item.question.toLowerCase().includes(query)
      );
      displaySearchResults(filteredResults);
    } catch (error) {
      console.error("Error fetching FAQ suggestions:", error);
    }
  }

  function displaySearchResults(results) {
    clearSearchResults();

    if (results.length > 0) {
      results.forEach((result) => {
        const resultItem = document.createElement("div");
        resultItem.classList.add("search-result-item");
        resultItem.textContent = result.question;
        resultItem.addEventListener("click", () => {
          showFAQAnswer(result);
          clearSearchResults();
        });
        searchResultsContainer.appendChild(resultItem);
      });
      searchResultsContainer.style.display = "block";
    } else {
      searchResultsContainer.style.display = "none";
    }
  }

  function showFAQAnswer(faq) {
    chatElements.faqQuestionElement.textContent = faq.question;
    chatElements.faqAnswerElement.textContent = faq.answer;

    chatElements.landingPage.classList.add("hidden");
    chatElements.faqAnswerPage.classList.remove("hidden");
  }

  chatElements.backToSearchButton.addEventListener("click", function () {
    chatElements.faqAnswerPage.classList.add("hidden");
    chatElements.landingPage.classList.remove("hidden");
  });

  function clearSearchResults() {
    searchResultsContainer.innerHTML = "";
    searchResultsContainer.style.display = "none";
  }

  function scrollToLatest() {
    chatElements.chatMessages.scrollTop = chatElements.chatMessages.scrollHeight;
    hideGoToLatestButton();
  }

  function showGoToLatestButton() {
    chatElements.goToLatestButton.classList.remove("hidden");
    chatElements.goToLatestButton.classList.add("visible");
  }

  function hideGoToLatestButton() {
    chatElements.goToLatestButton.classList.remove("visible");
    chatElements.goToLatestButton.classList.add("hidden");
  }

  function showEmailTranscriptPage() {
    chatElements.landingPage.classList.add("hidden");
    chatElements.userFormPage.classList.add("hidden");
    chatElements.chatHeader.classList.add("hidden");
    chatElements.chatMessages.classList.add("hidden");
    chatElements.chatInputContainer.classList.add("hidden");
    chatElements.chatEndedMessage.classList.add("hidden");
    const emailTranscriptPage = document.getElementById("email-transcript-page");
    emailTranscriptPage.classList.remove("hidden");

    const email = localStorage.getItem("userEmail");
    const emailInput = emailTranscriptPage.querySelector('input[type="email"]');
    if (email) {
      emailInput.value = email;
    }
    const transcriptForm = document.getElementById("transcript-form");
    transcriptForm.addEventListener("submit", sendEmailTranscript);
  }

  function sendEmailTranscript(event) {
    event.preventDefault();

    const email = document.querySelector('#email-transcript-page input[type="email"]').value;
    const conversationHistory = JSON.parse(localStorage.getItem("conversationHistory"));

    const selectedIndex = currentConversationIndex;
    const selectedConversation = conversationHistory[selectedIndex];

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
      console.log("Percakapan yang dipilih masih aktif. Email transcript tidak dapat dikirim.");
    } else {
      console.log("Percakapan yang dipilih tidak tersedia atau masih aktif.");
    }

    resetToLandingPage();
  }

  function backToChat() {
    const emailTranscriptPage = document.getElementById("email-transcript-page");
    emailTranscriptPage.classList.add("hidden");

    chatElements.chatHeader.classList.remove("hidden");
    chatElements.chatMessages.classList.remove("hidden");

    if (conversationHistory[currentConversationIndex].active) {
      chatElements.chatInputContainer.classList.remove("hidden");
      chatElements.chatEndedMessage.classList.add("hidden");
    } else {
      chatElements.chatInputContainer.classList.add("hidden");
      chatElements.chatEndedMessage.classList.remove("hidden");
    }
  }

  function showEditProfile() {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    document.getElementById("edit-name").value = name || "";
    document.getElementById("edit-email").value = email || "";
    document.getElementById("edit-phone").value = phone || "";

    chatElements.landingPage.classList.add("hidden");
    chatElements.chatHeader.classList.add("hidden");
    chatElements.chatMessages.classList.add("hidden");
    chatElements.chatInputContainer.classList.add("hidden");
    chatElements.userFormPage.classList.add("hidden");
    chatElements.editUserPage.classList.remove("hidden");
    chatElements.chatEndedMessage.classList.add("hidden");
  }

  function saveProfileEdits(event) {
    event.preventDefault();

    const newName = document.getElementById("edit-name").value;
    const newEmail = document.getElementById("edit-email").value;
    const newPhone = document.getElementById("edit-phone").value;

    localStorage.setItem("userName", newName);
    localStorage.setItem("userEmail", newEmail);
    localStorage.setItem("userPhone", newPhone);

    backToChatFromEdit();
  }

  function backToChatFromEdit() {
    chatElements.editUserPage.classList.add("hidden");
    chatElements.chatHeader.classList.remove("hidden");
    chatElements.chatMessages.classList.remove("hidden");

    if (conversationHistory[currentConversationIndex]?.active) {
      chatElements.chatInputContainer.classList.remove("hidden");
      chatElements.chatEndedMessage.classList.add("hidden");
    } else {
      chatElements.chatInputContainer.classList.add("hidden");
      chatElements.chatEndedMessage.classList.remove("hidden");
    }
  }

  function handleSearchInput() {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length > 0) {
      fetchFAQSuggestions(query);
    } else {
      clearSearchResults();
    }
  }

  function toggleDropdown() {
    const dropdownMenu = document.querySelector(".dropdown-menu");
    dropdownMenu.classList.toggle("hidden");
    this.parentElement.classList.toggle("open");
  }

  function closeDropdownOnClickOutside(e) {
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    if (!dropdownToggle.parentElement.contains(e.target)) {
      const dropdownMenu = document.querySelector(".dropdown-menu");
      dropdownMenu.classList.add("hidden");
      dropdownToggle.parentElement.classList.remove("open");
    }
  }

  function handleChatScroll() {
    const atBottom = chatElements.chatMessages.scrollHeight - chatElements.chatMessages.scrollTop === chatElements.chatMessages.clientHeight;
    if (atBottom) {
      hideGoToLatestButton();
    } else {
      showGoToLatestButton();
    }
  }
};
