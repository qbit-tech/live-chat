document.addEventListener("DOMContentLoaded", function () {
  const chatInput = document.getElementById("chat-input");
  const chatSubmit = document.getElementById("chat-submit");
  const chatMessages = document.getElementById("chat-messages");
  const chatBubble = document.getElementById("chat-bubble");
  const chatPopup = document.getElementById("chat-popup");
  const chatIcon = document.getElementById("chat-icon");
  const landingPage = document.getElementById("landing-page");
  const startConversationButton = document.getElementById("start-conversation");
  const newConversationButton = document.getElementById("new-conversation");
  const chatHeader = document.getElementById("chat-header");
  const chatHeaderTitle = document.getElementById("chat-header-title");
  const chatInputContainer = document.getElementById("chat-input-container");
  const chatEndedMessage = document.getElementById("chat-ended-message");
  const backButton = document.querySelectorAll("#back-to-landing");
  const conversationList = document.querySelector(".conversation-list");
  const userFormPage = document.getElementById("user-form-page");
  const conversationForm = document.getElementById("conversation-form");
  const goToLatestButton = document.getElementById("go-to-latest");
  const emailTranscriptButton = document.getElementById("email-transcript");
  const backToChatButton = document.getElementById("back-to-chat");
  const faqAnswerPage = document.getElementById("faq-answer-page");
  const faqQuestionElement = document.getElementById("faq-question");
  const faqAnswerElement = document.getElementById("faq-answer");
  const backToSearchButton = document.getElementById("back-to-search");

  let chatMode = "openai";
  let conversationHistory = [];
  let currentConversationIndex = null;

  const searchInput = document.querySelector(".search-box input");
  const searchResultsContainer = document.createElement("div");
  searchResultsContainer.classList.add("search-results-container");
  searchInput.parentNode.appendChild(searchResultsContainer);

  init();

  function init() {
    loadConversationHistory();
    addEventListeners();
    updateConversationList();
  }

  function addEventListeners() {
    chatBubble.addEventListener("click", togglePopup);
    startConversationButton.addEventListener("click", startConversation);
    newConversationButton.addEventListener("click", showUserForm);
    backButton.forEach((button) => {
      button.addEventListener("click", resetToLandingPage);
    });
    chatSubmit.addEventListener("click", handleUserSubmit);
    chatInput.addEventListener("keyup", handleKeyUp);
    conversationForm.addEventListener("submit", handleFormSubmit);
    searchInput.addEventListener("input", function () {
      const query = searchInput.value.trim().toLowerCase();
      if (query.length > 0) {
        fetchFAQSuggestions(query);
      } else {
        clearSearchResults();
      }
    });

    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const dropdownMenu = document.querySelector(".dropdown-menu");

    dropdownToggle.addEventListener("click", function () {
      dropdownMenu.classList.toggle("hidden");
      dropdownToggle.parentElement.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (!dropdownToggle.parentElement.contains(e.target)) {
        dropdownMenu.classList.add("hidden");
        dropdownToggle.parentElement.classList.remove("open");
      }
    });

    const endConversationButton = document.getElementById("end-conversation");
    endConversationButton.addEventListener("click", endCurrentConversation);

    chatMessages.addEventListener("scroll", function () {
      const atBottom = chatMessages.scrollHeight - chatMessages.scrollTop === chatMessages.clientHeight;

      if (atBottom) {
        hideGoToLatestButton();
      } else {
        showGoToLatestButton();
      }
    });

    goToLatestButton.addEventListener("click", scrollToLatest);

    emailTranscriptButton.addEventListener("click", showEmailTranscriptPage);

    if (backToChatButton) {
      backToChatButton.addEventListener("click", backToChat);
    }
  }

  function togglePopup() {
    if (chatPopup.classList.contains("visible")) {
      closeChatPopup();
    } else {
      openChatPopup();
    }
  }

  function openChatPopup() {
    chatPopup.classList.remove("hidden");
    chatPopup.classList.add("visible");
    chatIcon.style.transform = "rotate(180deg)";
    chatIcon.src = "./assets/delete.svg";
    chatInput.focus();
  }

  function closeChatPopup() {
    chatIcon.style.transform = "rotate(0)";
    chatIcon.src = "./assets/customer-service.svg";
    chatPopup.classList.add("closing");
    chatPopup.addEventListener("animationend", onPopupCloseAnimationEnd, {
      once: true,
    });
  }

  function onPopupCloseAnimationEnd() {
    if (chatPopup.classList.contains("closing")) {
      chatPopup.classList.remove("visible", "closing");
      chatPopup.classList.add("hidden");
      resetToLandingPage();
    }
  }

  function startConversation() {
    landingPage.classList.add("hidden");
    userFormPage.classList.add("hidden");
    chatHeader.classList.remove("hidden");
    chatMessages.classList.remove("hidden");
    chatInputContainer.classList.remove("hidden");
    chatEndedMessage.classList.add("hidden");
    backButton.forEach((button) => {
      button.style.display = "inline-block";
    });
    updateChatHeaderTitle();
  }

  function showUserForm() {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    if (name && email && phone) {
      startNewConversation();
    } else {
      landingPage.classList.add("hidden");
      userFormPage.classList.remove("hidden");
      chatHeader.classList.add("hidden");
      chatMessages.classList.add("hidden");
      chatInputContainer.classList.add("hidden");
      backButton.forEach((button) => {
        button.style.display = "inline-block";
      });
      loadFormValues();
    }
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    console.log("User Info Submitted:", { name, email, phone });

    saveFormValues(name, email, phone);
    startNewConversation();
  }

  function saveFormValues(name, email, phone) {
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", phone);
  }

  function loadFormValues() {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    if (name) {
      document.getElementById("name").value = name;
    }
    if (email) {
      document.getElementById("email").value = email;
    }
    if (phone) {
      document.getElementById("phone").value = phone;
    }
  }

  function startNewConversation() {
    chatMessages.innerHTML = "";
    startConversation();
    const timestamp = new Date().toLocaleString();
    conversationHistory.push({
      status: "OpenAI",
      preview: "New conversation started...",
      timestamp,
      active: true,
      messages: [],
    });
    currentConversationIndex = conversationHistory.length - 1;
    reply("Hello! How can I assist you today?");
    updateConversationList();
    saveConversationHistory();
    checkActiveConversations();
  }

  function handleUserSubmit() {
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = "";
    onUserRequest(message);
  }

  function handleKeyUp(event) {
    if (event.key === "Enter") {
      chatSubmit.click();
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

    const previousMessage = chatMessages.lastElementChild;
    const isSameSender = previousMessage && previousMessage.classList.contains(type);

    if (isSameSender) {
      const previousIcon = previousMessage.querySelector(".bubble-icon");
      if (previousIcon) previousIcon.style.display = "none";
    }

    messageElement.innerHTML = `
      <div class="bubble">${content}</div>
      <img src="${imageSrc}" alt="${type}" class="bubble-icon">`;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
      </div>`;
    chatMessages.appendChild(optionElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    document
      .getElementById("switch-agent")
      .addEventListener("click", switchToRealAgent);
  }

  function switchToRealAgent() {
    chatMode = "agent";
    updateCurrentConversationStatus("Live Agent");
    resetChatMessages();
    reply("You have been transferred to a real agent. Please start your conversation.");
    chatInput.value = "";
    chatInput.focus();
    updateConversationList();
    saveConversationHistory();
    updateChatHeaderTitle();
  }

  function resetChatMessages() {
    chatMessages.innerHTML = "";
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
      chatInputContainer.classList.remove("hidden");
      chatEndedMessage.classList.add("hidden");
    } else {
      chatInputContainer.classList.add("hidden");
      chatEndedMessage.classList.remove("hidden");
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function endCurrentConversation() {
    if (currentConversationIndex !== null) {
      conversationHistory[currentConversationIndex].active = false;
      updateConversationList();
      saveConversationHistory();
      chatInputContainer.classList.add("hidden");
      chatEndedMessage.classList.remove("hidden");
      resetToLandingPage();
      checkActiveConversations();
    }
  }

  function resetToLandingPage() {
    landingPage.classList.remove("hidden");
    chatHeader.classList.add("hidden");
    chatMessages.classList.add("hidden");
    chatInputContainer.classList.add("hidden");
    chatEndedMessage.classList.add("hidden");
    userFormPage.classList.add("hidden");
    const emailTranscriptPage = document.getElementById("email-transcript-page");
    emailTranscriptPage.classList.add("hidden");
    chatMode = "openai";
    backButton.forEach((button) => {
      button.style.display = "none";
    });
    updateConversationList();
  }

  function updateConversationList() {
    conversationList.innerHTML = "";
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
    conversationList.appendChild(noHistoryMessage);
  }

  function renderConversationItems() {
    conversationHistory.forEach((conversation, index) => {
      const conversationItem = createConversationItem(conversation, index);
      conversationList.appendChild(conversationItem);
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
        <p class="status-dot" data-status="${conversation.active ? 'active' : 'inactive'}">•</p>
      </div>
      <div class="conversation-action">
        <button class="btn-active" data-index="${index}">&gt;</button>
      </div>`;
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
    const activeConversationExists = conversationHistory.some(
      (conversation) => conversation.active
    );
    toggleNewConversationButton(activeConversationExists);
    toggleClearButton(activeConversationExists);
  }

  function toggleNewConversationButton(isActive) {
    newConversationButton.disabled = isActive;
    newConversationButton.textContent = isActive
      ? "Conversation Active"
      : "New Conversation";
    newConversationButton.classList.toggle("disabled", isActive);
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

    conversationList.appendChild(clearButton);
  }

  function removeClearButton() {
    const clearButton = document.getElementById("clear-conversations");
    if (clearButton) {
      clearButton.remove();
    }
  }

  function updateChatHeaderTitle() {
    chatHeaderTitle.textContent = chatMode === "openai" ? "OpenAI" : "Live Agent";
  }

  async function fetchFAQSuggestions(query) {
    try {
      const response = await fetch(`https://base-api-development.qbit.co.id/faqs`);
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
    faqQuestionElement.textContent = faq.question;
    faqAnswerElement.textContent = faq.answer;

    landingPage.classList.add("hidden");
    faqAnswerPage.classList.remove("hidden");
  }

  backToSearchButton.addEventListener("click", function () {
    faqAnswerPage.classList.add("hidden");
    landingPage.classList.remove("hidden");
  });

  function clearSearchResults() {
    searchResultsContainer.innerHTML = "";
    searchResultsContainer.style.display = "none";
  }

  function scrollToLatest() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    hideGoToLatestButton();
  }

  function showGoToLatestButton() {
    goToLatestButton.classList.remove("hidden");
    goToLatestButton.classList.add("visible");
  }

  function hideGoToLatestButton() {
    goToLatestButton.classList.remove("visible");
    goToLatestButton.classList.add("hidden");
  }

  function showEmailTranscriptPage() {
    landingPage.classList.add("hidden");
    userFormPage.classList.add("hidden");
    chatHeader.classList.add("hidden");
    chatMessages.classList.add("hidden");
    chatInputContainer.classList.add("hidden");
    chatEndedMessage.classList.add("hidden");
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
      selectedConversation.messages.forEach(message => {
        chatContent += `${message.type === 'user' ? 'User' : (selectedConversation.status === 'OpenAI' ? 'Bot' : 'Real Agent')}: ${message.content}\n`;
      });
  
      console.log(`Email tujuan: ${email}`);
      console.log(`Isi chat:\n${chatContent}`);
    } else if (selectedConversation && selectedConversation.active) {
      console.log('Percakapan yang dipilih masih aktif. Email transcript tidak dapat dikirim.');
    } else {
      console.log('Percakapan yang dipilih tidak tersedia atau masih aktif.');
    }
  
    resetToLandingPage();
  }
  
  function backToChat() {
    const emailTranscriptPage = document.getElementById("email-transcript-page");

    emailTranscriptPage.classList.add("hidden");

    chatHeader.classList.remove("hidden");
    chatMessages.classList.remove("hidden");
    
    if (conversationHistory[currentConversationIndex].active) {
      chatInputContainer.classList.remove("hidden");
      chatEndedMessage.classList.add("hidden");
    } else {
      chatInputContainer.classList.add("hidden");
      chatEndedMessage.classList.remove("hidden");
    }
  }

});
