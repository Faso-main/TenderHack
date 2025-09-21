import './styles/main.css';

class KnowledgeBaseApp {
    constructor() {
        this.searchSuggestions = [];
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        this.isVectorSearch = true; // Флаг для переключения между типами поиска
        this.init();
    }

    init() {
        this.renderApp();
        this.setupEventListeners();
        this.checkAuth();
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
                            <h1>Умный поиск</h1>
                        </div>
                        
                        <div class="search-box">
                            <input type="text" id="searchInput" placeholder="Введите ID, ИНН, название, сумму или описание...">
                            <button id="searchButton">
                                <i class="fas fa-search"></i>
                                <span>Найти</span>
                            </button>
                        </div>
                        
                        <div id="searchSuggestions" class="search-suggestions"></div>
                        
                        <div class="search-stats" id="searchStats"></div>
                    </div>
                </main>

                <div id="resultsModal" class="modal results-modal">
                    <div class="modal-backdrop"></div>
                    <div class="modal-container">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2>Результаты поиска</h2>
                                <div class="search-query">По запросу: <span id="modalQuery"></span></div>
                            </div>
                            <div class="modal-body">
                                <div id="modalResults" class="modal-results"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="profileModal" class="modal profile-modal">
                    <div class="modal-backdrop"></div>
                    <div class="modal-container">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2>Личный кабинет</h2>
                            </div>
                            <div class="modal-body">
                                <div id="profileContent" class="profile-content"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="authModal" class="modal">
                    <div class="modal-backdrop"></div>
                    <div class="modal-container">
                        <div class="modal-content">
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
                                    <p class="auth-switch desktop-only">
                                        Нет аккаунта? <a href="#" id="showRegister">Зарегистрироваться</a>
                                    </p>
                                </form>

                                <form id="registerForm" class="auth-form">
                                    <h2>Регистрация</h2>
                                    <div class="input-group">
                                        <i class="fas fa-user"></i>
                                        <input type="text" id="registerName" placeholder="ФИО" required>
                                    </div>
                                    <div class="input-group">
                                        <i class="fas fa-building"></i>
                                        <input type="text" id="registerCompany" placeholder="Название компании" required>
                                    </div>
                                    <div class="input-group">
                                        <i class="fas fa-id-card"></i>
                                        <input type="text" id="registerInn" placeholder="ИНН" required>
                                    </div>
                                    <div class="input-group">
                                        <i class="fas fa-phone"></i>
                                        <input type="tel" id="registerPhone" placeholder="Телефон" required>
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
                                    <p class="auth-switch desktop-only">
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

    checkAuth() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userIcon = document.getElementById('userIcon');
        
        if (currentUser) {
            userIcon.innerHTML = `<i class="fas fa-user"></i>`;
            userIcon.title = `${currentUser.name}`;
            userIcon.classList.add('authenticated');
        } else {
            userIcon.innerHTML = `<i class="fas fa-user"></i>`;
            userIcon.title = 'Личный кабинет';
            userIcon.classList.remove('authenticated');
        }
    }

    setupEventListeners() {
        const userIcon = document.getElementById('userIcon');
        const authModal = document.getElementById('authModal');
        const resultsModal = document.getElementById('resultsModal');
        const profileModal = document.getElementById('profileModal');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');

        userIcon.addEventListener('click', () => {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                this.showProfileModal(currentUser);
            } else {
                authModal.style.display = 'block';
                setTimeout(() => {
                    authModal.classList.add('active');
                }, 10);
            }
        });

