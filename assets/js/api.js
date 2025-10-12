/**
 * API 调用模块
 * 处理与后端云函数的数据交互
 */

import { showError, showSuccess } from './utils.js';

// API 基础配置
const API_CONFIG = {
    baseURL: 'https://fcabackend.hzcubing.club', // Sealos 云函数 URL
    timeout: 10000,
    retryCount: 3
};

/**
 * API 客户端类
 */
export class APIClient {
    constructor(baseURL = API_CONFIG.baseURL) {
        this.baseURL = baseURL;
        this.timeout = API_CONFIG.timeout;
        this.retryCount = API_CONFIG.retryCount;
    }

    /**
     * 发送 HTTP 请求
     * @param {string} endpoint - API 端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 响应数据
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.code && data.code !== 200) {
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            
            console.error('API请求错误:', error);
            throw error;
        }
    }

    /**
     * GET 请求
     * @param {string} endpoint - API 端点
     * @param {Object} params - 查询参数
     * @returns {Promise} 响应数据
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST 请求
     * @param {string} endpoint - API 端点
     * @param {Object} data - 请求数据
     * @returns {Promise} 响应数据
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT 请求
     * @param {string} endpoint - API 端点
     * @param {Object} data - 请求数据
     * @returns {Promise} 响应数据
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE 请求
     * @param {string} endpoint - API 端点
     * @returns {Promise} 响应数据
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// 创建全局 API 客户端实例
export const apiClient = new APIClient();

/**
 * 校记录相关 API
 */
export const recordsAPI = {
    /**
     * 获取校记录列表
     * @param {Object} params - 查询参数
     * @returns {Promise} 校记录列表
     */
    async getRecords(params = {}) {
        try {
            const response = await apiClient.get('/get-records', params);
            return response.data || [];
        } catch (error) {
            showError('获取校记录失败: ' + error.message);
            throw error;
        }
    },

    /**
     * 获取当前记录
     * @returns {Promise} 当前记录列表
     */
    async getCurrentRecords() {
        return this.getRecords({ isCurrent: true });
    },

    /**
     * 获取历史记录
     * @param {string} project - 项目名称
     * @returns {Promise} 历史记录列表
     */
    async getHistoryRecords(project = '') {
        const params = { isCurrent: false };
        if (project) params.project = project;
        return this.getRecords(params);
    },

    /**
     * 创建校记录
     * @param {Object} record - 校记录数据
     * @returns {Promise} 创建结果
     */
    async createRecord(record) {
        try {
            const response = await apiClient.post('/create-record', record);
            showSuccess('校记录创建成功');
            return response.data;
        } catch (error) {
            showError('创建校记录失败: ' + error.message);
            throw error;
        }
    },

    /**
     * 更新校记录
     * @param {string} id - 记录ID
     * @param {Object} record - 更新数据
     * @returns {Promise} 更新结果
     */
    async updateRecord(id, record) {
        try {
            const response = await apiClient.post('/update-record', { _id: id, ...record });
            showSuccess('校记录更新成功');
            return response.data;
        } catch (error) {
            showError('更新校记录失败: ' + error.message);
            throw error;
        }
    },

    /**
     * 删除校记录
     * @param {string} id - 记录ID
     * @returns {Promise} 删除结果
     */
    async deleteRecord(id) {
        try {
            const response = await apiClient.get(`/delete-record?_id=${id}`);
            showSuccess('校记录删除成功');
            return response.data;
        } catch (error) {
            showError('删除校记录失败: ' + error.message);
            throw error;
        }
    }
};

/**
 * 周赛记录相关 API
 */
export const contestsAPI = {
    /**
     * 获取周赛记录列表
     * @param {Object} params - 查询参数
     * @returns {Promise} 周赛记录列表
     */
    async getContests(params = {}) {
        try {
            const response = await apiClient.get('/get-contests', params);
            return response.data || [];
        } catch (error) {
            showError('获取周赛记录失败: ' + error.message);
            throw error;
        }
    },

    /**
     * 获取指定周次记录
     * @param {string} week - 周次
     * @returns {Promise} 周次记录
     */
    async getContestByWeek(week) {
        return this.getContests({ week });
    },

    /**
     * 创建周赛记录
     * @param {Object} contest - 周赛记录数据
     * @returns {Promise} 创建结果
     */
    async createContest(contest) {
        try {
            const response = await apiClient.post('/create-contest', contest);
            showSuccess('周赛记录创建成功');
            return response.data;
        } catch (error) {
            showError('创建周赛记录失败: ' + error.message);
            throw error;
        }
    },

    /**
     * 更新周赛记录
     * @param {string} id - 记录ID
     * @param {Object} contest - 更新数据
     * @returns {Promise} 更新结果
     */
    async updateContest(id, contest) {
        try {
            const response = await apiClient.post('/update-contest', { _id: id, ...contest });
            showSuccess('周赛记录更新成功');
            return response.data;
        } catch (error) {
            showError('更新周赛记录失败: ' + error.message);
            throw error;
        }
    },

    /**
     * 删除周赛记录
     * @param {string} id - 记录ID
     * @returns {Promise} 删除结果
     */
    async deleteContest(id) {
        try {
            const response = await apiClient.get(`/delete-contest?_id=${id}`);
            showSuccess('周赛记录删除成功');
            return response.data;
        } catch (error) {
            showError('删除周赛记录失败: ' + error.message);
            throw error;
        }
    }
};

/**
 * 周赛成绩提交相关 API
 */
export const contestScoresAPI = {
    /**
     * 提交周赛项目成绩
     * @param {string} contestId - 周赛ID
     * @param {string} project - 项目名称
     * @param {Array} players - 选手成绩数组 [{name: string, times: string[]}]
     * @returns {Promise} 提交结果
     */
    async submitScores(contestId, project, players) {
        try {
            const response = await apiClient.post('/submit-contest-scores', {
                contestId,
                project,
                players
            });
            showSuccess('成绩提交成功');
            return response.data;
        } catch (error) {
            showError('成绩提交失败: ' + error.message);
            throw error;
        }
    }
};


import { mockData } from './mockData.js';

/**
 * 模拟数据 API（用于开发阶段）
 */
export const mockAPI = {
    /**
     * 模拟延迟
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise}
     */
    delay(ms = 100) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 模拟获取校记录
     * @param {Object} params - 查询参数
     * @returns {Promise} 模拟数据
     */
    async getRecords(params = {}) {
        await this.delay();
        
        let records = [...mockData.schoolRecords];
        
        if (params.isCurrent !== undefined) {
            records = records.filter(r => r.isCurrent === (params.isCurrent === 'true'));
        }
        
        if (params.project) {
            records = records.filter(r => r.project === params.project);
        }

        return {
            code: 200,
            message: '获取校记录成功',
            data: records
        };
    },

    /**
     * 模拟获取周赛记录
     * @param {Object} params - 查询参数
     * @returns {Promise} 模拟数据
     */
    async getContests(params = {}) {
        await this.delay();
        
        let contests = [...mockData.weeklyContests];
        
        if (params.week) {
            contests = contests.filter(c => c.week === params.week);
        }

        return {
            code: 200,
            message: '获取周赛记录成功',
            data: contests
        };
    },

};

// 真实 API 客户端
const API_BASE_URL = 'https://fcabackend.hzcubing.club';

export const realAPI = {
    /**
     * 发送请求
     * @param {string} endpoint - 接口端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 响应数据
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}/${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (data.code !== 200) {
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error(`API请求失败 (${endpoint}):`, error);
            throw error;
        }
    },

    /**
     * 获取校记录
     * @param {Object} params - 查询参数
     * @returns {Promise} 校记录数据
     */
    async getRecords(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `get-records${queryString ? `?${queryString}` : ''}`;
        return await this.request(endpoint);
    },

    /**
     * 创建校记录
     * @param {Object} recordData - 记录数据
     * @returns {Promise} 创建结果
     */
    async createRecord(recordData) {
        return await this.request('create-record', {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
    },

    /**
     * 更新校记录
     * @param {string} id - 记录ID
     * @param {Object} recordData - 更新数据
     * @returns {Promise} 更新结果
     */
    async updateRecord(id, recordData) {
        return await this.request('update-record', {
            method: 'POST',
            body: JSON.stringify({ _id: id, ...recordData })
        });
    },

    /**
     * 删除校记录
     * @param {string} id - 记录ID
     * @returns {Promise} 删除结果
     */
    async deleteRecord(id) {
        return await this.request(`delete-record?_id=${id}`);
    },

    /**
     * 获取周赛记录
     * @param {Object} params - 查询参数
     * @returns {Promise} 周赛记录数据
     */
    async getContests(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `get-contests${queryString ? `?${queryString}` : ''}`;
        return await this.request(endpoint);
    },

    /**
     * 创建周赛记录
     * @param {Object} contestData - 周赛数据
     * @returns {Promise} 创建结果
     */
    async createContest(contestData) {
        return await this.request('create-contest', {
            method: 'POST',
            body: JSON.stringify(contestData)
        });
    },

    /**
     * 更新周赛记录
     * @param {string} id - 周赛ID
     * @param {Object} contestData - 更新数据
     * @returns {Promise} 更新结果
     */
    async updateContest(id, contestData) {
        return await this.request('update-contest', {
            method: 'POST',
            body: JSON.stringify({ _id: id, ...contestData })
        });
    },

    /**
     * 删除周赛记录
     * @param {string} id - 周赛ID
     * @returns {Promise} 删除结果
     */
    async deleteContest(id) {
        return await this.request(`delete-contest?_id=${id}`);
    },

};

// 根据环境选择 API
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const currentAPI = isDevelopment ? mockAPI : realAPI;
