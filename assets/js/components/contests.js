/**
 * 周赛记录组件
 * 处理周赛记录的显示和交互逻辑
 */

import { formatTime, getRankingClass, showError } from '../utils.js';
import { contestsAPI } from '../api.js';
import { mockData } from '../mockData.js';
import { getProjectConfig, getProjectScoringMethod } from '../projectConfig.js';
import { formatTimeDisplay, parseTimeString } from '../timeUtils.js';
import { processPlayerResult, calculateProjectRanking } from '../scoringUtils.js';

/**
 * 周赛记录组件类
 */
export class ContestsComponent {
    constructor(container, apiClient = contestsAPI) {
        this.container = container;
        this.apiClient = apiClient;
        this.contests = [];
        this.filters = {};
    }

    /**
     * 初始化组件
     */
    async init() {
        await this.loadContests();
        this.generateWeekFilter();
        this.bindEvents();
    }

    /**
     * 加载周赛记录
     * @param {Object} filters - 筛选条件
     */
    async loadContests(filters = {}) {
        try {
            this.filters = filters;
            this.showLoading();
            
            // 使用真实API数据
            const contests = await this.apiClient.getContests();
            this.contests = contests;
            this.renderContests();
            this.generateWeekFilter(); // 重新生成筛选器
        } catch (error) {
            this.showError('加载周赛记录失败: ' + error.message);
        }
    }

    /**
     * 生成周次筛选器选项
     */
    generateWeekFilter() {
        const weekFilter = document.getElementById('week-filter');
        if (!weekFilter || !this.contests) return;

        // 保存当前选中的值
        const currentValue = weekFilter.value;

        // 获取所有唯一的周次，并按时间排序
        const weeks = [...new Set(this.contests.map(contest => contest.week))]
            .filter(week => week) // 过滤空值
            .sort((a, b) => {
                // 尝试按周次数字排序，如果失败则按字符串排序
                const aNum = parseInt(a.match(/\d+/)?.[0]);
                const bNum = parseInt(b.match(/\d+/)?.[0]);
                if (aNum && bNum) {
                    return aNum - bNum;
                }
                return a.localeCompare(b);
            });

        // 生成选项HTML
        const optionsHtml = weeks.map(week => {
            // 找到对应的日期
            const contest = this.contests.find(c => c.week === week);
            const date = contest ? contest.date : '';
            const displayText = date ? `${week} (${date})` : week;
            
            return `<option value="${week}">${displayText}</option>`;
        }).join('');

        // 更新筛选器内容
        weekFilter.innerHTML = `
            <option value="">全部周次</option>
            ${optionsHtml}
        `;

        // 恢复之前选中的值
        if (currentValue && weeks.includes(currentValue)) {
            weekFilter.value = currentValue;
        }
    }

    /**
     * 渲染周赛记录
     */
    renderContests() {
        const contestsTimeline = document.getElementById('contests-timeline');
        const noData = document.getElementById('no-data');
        
        if (!contestsTimeline) return;

        let filteredContests = [...this.contests];

        // 按时间排序，最新的周在最上面
        filteredContests.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 应用筛选
        if (this.filters.week) {
            filteredContests = filteredContests.filter(week => week.week === this.filters.week);
        }

        if (filteredContests.length === 0) {
            contestsTimeline.style.display = 'none';
            if (noData) noData.style.display = 'block';
            return;
        }

        contestsTimeline.style.display = 'flex';
        if (noData) noData.style.display = 'none';

        contestsTimeline.innerHTML = filteredContests.map(week => {
            let weekContests = week.contests;
            
            // 应用项目筛选
            if (this.filters.project) {
                weekContests = weekContests.filter(contest => contest.project === this.filters.project);
            }

            if (weekContests.length === 0) return '';

            // 获取所有项目列表
            const allProjects = week.contests.map(contest => contest.project);
            const uniqueProjects = [...new Set(allProjects)];

            return this.generateWeekCard(week, weekContests, uniqueProjects);
        }).filter(html => html).join('');
    }

