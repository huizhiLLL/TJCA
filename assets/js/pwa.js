/**
 * PWA 功能模块
 * 处理 Service Worker 注册和 PWA 相关功能
 */

class PWAManager {
    constructor() {
        this.registration = null;
        this.isOnline = navigator.onLine;
        this.deferredPrompt = null;
        this.init();
    }

    /**
     * 初始化 PWA 功能
     */
    async init() {
        await this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOnlineOfflineHandlers();
        this.setupUpdateHandlers();
    }

    /**
     * 注册 Service Worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('./sw.js', {
                    scope: './'
                });
                
                console.log('Service Worker 注册成功:', this.registration);
                
                // 检查更新
                this.checkForUpdates();
                
            } catch (error) {
                console.error('Service Worker 注册失败:', error);
            }
        } else {
            console.log('当前浏览器不支持 Service Worker');
        }
    }

    /**
     * 设置安装提示
     */
    setupInstallPrompt() {
        // 监听 beforeinstallprompt 事件
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA 安装提示可用');
            e.preventDefault();
            this.deferredPrompt = e;
            // 不显示安装按钮，保持页面干净
            // this.showInstallButton();
        });

        // 监听 appinstalled 事件
        window.addEventListener('appinstalled', () => {
            console.log('PWA 已安装');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });
    }

    /**
     * 显示安装按钮
     */
    showInstallButton() {
        // 创建安装按钮
        const installButton = document.createElement('button');
        installButton.id = 'install-button';
        installButton.innerHTML = `
            <i class="fas fa-download"></i>
            安装应用
        `;
        installButton.className = 'install-button';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        installButton.addEventListener('click', () => this.installApp());
        installButton.addEventListener('mouseenter', () => {
            installButton.style.transform = 'translateY(-2px)';
            installButton.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
        });
        installButton.addEventListener('mouseleave', () => {
            installButton.style.transform = 'translateY(0)';
            installButton.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
        });

        document.body.appendChild(installButton);
    }

    /**
     * 隐藏安装按钮
     */
    hideInstallButton() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.remove();
        }
    }

    /**
     * 安装应用
     */
    async installApp() {
        if (!this.deferredPrompt) {
            return;
        }

        try {
            // 显示安装提示
            this.deferredPrompt.prompt();
            
            // 等待用户响应
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log('用户选择:', outcome);
            
            if (outcome === 'accepted') {
                console.log('用户接受了安装');
            } else {
                console.log('用户拒绝了安装');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('安装失败:', error);
        }
    }

    /**
     * 设置在线/离线处理
     */
    setupOnlineOfflineHandlers() {
        window.addEventListener('online', () => {
            console.log('网络已连接');
            this.isOnline = true;
            // 不显示在线状态提示，保持页面干净
            // this.showOnlineStatus();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            console.log('网络已断开');
            this.isOnline = false;
            // 不显示离线状态提示，保持页面干净
            // this.showOfflineStatus();
        });
    }

    /**
     * 显示在线状态
     */
    showOnlineStatus() {
        this.showStatusMessage('网络已连接', 'success');
    }

    /**
     * 显示离线状态
     */
    showOfflineStatus() {
        this.showStatusMessage('网络已断开，部分功能可能不可用', 'warning');
    }

    /**
     * 显示状态消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showStatusMessage(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#10b981' : '#f59e0b'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1001;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(statusDiv);

        setTimeout(() => {
            statusDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => statusDiv.remove(), 300);
        }, 3000);
    }

    /**
     * 同步离线数据
     */
    async syncOfflineData() {
        try {
            // 这里可以添加同步离线数据的逻辑
            console.log('同步离线数据...');
        } catch (error) {
            console.error('同步离线数据失败:', error);
        }
    }

    /**
     * 设置更新处理
     */
    setupUpdateHandlers() {
        if (this.registration) {
            this.registration.addEventListener('updatefound', () => {
                console.log('发现新版本');
                // 不显示更新提示，保持页面干净
                // this.showUpdateAvailable();
            });
        }

        // 监听 Service Worker 消息
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                // 不显示更新提示，保持页面干净
                // this.showUpdateAvailable();
            }
        });
    }

    /**
     * 检查更新
     */
    checkForUpdates() {
        if (this.registration) {
            this.registration.update();
        }
    }

    /**
     * 显示更新可用
     */
    showUpdateAvailable() {
        const updateDiv = document.createElement('div');
        updateDiv.className = 'update-available';
        updateDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
                z-index: 1001;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <i class="fas fa-sync-alt" style="animation: spin 1s linear infinite;"></i>
                <span>发现新版本，点击刷新</span>
                <button onclick="this.closest('.update-available').remove(); location.reload();" 
                        style="
                            background: rgba(255, 255, 255, 0.2);
                            border: none;
                            color: white;
                            padding: 6px 12px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                    刷新
                </button>
            </div>
        `;

        document.body.appendChild(updateDiv);

        // 10秒后自动移除
        setTimeout(() => {
            if (updateDiv.parentNode) {
                updateDiv.remove();
            }
        }, 10000);
    }

    /**
     * 检查是否已安装
     * @returns {boolean} 是否已安装
     */
    isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    /**
     * 获取应用信息
     * @returns {Object} 应用信息
     */
    getAppInfo() {
        return {
            isInstalled: this.isInstalled(),
            isOnline: this.isOnline,
            hasServiceWorker: 'serviceWorker' in navigator,
            canInstall: !!this.deferredPrompt
        };
    }
}

// CSS 动画已移除，因为不再显示PWA UI元素

// 创建全局 PWA 管理器实例
window.pwaManager = new PWAManager();

// 导出类供其他模块使用
export default PWAManager;
