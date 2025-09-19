import './styles/main.css';

// Имитация базы знаний
const knowledgeBase = [
  { 
    id: 1, 
    title: "Как настроить профиль", 
    content: "Для настройки профиля перейдите в личный кабинет, затем нажмите на кнопку 'Настройки'. Здесь вы можете изменить личную информацию, настройки приватности и предпочтения уведомлений." 
  },
  { 
    id: 2, 
    title: "Частые вопросы о платежах", 
    content: "Платежи обрабатываются в течение 24 часов. Для проверки статуса платежа перейдите в раздел 'Платежи' в вашем личном кабинете. Возвраты средств осуществляются в течение 5-7 рабочих дней." 
  },
  { 
    id: 3, 
    title: "Руководство по использованию API", 
    content: "Наше API предоставляет доступ ко всем функциям системы. Для начала работы получите API-ключ в личном кабинете. Документация доступна по адресу /api/docs." 
  },
  { 
    id: 4, 
    title: "Устранение неполадок", 
    content: "Если возникли проблемы, проверьте соединение с интернетом, очистите кэш браузера или обратитесь в техническую поддержку." 
  }
];

class KnowledgeBaseApp {
  constructor() {
    this.init();
  }

  init() {
    this.initUsers();
    this.renderApp();
    this.setupEventListeners();
    this.checkAuth();
  }

  initUsers() {
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify([]));
    }
  }

  renderApp() {
    const app = document.querySelector('#app');
    app.innerHTML = `
      <div class="app-container">
        <header class="header">
          <div class="user-icon" id="userIcon">
            <i class="fas fa-user"></i>
          </div>
        </header>

        <main class="main-content">
          <div class="search-container">
            <div class="search-header">
              <h1>Smart - строка</h1>
            </div>
            
            <div class="search-box">
              <input type="text" id="searchInput" placeholder="Введите ваш вопрос...">
              <button id="searchButton">
                <i class="fas fa-search"></i>
                <span>Поиск</span>
              </button>
            </div>
            
            <div id="searchResults" class="search-results"></div>
          </div>
        </main>

        <div id="authModal" class="modal">
          <div class="modal-backdrop"></div>
          <div class="modal-container">
            <div class="modal-content">
              <button class="close">&times;</button>
              
              <div class="auth-forms">
                <form id="loginForm" class="auth-form active">
                  <h2>Вход в систему</h2>
                  <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="loginEmail" placeholder="Email" required>
                  </div>
                  <div class="input-group">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="loginPassword" placeholder="Пароль" required>
                  </div>
                  <button type="submit" class="btn-primary">Войти</button>
                  <p class="auth-switch">
                    Нет аккаунта? <a href="#" id="showRegister">Зарегистрироваться</a>
                  </p>
                </form>

                <form id="registerForm" class="auth-form">
                  <h2>Регистрация</h2>
                  <div class="input-group">
                    <i class="fas fa-user"></i>
                    <input type="text" id="registerName" placeholder="Имя" required>
                  </div>
                  <div class="input-group">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="registerEmail" placeholder="Email" required>
                  </div>
                  <div class="input-group">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="registerPassword" placeholder="Пароль" required>
                  </div>
                  <button type="submit" class="btn-primary">Зарегистрироваться</button>
                  <p class="auth-switch">
                    Уже есть аккаунт? <a href="#" id="showLogin">Войти</a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const userIcon = document.getElementById('userIcon');
    const authModal = document.getElementById('authModal');
    const closeModal = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    userIcon.addEventListener('click', () => {
      authModal.style.display = 'block';
      setTimeout(() => {
        authModal.classList.add('active');
      }, 10);
    });

    closeModal.addEventListener('click', () => {
      this.closeModal();
    });

    authModal.querySelector('.modal-backdrop').addEventListener('click', () => {
      this.closeModal();
    });

    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.remove('active');
      registerForm.classList.add('active');
    });

    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.classList.remove('active');
      loginForm.classList.add('active');
    });

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    searchButton.addEventListener('click', () => {
      this.performSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    searchInput.addEventListener('input', () => {
      this.performSearch();
    });
  }

  closeModal() {
    const authModal = document.getElementById('authModal');
    authModal.classList.remove('active');
    setTimeout(() => {
      authModal.style.display = 'none';
    }, 300);
  }

  handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const users = JSON.parse(localStorage.getItem('users'));
    
    if (users.find(u => u.email === email)) {
      this.showNotification('Пользователь с таким email уже существует', 'error');
      return;
    }
    
    const newUser = { name, email, password, joined: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    this.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').reset();
  }

  handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      this.showNotification('Вход выполнен успешно!', 'success');
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.closeModal();
      document.getElementById('loginForm').reset();
      this.checkAuth();
    } else {
      this.showNotification('Неверный email или пароль', 'error');
    }
  }

  checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userIcon = document.getElementById('userIcon');
    
    if (currentUser) {
      userIcon.innerHTML = `<i class="fas fa-user-check"></i>`;
      userIcon.title = `${currentUser.name}`;
      userIcon.classList.add('authenticated');
    } else {
      userIcon.innerHTML = `<i class="fas fa-user"></i>`;
      userIcon.title = 'Личный кабинет';
      userIcon.classList.remove('authenticated');
    }
  }

  performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    
    if (query === '') {
      searchResults.innerHTML = '';
      return;
    }
    
    const results = knowledgeBase.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query)
    );
    
    this.displayResults(results);
  }

  displayResults(results) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить поисковый запрос</p>
        </div>
      `;
      return;
    }
    
    results.forEach((result, index) => {
      const resultElement = document.createElement('div');
      resultElement.className = 'result-item';
      resultElement.style.animationDelay = `${index * 0.1}s`;
      resultElement.innerHTML = `
        <div class="result-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="result-content">
          <h3>${result.title}</h3>
          <p>${result.content.substring(0, 120)}...</p>
        </div>
        <div class="result-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      `;
      resultElement.addEventListener('click', () => {
        this.showResultDetails(result);
      });
      searchResults.appendChild(resultElement);
    });
  }

  showResultDetails(result) {
    const modal = document.createElement('div');
    modal.className = 'result-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-header">
            <h2>${result.title}</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>${result.content}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary">Закрыть</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
      }, 300);
    };
    
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.btn-secondary').addEventListener('click', closeModal);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Добавляем Font Awesome
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
document.head.appendChild(fontAwesome);

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  new KnowledgeBaseApp();
});