    /**
     * 生成周次卡片HTML
     * @param {Object} week - 周次数据
     * @param {Array} weekContests - 周次比赛数据
     * @param {Array} uniqueProjects - 唯一项目列表
     * @returns {string} HTML字符串
     */
    generateWeekCard(week, weekContests, uniqueProjects) {
        // 默认显示三阶项目，如果没有三阶则显示第一个有数据的项目
        let defaultProject = weekContests.find(contest => contest.project === '三阶');
        if (!defaultProject || !defaultProject.results || defaultProject.results.length === 0) {
            defaultProject = weekContests.find(contest => contest.results && contest.results.length > 0) || weekContests[0];
        }
        
        // 找到默认项目的索引
        const defaultProjectIndex = uniqueProjects.findIndex(project => project === defaultProject?.project);
        
        return `
            <div class="week-card fade-in-up">
                <div class="week-header">
                    <div class="week-info">
                        <div class="week-title">${week.week}</div>
                        <div class="week-date">${week.date}</div>
                    </div>
                    <button class="export-week-btn" onclick="exportWeekSummary('${week.week}')" title="导出赛果摘要">
                        <i class="fas fa-download"></i>
                        <span>导出赛果</span>
                    </button>
                </div>
                
                <!-- 项目标签栏 -->
                <div class="project-tabs">
                    ${uniqueProjects.map((project, index) => {
                        const contest = weekContests.find(c => c.project === project);
                        const hasResults = contest && contest.results && contest.results.length > 0;
                        const isActive = project === defaultProject?.project;
                        return `
                            <button class="project-tab ${isActive ? 'active' : ''}" 
                                    onclick="switchProject('${week.week}', '${project}')" 
                                    data-project="${project}"
                                    title="${this.getProjectTooltip(project)}">
                                ${project}
                                ${hasResults ? `<span class="result-count">(${contest.results.length})</span>` : ''}
                            </button>
                        `;
                    }).join('')}
                </div>
                
                <div class="week-content" id="content-${week.week}">
                    ${weekContests.map((contest, index) => {
                        const isActive = contest.project === defaultProject?.project;
                        return `
                            <div class="project-section ${isActive ? 'active' : ''}" data-project="${contest.project}">
                                <div class="project-header">
                                    <div class="project-header-left">
                                        <h3 class="project-title">${contest.project}</h3>
                                        <div class="project-config-info">
                                            ${this.getProjectConfigDisplay(contest.project)}
                                        </div>
                                    </div>
                                    <div class="round-filter">
                                        <label for="round-filter-${week.week}-${contest.project}">轮数：</label>
                                        <select id="round-filter-${week.week}-${contest.project}" class="round-select" onchange="filterByRound('${week.week}', '${contest.project}', this.value)">
                                            <option value="1" selected>初赛 (第1轮)</option>
                                            <option value="2">复赛 (第2轮)</option>
                                            <option value="3">决赛 (第3轮)</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="contest-table-container" id="table-${week.week}-${contest.project}">
                                    ${this.generateContestTable(contest, '1')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 生成比赛表格HTML
     * @param {Object} contest - 比赛数据
     * @param {string} roundFilter - 轮数筛选条件
     * @returns {string} HTML字符串
     */
    generateContestTable(contest, roundFilter = '') {
        const projectName = contest.project;
        const config = getProjectConfig(projectName);
        
        // 根据轮数筛选结果
        let filteredResults = contest.results || [];
        if (roundFilter) {
            filteredResults = filteredResults.filter(result => result.round == roundFilter);
        }
        
        // 使用新的排名计算系统
        const rankedResults = calculateProjectRanking(filteredResults, projectName);
        
        // 根据项目配置生成表头
        const tableHeaders = this.generateTableHeaders(config);
        const timesColumnHeader = this.getTimesColumnHeader(config);
        
        return `
            <table class="contest-table">
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>姓名</th>
                        ${tableHeaders}
                        <th>${timesColumnHeader}</th>
                        <th>轮数</th>
                    </tr>
                </thead>
                <tbody>
                    ${rankedResults.map(result => this.generateResultRow(result, config)).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * 根据项目配置生成表头
     * @param {Object} config - 项目配置
     * @returns {string} 表头HTML
     */
    generateTableHeaders(config) {
        switch (config.scoringMethod) {
            case 'single':
                return '<th>最佳单次</th>';
            case 'mo3':
                return '<th>单次</th><th>平均</th>';
            case 'ao5':
                return '<th>单次</th><th>平均</th>';
            case 'single_with_mo3':
                return '<th>单次</th><th>平均</th>';
            default:
                return '<th>单次</th><th>平均</th>';
        }
    }

    /**
     * 获取成绩列的表头文本
     * @param {Object} config - 项目配置
     * @returns {string} 表头文本
     */
    getTimesColumnHeader(config) {
        if (config.timeFormat === 'moves') {
            return '步数';
        }
        
        return '成绩';
    }

    /**
     * 获取项目提示信息
     * @param {string} projectName - 项目名称
     * @returns {string} 提示信息
     */
    getProjectTooltip(projectName) {
        const config = getProjectConfig(projectName);
        const scoringMethodText = config.scoringMethod === 'single' ? '最佳单次' :
                                config.scoringMethod === 'mo3' ? '3次平均' :
                                config.scoringMethod === 'ao5' ? '5次去头尾平均' : '计算平均';
        
        return `${config.displayName}: ${config.attempts}把成绩，${scoringMethodText}`;
    }

    /**
     * 获取项目配置显示信息
     * @param {string} projectName - 项目名称
     * @returns {string} 配置显示HTML
     */
    getProjectConfigDisplay(projectName) {
        const config = getProjectConfig(projectName);
        const scoringMethodText = config.scoringMethod === 'single' ? '最佳单次' :
                                config.scoringMethod === 'mo3' ? '3次平均' :
                                config.scoringMethod === 'ao5' ? '5次去头尾平均' : '计算平均';
        
        const timeFormatText = config.timeFormat === 'moves' ? '步数' :
                             config.timeFormat === 'extended' ? '长时间' : '标准时间';

        return `
            <div class="config-badges">
                <span class="config-badge config-attempts">${config.attempts}把</span>
                <span class="config-badge config-scoring">${scoringMethodText}</span>
                <span class="config-badge config-format">${timeFormatText}</span>
            </div>
        `;
    }


    /**
     * 生成结果行HTML
     * @param {Object} result - 结果数据
     * @param {Object} config - 项目配置
     * @returns {string} HTML字符串
     */
    generateResultRow(result, config) {
        // 轮数显示
        const roundText = result.round ? `第${result.round}轮` : '-';
        
        // 排名显示
        const rankingHtml = `
            <span class="ranking ${getRankingClass(result.rank)}">
                ${result.rank}
            </span>
        `;
        
        // 根据项目配置生成成绩列
        const scoresHtml = this.generateScoreColumns(result, config);
        
        // 生成详细成绩列表
        const timesHtml = this.generateTimesList(result, config);

        return `
            <tr>
                <td>${rankingHtml}</td>
                <td>${result.name}</td>
                ${scoresHtml}
                <td>${timesHtml}</td>
                <td>${roundText}</td>
            </tr>
        `;
    }

    /**
     * 生成成绩列HTML
     * @param {Object} result - 结果数据
     * @param {Object} config - 项目配置
     * @returns {string} 成绩列HTML
     */
    generateScoreColumns(result, config) {
        const isMovesFormat = config.timeFormat === 'moves';
        
        switch (config.scoringMethod) {
            case 'single':
                // 只显示最佳单次
                const bestTime = result.result !== null ? 
                    formatTimeDisplay(result.result, isMovesFormat) : 'DNF';
                return `<td>${bestTime}</td>`;
                
            case 'mo3':
            case 'ao5':
                // 显示单次和平均
                const single = this.getBestSingle(result.times);
                const singleDisplay = single !== null ? 
                    formatTimeDisplay(single, isMovesFormat) : '-';
                const averageDisplay = result.result !== null ? 
                    formatTimeDisplay(result.result, isMovesFormat) : 'DNF';
                return `<td>${singleDisplay}</td><td>${averageDisplay}</td>`;
                
            case 'single_with_mo3':
                // 盲拧项目：显示最佳单次和3次平均
                const blindSingleDisplay = result.result !== null ? 
                    formatTimeDisplay(result.result, isMovesFormat) : 'DNF';
                const blindAverageDisplay = result.averageDisplay || 'DNF';
                return `<td>${blindSingleDisplay}</td><td>${blindAverageDisplay}</td>`;
                
            default:
                return '<td>-</td><td>-</td>';
        }
    }

    /**
     * 获取最佳单次成绩
     * @param {Array} times - 成绩数组
     * @returns {number|null} 最佳单次成绩
     */
    getBestSingle(times) {
        if (!times || times.length === 0) return null;
        
        const validTimes = times
            .filter(t => t.status !== 'dnf')
            .map(t => t.time)
            .filter(t => t !== null && t !== undefined);
            
        return validTimes.length > 0 ? Math.min(...validTimes) : null;
    }

    /**
     * 生成详细成绩列表HTML
     * @param {Object} result - 结果数据
     * @param {Object} config - 项目配置
     * @returns {string} 成绩列表HTML
     */
    generateTimesList(result, config) {
        const times = result.times || [];
        if (times.length === 0) {
            return '<div class="times-list">-</div>';
        }
        
        const isMovesFormat = config.timeFormat === 'moves';
        
        // 对成绩进行排序用于标记最好和最差
        const sortedTimes = [...times].sort((a, b) => {
            if (a.status === 'dnf' && b.status === 'dnf') return 0;
            if (a.status === 'dnf') return 1;
            if (b.status === 'dnf') return -1;
            return (a.time || 0) - (b.time || 0);
        });

        return `
            <div class="times-list">
                ${times.map(time => {
                    // 只有AO5项目才标记最好和最差成绩并加括号
                    const isBest = config.scoringMethod === 'ao5' && time === sortedTimes[0] && time.status !== 'dnf';
                    const isWorst = config.scoringMethod === 'ao5' && time === sortedTimes[sortedTimes.length - 1] && sortedTimes.filter(t => t.status !== 'dnf').length > 1;
                    
                    let displayTime = time.display;
                    // 只有去头尾平均（AO5）才加括号
                    if (config.scoringMethod === 'ao5' && (isBest || isWorst)) {
                        displayTime = `(${displayTime})`;
                    }
                    
                    // 移除特殊状态样式，只保留AO5的best/worst样式
                    const rankClass = config.scoringMethod === 'ao5' ? 
                                    (isBest ? 'best' : isWorst ? 'worst' : '') : '';
                    
                    return `
                        <span class="time-item ${rankClass}">
                            ${displayTime}
                        </span>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * 格式化时间显示（使用新的时间工具）
     * @param {number|string} time - 时间（秒）
     * @param {boolean} isMovesFormat - 是否为步数格式
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(time, isMovesFormat = false) {
        return formatTimeDisplay(time, isMovesFormat);
    }

    /**
     * 切换项目显示
     * @param {string} week - 周次
     * @param {string} project - 项目名称
     */
    switchProject(week, project) {
        const weekContent = document.getElementById(`content-${week}`);
        if (!weekContent) return;

        const projectSections = weekContent.querySelectorAll('.project-section');
        const projectTabs = document.querySelectorAll(`[onclick*="${week}"]`);
        
        // 隐藏所有项目
        projectSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // 显示选中的项目
        const selectedSection = weekContent.querySelector(`[data-project="${project}"]`);
        if (selectedSection) {
            selectedSection.classList.add('active');
        }
        
        // 更新标签状态
        projectTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[onclick*="${week}"][onclick*="${project}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 周次筛选器
        const weekFilter = document.getElementById('week-filter');
        if (weekFilter) {
            weekFilter.addEventListener('change', (e) => {
                this.filters.week = e.target.value;
                this.loadContests(this.filters);
            });
        }

        // 项目筛选器
        const projectFilter = document.getElementById('project-filter');
        if (projectFilter) {
            projectFilter.addEventListener('change', (e) => {
                this.filters.project = e.target.value;
                this.loadContests(this.filters);
            });
        }

        // 重置筛选器
        const resetBtn = document.querySelector('.filter-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }

        // 将切换项目函数挂载到全局
        window.switchProject = (week, project) => {
            this.switchProject(week, project);
        };

        // 将轮数筛选函数挂载到全局
        window.filterByRound = (week, project, roundValue) => {
            this.filterByRound(week, project, roundValue);
        };
    }

    /**
     * 轮数筛选
     * @param {string} week - 周次
     * @param {string} project - 项目
     * @param {string} roundValue - 轮数值
     */
    filterByRound(week, project, roundValue) {
        // 找到对应的周次数据
        const weekData = this.contests.find(contest => contest.week === week);
        if (!weekData) return;

        // 找到对应的项目数据
        const projectData = weekData.contests.find(contest => contest.project === project);
        if (!projectData) return;

        // 更新表格内容
        const tableContainer = document.getElementById(`table-${week}-${project}`);
        if (tableContainer) {
            tableContainer.innerHTML = this.generateContestTable(projectData, roundValue);
        }
    }

    /**
     * 重置筛选器
     */
    resetFilters() {
        this.filters = {};
        
        const weekFilter = document.getElementById('week-filter');
        const projectFilter = document.getElementById('project-filter');
        
        if (weekFilter) weekFilter.value = '';
        if (projectFilter) projectFilter.value = '';
        
        // 重置所有轮数筛选为第一轮
        const roundSelects = document.querySelectorAll('.round-select');
        roundSelects.forEach(select => {
            select.value = '1';
        });
        
        this.loadContests();
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        const contestsTimeline = document.getElementById('contests-timeline');
        if (contestsTimeline) {
            contestsTimeline.innerHTML = `
                <div class="week-card">
                    <div class="week-content" style="text-align: center; padding: 40px;">
                        <div class="loading"></div>
                        <p style="margin-top: 16px; color: var(--text-secondary);">加载中...</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    showError(message) {
        const contestsTimeline = document.getElementById('contests-timeline');
        if (contestsTimeline) {
            contestsTimeline.innerHTML = `
                <div class="week-card">
                    <div class="week-content" style="text-align: center; padding: 40px; color: var(--danger-color);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px; display: block;"></i>
                        <h3 style="margin: 0 0 8px 0;">加载失败</h3>
                        <p style="margin: 0; font-size: 0.9rem;">${message}</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 创建新周赛记录
     * @param {Object} contestData - 周赛记录数据
     */
    async createContest(contestData) {
        try {
            await this.apiClient.createContest(contestData);
            await this.loadContests(this.filters);
        } catch (error) {
            // 错误已在 API 中处理
        }
    }

    /**
     * 更新周赛记录
     * @param {string} id - 记录ID
     * @param {Object} contestData - 更新数据
     */
    async updateContest(id, contestData) {
        try {
            await this.apiClient.updateContest(id, contestData);
            await this.loadContests(this.filters);
        } catch (error) {
            // 错误已在 API 中处理
        }
    }

    /**
     * 删除周赛记录
     * @param {string} id - 记录ID
     */
    async deleteContest(id) {
        try {
            await this.apiClient.deleteContest(id);
            await this.loadContests(this.filters);
        } catch (error) {
            // 错误已在 API 中处理
        }
    }

    /**
     * 导出某周的赛果摘要
     * @param {string} weekName - 周次名称
     */
    exportWeekSummary(weekName) {
        // 找到该周的周赛记录
        const weekRecord = this.contests.find(contest => contest.week === weekName);
        
        if (!weekRecord) {
            showError('未找到该周的比赛数据');
            return;
        }

        // 调试：输出数据结构
        console.log('周赛数据:', weekRecord);
        
        let summary = '';
        
        // 标题部分
        summary += '═══════════════════════════════════\n';
        summary += `   ${weekRecord.week} 赛果摘要\n`;
        summary += `   日期：${weekRecord.date}\n`;
        summary += '═══════════════════════════════════\n\n';
        
        // 统计参赛项目和人数
        let totalProjects = 0;
        let totalParticipants = new Set();
        
        // 周赛数据包含 contests 数组，每个元素是一个项目
        const projectContests = weekRecord.contests || [];
        
        // 遍历每个项目
        projectContests.forEach(contest => {
            if (!contest.results || contest.results.length === 0) {
                return; // 跳过没有参赛选手的项目
            }
            
            totalProjects++;
            contest.results.forEach(r => totalParticipants.add(r.name));
            
            const config = getProjectConfig(contest.project);
            
            // 项目标题
            summary += `【${contest.project}】\n`;
            
            // 计算排名
            const rankedResults = calculateProjectRanking(contest.results, contest.project);
            
            // 分离有效成绩和无效成绩
            const validResults = rankedResults.filter(r => r.rank !== '-');
            const invalidResults = rankedResults.filter(r => r.rank === '-');
            
            // 显示参赛人数
            summary += `  参赛人数：${rankedResults.length}人\n`;
            
            // 如果有有效成绩，显示排名（如果人数<=5显示全部，否则只显示前三）
            if (validResults.length > 0) {
                const displayCount = validResults.length <= 5 ? validResults.length : 3;
                const resultsToShow = validResults.slice(0, displayCount);
                
                resultsToShow.forEach(result => {
                    const medal = result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : '  ';
                    summary += `    ${medal} ${result.rank}. ${result.name} - ${result.resultDisplay}`;
                    
                    // 如果有平均值，也显示（盲拧项目）
                    if (result.averageDisplay && result.averageDisplay !== '-') {
                        summary += ` (平均: ${result.averageDisplay})`;
                    }
                    summary += '\n';
                });
                
                // 如果还有更多选手，显示提示
                if (validResults.length > displayCount) {
                    summary += `    ... 及其他 ${validResults.length - displayCount} 位选手\n`;
                }
            }
            
            // 如果有DNF选手，显示人数
            if (invalidResults.length > 0) {
                summary += `  DNF：${invalidResults.length}人\n`;
            }
            
            // 如果完全没有有效成绩
            if (validResults.length === 0) {
                summary += '  暂无有效成绩\n';
            }
            
            summary += '\n';
        });
        
        // 底部统计
        summary += '───────────────────────────────────\n';
        summary += `总计：${totalProjects} 个项目，${totalParticipants.size} 位选手参赛\n`;
        summary += '═══════════════════════════════════\n';
        
        // 复制到剪贴板
        this.copyToClipboard(summary, weekName);
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @param {string} weekName - 周次名称
     */
    async copyToClipboard(text, weekName) {
        try {
            await navigator.clipboard.writeText(text);
            
            // 显示成功提示
            const message = document.createElement('div');
            message.className = 'copy-success-toast';
            message.innerHTML = `
                <i class="fas fa-check-circle"></i>
                ${weekName} 赛果已复制到剪贴板！
            `;
            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 500;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(message);
            
            // 3秒后自动消失
            setTimeout(() => {
                message.style.opacity = '0';
                setTimeout(() => message.remove(), 300);
            }, 3000);
            
            // 同时在控制台输出，方便查看
            console.log('=== 赛果摘要 ===\n' + text);
        } catch (error) {
            // 如果复制失败，显示在弹窗中
            this.showSummaryModal(text, weekName);
        }
    }

    /**
     * 在模态框中显示赛果摘要
     * @param {string} text - 赛果文本
     * @param {string} weekName - 周次名称
     */
    showSummaryModal(text, weekName) {
        const modal = document.createElement('div');
        modal.className = 'summary-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        modal.innerHTML = `
            <div class="summary-modal-content" style="background: white; border-radius: 12px; padding: 24px; max-width: 600px; width: 90%; max-height: 80vh; display: flex; flex-direction: column;">
                <div class="summary-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0;">${weekName} 赛果摘要</h3>
                    <button class="summary-modal-close" onclick="this.closest('.summary-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="summary-modal-body" style="flex: 1; overflow: auto; margin-bottom: 16px;">
                    <textarea readonly style="width: 100%; height: 400px; font-family: monospace; padding: 12px; border: 1px solid #ddd; border-radius: 6px; resize: vertical;">${text}</textarea>
                </div>
                <div class="summary-modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-primary" onclick="navigator.clipboard.writeText(this.closest('.summary-modal').querySelector('textarea').value).then(() => alert('已复制！'))" style="padding: 8px 16px; background: #1e40af; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-copy"></i> 复制
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.summary-modal').remove()" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * 获取计分方式显示文本
     * @param {string} method - 计分方式
     * @returns {string} 显示文本
     */
    getScoringMethodDisplay(method) {
        const map = {
            'ao5': 'Ao5',
            'mo3': 'Mo3',
            'single': '单次',
            'single_with_mo3': '单次+Mo3'
        };
        return map[method] || method;
    }
}

// 全局函数，用于 HTML 中的 onclick 事件
window.switchProject = function(week, project) {
    if (window.contestsComponent) {
        window.contestsComponent.switchProject(week, project);
    }
};

window.resetFilters = function() {
    if (window.contestsComponent) {
        window.contestsComponent.resetFilters();
    }
};

window.exportWeekSummary = function(weekName) {
    if (window.contestsComponent) {
        window.contestsComponent.exportWeekSummary(weekName);
    }
};
