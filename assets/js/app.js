/**
 * 主应用逻辑
 * 应用程序的入口点和核心逻辑
 */

import { RecordsComponent } from './components/records.js';
import { ContestsComponent } from './components/contests.js';
import { showError } from './utils.js';

/**
 * 首页功能模块
 */
class HomePage {
    constructor() {
    }

    /**
     * 初始化首页
     */
    async init() {
        // 首页目前无需特殊初始化逻辑
    }
}

/**
 * 应用主类
 */
class App {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.components = {};
    }

    /**
     * 获取当前页面
     * @returns {string} 页面名称
     */
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('school-records')) return 'school-records';
        if (path.includes('weekly-contests')) return 'weekly-contests';
        if (path.includes('admin')) return 'admin';
        return 'home';
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            await this.initializePage();
            this.bindGlobalEvents();
            this.initializeAnimations();
        } catch (error) {
            console.error('应用初始化失败:', error);
            showError('应用初始化失败: ' + error.message);
        }
    }

    /**
     * 初始化页面
     */
    async initializePage() {
        switch (this.currentPage) {
            case 'home':
                this.components.homePage = new HomePage();
                await this.components.homePage.init();
                break;
            
            case 'school-records':
                // 等待DOM完全加载
                await new Promise(resolve => setTimeout(resolve, 100));
                this.components.records = new RecordsComponent(
                    document.getElementById('current-records-table-body')
                );
                await this.components.records.init();
                // 将组件实例挂载到全局，供 HTML 中的函数使用
                window.recordsComponent = this.components.records;
                break;
            
            case 'weekly-contests':
                // 等待DOM完全加载
                await new Promise(resolve => setTimeout(resolve, 100));
                this.components.contests = new ContestsComponent(
                    document.getElementById('contests-timeline')
                );
                await this.components.contests.init();
                // 将组件实例挂载到全局，供 HTML 中的函数使用
                window.contestsComponent = this.components.contests;
                break;
            
            case 'admin':
                // 管理后台页面初始化
                this.initializeAdminPage();
                break;
            
            default:
                console.warn('未知页面:', this.currentPage);
        }
    }

    /**
     * 初始化管理后台页面
     */
    initializeAdminPage() {
        // 管理后台页面逻辑将在未来实现
    }

    /**
     * 绑定全局事件
     */
    bindGlobalEvents() {
        // 移动端导航菜单切换
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
            
            // 点击菜单链接后关闭菜单
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                });
            });
            
            // 点击菜单外部关闭菜单
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            });
        }

        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // 窗口大小改变时的处理
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // 页面可见性变化处理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
    }

    /**
     * 初始化动画
     */
    initializeAnimations() {
        const elements = document.querySelectorAll('.fade-in-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    }

    /**
     * 处理窗口大小改变
     */
    handleResize() {
        // 移动端导航菜单在窗口变大时自动关闭
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && window.innerWidth > 768) {
            navMenu.classList.remove('active');
        }
    }

    /**
     * 处理页面隐藏
     */
    handlePageHidden() {
        // 页面隐藏时的处理逻辑将在未来实现
    }

    /**
     * 处理页面显示
     */
    handlePageVisible() {
        // 页面显示时的处理逻辑将在未来实现
    }

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
