/**
 * 校记录组件
 * 处理校记录的显示和交互逻辑
 */

import { formatTime, showError, showSuccess } from '../utils.js';
import { recordsAPI } from '../api.js';
import { mockData } from '../mockData.js';

/**
 * 校记录组件类
 */
export class RecordsComponent {
    constructor(container, apiClient = recordsAPI) {
        this.container = container;
        this.apiClient = apiClient;
        this.currentView = 'current';
        this.records = [];
    }

    /**
     * 初始化组件
     */
    async init() {
        await this.loadRecords();
        this.bindEvents();
    }

    /**
     * 加载校记录
     * @param {Object} filters - 筛选条件
     */
    async loadRecords(filters = {}) {
        try {
            this.showLoading();
            
            if (this.currentView === 'current') {
                // 使用静态数据
                this.records = mockData.schoolRecords;
            } else {
                // 历史记录使用空数据
                this.records = mockData.historyRecords;
            }
            
            this.renderRecords();
        } catch (error) {
            console.error('加载校记录失败:', error);
            this.showError('加载校记录失败: ' + error.message);
        }
    }

    /**
     * 渲染校记录
     */
    renderRecords() {
        const currentRecords = document.getElementById('current-records');
        const historyRecords = document.getElementById('history-records');
        const currentTableBody = document.getElementById('current-records-table-body');
        const historyTableBody = document.getElementById('history-records-table-body');
        const noData = document.getElementById('no-data');
        
        if (this.currentView === 'current') {
            this.renderCurrentRecords(currentRecords, currentTableBody, noData);
        } else {
            this.renderHistoryRecords(historyRecords, historyTableBody, noData);
        }
    }

    /**
     * 渲染当前记录
     * @param {HTMLElement} container - 容器元素
     * @param {HTMLElement} tableBody - 表格体
     * @param {HTMLElement} noData - 无数据提示
     */
    renderCurrentRecords(container, tableBody, noData) {
        if (!container || !tableBody) {
            console.error('容器元素未找到', { container, tableBody });
            return;
        }

        // 显示当前记录，隐藏历史记录
        container.style.display = 'block';
        const historyContainer = document.getElementById('history-records');
        if (historyContainer) historyContainer.style.display = 'none';

        if (this.records.length === 0) {
            container.style.display = 'none';
            if (noData) noData.style.display = 'block';
            return;
        }

        if (noData) noData.style.display = 'none';

        // 按项目分组数据
        const groupedRecords = this.groupRecordsByProject(this.records);
        
        // 生成合并项目列的表格
        let tableHTML = '';
        Object.keys(groupedRecords).forEach(project => {
            const projectRecords = groupedRecords[project];
            projectRecords.forEach((record, index) => {
                if (index === 0) {
                    // 第一个记录显示项目名称并设置rowspan
                    tableHTML += this.generateRecordRow(record, projectRecords.length, true);
                } else {
                    // 其他记录不显示项目列
                    tableHTML += this.generateRecordRow(record, 1, false);
                }
            });
        });
        
        tableBody.innerHTML = tableHTML;
    }

