(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))o(t);new MutationObserver(t=>{for(const i of t)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&o(n)}).observe(document,{childList:!0,subtree:!0});function e(t){const i={};return t.integrity&&(i.integrity=t.integrity),t.referrerPolicy&&(i.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?i.credentials="include":t.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function o(t){if(t.ep)return;t.ep=!0;const i=e(t);fetch(t.href,i)}})();const m=[{id:1,title:"Как настроить профиль",content:"Для настройки профиля перейдите в личный кабинет, затем нажмите на кнопку 'Настройки'. Здесь вы можете изменить личную информацию, настройки приватности и предпочтения уведомлений."},{id:2,title:"Частые вопросы о платежах",content:"Платежи обрабатываются в течение 24 часов. Для проверки статуса платежа перейдите в раздел 'Платежи' в вашем личном кабинете. Возвраты средств осуществляются в течение 5-7 рабочих дней."},{id:3,title:"Руководство по использованию API",content:"Наше API предоставляет доступ ко всем функциям системы. Для начала работы получите API-ключ в личном кабинете. Документация доступна по адресу /api/docs."},{id:4,title:"Устранение неполадок",content:"Если возникли проблемы, проверьте соединение с интернетом, очистите кэш браузера или обратитесь в техническую поддержку."}];class h{constructor(){this.init()}init(){this.initUsers(),this.renderApp(),this.setupEventListeners(),this.checkAuth()}initUsers(){localStorage.getItem("users")||localStorage.setItem("users",JSON.stringify([]))}renderApp(){const s=document.querySelector("#app");s.innerHTML=`
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
    `}setupEventListeners(){const s=document.getElementById("userIcon"),e=document.getElementById("authModal"),o=document.querySelector(".close"),t=document.getElementById("loginForm"),i=document.getElementById("registerForm"),n=document.getElementById("showRegister"),d=document.getElementById("showLogin"),r=document.getElementById("searchInput"),u=document.getElementById("searchButton");s.addEventListener("click",()=>{e.style.display="block",setTimeout(()=>{e.classList.add("active")},10)}),o.addEventListener("click",()=>{this.closeModal()}),e.querySelector(".modal-backdrop").addEventListener("click",()=>{this.closeModal()}),n.addEventListener("click",a=>{a.preventDefault(),t.classList.remove("active"),i.classList.add("active")}),d.addEventListener("click",a=>{a.preventDefault(),i.classList.remove("active"),t.classList.add("active")}),i.addEventListener("submit",a=>{a.preventDefault(),this.handleRegister()}),t.addEventListener("submit",a=>{a.preventDefault(),this.handleLogin()}),u.addEventListener("click",()=>{this.performSearch()}),r.addEventListener("keypress",a=>{a.key==="Enter"&&this.performSearch()}),r.addEventListener("input",()=>{this.performSearch()})}closeModal(){const s=document.getElementById("authModal");s.classList.remove("active"),setTimeout(()=>{s.style.display="none"},300)}handleRegister(){const s=document.getElementById("registerName").value,e=document.getElementById("registerEmail").value,o=document.getElementById("registerPassword").value,t=JSON.parse(localStorage.getItem("users"));if(t.find(n=>n.email===e)){this.showNotification("Пользователь с таким email уже существует","error");return}const i={name:s,email:e,password:o,joined:new Date().toISOString()};t.push(i),localStorage.setItem("users",JSON.stringify(t)),this.showNotification("Регистрация успешна! Теперь вы можете войти.","success"),document.getElementById("registerForm").classList.remove("active"),document.getElementById("loginForm").classList.add("active"),document.getElementById("registerForm").reset()}handleLogin(){const s=document.getElementById("loginEmail").value,e=document.getElementById("loginPassword").value,t=JSON.parse(localStorage.getItem("users")).find(i=>i.email===s&&i.password===e);t?(this.showNotification("Вход выполнен успешно!","success"),localStorage.setItem("currentUser",JSON.stringify(t)),this.closeModal(),document.getElementById("loginForm").reset(),this.checkAuth()):this.showNotification("Неверный email или пароль","error")}checkAuth(){const s=JSON.parse(localStorage.getItem("currentUser")),e=document.getElementById("userIcon");s?(e.innerHTML='<i class="fas fa-user-check"></i>',e.title=`${s.name}`,e.classList.add("authenticated")):(e.innerHTML='<i class="fas fa-user"></i>',e.title="Личный кабинет",e.classList.remove("authenticated"))}performSearch(){const s=document.getElementById("searchInput").value.toLowerCase().trim(),e=document.getElementById("searchResults");if(s===""){e.innerHTML="";return}const o=m.filter(t=>t.title.toLowerCase().includes(s)||t.content.toLowerCase().includes(s));this.displayResults(o)}displayResults(s){const e=document.getElementById("searchResults");if(e.innerHTML="",s.length===0){e.innerHTML=`
        <div class="no-results">
          <i class="fas fa-search"></i>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить поисковый запрос</p>
        </div>
      `;return}s.forEach((o,t)=>{const i=document.createElement("div");i.className="result-item",i.style.animationDelay=`${t*.1}s`,i.innerHTML=`
        <div class="result-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <div class="result-content">
          <h3>${o.title}</h3>
          <p>${o.content.substring(0,120)}...</p>
        </div>
        <div class="result-arrow">
          <i class="fas fa-chevron-right"></i>
        </div>
      `,i.addEventListener("click",()=>{this.showResultDetails(o)}),e.appendChild(i)})}showResultDetails(s){const e=document.createElement("div");e.className="result-modal",e.innerHTML=`
      <div class="modal-backdrop"></div>
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-header">
            <h2>${s.title}</h2>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>${s.content}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary">Закрыть</button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(e),setTimeout(()=>{e.classList.add("active")},10);const o=()=>{e.classList.remove("active"),setTimeout(()=>{e.parentNode&&document.body.removeChild(e)},300)};e.querySelector(".modal-backdrop").addEventListener("click",o),e.querySelector(".modal-close").addEventListener("click",o),e.querySelector(".btn-secondary").addEventListener("click",o)}showNotification(s,e="info"){const o=document.createElement("div");o.className=`notification notification-${e}`,o.innerHTML=`
      <i class="fas fa-${e==="success"?"check-circle":e==="error"?"exclamation-circle":"info-circle"}"></i>
      <span>${s}</span>
    `,document.body.appendChild(o),setTimeout(()=>{o.classList.add("show")},100),setTimeout(()=>{o.classList.remove("show"),setTimeout(()=>{o.parentNode&&document.body.removeChild(o)},300)},3e3)}}const c=document.createElement("link");c.rel="stylesheet";c.href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";document.head.appendChild(c);document.addEventListener("DOMContentLoaded",()=>{new h});