        [authModal, resultsModal, profileModal].forEach(modal => {
            modal.querySelector('.modal-backdrop').addEventListener('click', () => {
                this.closeModal(modal);
            });
        });

        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            });
        }

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        searchButton.addEventListener('click', () => {
            this.showSearchResults();
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.showSearchResults();
            }
        });

        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.getSearchSuggestions();
            }, 300);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.active');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });
    }

    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    showProfileModal(user) {
        const profileModal = document.getElementById('profileModal');
        const profileContent = document.getElementById('profileContent');
        
        profileContent.innerHTML = `
            <div class="profile-info">
                <div class="profile-item">
                    <i class="fas fa-user"></i>
                    <div>
                        <strong>ФИО:</strong>
                        <span>${user.name}</span>
                    </div>
                </div>
                <div class="profile-item">
                    <i class="fas fa-building"></i>
                    <div>
                        <strong>Компания:</strong>
                        <span>${user.company || 'Не указано'}</span>
                    </div>
                </div>
                <div class="profile-item">
                    <i class="fas fa-id-card"></i>
                    <div>
                        <strong>ИНН:</strong>
                        <span>${user.inn || 'Не указано'}</span>
                    </div>
                </div>
                <div class="profile-item">
                    <i class="fas fa-phone"></i>
                    <div>
                        <strong>Телефон:</strong>
                        <span>${user.phone || 'Не указано'}</span>
                    </div>
                </div>
                <div class="profile-item">
                    <i class="fas fa-envelope"></i>
                    <div>
                        <strong>Email:</strong>
                        <span>${user.email}</span>
                    </div>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn-primary" id="logoutBtn">Выйти</button>
            </div>
        `;

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            this.closeModal(profileModal);
            this.checkAuth();
            this.showNotification('Вы вышли из системы', 'success');
        });

        profileModal.style.display = 'block';
        setTimeout(() => {
            profileModal.classList.add('active');
        }, 10);
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const company = document.getElementById('registerCompany').value;
        const inn = document.getElementById('registerInn').value;
        const phone = document.getElementById('registerPhone').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, company, inn, phone, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
                document.getElementById('registerForm').classList.remove('active');
                document.getElementById('loginForm').classList.add('active');
                document.getElementById('registerForm').reset();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Вход выполнен успешно!', 'success');
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.closeModal(document.getElementById('authModal'));
                document.getElementById('loginForm').reset();
                this.checkAuth();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }

// Обновите метод getSearchSuggestions
async getSearchSuggestions() {
    const query = document.getElementById('searchInput').value.trim();
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (query === '') {
        suggestionsContainer.innerHTML = '';
        this.showRecentSearches();
        return;
    }
    
    try {
        // Показываем быстрые локальные подсказки
        this.showQuickSuggestions(query);
        
        // Асинхронно загружаем умные подсказки
        const response = await fetch(`/api/smart-suggestions?q=${encodeURIComponent(query)}&limit=3`);
        
        if (response.ok) {
            const data = await response.json();
            this.displaySmartSuggestions(data, query);
        }
    } catch (error) {
        console.error('Smart suggestions error:', error);
    }
}

async performVectorSearch(query) {
    try {
        const response = await fetch(`/api/vector-search?q=${encodeURIComponent(query)}&limit=20`);
        
        if (!response.ok) {
            throw new Error('Ошибка семантического поиска');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Vector search error:', error);
        return [];
    }
}

    displaySearchSuggestions(results, query) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        suggestionsContainer.innerHTML = '';
        
        if (results.length === 0) {
            suggestionsContainer.innerHTML = `
                <div class="suggestion-item">
                    <i class="fas fa-info-circle"></i>
                    <span>Попробуйте изменить запрос или использовать ID/ИНН</span>
                </div>
            `;
            return;
        }
        
        const contracts = results.filter(item => item.data_type === 'contract');
        const sessions = results.filter(item => item.data_type === 'quotation_session');
        
        if (contracts.length > 0) {
            suggestionsContainer.innerHTML += `
                <div class="suggestion-category">
                    <i class="fas fa-file-contract"></i>
                    Контракты (${contracts.length})
                </div>
            `;
            contracts.slice(0, 3).forEach(item => {
                suggestionsContainer.innerHTML += `
                    <div class="suggestion-item" data-id="${item.contract_id}" data-type="contract">
                        <i class="fas fa-arrow-right"></i>
                        <span>${item.contract_name} (${item.contract_id})</span>
                    </div>
                `;
            });
        }
        
        if (sessions.length > 0) {
            suggestionsContainer.innerHTML += `
                <div class="suggestion-category">
                    <i class="fas fa-chart-line"></i>
                    Котировки (${sessions.length})
                </div>
            `;
            sessions.slice(0, 3).forEach(item => {
                suggestionsContainer.innerHTML += `
                    <div class="suggestion-item" data-id="${item.session_id}" data-type="session">
                        <i class="fas fa-arrow-right"></i>
                        <span>${item.session_name} (${item.session_id})</span>
                    </div>
                `;
            });
        }
        
        suggestionsContainer.innerHTML += `
            <div class="suggestion-item suggestion-main">
                <i class="fas fa-search"></i>
                <span>Нажмите "Найти" чтобы увидеть все результаты (${results.length})</span>
            </div>
        `;
        
        document.querySelectorAll('.suggestion-item[data-id]').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                document.getElementById('searchInput').value = id;
                this.showSearchResults();
            });
        });
    }

