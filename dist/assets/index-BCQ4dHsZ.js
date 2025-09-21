(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver(e=>{for(const o of e)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function s(e){const o={};return e.integrity&&(o.integrity=e.integrity),e.referrerPolicy&&(o.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?o.credentials="include":e.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(e){if(e.ep)return;e.ep=!0;const o=s(e);fetch(e.href,o)}})();class p{constructor(){this.init()}init(){this.renderApp(),this.setupEventListeners(),this.checkAuth()}renderApp(){const t=document.querySelector("#app");t.innerHTML=`
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
                            <input type="text" id="searchInput" placeholder="Введите ID, ИНН, название организации, сумму...">
                            <button id="searchButton">
                                <i class="fas fa-search"></i>
                                <span>Найти</span>
                            </button>
                        </div>
                        
                        <div class="search-stats" id="searchStats"></div>
                        
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
        `}setupEventListeners(){const t=document.getElementById("userIcon"),s=document.getElementById("authModal"),a=document.querySelector(".close"),e=document.getElementById("loginForm"),o=document.getElementById("registerForm"),n=document.getElementById("showRegister"),r=document.getElementById("showLogin"),c=document.getElementById("searchInput"),d=document.getElementById("searchButton");t.addEventListener("click",()=>{s.style.display="block",setTimeout(()=>{s.classList.add("active")},10)}),a.addEventListener("click",()=>{this.closeModal()}),s.querySelector(".modal-backdrop").addEventListener("click",()=>{this.closeModal()}),n.addEventListener("click",i=>{i.preventDefault(),e.classList.remove("active"),o.classList.add("active")}),r.addEventListener("click",i=>{i.preventDefault(),o.classList.remove("active"),e.classList.add("active")}),o.addEventListener("submit",i=>{i.preventDefault(),this.handleRegister()}),e.addEventListener("submit",i=>{i.preventDefault(),this.handleLogin()}),d.addEventListener("click",()=>{this.performSearch()}),c.addEventListener("keypress",i=>{i.key==="Enter"&&this.performSearch()});let u;c.addEventListener("input",()=>{clearTimeout(u),u=setTimeout(()=>{this.performSearch()},300)})}closeModal(){const t=document.getElementById("authModal");t.classList.remove("active"),setTimeout(()=>{t.style.display="none"},300)}async handleRegister(){const t=document.getElementById("registerName").value,s=document.getElementById("registerEmail").value,a=document.getElementById("registerPassword").value;try{const o=await(await fetch("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:t,email:s,password:a})})).json();o.success?(this.showNotification("Регистрация успешна! Теперь вы можете войти.","success"),document.getElementById("registerForm").classList.remove("active"),document.getElementById("loginForm").classList.add("active"),document.getElementById("registerForm").reset()):this.showNotification(o.error,"error")}catch{this.showNotification("Ошибка соединения с сервером","error")}}async handleLogin(){const t=document.getElementById("loginEmail").value,s=document.getElementById("loginPassword").value;try{const e=await(await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,password:s})})).json();e.success?(this.showNotification("Вход выполнен успешно!","success"),localStorage.setItem("currentUser",JSON.stringify(e.user)),this.closeModal(),document.getElementById("loginForm").reset(),this.checkAuth()):this.showNotification(e.error,"error")}catch{this.showNotification("Ошибка соединения с сервером","error")}}checkAuth(){const t=JSON.parse(localStorage.getItem("currentUser")),s=document.getElementById("userIcon");t?(s.innerHTML='<i class="fas fa-user-check"></i>',s.title=`${t.name}`,s.classList.add("authenticated")):(s.innerHTML='<i class="fas fa-user"></i>',s.title="Личный кабинет",s.classList.remove("authenticated"))}async performSearch(){const t=document.getElementById("searchInput").value.trim(),s=document.getElementById("searchResults"),a=document.getElementById("searchStats");if(t===""){s.innerHTML="",a.innerHTML="";return}try{s.innerHTML='<div class="loading">Поиск...</div>';const e=await fetch(`/api/search?q=${encodeURIComponent(t)}`);if(!e.ok)throw new Error("Ошибка поиска");const o=await e.json();this.displaySearchResults(o)}catch(e){console.error("Search error:",e),s.innerHTML=`
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Ошибка поиска</h3>
                    <p>Попробуйте позже или измените запрос</p>
                </div>
            `}}displaySearchResults(t){const s=document.getElementById("searchResults"),a=document.getElementById("searchStats");if(s.innerHTML="",t.length===0){a.innerHTML='<div class="stats">Найдено: 0</div>',s.innerHTML=`
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить поисковый запрос</p>
                </div>
            `;return}a.innerHTML=`<div class="stats">Найдено: ${t.length} записей</div>`,t.forEach((e,o)=>{const n=e.data_type==="contract",r=document.createElement("div");r.className="result-item",r.style.animationDelay=`${o*.1}s`;const c=parseFloat(n?e.contract_amount:e.session_amount),d=new Date(n?e.contract_date:e.creation_date);r.innerHTML=`
                <div class="result-icon">
                    <i class="fas ${n?"fa-file-contract":"fa-chart-line"}"></i>
                </div>
                <div class="result-content">
                    <div class="result-header">
                        <h3>${n?e.contract_name:e.session_name}</h3>
                        <span class="data-type-badge">${n?"Контракт":"Котировка"}</span>
                    </div>
                    <div class="result-details">
                        <p><strong>ID:</strong> ${n?e.contract_id:e.session_id}</p>
                        <p><strong>Заказчик:</strong> ${e.customer_name}</p>
                        <p><strong>ИНН заказчика:</strong> ${e.customer_inn}</p>
                        <p><strong>Поставщик:</strong> ${e.supplier_name}</p>
                        <p><strong>ИНН поставщика:</strong> ${e.supplier_inn}</p>
                        <p><strong>Сумма:</strong> ${c.toLocaleString("ru-RU")} руб.</p>
                        <p><strong>Дата:</strong> ${d.toLocaleDateString("ru-RU")}</p>
                        <p><strong>Основание:</strong> ${e.law_basis}</p>
                    </div>
                </div>
                <div class="result-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `,r.addEventListener("click",()=>{this.showResultDetails(e)}),s.appendChild(r)})}showResultDetails(t){const s=t.data_type==="contract",a=document.createElement("div");a.className="result-modal";const e=parseFloat(s?t.contract_amount:t.session_amount),o=new Date(s?t.contract_date:t.creation_date);a.innerHTML=`
            <div class="modal-backdrop"></div>
            <div class="modal-container">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${s?t.contract_name:t.session_name}</h2>
                        <span class="data-type-badge">${s?"Контракт":"Котировочная сессия"}</span>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>ID:</strong> ${s?t.contract_id:t.session_id}
                            </div>
                            <div class="detail-item">
                                <strong>Тип:</strong> ${s?"Контракт":"Котировочная сессия"}
                            </div>
                            <div class="detail-item">
                                <strong>Заказчик:</strong> ${t.customer_name}
                            </div>
                            <div class="detail-item">
                                <strong>ИНН заказчика:</strong> ${t.customer_inn}
                            </div>
                            <div class="detail-item">
                                <strong>Поставщик:</strong> ${t.supplier_name}
                            </div>
                            <div class="detail-item">
                                <strong>ИНН поставщика:</strong> ${t.supplier_inn}
                            </div>
                            <div class="detail-item">
                                <strong>Сумма:</strong> ${e.toLocaleString("ru-RU")} руб.
                            </div>
                            <div class="detail-item">
                                <strong>Дата ${s?"заключения":"создания"}:</strong> ${o.toLocaleDateString("ru-RU")}
                            </div>
                            ${s?"":`
                                <div class="detail-item">
                                    <strong>Дата завершения:</strong> ${new Date(t.completion_date).toLocaleDateString("ru-RU")}
                                </div>
                            `}
                            <div class="detail-item">
                                <strong>Правовое основание:</strong> ${t.law_basis}
                            </div>
                            ${t.category?`
                                <div class="detail-item">
                                    <strong>Категория:</strong> ${t.category}
                                </div>
                            `:""}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary">Закрыть</button>
                    </div>
                </div>
            </div>
        `,document.body.appendChild(a),setTimeout(()=>{a.classList.add("active")},10);const n=()=>{a.classList.remove("active"),setTimeout(()=>{a.parentNode&&document.body.removeChild(a)},300)};a.querySelector(".modal-backdrop").addEventListener("click",n),a.querySelector(".modal-close").addEventListener("click",n),a.querySelector(".btn-secondary").addEventListener("click",n)}showNotification(t,s="info"){const a=document.createElement("div");a.className=`notification notification-${s}`,a.innerHTML=`
            <i class="fas fa-${s==="success"?"check-circle":s==="error"?"exclamation-circle":"info-circle"}"></i>
            <span>${t}</span>
        `,document.body.appendChild(a),setTimeout(()=>{a.classList.add("show")},100),setTimeout(()=>{a.classList.remove("show"),setTimeout(()=>{a.parentNode&&document.body.removeChild(a)},300)},3e3)}}const l=document.createElement("link");l.rel="stylesheet";l.href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";document.head.appendChild(l);document.addEventListener("DOMContentLoaded",()=>{new p});
