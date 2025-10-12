/**
 * PWA 功能模块 - 简化版本
 * 仅处理基本的 Service Worker 注册，不提供离线缓存功能
 */

class PWAManager {
    constructor() {
        this.registration = null;
        this.init();
    }

    /**
     * 初始化 PWA 功能
     */
    async init() {
        await this.registerServiceWorker();
        console.log('PWA Manager 初始化完成 (简化版本)');
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
     * 检查更新
     */
    checkForUpdates() {
        if (this.registration) {
            this.registration.update();
        }
    }

    /**
     * 卸载 Service Worker（用于完全移除缓存功能）
     */
    async unregisterServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                    console.log('Service Worker 已卸载:', registration);
                }
                
                // 清理所有缓存
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
                console.log('所有缓存已清理');
                
            } catch (error) {
                console.error('卸载 Service Worker 失败:', error);
            }
        }
    }

    /**
     * 获取应用信息
     * @returns {Object} 应用信息
     */
    getAppInfo() {
        return {
            hasServiceWorker: 'serviceWorker' in navigator,
            registration: this.registration,
            cacheDisabled: true // 标识缓存已禁用
        };
    }
}

// 创建全局 PWA 管理器实例
window.pwaManager = new PWAManager();

// 导出类供其他模块使用
export default PWAManager;