displaySmartSuggestions(data, query) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if ((data.contracts && data.contracts.length > 0) || (data.sessions && data.sessions.length > 0)) {
        let smartSuggestionsHTML = '';
        
        if (data.contracts.length > 0) {
            smartSuggestionsHTML += `
                <div class="suggestion-category">
                    <i class="fas fa-file-contract"></i>
                    Семантические совпадения в контрактах
                </div>
            `;
            
            data.contracts.forEach(item => {
                const similarityPercent = Math.round(item.similarity * 100);
                smartSuggestionsHTML += `
                    <div class="suggestion-item" data-id="${item.contract_id}" data-type="contract">
                        <i class="fas fa-magic"></i>
                        <span>${item.contract_name}</span>
                        <span class="similarity-badge">${similarityPercent}%</span>
                    </div>
                `;
            });
        }
        
        if (data.sessions.length > 0) {
            smartSuggestionsHTML += `
                <div class="suggestion-category">
                    <i class="fas fa-chart-line"></i>
                    Семантические совпадения в котировках
                </div>
            `;
            
            data.sessions.forEach(item => {
                const similarityPercent = Math.round(item.similarity * 100);
                smartSuggestionsHTML += `
                    <div class="suggestion-item" data-id="${item.session_id}" data-type="session">
                        <i class="fas fa-magic"></i>
                        <span>${item.session_name}</span>
                        <span class="similarity-badge">${similarityPercent}%</span>
                    </div>
                `;
            });
        }
        
        // Вставляем умные подсказки после быстрых
        const quickSuggestions = suggestionsContainer.innerHTML;
        suggestionsContainer.innerHTML = quickSuggestions + smartSuggestionsHTML;
        
        // Добавляем обработчики
        this.setupSuggestionHandlers();
    }
}

