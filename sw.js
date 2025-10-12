/**
 * Service Worker
 * 提供离线缓存和后台同步功能
 */

const CACHE_NAME = 'cube-contest-v1.0.1';
const STATIC_CACHE = 'static-v1.0.1';
const DYNAMIC_CACHE = 'dynamic-v1.0.1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/school-records.html',
    '/weekly-contests.html',
    '/admin.html',
    '/assets/css/styles.css',
    '/assets/css/components.css',
    '/assets/css/responsive.css',
    '/assets/js/app.js',
    '/assets/js/utils.js',
    '/assets/js/api.js',
    '/assets/js/components/records.js',
    '/assets/js/components/contests.js',
    '/assets/images/fdu.ico',
    '/manifest.json'
];

// 需要缓存的 API 端点
const API_CACHE_PATTERNS = [
    /\/api\/records/,
    /\/api\/contests/,
    /\/api\/stats/
];

// 安装事件
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('缓存静态资源...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('静态资源缓存完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('静态资源缓存失败:', error);
            })
    );
});

// 激活事件
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 删除所有旧版本的缓存
                        if (!cacheName.includes('v1.0.1')) {
                            console.log('删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker 激活完成');
                return self.clients.claim();
            })
    );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // 只处理 GET 请求
    if (request.method !== 'GET') {
        return;
    }
    
    try {
        const url = new URL(request.url);
        
        // 跳过非HTTP(S)请求
        if (!url.protocol.startsWith('http')) {
            return;
        }
        
        // 处理静态资源请求
        if (STATIC_ASSETS.includes(url.pathname)) {
            event.respondWith(handleStaticRequest(request));
            return;
        }
        
        // 处理 API 请求
        if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
            event.respondWith(handleAPIRequest(request));
            return;
        }
        
        // 处理其他请求
        event.respondWith(handleOtherRequest(request));
    } catch (error) {
        console.warn('处理请求时出错:', error);
        // 不响应无效请求，让浏览器处理
        return;
    }
});

// 处理静态资源请求
async function handleStaticRequest(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('静态资源请求失败:', error);
        return new Response('资源加载失败', { status: 404 });
    }
}

// 处理 API 请求
async function handleAPIRequest(request) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        // 尝试网络请求
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                // 缓存成功的响应
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (networkError) {
            console.log('网络请求失败，尝试使用缓存:', networkError);
        }
        
        // 如果网络失败，返回缓存
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 如果既没有网络也没有缓存，返回离线提示
        return new Response(
            JSON.stringify({
                code: 503,
                message: '网络不可用，请检查网络连接',
                data: null
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('API 请求处理失败:', error);
        return new Response('请求失败', { status: 500 });
    }
}

// 处理其他请求
async function handleOtherRequest(request) {
    try {
        // 检查请求是否有效
        if (!request || !request.url) {
            console.warn('无效的请求对象');
            return new Response('无效请求', { status: 400 });
        }

        // 尝试网络请求
        const response = await fetch(request);
        
        // 检查响应状态
        if (!response.ok) {
            console.warn(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.warn('网络请求失败，可能是离线状态:', error.message);
        
        // 对于某些请求，我们可以返回一个基本的响应而不是错误
        if (request.url.includes('.html')) {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>离线模式</title>
                    <meta charset="utf-8">
                </head>
                <body>
                    <h1>离线模式</h1>
                    <p>网络连接不可用，请检查网络连接后重试。</p>
                </body>
                </html>
            `, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // 对于其他请求，返回适当的错误响应
        return new Response('网络不可用', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// 后台同步
self.addEventListener('sync', (event) => {
    console.log('后台同步事件:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 执行后台同步
async function doBackgroundSync() {
    try {
        console.log('执行后台同步...');
        
        // 这里可以添加需要后台同步的逻辑
        // 比如上传离线时保存的数据
        
        console.log('后台同步完成');
    } catch (error) {
        console.error('后台同步失败:', error);
    }
}

// 推送通知
self.addEventListener('push', (event) => {
    console.log('收到推送消息:', event);
    
    const options = {
        body: event.data ? event.data.text() : '您有新的消息',
        icon: '/assets/images/fdu.ico',
        badge: '/assets/images/fdu.ico',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情'
                // icon: '/assets/images/action-view.png' // 图标文件不存在
            },
            {
                action: 'close',
                title: '关闭'
                // icon: '/assets/images/action-close.png' // 图标文件不存在
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('魔方周赛记录系统', options)
    );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
    console.log('通知被点击:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 关闭通知，不需要额外操作
    } else {
        // 默认点击行为
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 处理通知关闭
self.addEventListener('notificationclose', (event) => {
    console.log('通知被关闭:', event);
});

// 消息处理
self.addEventListener('message', (event) => {
    console.log('收到消息:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(STATIC_CACHE)
                .then((cache) => cache.addAll(event.data.urls))
        );
    }
});

// 错误处理
self.addEventListener('error', (event) => {
    console.error('Service Worker 错误:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker 未处理的 Promise 拒绝:', event.reason);
});
