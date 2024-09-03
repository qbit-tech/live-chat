class QLiveChatWidget {
  constructor(config) {
    this.config = config;
    this.chatMode = "openai";
    this.conversationHistory = [];
    this.currentConversationIndex = null;
    this.isRequestPending = false;
    this.hasOfferedRealAgent = false;
    this.isNewConversation = true;
  }

  async init() {
    try {
      const widgetConfig = await this.fetchWidgetConfig(this.config.widgetId);
      this.config = { ...this.config, settings: widgetConfig };
      
      console.log("Final Widget Config:", this.config);
      
      if (!this.config.settings.botId || !this.config.settings.faqEndpoint || !this.config.settings.chatEndpoint) {
        throw new Error("Missing essential widget settings.");
      }
  
      // Lanjutkan dengan inisialisasi widget
      this.injectCSS();
      this.setupWidget();
      this.loadConversationHistory();
      this.addEventListeners();
      this.checkActiveConversations();
    } catch (error) {
      console.error("Failed to initialize the widget:", error);
    }
  }
  

  async fetchWidgetConfig(widgetId) {
    const response = await fetch(`${this.config.endpointWidget}/${widgetId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch widget configuration: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Fetched Widget Config:", data);
  
    const settings = {
      ...data.payload.settings,
      botId: data.payload.defaultBotId, // Gunakan defaultBotId sebagai botId
    };
  
    // Debug log untuk memastikan URL endpoint valid
    console.log("FAQ Endpoint:", settings.faqEndpoint);
    console.log("Chat Endpoint:", settings.chatEndpoint);
    console.log("Bot ID:", settings.botId);
  
    return settings;
  }
  
  injectCSS() {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400&display=swap');
      
      :root {
        --color-background: #fef3c7;
        --color-primary: #10b981;
        --color-primary-dark: #0e9a73;
        --color-primary-darker: #0c8765;
        --color-secondary: #ffffff;
        --color-secondary-dark: #e9e9e9;
        --color-tertiary: #e5e7eb;
        --color-text-primary: #000000;
        --color-text-secondary: #888;
        --color-hover: #c4c4c4;
        --color-danger: #e53e3e;
        --color-danger-dark: #c53030;
        --color-clear: #ff7043;
        --color-clear-hover: #ff5722;
        --color-clear-active: #e64a19;
        --color-icon: #ffffff;
        --font-primary: 'Poppins', sans-serif;
      }

      .container, .title, .chat-popup, .message, .bubble, .chat-header, .landing-header {
        font-family: var(--font-primary);
      }

      .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        justify-content: center;
        height: 100vh;
        text-align: center;
        overflow-y: auto;
      }

      .title {
        font-size: 2rem;
        font-weight: bold;
        line-height: 1.5;
      }

      .chat-bubble {
        width: 4rem;
        height: 4rem;
        background-color: var(--color-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      }

      .chat-popup {
        position: fixed;
        bottom: 100px;
        right: 1rem;
        width: 24rem;
        background-color: var(--color-secondary);
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease, opacity 0.3s ease;
        transform: translate(50%, 50%) scale(0.5);
        opacity: 0;
        height: 70vh;
        z-index: 999;
      }

      .chat-popup.visible {
        animation: slideZoomInDiagonal 0.3s forwards ease-in-out;
      }

      .chat-popup.closing {
        animation: slideZoomOutDiagonal 0.3s forwards ease-in-out;
      }

      #faq-question {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 20ch;
      }

      .faq-answer-page {
        display: flex;
        flex-direction: column;
        max-height: 100%;
      }

      @keyframes slideZoomInDiagonal {
        0% {
          transform: translate(50%, 50%) scale(0.5);
          opacity: 0;
        }
        100% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
      }

      @keyframes slideZoomOutDiagonal {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(50%, 50%) scale(0.5);
          opacity: 0;
        }
      }

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        height: 2.5rem;
        background-color: var(--color-primary);
        color: var(--color-icon);
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2), 0px 1px 3px rgba(0, 0, 0, 0.09);
        z-index: 999;
      }

      .chat-header h3 {
        margin: 0;
        font-size: 1.125rem;
        text-align: center;
      }

      .back-button {
        background-color: transparent;
        border: none;
        color: var(--color-icon);
        cursor: pointer;
      }

      #chat-icon {
        transition: transform 0.3s, opacity 0.3s;
        width: 40px;
        height: 40px;
      }

      .chat-messages {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
      }

      .chat-input-container {
        padding: 1rem;
        border-top: 1px solid var(--color-tertiary);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chat-input {
        flex: 1;
        border: 1px solid var(--color-tertiary);
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        outline: none;
        width: 75%;
      }

      .chat-submit {
        background-color: var(--color-primary);
        color: var(--color-icon);
        border-radius: 0.375rem;
        padding: 0.5rem 1rem;
        cursor: pointer;
        border: transparent;
      }

      .text-center {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 0.75rem;
        padding-top: 1rem;
      }

      .text-center a {
        color: #6366f1;
      }

      .message {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.75rem;
      }

      .message.user {
        align-items: flex-end;
        margin-bottom: 0;
      }

      .message.reply {
        align-items: flex-start;
        margin-bottom: 0;
      }

      .bubble {
        background-color: var(--color-primary);
        color: var(--color-icon);
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        margin-top: 0.5rem;
        max-width: 70%;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.08);
      }

      .message.reply .bubble {
        background-color: var(--color-tertiary);
        color: var(--color-text-primary);
      }

      .bubble-icon {
        width: 30px;
        height: 30px;
        margin-top: 5px;
      }

      .message.user .bubble-icon {
        align-self: end;
        display: block;
      }

      .message.reply .bubble-icon {
        align-self: start;
        display: block;
      }

      #chat-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        z-index: 99999;
      }

      .landing-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        background-color: var(--color-secondary-dark);
        border-radius: 1rem;
      }

      .landing-header {
        background-color: var(--color-primary);
        height: 12.5rem;
        width: 100%;
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;
      
      }

      .landing-header h2 {
        text-align: start;
        padding-inline: 2rem;
        font-size: 45px;
        color: var(--color-icon);
        margin-bottom: 0.1rem;
      }

      .landing-header p {
        text-align: start;
        font-size: 15px;
        margin-bottom: 2.25rem;
        margin-top: 0;
        padding-inline: 2rem;
        color: var(--color-icon);
      }

      .conversation-list {
        width: 90%;
        margin-bottom: 1rem;
        overflow-y: auto;
        overflow-x: hidden;
        background-color: var(--color-secondary);
        border-radius: 0.5rem;
        height: 100%;
        position: relative;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.08);
      }

      .no-history-message {
        font-size: 1rem;
        color: var(--color-text-secondary);
        text-align: center;
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .conversation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--color-secondary);
        padding: 0.75rem;
        border: 1px solid var(--color-tertiary);
        box-shadow: none;
        transition: transform 0.3s ease, background-color 0.3s ease,
          box-shadow 0.3s ease;
        cursor: pointer;
      }

      .conversation-item:hover {
        background-color: var(--color-secondary-dark);
        transform: scale(1.02);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .conversation-item:active {
        transform: scale(0.98);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
      }

      .conversation-icon img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 0.9;
      }

      .conversation-item:hover .conversation-icon img {
        transform: scale(1.05);
        opacity: 1;
      }

      .conversation-content {
        flex: 1;
        margin-left: 1rem;
        text-align: left;
        overflow: hidden;
      }

      .relative-time {
        font-size: 0.7rem;
        color: var(--color-text-secondary);
        padding-bottom: 2px;
      }

      .conversation-status {
        font-size: 0.875rem;
        color: var(--color-text-primary);
        margin-bottom: 0.25rem;
        margin-top: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .status {
        display: flex;
        align-items: center;
        font-size: 0.8rem;
        color: var(--color-text-secondary);
        margin: 0;
      }

      .status p {
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 20vh;
      }

      .status-dot {
        font-size: 1rem;
        margin: 0;
        font-weight: lighter;
        font-size: 13px;
      }

      .status-dot[data-status="active"] {
        color: green;
      }

      .status-dot[data-status="inactive"] {
        color: red;
      }

      .conversation-action {
        display: flex;
        flex-direction: column;
        align-items: end;
      }

      .conversation-action .btn-active {
        background-color: transparent;
        border: none;
        padding: 0;
        padding-top: 0;
        padding-right: 0.75rem;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
        opacity: 0.8;
      }

      .conversation-action .btn-active img {
        width: 35px;
        height: 35px;
        transition: transform 0.3s ease;
      }

      .conversation-item:hover .btn-active img {
        transform: translateX(3px);
      }

      .conversation-action .btn-active:active {
        transform: scale(0.95);
      }

      @keyframes fadeIn {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .conversation-item {
        animation: fadeIn 0.4s ease-in-out;
      }

      .search-box {
        display: flex;
        margin: 1rem;
        margin-top: -5%;
        width: 90%;
        height: 10%;
        box-shadow: -5px -5px 10px rgba(0, 0, 0, 0.1), 5px 5px 10px rgba(0, 0, 0, 0.1),
          0px 0px 15px rgba(0, 0, 0, 0.2);
        transition: box-shadow 0.3s ease;
        border-radius: 0.375rem;
      }

      .search-box:hover {
        box-shadow: -7px -7px 15px rgba(0, 0, 0, 0.15),
          7px 7px 15px rgba(0, 0, 0, 0.15), 0px 0px 20px rgba(0, 0, 0, 0.25);
      }

      .search-box input {
        flex: 1;
        padding: 0.5rem;
        border-radius: 0.375rem 0 0 0.375rem;
        border: 1px solid transparent;
      }

      .search-button {
        background-color: var(--color-primary);
        padding: 0.5rem;
        border: none;
        border-radius: 0 0.375rem 0.375rem 0;
        color: var(--color-icon);
        cursor: pointer;
      }

      .new-conversation {
        width: 90%;
        z-index: 99;
        // margin-bottom: 1rem;
      }

      .new-conversation button {
        background-color: var(--color-primary);
        padding: 0.75rem;
        width: 100%;
        height: 100%;
        border-radius: 0.375rem;
        color: var(--color-icon);
        border: none;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.08);
      }

      .new-conversation button:hover:not(.disabled) {
        background-color: var(--color-primary-dark);
      }

      .new-conversation button:active:not(.disabled) {
        transform: translateY(1px);
        background-color: var(--color-primary-darker);
      }

      .new-conversation button.disabled {
        background-color: var(--color-hover);
        cursor: not-allowed;
        transform: none;
      }

      .hidden {
        display: none;
      }

      .chat-ended-message {
        text-align: center;
        font-size: 1rem;
        color: var(--color-text-secondary);
        background-color: #f5f5f5;
        border-top: 1px solid var(--color-tertiary);
      }

      .btn-clear {
        background-color: var(--color-clear);
        color: var(--color-icon);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
        transition: background-color 0.3s ease, transform 0.2s ease;
        display: block;
        width: 40%;
        text-align: center;
        margin-left: auto;
        margin-right: auto;
      }

      .btn-clear:hover:not(.disabled) {
        background-color: var(--color-clear-hover);
        transform: translateY(-3px);
      }

      .btn-clear:active:not(.disabled) {
        transform: translateY(1px);
        background-color: var(--color-clear-active);
      }

      .btn-clear.disabled {
        background-color: var(--color-hover);
        cursor: not-allowed;
        transform: none;
      }

      .search-results-container {
        position: absolute;
        background-color: var(--color-secondary);
        box-shadow: -4px 4px 8px rgba(0, 0, 0, 0.1), 4px 4px 8px rgba(0, 0, 0, 0.1),
          0px 8px 12px rgba(0, 0, 0, 0.15);
        border-radius: 0.375rem;
        margin-top: 3rem;
        max-height: 15rem;
        overflow-y: auto;
        width: 75%;
        z-index: 1000;
        display: none;
      }

      .search-result-item {
        padding: 0.75rem;
        font-size: small;
        cursor: pointer;
        border-bottom: 1px solid var(--color-text-secondary);
        text-align: start;
      }

      .search-result-item:hover {
        background-color: var(--color-hover);
      }

      .faq-answer {
        padding: 1rem;
        background-color: var(--color-secondary);
        border-radius: 0.5rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05),
          0 -4px 8px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(0, 0, 0, 0.05),
          4px 0 8px rgba(0, 0, 0, 0.1), 2px 0 4px rgba(0, 0, 0, 0.05),
          -4px 0 8px rgba(0, 0, 0, 0.1), -2px 0 4px rgba(0, 0, 0, 0.05);
        max-width: 100%;
        overflow: hidden;
        position: relative;
        z-index: 1;
      }

      .faq-answer::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
        pointer-events: none;
      }

      .faq-answer h3 {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
        color: var(--color-text-primary);
      }

      .faq-answer p {
        font-size: 1rem;
        line-height: 1.5;
        color: var(--color-text-secondary);
        margin-bottom: 1rem;
      }

      .back-to-search {
        background-color: var(--color-primary);
        color: var(--color-icon);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      .back-to-search:hover {
        background-color: var(--color-primary-dark);
      }

      .user-form {
        display: flex;
        width: 100%;
        height: 100%;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .user-form label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.5rem;
        margin-top: 1rem;
      }

      .user-form input {
        padding: 0.5rem;
        width: 19rem;
        border-radius: 0.375rem;
        border: 1px solid var(--color-tertiary);
      }

      .btn-start-chat,
      .btn-edit {
        background-color: var(--color-primary);
        width: 20rem;
        color: var(--color-icon);
        border: none;
        margin: 1rem auto;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        align-self: center;
        transition: background-color 0.3s ease, transform 0.2s ease;
        display: block;
        text-align: center;
      }

      .btn-start-chat:hover {
        background-color: var(--color-primary-dark);
      }

      .btn-start-chat:active {
        transform: translateY(1px);
        background-color: var(--color-primary-darker);
      }

      .btn-edit {
        background-color: var(--color-clear);
      }

      .btn-edit:hover {
        background-color: var(--color-clear-hover);
      }

      .btn-edit:active {
        transform: translateY(1px);
        background-color: var(--color-clear-active);
      }

      .dropdown {
        position: relative;
        display: inline-block;
      }

      .dropdown-toggle {
        background-color: transparent;
        border: none;
        color: var(--color-icon);
        cursor: pointer;
        padding: 0.5rem;
        transition: background-color 0.3s ease;
      }

      .dropdown-menu {
        opacity: 0;
        visibility: hidden;
        transform-origin: top center;
        transform: perspective(400px) rotateX(-90deg);
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--color-secondary);
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
        border-radius: 0.375rem;
        z-index: 1000;
        min-width: 200px;
        padding: 0.5rem 0;
        transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
      }

      .dropdown.open .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: perspective(400px) rotateX(0deg);
      }

      .dropdown-menu::before {
        content: "";
        position: absolute;
        top: -6px;
        right: 10px;
        width: 0;
        height: 0;
        border-width: 0 6px 6px 6px;
        border-style: solid;
        border-color: transparent transparent var(--color-secondary) transparent;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .dropdown-item {
        padding: 0.75rem 1rem;
        width: 100%;
        text-align: left;
        background-color: transparent;
        color: var(--color-text-primary);
        border: none;
        cursor: pointer;
        font-size: 1rem;
        transform-origin: top center;
        opacity: 0;
        transform: perspective(400px) rotateX(-90deg);
        background-color: var(--color-secondary);
        transition: all 100ms;
      }

      .dropdown-item:hover {
        background-color: var(--color-hover);
        color: var(--color-icon);
      }

      @keyframes rotateX {
        0% {
          opacity: 0;
          transform: perspective(400px) rotateX(-90deg);
        }
        50% {
          transform: perspective(400px) rotateX(-20deg);
        }
        100% {
          opacity: 1;
          transform: perspective(400px) rotateX(0deg);
        }
      }

      .dropdown.open .dropdown-item-1 {
        animation: rotateX 300ms 0ms ease-in-out forwards;
      }

      .dropdown.open .dropdown-item-2 {
        animation: rotateX 300ms 50ms ease-in-out forwards;
      }

      .dropdown.open .dropdown-item-3 {
        animation: rotateX 300ms 150ms ease-in-out forwards;
      }

      .go-to-latest {
        position: fixed;
        bottom: 4.5rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(136, 136, 136, 0.5);
        color: var(--color-icon);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        z-index: 1001;
        transition: opacity 0.3s ease, transform 0.3s ease;
        border: solid transparent;
      }

      .go-to-latest.hidden {
        opacity: 0;
        transform: translate(-50%, 20px);
        pointer-events: none;
      }

      .go-to-latest.visible {
        opacity: 1;
        transform: translate(-50%, 0);
      }

      #user-form-page .chat-messages,
      #edit-user-page .chat-messages {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow-x: hidden;
      }

      #message-confirmation {
        display: flex;
      }

      .user-form textarea,
      #message-confirmation {
        padding: 0.5rem;
        width: 19rem;
        border-radius: 0.375rem;
        border: 1px solid var(--color-tertiary);
        resize: none;
        height: 5rem;
      }

      .user-edit {
        display: flex;
        width: 100%;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 1rem 1rem;
      }

      .user-edit div {
        margin-bottom: 1rem;
      }

      .user-edit label {
        display: block;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .user-edit input {
        padding: 0.5rem;
        width: 19rem;
        border-radius: 0.375rem;
        border: 1px solid var(--color-tertiary);
      }

      .edit-user {
        background-color: var(--color-primary);
        width: 20rem;
        color: var(--color-icon);
        border: none;
        margin: 1rem auto;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        align-self: center;
        transition: background-color 0.3s ease, transform 0.2s ease;
        display: block;
        text-align: center;
      }

      .edit-user:hover {
        background-color: var(--color-primary-dark);
      }

      .edit-user:active {
        transform: translateY(1px);
        background-color: var(--color-primary-darker);
      }

      #email-transcript-page .chat-messages {
        display: flex;
        justify-items: center;
        align-items: center;
        height: 100%;
        overflow-x: hidden;
        padding: 1rem;
      }

      #chat-bubble.hidden {
        display: none;
      }
      .chat-bubble img,
      .back-button img {
        width: 40px;
        height: 40px;
      }

      .back-button img {
        width: 20px;
        height: 20px;
      }

      .chat-header .dropdown-toggle img {
        width: 25px;
        height: 25px;
      }

      .conversation-icon img {
        width: 40px;
        height: 40px;
      }

      .conversation-action img {
        width: 20px;
        height: 20px;
      }

      .switch-agent-button {
        padding: 8px 16px;
        background-color: var(--color-primary-dark);
        color: var(--color-icon);
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        margin-top: 10px;
      }

      .switch-agent-button:hover {
        background-color: var(--color-primary-darker);
      }

      .landing-header .back-button {
        padding-top: 10px;
      }

      .chat-version {
        text-align: center;
        font-size: 0.75rem;
        color: var(--color-text-secondary);
        padding: 0.5rem;
        background-color: var(--color-tertiary);
        border-top: 1px solid var(--color-tertiary);
        border-bottom-left-radius: 1rem;
        border-bottom-right-radius: 1rem;
        position: relative;
      }

      .loader {
        width: 20px;
        aspect-ratio: 1;
        --_g: no-repeat radial-gradient(circle closest-side, var(--color-text-secondary) 90%, #0000);
        background: 
          var(--_g) 0%   50%,
          var(--_g) 50%  50%,
          var(--_g) 100% 50%;
        background-size: calc(100%/3) 50%;
        animation: l3 1s infinite linear;
      }

      @keyframes l3 {
        20%{background-position:0%   0%, 50%  50%,100%  50%}
        40%{background-position:0% 100%, 50%   0%,100%  50%}
        60%{background-position:0%  50%, 50% 100%,100%   0%}
        80%{background-position:0%  50%, 50%  50%,100% 100%}
      }

      .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--color-secondary);
        padding: 1.5rem;
        width: 75%;
        border-radius: 0.5rem;
        box-shadow: -5px -5px 10px rgba(0, 0, 0, 0.1), 5px 5px 10px rgba(0, 0, 0, 0.1),
          0px 0px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
      }

      .modal-content {
          text-align: center;
      }

      .modal h3 {
          margin-bottom: 1rem;
      }

      .modal p {
          margin-bottom: 1.5rem;
      }

      .modal-btn-yes, .modal-btn-no {
          color: var(--color-icon);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          margin: 0 0.5rem;
      }

      .modal-btn-yes{
        background-color: var(--color-danger);
      }

      .modal-btn-yes:hover {
          background-color: var(--color-danger-dark);
      }

      .modal-btn-no{
        background-color: var(--color-primary);
      }

      .modal-btn-no:hover {
          background-color: var(--color-primary-dark);
      }

      @media (max-width: 768px) {
        .chat-popup {
          width: 100%;
          height: 100dvh;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }

        .chat-header {
          border-radius: 0;
        }

        .chat-input-container {
          border-radius: 0;
        }

        .landing-header {
          height: 12rem;
          border-radius: 0px;
        }

        .landing-header h2 {
          font-size: 2rem;
          margin-top: 0.5rem;
        }

        .landing-header p {
          font-size: 1rem;
        }

        .search-box {
          margin-top: -1.5rem;
          height: 3rem;
        }

        .conversation-list {
          height: 65vh;
        }
      }
    `;
    document.head.appendChild(styleElement);
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
        <img id="chat-icon" src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/customer-service.svg" alt="Chat Bubble" width="40" height="40" />
      </div>
      <div id="chat-popup" class="chat-popup hidden">
        ${this.getLandingPageHTML()}
        ${this.getFAQAnswerPageHTML()}
        ${this.getUserFormPageHTML()}
        ${this.getChatHeaderHTML()}
        ${this.getChatMessagesHTML()}
        ${this.getEditUserPageHTML()}
        ${this.getEmailTranscriptPageHTML()}
        ${this.getEndConversationModalHTML()}
      </div>
    `;
  }

  getLandingPageHTML() {
    return `
      <div id="landing-page" class="landing-page">
        <div class="landing-header">
          <div id="close-chat-popup" class="back-button">
            <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/close.svg" alt="Close" width="20" height="20" />
            </div>
            <h2>Hi there <span role="img" aria-label="wave">👋</span></h2>
            <p>Need help? Search our help center for answers or start a conversation:</p>
        </div>
        <div class="search-box">
          <input type="text" placeholder="Search from Faqs" />
          <button class="search-button">Search</button>
          <div class="search-results-container"></div>
        </div>
        <div class="conversation-list"></div>
        <div class="new-conversation">
          <button id="new-conversation">New Conversation</button>
        </div>
        <div id="chat-version" class="chat-version">Live Chat Widget v0.0.1</div>
      </div>
    `;
  }

  getFAQAnswerPageHTML() {
    return `
      <div id="faq-answer-page" class="faq-answer-page hidden">
        <div class="chat-header">
          <button id="back-to-search" class="back-button">
            <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/arrow.svg" alt="Back" width="20" height="20" />
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
            <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/arrow.svg" alt="Back" width="20" height="20" />
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
          <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/arrow.svg" alt="Back" width="20" height="20" />
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
          <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/more.svg" alt="More" width="25" height="25" />
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
            <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/arrow.svg" alt="Back" width="20" height="20" />
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
            <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/arrow.svg" alt="Back" width="20" height="20" />
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

  getEndConversationModalHTML() {
    return `
        <div id="end-conversation-modal" class="modal hidden">
            <div class="modal-content">
                <h3>End Conversation</h3>
                <p>Are you sure you want to end this conversation?</p>
                <button id="confirm-end-conversation" class="modal-btn-yes">Yes</button>
                <button id="cancel-end-conversation" class="modal-btn-no">No</button>
            </div>
        </div>
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
      confirmEndConversationButton: document.getElementById(
        "confirm-end-conversation"
      ),
      cancelEndConversationButton: document.getElementById(
        "cancel-end-conversation"
      ),
      endConversationModal: document.getElementById("end-conversation-modal"),
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
      this.showEndConversationModal.bind(this)
    );

    this.chatElements.confirmEndConversationButton.addEventListener(
      "click",
      this.endCurrentConversation.bind(this)
    );

    this.chatElements.cancelEndConversationButton.addEventListener(
      "click",
      this.hideEndConversationModal.bind(this)
    );
  }

  showEndConversationModal() {
    const modal = this.chatElements.endConversationModal;
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  hideEndConversationModal() {
    const modal = this.chatElements.endConversationModal;
    if (modal) {
      modal.classList.add("hidden");
    }
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
    this.chatElements.chatIcon.src =
      "https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/delete.svg";
    this.chatElements.chatInput.focus();
    if (window.innerWidth <= 768) {
      this.chatElements.chatBubble.classList.add("hidden");
    }
  }

  closeChatPopup() {
    this.chatElements.chatIcon.style.transform = "rotate(0)";
    this.chatElements.chatIcon.src =
      "https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/customer-service.svg";
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
    const name = localStorage.getItem("userName") || "";
    const email = localStorage.getItem("userEmail") || "";
    const phone = localStorage.getItem("userPhone") || "";
    const message = document
      .getElementById("message-confirmation")
      .value.trim();

    if (!message) {
      console.error("Message is missing.");
      return;
    }

    if (!name || !email || !phone) {
      console.error("Profile data is missing.");
      return;
    }

    this.startNewConversation(name, email, phone, message);
  }

  handleFormSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();

    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", phone);

    this.startNewConversation(name, email, phone, message);
  }

  saveFormValues(name, email, phone) {
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPhone", phone);
  }

  startNewConversation(name, email, phone, initialMessage) {
    if (this.isRequestPending) {
      console.warn("A request is already in progress. Please wait.");
      return;
    }

    this.isRequestPending = true;

    this.hasOfferedRealAgent = false;
    this.isNewConversation = true;

    const requestBody = {
      profile: { name, email, phone },
      botId: this.config.settings.botId,
      message: initialMessage,
    };

    console.log("Request Body:", requestBody);

    fetch(`${this.config.settings.chatEndpoint}start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response Data:", data);
        if (data.payload && data.payload.roomId) {
          this.currentRoomId = data.payload.roomId;
          console.log("Room ID:", this.currentRoomId);

          this.resetChatMessages();

          localStorage.setItem("userName", name);
          localStorage.setItem("userEmail", email);
          localStorage.setItem("userPhone", phone);

          const timestamp = new Date().toISOString();
          this.conversationHistory.push({
            status: "OpenAI",
            preview: "New conversation started...",
            timestamp,
            active: true,
            messages: [],
            roomId: data.payload.roomId,
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
        } else {
          console.error(
            "Failed to start conversation: Invalid payload or roomId missing",
            data
          );
        }
      })
      .catch((error) => console.error("Error starting conversation:", error))
      .finally(() => {
        this.isRequestPending = false;
      });
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
    if (this.isNewConversation) {
      this.hasOfferedRealAgent = false;
      this.isNewConversation = false;
    }

    const messageTimestamp = new Date().toISOString();
    this.appendMessage("user", message, messageTimestamp);
    this.updateCurrentConversation(message, "user", messageTimestamp);

    const loaderElement = document.createElement("div");
    loaderElement.className = "loader";

    const lastBotMessage = document.createElement("div");
    lastBotMessage.className = "message reply";
    lastBotMessage.innerHTML = `
      <div class="bubble"></div>
      <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/bot.png" alt="bot" class="bubble-icon" width="30" height="30">
    `;
    const bubbleElement = lastBotMessage.querySelector(".bubble");
    bubbleElement.appendChild(loaderElement);
    this.chatElements.chatMessages.appendChild(lastBotMessage);
    this.chatElements.chatMessages.scrollTop =
      this.chatElements.chatMessages.scrollHeight;

    if (this.chatMode === "openai") {
      const requestBody = {
        roomId: this.currentRoomId,
        senderId: this.config.settings.botId,
        message: message,
      };

      fetch(`${this.config.settings.chatEndpoint}send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          bubbleElement.removeChild(loaderElement);

          if (data && data.payload && data.payload.message) {
            this.reply(data.payload.message);
          } else {
            this.reply(
              "Failed to receive a proper response from the bot. Please try again later."
            );
            console.error("Failed to receive message:", data);
          }

          if (!bubbleElement.textContent.trim()) {
            lastBotMessage.removeChild(bubbleElement);
          }
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          bubbleElement.removeChild(loaderElement);
          this.reply(`Error: ${error.message}`);

          if (!bubbleElement.textContent.trim()) {
            lastBotMessage.removeChild(bubbleElement);
          }
        })
        .finally(() => {
          if (!this.hasOfferedRealAgent) {
            this.offerRealAgentOption();
            this.hasOfferedRealAgent = true;
          }
        });
    } else if (this.chatMode === "agent") {
      const adminResponse = "This is a response from the live agent.";
      bubbleElement.removeChild(loaderElement);
      this.reply(adminResponse);

      if (!bubbleElement.textContent.trim()) {
        lastBotMessage.removeChild(bubbleElement);
      }
    }
  }

  appendMessage(type, content, timestamp) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;

    let imageSrc = "";
    if (type === "user") {
      imageSrc =
        "https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/user.png";
    } else if (type === "reply") {
      imageSrc =
        this.chatMode === "openai"
          ? "https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/bot.png"
          : "https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/admin.png";
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
    if (this.currentConversationIndex !== null) {
      const optionExists = !!document.querySelector(".switch-agent-button");

      if (!optionExists) {
        const optionElement = document.createElement("div");
        optionElement.className = "message reply";
        optionElement.innerHTML = `
                <div class="bubble">
                    If you need further assistance, you can <button id="switch-agent" class="switch-agent-button">Chat with a real agent</button>.
                </div>
                <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/bot.png" alt="bot" class="bubble-icon" width="30" height="30">
            `;
        this.chatElements.chatMessages.appendChild(optionElement);
        this.chatElements.chatMessages.scrollTop =
          this.chatElements.chatMessages.scrollHeight;

        document
          .getElementById("switch-agent")
          .addEventListener("click", this.switchToRealAgent.bind(this));

        this.conversationHistory[
          this.currentConversationIndex
        ].hasOfferedRealAgent = true;
        this.saveConversationHistory();
      }
    }
  }

  switchToRealAgent() {
    fetch(
      `${this.config.settings.chatEndpoint}${this.currentRoomId}/start-live-agent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
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
      })
      .catch((error) => console.error("Error switching to real agent:", error));
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

    if (this.conversationHistory[index].hasOfferedRealAgent) {
      this.offerRealAgentOption();
    }

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
    this.hasOfferedRealAgent = false;
    this.isNewConversation = true;

    if (this.currentConversationIndex !== null) {
      fetch(`${this.config.settings.chatEndpoint}${this.currentRoomId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Response Data:", data);
          if (
            data.code === "success" &&
            data.payload &&
            data.payload.isSuccess
          ) {
            this.conversationHistory[
              this.currentConversationIndex
            ].active = false;
            this.updateConversationList();
            this.saveConversationHistory();
            this.chatElements.chatInputContainer.classList.add("hidden");
            this.chatElements.chatEndedMessage.classList.remove("hidden");
            this.resetToLandingPage();
            this.checkActiveConversations();
          } else {
            console.error("Failed to end conversation:", data);
          }
        })
        .catch((error) => console.error("Error ending conversation:", error))
        .finally(() => {
          this.hideEndConversationModal();
        });
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
      iconSrc =
        "https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/bot.png";
    } else if (conversation.status === "Live Agent") {
      iconSrc =
        "https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/admin.png";
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
          <img src="https://cdn.jsdelivr.net/gh/qbit-tech/live-chat/assets/next.svg" alt="Resume" width="20" height="20" />
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

      this.conversationHistory[
        this.currentConversationIndex
      ].hasOfferedRealAgent = this.hasOfferedRealAgent;

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
    const url = `${this.config.settings.faqEndpoint}?query=${encodeURIComponent(query)}`;
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        if (data && data.payload && data.payload.results) {
          const filteredResults = data.payload.results.filter(item =>
            item.question.toLowerCase().includes(query)
          );
          this.displaySearchResults(filteredResults);
        } else {
          this.clearSearchResults();
        }
      })
      .catch(error => {
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

    if (!this.currentRoomId) {
      console.error("Room ID is undefined. Cannot update profile.");
      return;
    }

    const newName = document.getElementById("edit-name").value;
    const newEmail = document.getElementById("edit-email").value;
    const newPhone = document.getElementById("edit-phone").value;

    const requestBody = {
      roomId: this.currentRoomId,
      name: newName,
      email: newEmail,
      phone: newPhone,
    };

    console.log("Request Body:", requestBody);

    fetch(`${this.config.settings.chatEndpoint}${this.currentRoomId}/update-profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response Data:", data);
        if (data.code === "success" && data.payload && data.payload.isSuccess) {
          localStorage.setItem("userName", newName);
          localStorage.setItem("userEmail", newEmail);
          localStorage.setItem("userPhone", newPhone);
          this.backToChatFromEdit();
        } else {
          console.error("Failed to update profile:", data);
        }
      })
      .catch((error) => console.error("Error updating profile:", error));
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

window.QLiveChatWidget = QLiveChatWidget;
