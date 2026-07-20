// ============================================
// اوای یقین - پنل مدیریت حرفه‌ای (نسخه چند API)
// ============================================

(function() {
    'use strict';

    var currentTab = 'dashboard';
    var allChats = [];
    var botPersonality = '';
    var botTraining = [];
    var settings = {};
    var autoRefreshInterval = null;

    function init() {
        // Load data
        try {
            var savedChats = localStorage.getItem('oay_chats');
            if (savedChats) allChats = JSON.parse(savedChats);
        } catch(e) { allChats = []; }

        try {
            var savedPersonality = localStorage.getItem('oay_personality');
            botPersonality = savedPersonality || BOT_PERSONALITY;
        } catch(e) { botPersonality = BOT_PERSONALITY; }

        try {
            var savedTraining = localStorage.getItem('oay_training');
            if (savedTraining) botTraining = JSON.parse(savedTraining);
        } catch(e) { botTraining = []; }

        try {
            var savedSettings = localStorage.getItem('oay_settings');
            if (savedSettings) settings = JSON.parse(savedSettings);
        } catch(e) { settings = {}; }

        bindEvents();
        renderDashboard();
        loadSettings();
        startAutoRefresh();
    }

    function bindEvents() {
        // Tab buttons
        var tabBtns = document.querySelectorAll('.admin-tab');
        for (var i = 0; i < tabBtns.length; i++) {
            tabBtns[i].addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        }

        // Search chats
        var searchInput = document.getElementById('search-chats');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                renderChats(this.value);
            });
        }

        // Filter chats
        var filterDate = document.getElementById('filter-date');
        if (filterDate) {
            filterDate.addEventListener('change', function() {
                renderChats();
            });
        }

        var filterMinMsgs = document.getElementById('filter-min-msgs');
        if (filterMinMsgs) {
            filterMinMsgs.addEventListener('input', function() {
                renderChats();
            });
        }

        // Personality
        var savePersonalityBtn = document.getElementById('save-personality');
        if (savePersonalityBtn) {
            savePersonalityBtn.addEventListener('click', savePersonality);
        }

        var resetPersonalityBtn = document.getElementById('reset-personality');
        if (resetPersonalityBtn) {
            resetPersonalityBtn.addEventListener('click', resetPersonality);
        }

        // Training
        var addTrainingBtn = document.getElementById('add-training');
        if (addTrainingBtn) {
            addTrainingBtn.addEventListener('click', addTrainingItem);
        }

        // Settings
        var saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', saveSettings);
        }

        var resetSettingsBtn = document.getElementById('reset-settings');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', resetSettings);
        }

        // Provider change
        var providerSelect = document.getElementById('setting-provider');
        if (providerSelect) {
            providerSelect.addEventListener('change', function() {
                updateModelOptions(this.value);
            });
        }

        // Test API
        var testApiBtn = document.getElementById('test-api');
        if (testApiBtn) {
            testApiBtn.addEventListener('click', testApiConnection);
        }

        // Data management
        var exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }

        var importBtn = document.getElementById('import-data');
        if (importBtn) {
            importBtn.addEventListener('click', importData);
        }

        var clearBtn = document.getElementById('clear-all');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllData);
        }

        // Temperature slider
        var tempSlider = document.getElementById('setting-temperature');
        if (tempSlider) {
            tempSlider.addEventListener('input', function() {
                var valEl = document.getElementById('setting-temp-value');
                if (valEl) valEl.textContent = this.value;
            });
        }

        // Top P slider
        var topPSlider = document.getElementById('setting-top-p');
        if (topPSlider) {
            topPSlider.addEventListener('input', function() {
                var valEl = document.getElementById('setting-top-p-value');
                if (valEl) valEl.textContent = this.value;
            });
        }

        // Frequency penalty slider
        var freqSlider = document.getElementById('setting-frequency-penalty');
        if (freqSlider) {
            freqSlider.addEventListener('input', function() {
                var valEl = document.getElementById('setting-freq-value');
                if (valEl) valEl.textContent = this.value;
            });
        }

        // Presence penalty slider
        var presSlider = document.getElementById('setting-presence-penalty');
        if (presSlider) {
            presSlider.addEventListener('input', function() {
                var valEl = document.getElementById('setting-pres-value');
                if (valEl) valEl.textContent = this.value;
            });
        }

        // Auto refresh toggle
        var autoRefreshToggle = document.getElementById('setting-auto-refresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', function() {
                if (this.checked) {
                    startAutoRefresh();
                } else {
                    stopAutoRefresh();
                }
            });
        }
    }

    function switchTab(tabName) {
        currentTab = tabName;

        var tabBtns = document.querySelectorAll('.admin-tab');
        for (var i = 0; i < tabBtns.length; i++) {
            tabBtns[i].classList.toggle('active', tabBtns[i].dataset.tab === tabName);
        }

        var tabContents = document.querySelectorAll('.admin-tab-content');
        for (var i = 0; i < tabContents.length; i++) {
            tabContents[i].classList.toggle('active', tabContents[i].id === 'tab-' + tabName);
        }

        if (tabName === 'dashboard') renderDashboard();
        if (tabName === 'chats') renderChats();
        if (tabName === 'users') renderUsers();
        if (tabName === 'personality') loadPersonality();
        if (tabName === 'training') renderTraining();
        if (tabName === 'settings') loadSettings();
    }

    // ============================================
    // AUTO REFRESH
    // ============================================
    function startAutoRefresh() {
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        autoRefreshInterval = setInterval(function() {
            // Reload chats from localStorage
            try {
                var saved = localStorage.getItem('oay_chats');
                if (saved) {
                    var newChats = JSON.parse(saved);
                    if (newChats.length !== allChats.length) {
                        allChats = newChats;
                        if (currentTab === 'dashboard') renderDashboard();
                        if (currentTab === 'chats') renderChats();
                        if (currentTab === 'users') renderUsers();
                    }
                }
            } catch(e) {}
        }, 5000); // Every 5 seconds
    }

    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    // ============================================
    // DASHBOARD
    // ============================================
    function renderDashboard() {
        var totalChats = allChats.length;
        var totalMessages = 0;
        for (var i = 0; i < allChats.length; i++) {
            totalMessages += (allChats[i].messages && allChats[i].messages.length) || 0;
        }

        var today = new Date().toDateString();
        var todayChats = 0;
        var weekChats = 0;
        var monthChats = 0;
        var now = new Date();
        var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        var monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        var dailyStats = {};
        var weeklyStats = {};

        for (var i = 0; i < allChats.length; i++) {
            var chatDate = new Date(allChats[i].timestamp);
            var dateStr = chatDate.toDateString();

            if (dateStr === today) todayChats++;
            if (chatDate >= weekAgo) weekChats++;
            if (chatDate >= monthAgo) monthChats++;

            // Daily stats for chart
            var dayKey = chatDate.toLocaleDateString('fa-IR');
            if (!dailyStats[dayKey]) dailyStats[dayKey] = 0;
            dailyStats[dayKey]++;
        }

        var statTotalChats = document.getElementById('stat-total-chats');
        var statTotalMessages = document.getElementById('stat-total-messages');
        var statTodayChats = document.getElementById('stat-today-chats');
        var statWeekChats = document.getElementById('stat-week-chats');
        var statMonthChats = document.getElementById('stat-month-chats');
        var statTraining = document.getElementById('stat-training-items');
        var statActiveUsers = document.getElementById('stat-active-users');

        if (statTotalChats) statTotalChats.textContent = totalChats;
        if (statTotalMessages) statTotalMessages.textContent = totalMessages;
        if (statTodayChats) statTodayChats.textContent = todayChats;
        if (statWeekChats) statWeekChats.textContent = weekChats;
        if (statMonthChats) statMonthChats.textContent = monthChats;
        if (statTraining) statTraining.textContent = botTraining.length;

        // Active users (unique phones in last 7 days)
        var activeUsers = {};
        for (var i = 0; i < allChats.length; i++) {
            var chatDate = new Date(allChats[i].timestamp);
            if (chatDate >= weekAgo && allChats[i].userPhone) {
                activeUsers[allChats[i].userPhone] = true;
            }
        }
        if (statActiveUsers) statActiveUsers.textContent = Object.keys(activeUsers).length;

        // Render chart
        renderChart(dailyStats);
    }

    function renderChart(dailyStats) {
        var chartContainer = document.getElementById('stats-chart');
        if (!chartContainer) return;

        var days = Object.keys(dailyStats).sort();
        if (days.length === 0) {
            chartContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">هنوز داده‌ای برای نمایش وجود ندارد</div>';
            return;
        }

        // Show last 14 days
        if (days.length > 14) {
            days = days.slice(days.length - 14);
        }

        var maxVal = 0;
        for (var i = 0; i < days.length; i++) {
            if (dailyStats[days[i]] > maxVal) maxVal = dailyStats[days[i]];
        }
        if (maxVal === 0) maxVal = 1;

        var html = '<div style="display:flex;align-items:flex-end;gap:6px;height:200px;padding:20px 0;">';
        for (var i = 0; i < days.length; i++) {
            var val = dailyStats[days[i]];
            var height = Math.round((val / maxVal) * 160);
            var tooltip = days[i] + ': ' + val + ' گفتگو';
            html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
                '<div style="font-size:11px;color:var(--gold);font-weight:600;">' + val + '</div>' +
                '<div style="width:100%;height:' + height + 'px;background:linear-gradient(to top, var(--primary), var(--primary-light));border-radius:4px 4px 0 0;min-height:4px;transition:all 0.3s ease;cursor:pointer;" title="' + tooltip + '"></div>' +
                '<div style="font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;text-align:center;">' + days[i].split('/')[2] + '/' + days[i].split('/')[1] + '</div>' +
                '</div>';
        }
        html += '</div>';

        chartContainer.innerHTML = html;
    }

    // ============================================
    // USERS
    // ============================================
    function renderUsers() {
        var usersList = document.getElementById('users-list');
        if (!usersList) return;

        var users = {};
        for (var i = 0; i < allChats.length; i++) {
            var phone = allChats[i].userPhone || 'ناشناس';
            var name = allChats[i].userName || 'ناشناس';
            if (!users[phone]) {
                users[phone] = { name: name, phone: phone, chats: 0, messages: 0, lastActive: 0 };
            }
            users[phone].chats++;
            users[phone].messages += (allChats[i].messages && allChats[i].messages.length) || 0;
            if (allChats[i].timestamp > users[phone].lastActive) {
                users[phone].lastActive = allChats[i].timestamp;
            }
        }

        var userArray = [];
        for (var key in users) {
            userArray.push(users[key]);
        }
        userArray.sort(function(a, b) { return b.lastActive - a.lastActive; });

        if (userArray.length === 0) {
            usersList.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128100;</div><div class="empty-title">هیچ کاربری یافت نشد</div><div class="empty-desc">هنوز کاربری ثبت نام نکرده است</div></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < userArray.length; i++) {
            var user = userArray[i];
            var lastActive = new Date(user.lastActive).toLocaleString('fa-IR');
            html += '<div class="user-card">' +
                '<div class="user-card-header">' +
                '<div class="user-card-avatar">&#128100;</div>' +
                '<div class="user-card-info">' +
                '<div class="user-card-name">' + escapeHtml(user.name) + '</div>' +
                '<div class="user-card-phone">&#128222; ' + escapeHtml(user.phone) + '</div>' +
                '</div>' +
                '<div class="user-card-stats">' +
                '<div class="user-stat"><strong>' + user.chats + '</strong> گفتگو</div>' +
                '<div class="user-stat"><strong>' + user.messages + '</strong> پیام</div>' +
                '</div>' +
                '</div>' +
                '<div class="user-card-footer">آخرین فعالیت: ' + lastActive + '</div>' +
                '</div>';
        }

        usersList.innerHTML = html;
    }

    // ============================================
    // CHATS
    // ============================================
    function renderChats(searchTerm) {
        var chatsList = document.getElementById('chats-list');
        if (!chatsList) return;

        var chats = allChats.slice();

        // Apply filters
        var filterDate = document.getElementById('filter-date');
        var filterMinMsgs = document.getElementById('filter-min-msgs');

        if (filterDate && filterDate.value) {
            var filterDateObj = new Date(filterDate.value);
            var filterDateStr = filterDateObj.toDateString();
            chats = chats.filter(function(chat) {
                return new Date(chat.timestamp).toDateString() === filterDateStr;
            });
        }

        if (filterMinMsgs && filterMinMsgs.value) {
            var minMsgs = parseInt(filterMinMsgs.value);
            chats = chats.filter(function(chat) {
                return (chat.messages && chat.messages.length) >= minMsgs;
            });
        }

        if (searchTerm) {
            var term = searchTerm.toLowerCase();
            chats = chats.filter(function(chat) {
                var text = (chat.userName || '') + ' ' + (chat.userPhone || '') + ' ';
                if (chat.messages) {
                    for (var i = 0; i < chat.messages.length; i++) {
                        text += chat.messages[i].content + ' ';
                    }
                }
                return text.toLowerCase().indexOf(term) !== -1;
            });
        }

        // Sort by newest first
        chats.sort(function(a, b) { return b.timestamp - a.timestamp; });

        if (chats.length === 0) {
            chatsList.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128172;</div><div class="empty-title">هیچ گفتگویی یافت نشد</div><div class="empty-desc">' + (searchTerm || (filterDate && filterDate.value) || (filterMinMsgs && filterMinMsgs.value) ? 'فیلترها را تغییر دهید' : 'هنوز گفتگویی ثبت نشده است') + '</div></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < chats.length; i++) {
            var chat = chats[i];
            var date = new Date(chat.timestamp).toLocaleString('fa-IR');
            var messageCount = (chat.messages && chat.messages.length) || 0;
            var preview = '';
            if (chat.messages) {
                for (var j = 0; j < chat.messages.length; j++) {
                    if (chat.messages[j].role === 'user') {
                        preview = chat.messages[j].content.substring(0, 60) + '...';
                        break;
                    }
                }
            }
            if (!preview) preview = 'بدون عنوان';

            var userName = chat.userName || 'ناشناس';
            var userPhone = chat.userPhone || 'شماره ثبت نشده';

            html += '<div class="chat-card">' +
                '<div class="chat-card-header"><div class="chat-card-title">' + escapeHtml(chat.title || 'گفتگوی بدون عنوان') + '</div><div class="chat-card-date">' + date + '</div></div>' +
                '<div class="chat-card-user-info">' +
                '<span class="user-badge user-name">&#128100; ' + escapeHtml(userName) + '</span>' +
                '<span class="user-badge user-phone">&#128222; ' + escapeHtml(userPhone) + '</span>' +
                '</div>' +
                '<div class="chat-card-preview">' + escapeHtml(preview) + '</div>' +
                '<div class="chat-card-footer"><span class="chat-card-count">' + messageCount + ' پیام</span>' +
                '<div class="chat-card-actions">' +
                '<button class="chat-card-btn view-btn" data-chat-id="' + chat.id + '">مشاهده</button>' +
                '<button class="chat-card-btn export-btn" data-chat-id="' + chat.id + '">خروجی</button>' +
                '<button class="chat-card-btn delete-btn" data-chat-id="' + chat.id + '">حذف</button>' +
                '</div></div></div>';
        }

        chatsList.innerHTML = html;

        // Bind view buttons
        var viewBtns = chatsList.querySelectorAll('.view-btn');
        for (var i = 0; i < viewBtns.length; i++) {
            viewBtns[i].addEventListener('click', function() {
                viewChat(this.dataset.chatId);
            });
        }

        // Bind export buttons
        var exportBtns = chatsList.querySelectorAll('.export-btn');
        for (var i = 0; i < exportBtns.length; i++) {
            exportBtns[i].addEventListener('click', function() {
                exportSingleChat(this.dataset.chatId);
            });
        }

        // Bind delete buttons
        var deleteBtns = chatsList.querySelectorAll('.delete-btn');
        for (var i = 0; i < deleteBtns.length; i++) {
            deleteBtns[i].addEventListener('click', function() {
                deleteChat(this.dataset.chatId);
            });
        }
    }

    function viewChat(chatId) {
        var chat = null;
        for (var i = 0; i < allChats.length; i++) {
            if (allChats[i].id === chatId) {
                chat = allChats[i];
                break;
            }
        }
        if (!chat) return;

        var modal = document.createElement('div');
        modal.className = 'modal-overlay';

        var messagesHtml = '';
        if (chat.messages) {
            for (var i = 0; i < chat.messages.length; i++) {
                var msg = chat.messages[i];
                var isUser = msg.role === 'user';
                messagesHtml += '<div class="modal-message ' + (isUser ? 'user' : 'bot') + '">' +
                    '<div class="modal-message-avatar">' + (isUser ? '&#128100;' : '&#128330;') + '</div>' +
                    '<div class="modal-message-content"><div class="modal-message-author">' + (isUser ? escapeHtml(chat.userName || 'کاربر') : 'اوای یقین') + '</div>' +
                    '<div class="modal-message-text">' + escapeHtml(msg.content) + '</div></div></div>';
            }
        }

        modal.innerHTML = '<div class="modal"><div class="modal-header"><h3>' + escapeHtml(chat.title || 'گفتگوی بدون عنوان') + '</h3>' +
            '<button class="modal-close">&times;</button></div>' +
            '<div class="modal-body chat-view">' + messagesHtml + '</div></div>';

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.remove();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
    }

    function exportSingleChat(chatId) {
        var chat = null;
        for (var i = 0; i < allChats.length; i++) {
            if (allChats[i].id === chatId) {
                chat = allChats[i];
                break;
            }
        }
        if (!chat) return;

        var text = 'گفتگو: ' + (chat.title || 'بدون عنوان') + '\n';
        text += 'کاربر: ' + (chat.userName || 'ناشناس') + '\n';
        text += 'شماره: ' + (chat.userPhone || 'ثبت نشده') + '\n';
        text += 'تاریخ: ' + new Date(chat.timestamp).toLocaleString('fa-IR') + '\n';
        text += '========================================\n\n';

        if (chat.messages) {
            for (var i = 0; i < chat.messages.length; i++) {
                var msg = chat.messages[i];
                text += (msg.role === 'user' ? (chat.userName || 'کاربر') : 'اوای یقین') + ':\n';
                text += msg.content + '\n\n';
            }
        }

        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'chat-' + chatId + '.txt';
        a.click();
        URL.revokeObjectURL(url);
        showToast('گفتگو با موفقیت دانلود شد');
    }

    function deleteChat(chatId) {
        if (!confirm('آیا از حذف این گفتگو اطمینان دارید؟')) return;

        var newChats = [];
        for (var i = 0; i < allChats.length; i++) {
            if (allChats[i].id !== chatId) {
                newChats.push(allChats[i]);
            }
        }
        allChats = newChats;
        localStorage.setItem('oay_chats', JSON.stringify(allChats));
        renderChats();
        renderDashboard();
        renderUsers();
        showToast('گفتگو حذف شد');
    }

    // ============================================
    // PERSONALITY
    // ============================================
    function loadPersonality() {
        var editor = document.getElementById('personality-editor');
        if (editor) editor.value = botPersonality;
    }

    function savePersonality() {
        var editor = document.getElementById('personality-editor');
        if (!editor) return;
        botPersonality = editor.value;
        localStorage.setItem('oay_personality', botPersonality);
        showToast('شخصیت ربات با موفقیت ذخیره شد');
    }

    function resetPersonality() {
        if (!confirm('آیا از بازگرداندن شخصیت پیش فرض اطمینان دارید؟')) return;
        botPersonality = BOT_PERSONALITY;
        var editor = document.getElementById('personality-editor');
        if (editor) editor.value = botPersonality;
        localStorage.setItem('oay_personality', botPersonality);
        showToast('شخصیت ربات به حالت پیش فرض بازگردانده شد');
    }

    // ============================================
    // TRAINING
    // ============================================
    function renderTraining() {
        var trainingList = document.getElementById('training-list');
        if (!trainingList) return;

        if (botTraining.length === 0) {
            trainingList.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128218;</div><div class="empty-title">هیچ آموزشی ثبت نشده</div><div class="empty-desc">با دکمه بالا دانش جدید به ربات اضافه کنید</div></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < botTraining.length; i++) {
            var item = botTraining[i];
            html += '<div class="training-item">' +
                '<div class="training-item-header"><span class="training-item-number">#' + (i + 1) + '</span>' +
                '<button class="training-item-delete" data-index="' + i + '">&times;</button></div>' +
                '<div class="training-item-question"><strong>سوال:</strong> ' + escapeHtml(item.question) + '</div>' +
                '<div class="training-item-answer"><strong>پاسخ:</strong> ' + escapeHtml(item.answer) + '</div></div>';
        }

        trainingList.innerHTML = html;

        var deleteBtns = trainingList.querySelectorAll('.training-item-delete');
        for (var i = 0; i < deleteBtns.length; i++) {
            deleteBtns[i].addEventListener('click', function() {
                deleteTraining(parseInt(this.dataset.index));
            });
        }
    }

    function addTrainingItem() {
        var modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = '<div class="modal"><div class="modal-header"><h3>افزودن دانش جدید</h3>' +
            '<button class="modal-close">&times;</button></div>' +
            '<div class="modal-body"><div class="form-group"><label>سوال / موضوع</label>' +
            '<input type="text" class="form-input" id="training-question" placeholder="سوال یا موضوع را وارد کنید..."></div>' +
            '<div class="form-group"><label>پاسخ / محتوا</label>' +
            '<textarea class="form-textarea" id="training-answer" rows="6" placeholder="پاسخ کامل را وارد کنید..."></textarea></div>' +
            '<button class="btn btn-primary" id="save-training-item">ذخیره</button></div></div>';

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.remove();
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });

        modal.querySelector('#save-training-item').addEventListener('click', function() {
            var question = document.getElementById('training-question').value.trim();
            var answer = document.getElementById('training-answer').value.trim();

            if (!question || !answer) {
                showToast('لطفا هر دو فیلد را پر کنید');
                return;
            }

            botTraining.push({ question: question, answer: answer, timestamp: Date.now() });
            localStorage.setItem('oay_training', JSON.stringify(botTraining));
            modal.remove();
            renderTraining();
            renderDashboard();
            showToast('دانش جدید با موفقیت اضافه شد');
        });
    }

    function deleteTraining(index) {
        if (!confirm('آیا از حذف این مورد اطمینان دارید؟')) return;
        botTraining.splice(index, 1);
        localStorage.setItem('oay_training', JSON.stringify(botTraining));
        renderTraining();
        renderDashboard();
    }

    // ============================================
    // SETTINGS
    // ============================================
    function updateModelOptions(provider) {
        var modelSelect = document.getElementById('setting-model');
        if (!modelSelect) return;

        var providerConfig = CONFIG.PROVIDERS[provider];
        if (!providerConfig) return;

        modelSelect.innerHTML = '';
        for (var i = 0; i < providerConfig.models.length; i++) {
            var model = providerConfig.models[i];
            var option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            modelSelect.appendChild(option);
        }

        // Update URL
        var urlInput = document.getElementById('setting-api-url');
        if (urlInput && provider !== 'custom') {
            urlInput.value = providerConfig.url;
        }

        // Update API key hint
        var keyHint = document.getElementById('api-key-hint');
        if (keyHint) {
            keyHint.textContent = 'مثال: ' + (provider === 'openai' ? 'sk-...' : provider === 'anthropic' ? 'sk-ant-...' : provider === 'google' ? 'AIzaSy...' : 'gsk_...');
        }
    }

    function loadSettings() {
        var provider = settings.provider || CONFIG.DEFAULT_PROVIDER;
        var providerConfig = CONFIG.PROVIDERS[provider] || CONFIG.PROVIDERS.groq;

        var defaults = {
            provider: CONFIG.DEFAULT_PROVIDER,
            apiKey: CONFIG.DEFAULT_API_KEY,
            apiUrl: CONFIG.DEFAULT_URL,
            model: CONFIG.DEFAULT_MODEL,
            temperature: CONFIG.DEFAULT_TEMPERATURE,
            maxTokens: CONFIG.DEFAULT_MAX_TOKENS,
            topP: CONFIG.DEFAULT_TOP_P,
            frequencyPenalty: CONFIG.DEFAULT_FREQUENCY_PENALTY,
            presencePenalty: CONFIG.DEFAULT_PRESENCE_PENALTY,
            welcomeMessage: 'بسم الله الرحمن الرحیم\nسلام و رحمت خدا بر شما. من اوای یقین هستم، دستیار هوشمند مسجد حضرت ابوالفضل (ع). چطور می توانم به شما کمک کنم؟',
            enableHistory: true,
            maxHistoryChats: 50,
            autoRefresh: true
        };

        var s = {};
        for (var key in defaults) {
            s[key] = settings[key] !== undefined ? settings[key] : defaults[key];
        }

        var el;

        el = document.getElementById('setting-provider');
        if (el) {
            el.value = s.provider;
            updateModelOptions(s.provider);
        }

        el = document.getElementById('setting-api-key');
        if (el) el.value = s.apiKey;

        el = document.getElementById('setting-api-url');
        if (el) el.value = s.apiUrl;

        el = document.getElementById('setting-model');
        if (el) el.value = s.model;

        el = document.getElementById('setting-temperature');
        if (el) el.value = s.temperature;

        el = document.getElementById('setting-temp-value');
        if (el) el.textContent = s.temperature;

        el = document.getElementById('setting-max-tokens');
        if (el) el.value = s.maxTokens;

        el = document.getElementById('setting-top-p');
        if (el) el.value = s.topP;

        el = document.getElementById('setting-top-p-value');
        if (el) el.textContent = s.topP;

        el = document.getElementById('setting-frequency-penalty');
        if (el) el.value = s.frequencyPenalty;

        el = document.getElementById('setting-freq-value');
        if (el) el.textContent = s.frequencyPenalty;

        el = document.getElementById('setting-presence-penalty');
        if (el) el.value = s.presencePenalty;

        el = document.getElementById('setting-pres-value');
        if (el) el.textContent = s.presencePenalty;

        el = document.getElementById('setting-welcome');
        if (el) el.value = s.welcomeMessage;

        el = document.getElementById('setting-enable-history');
        if (el) el.checked = s.enableHistory;

        el = document.getElementById('setting-max-history');
        if (el) el.value = s.maxHistoryChats;

        el = document.getElementById('setting-auto-refresh');
        if (el) el.checked = s.autoRefresh;
    }

    function saveSettings() {
        var el;
        settings = {};

        el = document.getElementById('setting-provider');
        if (el) settings.provider = el.value;

        el = document.getElementById('setting-api-key');
        if (el) settings.apiKey = el.value;

        el = document.getElementById('setting-api-url');
        if (el) settings.apiUrl = el.value;

        el = document.getElementById('setting-model');
        if (el) settings.model = el.value;

        el = document.getElementById('setting-temperature');
        if (el) settings.temperature = parseFloat(el.value);

        el = document.getElementById('setting-max-tokens');
        if (el) settings.maxTokens = parseInt(el.value);

        el = document.getElementById('setting-top-p');
        if (el) settings.topP = parseFloat(el.value);

        el = document.getElementById('setting-frequency-penalty');
        if (el) settings.frequencyPenalty = parseFloat(el.value);

        el = document.getElementById('setting-presence-penalty');
        if (el) settings.presencePenalty = parseFloat(el.value);

        el = document.getElementById('setting-welcome');
        if (el) settings.welcomeMessage = el.value;

        el = document.getElementById('setting-enable-history');
        if (el) settings.enableHistory = el.checked;

        el = document.getElementById('setting-max-history');
        if (el) settings.maxHistoryChats = parseInt(el.value);

        el = document.getElementById('setting-auto-refresh');
        if (el) settings.autoRefresh = el.checked;

        localStorage.setItem('oay_settings', JSON.stringify(settings));
        showToast('تنظیمات با موفقیت ذخیره شد');
    }

    function resetSettings() {
        if (!confirm('آیا از بازگرداندن تنظیمات پیش فرض اطمینان دارید؟')) return;
        settings = {};
        localStorage.removeItem('oay_settings');
        loadSettings();
        showToast('تنظیمات به حالت پیش فرض بازگردانده شد');
    }

    // ============================================
    // TEST API
    // ============================================
    function testApiConnection() {
        var provider = document.getElementById('setting-provider').value;
        var apiKey = document.getElementById('setting-api-key').value;
        var apiUrl = document.getElementById('setting-api-url').value;
        var model = document.getElementById('setting-model').value;

        if (!apiKey) {
            showToast('لطفا API Key را وارد کنید');
            return;
        }

        var testBtn = document.getElementById('test-api');
        var originalText = testBtn.textContent;
        testBtn.textContent = 'در حال تست...';
        testBtn.disabled = true;

        var providerConfig = CONFIG.PROVIDERS[provider] || CONFIG.PROVIDERS.groq;

        var requestBody, headers = { 'Content-Type': 'application/json' };

        if (provider === 'anthropic') {
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            requestBody = {
                model: model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'سلام' }]
            };
        } else if (provider === 'google') {
            var geminiUrl = apiUrl + model + ':generateContent?key=' + apiKey;
            requestBody = {
                contents: [{ role: 'user', parts: [{ text: 'سلام' }] }],
                generationConfig: { maxOutputTokens: 10 }
            };

            fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }).then(function(response) {
                testBtn.textContent = originalText;
                testBtn.disabled = false;
                if (response.ok) {
                    showToast('✅ اتصال API موفق!');
                } else {
                    showToast('❌ خطا: ' + response.status);
                }
            }).catch(function(err) {
                testBtn.textContent = originalText;
                testBtn.disabled = false;
                showToast('❌ خطای اتصال: ' + err.message);
            });
            return;
        } else {
            headers['Authorization'] = 'Bearer ' + apiKey;
            requestBody = {
                model: model,
                messages: [{ role: 'user', content: 'سلام' }],
                max_tokens: 10
            };
        }

        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        }).then(function(response) {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            if (response.ok) {
                showToast('✅ اتصال API موفق!');
            } else {
                showToast('❌ خطا: ' + response.status);
            }
        }).catch(function(err) {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            showToast('❌ خطای اتصال: ' + err.message);
        });
    }

    // ============================================
    // DATA MANAGEMENT
    // ============================================
    function exportData() {
        var data = {
            chats: allChats,
            personality: botPersonality,
            training: botTraining,
            settings: settings,
            exportDate: new Date().toISOString()
        };

        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'oay-yaqin-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('پشتیبان گیری با موفقیت انجام شد');
    }

    function exportExcel() {
        var csv = '\uFEFF'; // BOM for Excel UTF-8
        csv += 'شماره,نام کاربر,شماره تماس,تاریخ,تعداد پیام,اولین پیام\n';

        for (var i = 0; i < allChats.length; i++) {
            var chat = allChats[i];
            var name = (chat.userName || 'ناشناس').replace(/,/g, ' ');
            var phone = (chat.userPhone || 'ثبت نشده').replace(/,/g, ' ');
            var date = new Date(chat.timestamp).toLocaleString('fa-IR');
            var count = (chat.messages && chat.messages.length) || 0;
            var firstMsg = '';
            if (chat.messages) {
                for (var j = 0; j < chat.messages.length; j++) {
                    if (chat.messages[j].role === 'user') {
                        firstMsg = chat.messages[j].content.substring(0, 50).replace(/,/g, ' ').replace(/\n/g, ' ');
                        break;
                    }
                }
            }
            csv += (i + 1) + ',' + name + ',' + phone + ',' + date + ',' + count + ',' + firstMsg + '\n';
        }

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'oay-chats-' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('خروجی Excel با موفقیت دانلود شد');
    }

    function exportPDF() {
        var html = '<html dir="rtl"><head><meta charset="UTF-8"><style>' +
            'body{font-family:'Vazirmatn',Tahoma;font-size:12px;line-height:1.8;padding:20px;}' +
            'h1{color:#1a5c3a;text-align:center;}h2{color:#c9a84c;border-bottom:1px solid #ddd;padding-bottom:5px;}' +
            '.chat{margin-bottom:20px;border:1px solid #ddd;padding:15px;border-radius:8px;}' +
            '.user{color:#1a5c3a;font-weight:bold;}.bot{color:#c9a84c;font-weight:bold;}' +
            '.msg{margin:8px 0;padding:8px;background:#f9f9f9;border-radius:4px;}' +
            '.meta{color:#666;font-size:11px;margin-bottom:5px;}' +
            '</style></head><body>' +
            '<h1>&#128330; گزارش گفتگوها - اوای یقین</h1>' +
            '<p style="text-align:center;color:#666;">تاریخ گزارش: ' + new Date().toLocaleString('fa-IR') + '</p>';

        for (var i = 0; i < allChats.length; i++) {
            var chat = allChats[i];
            html += '<div class="chat">' +
                '<h2>گفتگوی ' + (i + 1) + '</h2>' +
                '<div class="meta">کاربر: ' + (chat.userName || 'ناشناس') + ' | شماره: ' + (chat.userPhone || 'ثبت نشده') + ' | تاریخ: ' + new Date(chat.timestamp).toLocaleString('fa-IR') + '</div>';

            if (chat.messages) {
                for (var j = 0; j < chat.messages.length; j++) {
                    var msg = chat.messages[j];
                    html += '<div class="msg"><span class="' + msg.role + '">' + (msg.role === 'user' ? (chat.userName || 'کاربر') : 'اوای یقین') + ':</span><br>' + escapeHtml(msg.content).replace(/\n/g, '<br>') + '</div>';
                }
            }
            html += '</div>';
        }

        html += '</body></html>';

        var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'oay-chats-report-' + new Date().toISOString().split('T')[0] + '.html';
        a.click();
        URL.revokeObjectURL(url);
        showToast('گزارش HTML با موفقیت دانلود شد (با مرورگر باز کنید و پرینت بگیرید)');
    }

    function importData() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var data = JSON.parse(event.target.result);

                    if (data.chats) {
                        allChats = data.chats;
                        localStorage.setItem('oay_chats', JSON.stringify(allChats));
                    }
                    if (data.personality) {
                        botPersonality = data.personality;
                        localStorage.setItem('oay_personality', botPersonality);
                    }
                    if (data.training) {
                        botTraining = data.training;
                        localStorage.setItem('oay_training', JSON.stringify(botTraining));
                    }
                    if (data.settings) {
                        settings = data.settings;
                        localStorage.setItem('oay_settings', JSON.stringify(settings));
                    }

                    renderDashboard();
                    renderChats();
                    renderUsers();
                    showToast('داده ها با موفقیت بازیابی شد');
                } catch (err) {
                    showToast('خطا در خواندن فایل');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function clearAllData() {
        if (!confirm('هشدار: این عملیات تمام داده ها را حذف می کند. آیا اطمینان دارید؟')) return;
        if (!confirm('آیا واقعا مطمئن هستید؟ این عملیات غیرقابل بازگشت است!')) return;

        localStorage.removeItem('oay_chats');
        localStorage.removeItem('oay_personality');
        localStorage.removeItem('oay_training');
        localStorage.removeItem('oay_settings');

        allChats = [];
        botPersonality = BOT_PERSONALITY;
        botTraining = [];
        settings = {};

        renderDashboard();
        renderChats();
        renderUsers();
        loadPersonality();
        renderTraining();
        loadSettings();
        showToast('تمام داده ها حذف شد');
    }

    // ============================================
    // UTILITIES
    // ============================================
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message) {
        var existing = document.querySelector('.admin-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'admin-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('show');
        });

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // Expose init function
    window.initAdminPanel = init;

    // Auto-init
    function tryInit() {
        var adminContent = document.getElementById('admin-content');
        if (adminContent && adminContent.classList.contains('active')) {
            init();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
})();
