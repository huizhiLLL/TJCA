/**
 * 工具函数模块
 * 提供通用的工具函数和辅助方法
 */

// 格式化时间
export const formatTime = (time) => {
    if (!time || time === '') {
        return '';
    }
    if (typeof time === 'string' && time.includes(':')) {
        return time;
    }
    const num = parseFloat(time);
    if (isNaN(num)) {
        return '';
    }
    if (num < 60) {
        return num.toFixed(2);
    } else {
        const minutes = Math.floor(num / 60);
        const seconds = (num % 60).toFixed(2);
        return `${minutes}:${seconds.padStart(5, '0')}`;
    }
};

// 获取排名样式类
export const getRankingClass = (ranking) => {
    if (ranking === 1) return 'ranking-1';
    if (ranking === 2) return 'ranking-2';
    if (ranking === 3) return 'ranking-3';
    return 'ranking-other';
};

// 动画计数器
export const animateCounter = (element, start, end, duration) => {
    const startTime = performance.now();
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    requestAnimationFrame(animate);
};

// 提示消息配置
const TOAST_CONFIG = {
    error: {
        duration: 2000,  // 错误提示显示4秒
        animation: 'slideInRight 0.3s ease'
    },
    success: {
        duration: 1500,  // 成功提示显示3秒
        animation: 'slideInRight 0.3s ease'
    }
};

// 显示错误消息
export const showError = (message, customDuration = null) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    const duration = customDuration || TOAST_CONFIG.error.duration;
    setTimeout(() => {
        // 添加消失动画
        errorDiv.style.animation = 'slideOutRight 0.3s ease';
        // 动画结束后移除元素
        setTimeout(() => {
            errorDiv.remove();
        }, 300);
    }, duration);
};

// 显示成功消息
export const showSuccess = (message, customDuration = null) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    const duration = customDuration || TOAST_CONFIG.success.duration;
    setTimeout(() => {
        // 添加消失动画
        successDiv.style.animation = 'slideOutRight 0.3s ease';
        // 动画结束后移除元素
        setTimeout(() => {
            successDiv.remove();
        }, 300);
    }, duration);
};

// 防抖函数
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 节流函数
export const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// 深拷贝
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

// 生成唯一ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 验证邮箱格式
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// 验证手机号格式
export const validatePhone = (phone) => {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
};

// 格式化日期
export const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
};

// 获取相对时间
export const getRelativeTime = (date) => {
    const now = new Date();
    const target = new Date(date);
    const diff = now - target;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;
    
    if (diff < minute) {
        return '刚刚';
    } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
        return `${Math.floor(diff / day)}天前`;
    } else if (diff < month) {
        return `${Math.floor(diff / week)}周前`;
    } else if (diff < year) {
        return `${Math.floor(diff / month)}个月前`;
    } else {
        return `${Math.floor(diff / year)}年前`;
    }
};

// 存储到本地存储
export const setStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('存储失败:', error);
    }
};

// 从本地存储获取
export const getStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('获取存储失败:', error);
        return defaultValue;
    }
};

// 移除本地存储
export const removeStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('移除存储失败:', error);
    }
};

// 缓存管理器
export class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxSize = 100;
    }

    set(key, value, ttl = 300000) { // 5分钟默认过期
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clear() {
        this.cache.clear();
    }
}

// 创建全局缓存实例
export const cache = new CacheManager();