    /**
     * 渲染历史记录
     * @param {HTMLElement} container - 容器元素
     * @param {HTMLElement} tableBody - 表格体
     * @param {HTMLElement} noData - 无数据提示
     */
    renderHistoryRecords(container, tableBody, noData) {
        if (!container || !tableBody) return;

        // 显示历史记录，隐藏当前记录
        const currentContainer = document.getElementById('current-records');
        if (currentContainer) currentContainer.style.display = 'none';
        container.style.display = 'block';
        if (noData) noData.style.display = 'none';

        // 显示开发中提示
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-tools" style="font-size: 2rem; margin-bottom: 16px; display: block; color: var(--primary-color);"></i>
                    <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">功能开发中</h3>
                    <p style="margin: 0; font-size: 0.9rem;">历史记录功能正在开发中，敬请期待！</p>
                </td>
            </tr>
        `;
    }

    /**
     * 按项目分组记录
     * @param {Array} records - 记录数组
     * @returns {Object} 分组后的记录
     */
    groupRecordsByProject(records) {
        const grouped = {};
        records.forEach(record => {
            if (!grouped[record.project]) {
                grouped[record.project] = [];
            }
            grouped[record.project].push(record);
        });
        return grouped;
    }

    /**
     * 生成记录行HTML
     * @param {Object} record - 记录数据
     * @param {number} rowspan - 行跨度
     * @param {boolean} showProject - 是否显示项目列
     * @returns {string} HTML字符串
     */
    generateRecordRow(record, rowspan, showProject) {
        const projectCell = showProject ? 
            `<td rowspan="${rowspan}" class="project-cell">${record.project}</td>` : '';
        
        return `
            <tr class="fade-in-up">
                ${projectCell}
                <td>${record.name}</td>
                <td>${record.grade}</td>
                <td>${formatTime(record.single)}</td>
                <td>${formatTime(record.average)}</td>
                <td>${record.date}</td>
                <td>${record.competition}</td>
            </tr>
        `;
    }

    /**
     * 切换记录类型
     * @param {string} type - 类型：'current' 或 'history'
     */
    switchRecordType(type) {
        this.currentView = type;
        
        const currentBtn = document.getElementById('current-records-btn');
        const historyBtn = document.getElementById('history-records-btn');
        const historyFilterGroup = document.getElementById('history-filter-group');
        
        if (type === 'current') {
            currentBtn.classList.add('active');
            historyBtn.classList.remove('active');
            if (historyFilterGroup) historyFilterGroup.style.display = 'none';
            this.loadRecords();
        } else {
            historyBtn.classList.add('active');
            currentBtn.classList.remove('active');
            if (historyFilterGroup) historyFilterGroup.style.display = 'flex';
            
            // 加载历史记录，默认三阶
            const projectFilter = document.getElementById('project-filter');
            const filters = {
                project: projectFilter?.value || '三阶'
            };
            this.loadRecords(filters);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 记录类型切换按钮
        const currentBtn = document.getElementById('current-records-btn');
        const historyBtn = document.getElementById('history-records-btn');
        
        if (currentBtn) {
            currentBtn.addEventListener('click', () => this.switchRecordType('current'));
        }
        
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.switchRecordType('history'));
        }

        // 项目筛选器
        const projectFilter = document.getElementById('project-filter');
        if (projectFilter) {
            projectFilter.addEventListener('change', (e) => {
                if (this.currentView === 'history') {
                    this.loadRecords({ project: e.target.value });
                }
            });
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        const tableBody = this.currentView === 'current' ? 
            document.getElementById('current-records-table-body') :
            document.getElementById('history-records-table-body');
        
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <div class="loading"></div>
                        <p style="margin-top: 16px; color: var(--text-secondary);">加载中...</p>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    showError(message) {
        const tableBody = this.currentView === 'current' ? 
            document.getElementById('current-records-table-body') :
            document.getElementById('history-records-table-body');
        
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--danger-color);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px; display: block;"></i>
                        <h3 style="margin: 0 0 8px 0;">加载失败</h3>
                        <p style="margin: 0; font-size: 0.9rem;">${message}</p>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * 创建新记录
     * @param {Object} recordData - 记录数据
     */
    async createRecord(recordData) {
        try {
            await this.apiClient.createRecord(recordData);
            await this.loadRecords();
        } catch (error) {
            // 错误已在 API 中处理
        }
    }

    /**
     * 更新记录
     * @param {string} id - 记录ID
     * @param {Object} recordData - 更新数据
     */
    async updateRecord(id, recordData) {
        try {
            await this.apiClient.updateRecord(id, recordData);
            await this.loadRecords();
        } catch (error) {
            // 错误已在 API 中处理
        }
    }

    /**
     * 删除记录
     * @param {string} id - 记录ID
     */
    async deleteRecord(id) {
        try {
            await this.apiClient.deleteRecord(id);
            await this.loadRecords();
        } catch (error) {
            // 错误已在 API 中处理
        }
    }
}

// 全局函数，用于 HTML 中的 onclick 事件
window.switchRecordType = function(type) {
    if (window.recordsComponent) {
        window.recordsComponent.switchRecordType(type);
    }
};
