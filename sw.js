/**
 * Service Worker - 简化版本
 * 不提供离线缓存功能
 */

// Service Worker 版本
const SW_VERSION = 'v1.0.0-no-cache';

// 安装事件 - 不进行任何缓存
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中... (无缓存版本)');
    // 立即激活新的 Service Worker
    self.skipWaiting();
});

// 激活事件 - 清理所有旧缓存
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活中...');
    
    event.waitUntil(
        // 清理所有现有缓存
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('删除缓存:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            console.log('所有缓存已清理');
            return self.clients.claim();
        })
    );
});

// 拦截网络请求 - 直接转发，不使用缓存
self.addEventListener('fetch', (event) => {
    // 直接从网络获取资源，不使用任何缓存
    event.respondWith(
        fetch(event.request).catch((error) => {
            console.log('网络请求失败:', event.request.url, error);
            // 如果是导航请求且网络失败，返回一个简单的离线页面
            if (event.request.mode === 'navigate') {
                return new Response(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>网络连接失败</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                text-align: center; 
                                padding: 50px; 
                                color: #666; 
                            }
                            h1 { color: #333; }
                            .retry-btn {
                                background: #1e40af;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>网络连接失败</h1>
                        <p>请检查您的网络连接</p>
                        <button class="retry-btn" onclick="location.reload()">重试</button>
                    </body>
                    </html>
                `, {
                    headers: { 'Content-Type': 'text/html' }
                });
            }
            // 对于其他请求，抛出错误
            throw error;
        })
    );
});

// 推送消息事件（保留基本功能）
self.addEventListener('push', (event) => {
    console.log('收到推送消息:', event);
    
    const options = {
        body: event.data ? event.data.text() : '您有新的消息',
        icon: '/assets/images/tjca.ico',
        badge: '/assets/images/tjca.ico',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: '/assets/images/tjca.ico'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/assets/images/tjca.ico'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('TJCA Website', options)
    );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
    console.log('通知被点击:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('Service Worker 已加载 (无缓存版本)');