async showSearchResults() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsModal = document.getElementById('resultsModal');
    const modalQuery = document.getElementById('modalQuery');
    const modalResults = document.getElementById('modalResults');
    
    if (query === '') {
        this.showNotification('Введите поисковый запрос', 'warning');
        return;
    }
    
    try {
        modalResults.innerHTML = '<div class="loading">Семантический поиск...</div>';
        modalQuery.textContent = query;
        modalQuery.innerHTML = `По запросу: <span>${query}</span> <span class="search-type-badge">семантический</span>`;
        
        resultsModal.style.display = 'block';
        setTimeout(() => {
            resultsModal.classList.add('active');
        }, 10);
        
        // Используем векторный поиск
        let results = await this.performVectorSearch(query);
        
        // Если векторный поиск не дал результатов, используем обычный
        if (results.length === 0) {
            modalQuery.innerHTML = `По запросу: <span>${query}</span> <span class="search-type-badge">текстовый</span>`;
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                results = await response.json();
            }
        }
        
        this.displayModalResults(results);
        
        // Сохраняем в историю
        this.addToSearchHistory(query);
        
    } catch (error) {
        console.error('Search error:', error);
        modalResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка поиска</h3>
                <p>Попробуйте позже или измените запрос</p>
            </div>
        `;
    }
}

    displayModalResults(results) {
        const modalResults = document.getElementById('modalResults');
        const searchStats = document.getElementById('searchStats');
        
        modalResults.innerHTML = '';
        searchStats.innerHTML = '';
        
        if (results.length === 0) {
            searchStats.innerHTML = '<div class="stats">Найдено: 0</div>';
            modalResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить поисковый запрос</p>
                </div>
            `;
            return;
        }
        
        searchStats.innerHTML = `<div class="stats">Найдено: ${results.length} записей</div>`;
        
        results.forEach((item, index) => {
            const isContract = item.data_type === 'contract';
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            resultElement.style.animationDelay = `${index * 0.1}s`;
            
            const amount = parseFloat(isContract ? item.contract_amount : item.session_amount);
            const date = new Date(isContract ? item.contract_date : item.creation_date);
            
            resultElement.innerHTML = `
                <div class="result-icon">
                    <i class="fas ${isContract ? 'fa-file-contract' : 'fa-chart-line'}"></i>
                </div>
                <div class="result-content">
                    <div class="result-header">
                        <h3>${isContract ? item.contract_name : item.session_name}</h3>
                        <span class="data-type-badge">${isContract ? 'Контракт' : 'Котировка'}</span>
                    </div>
                    <div class="result-details">
                        <p><strong>ID:</strong> ${isContract ? item.contract_id : item.session_id}</p>
                        <p><strong>Заказчик:</strong> ${item.customer_name}</p>
                        <p><strong>ИНН заказчика:</strong> ${item.customer_inn}</p>
                        <p><strong>Поставщик:</strong> ${item.supplier_name}</p>
                        <p><strong>ИНН поставщика:</strong> ${item.supplier_inn}</p>
                        <p><strong>Сумма:</strong> ${amount.toLocaleString('ru-RU')} руб.</p>
                        <p><strong>Дата:</strong> ${date.toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
                <div class="result-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
            
            resultElement.addEventListener('click', () => {
                this.showResultDetails(item);
            });
            
            modalResults.appendChild(resultElement);
        });
    }

    showResultDetails(item) {
        const isContract = item.data_type === 'contract';
        const modal = document.createElement('div');
        modal.className = 'result-modal';
        
        const amount = parseFloat(isContract ? item.contract_amount : item.session_amount);
        const date = new Date(isContract ? item.contract_date : item.creation_date);
        
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-container">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${isContract ? item.contract_name : item.session_name}</h2>
                        <span class="data-type-badge">${isContract ? 'Контракт' : 'Котировочная сессия'}</span>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>ID:</strong> ${isContract ? item.contract_id : item.session_id}
                            </div>
                            <div class="detail-item">
                                <strong>Тип:</strong> ${isContract ? 'Контракт' : 'Котировочная сессия'}
                            </div>
                            <div class="detail-item">
                                <strong>Заказчик:</strong> ${item.customer_name}
                            </div>
                            <div class="detail-item">
                                <strong>ИНН заказчика:</strong> ${item.customer_inn}
                            </div>
                            <div class="detail-item">
                                <strong>Поставщик:</strong> ${item.supplier_name}
                            </div>
                            <div class="detail-item">
                                <strong>ИНН поставщика:</strong> ${item.supplier_inn}
                            </div>
                            <div class="detail-item">
                                <strong>Сумма:</strong> ${amount.toLocaleString('ru-RU')} руб.
                            </div>
                            <div class="detail-item">
                                <strong>Дата ${isContract ? 'заключения' : 'создания'}:</strong> ${date.toLocaleDateString('ru-RU')}
                            </div>
                            ${isContract ? '' : `
                                <div class="detail-item">
                                    <strong>Дата завершения:</strong> ${new Date(item.completion_date).toLocaleDateString('ru-RU')}
                                </div>
                            `}
                            <div class="detail-item">
                                <strong>Правовое основание:</strong> ${item.law_basis}
                            </div>
                            ${item.category ? `
                                <div class="detail-item">
                                    <strong>Категория:</strong> ${item.category}
                                </div>
                            ` : ''}
                        </div>
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

const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
document.head.appendChild(fontAwesome);

document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeBaseApp();
});