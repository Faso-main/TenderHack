import './styles/main.css';

class KnowledgeBaseApp {
    constructor() {
        this.searchSuggestions = [];
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
                            <h1>Smart - строка</h1>
                        </div>
                        
                        <div class="search-box">
                            <input type="text" id="searchInput" placeholder="Введите ID, ИНН, название организации, сумму...">
                            <button id="searchButton">
                                <i class="fas fa-search"></i>
                                <span>Найти</span>
                            </button>
                        </div>
                        
                        <!-- Блок рекомендаций -->
                        <div id="searchSuggestions" class="search-suggestions"></div>
                        
                        <div class="search-stats" id="searchStats"></div>
                    </div>
                </main>

                <!-- Модальное окно с результатами -->
                <div id="resultsModal" class="modal results-modal">
                    <div class="modal-backdrop"></div>
                    <div class="modal-container">
                        <div class="modal-content">
                            <button class="close">&times;</button>
                            <div class="modal-header">
                                <h2>Результаты поиска</h2>
                                <div class="search-query">По запросу: <span id="modalQuery"></span></div>
                            </div>
                            <div class="modal-body">
                                <div id="modalResults" class="modal-results"></div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn-secondary" id="closeResults">Закрыть</button>
                            </div>
                        </div>
                    </div>
                </div>

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
    
    checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userIcon = document.getElementById('userIcon');
    
    if (currentUser) {
        userIcon.innerHTML = `<i class="fas fa-user-check"></i>`;  // ← Эту строку нужно изменить
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
        const closeButtons = document.querySelectorAll('.close');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const closeResultsBtn = document.getElementById('closeResults');

        userIcon.addEventListener('click', () => {
            authModal.style.display = 'block';
            setTimeout(() => {
                authModal.classList.add('active');
            }, 10);
        });

        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        authModal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeModal(authModal);
        });

        resultsModal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeModal(resultsModal);
        });

        closeResultsBtn.addEventListener('click', () => {
            this.closeModal(resultsModal);
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
            this.showSearchResults();
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.showSearchResults();
            }
        });

        // Дебаунс для поисковых подсказок
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.getSearchSuggestions();
            }, 300);
        });

        // Закрытие модальных окон по ESC
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

    async getSearchSuggestions() {
        const query = document.getElementById('searchInput').value.trim();
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (query === '') {
            suggestionsContainer.innerHTML = '';
            return;
        }
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
            
            if (!response.ok) {
                throw new Error('Ошибка получения подсказок');
            }
            
            const results = await response.json();
            this.displaySearchSuggestions(results, query);
            
        } catch (error) {
            console.error('Suggestions error:', error);
            // Не показываем ошибку пользователю для подсказок
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
        
        // Группируем результаты по типам
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
        
        // Добавляем общую рекомендацию
        suggestionsContainer.innerHTML += `
            <div class="suggestion-item suggestion-main">
                <i class="fas fa-search"></i>
                <span>Нажмите "Найти" чтобы увидеть все результаты (${results.length})</span>
            </div>
        `;
        
        // Добавляем обработчики кликов на подсказки
        document.querySelectorAll('.suggestion-item[data-id]').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                document.getElementById('searchInput').value = id;
                this.showSearchResults();
            });
        });
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
            modalResults.innerHTML = '<div class="loading">Поиск...</div>';
            modalQuery.textContent = query;
            
            resultsModal.style.display = 'block';
            setTimeout(() => {
                resultsModal.classList.add('active');
            }, 10);
            
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error('Ошибка поиска');
            }
            
            const results = await response.json();
            this.displayModalResults(results);
            
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
        
        // Обновляем статистику
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

    // В методе showResultDetails замените HTML модального окна:
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