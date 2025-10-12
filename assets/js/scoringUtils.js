// 成绩计算工具
// 根据项目配置计算排名和统计信息

import { getProjectConfig, getProjectScoringMethod } from './projectConfig.js';
import { parseTimeString, calculateResult, compareResults, formatTimeDisplay } from './timeUtils.js';

// 处理选手成绩数据
export function processPlayerResult(playerData, projectName) {
    const config = getProjectConfig(projectName);
    const times = playerData.times || [];
    
    // 解析所有时间
    const parsedTimes = times.map(timeStr => {
        if (typeof timeStr === 'object' && timeStr.time !== undefined) {
            // 已经是解析过的格式
            return timeStr;
        }
        return parseTimeString(timeStr);
    }).filter(t => t.valid);

    // 计算最终结果
    const result = calculateResult(parsedTimes, config.scoringMethod);
    
    return {
        name: playerData.name,
        round: playerData.round || 1,
        times: parsedTimes,
        result: result.result,
        resultDisplay: result.display,
        resultType: result.type || config.scoringMethod,
        // 对于盲拧项目，保存平均值信息
        average: result.average || null,
        averageDisplay: result.averageDisplay || null,
        submittedAt: playerData.submittedAt,
        submittedBy: playerData.submittedBy,
        // 原始数据保留
        originalData: playerData
    };
}

// 计算项目排名
export function calculateProjectRanking(results, projectName) {
    const config = getProjectConfig(projectName);
    const processedResults = results.map(r => processPlayerResult(r, projectName));
    
    // 按成绩排序
    const sortedResults = processedResults.sort((a, b) => {
        return compareResults(
            { result: a.result },
            { result: b.result },
            config.scoringMethod
        );
    });
    
    // 分配排名
    let currentRank = 1;
    const rankedResults = sortedResults.map((result, index) => {
        // 如果成绩与前一名相同，排名相同
        if (index > 0 && result.result === sortedResults[index - 1].result) {
            // 排名不变
        } else {
            currentRank = index + 1;
        }
        
        return {
            ...result,
            rank: result.result === null ? '-' : currentRank
        };
    });
    
    return rankedResults;
}

// 计算项目统计信息
export function calculateProjectStats(results, projectName) {
    const config = getProjectConfig(projectName);
    const processedResults = results.map(r => processPlayerResult(r, projectName));
    
    // 有效成绩
    const validResults = processedResults.filter(r => r.result !== null);
    
    if (validResults.length === 0) {
        return {
            totalParticipants: processedResults.length,
            validResults: 0,
            bestResult: null,
            worstResult: null,
            averageResult: null,
            projectName: projectName,
            scoringMethod: config.scoringMethod
        };
    }
    
    // 最佳成绩
    const bestResult = Math.min(...validResults.map(r => r.result));
    const bestPlayer = validResults.find(r => r.result === bestResult);
    
    // 最差成绩
    const worstResult = Math.max(...validResults.map(r => r.result));
    const worstPlayer = validResults.find(r => r.result === worstResult);
    
    // 平均成绩
    const sum = validResults.reduce((acc, r) => acc + r.result, 0);
    const averageResult = sum / validResults.length;
    
    return {
        totalParticipants: processedResults.length,
        validResults: validResults.length,
        bestResult: {
            time: bestResult,
            display: bestPlayer.resultDisplay,
            player: bestPlayer.name
        },
        worstResult: {
            time: worstResult,
            display: worstPlayer.resultDisplay,
            player: worstPlayer.name
        },
        averageResult: {
            time: averageResult,
            display: formatTimeDisplay(averageResult, config.timeFormat === 'moves')
        },
        projectName: projectName,
        scoringMethod: config.scoringMethod
    };
}

// 验证选手成绩完整性
export function validatePlayerScores(playerData, projectName) {
    const config = getProjectConfig(projectName);
    const errors = [];
    
    // 检查姓名
    if (!playerData.name || !playerData.name.trim()) {
        errors.push('选手姓名不能为空');
    }
    
    // 检查成绩数量
    const times = playerData.times || [];
    if (times.length === 0) {
        errors.push('至少需要输入一个成绩');
    }
    
    if (times.length > config.attempts) {
        errors.push(`${projectName}最多只能输入${config.attempts}个成绩`);
    }
    
    // 检查每个成绩的格式
    times.forEach((timeStr, index) => {
        if (typeof timeStr === 'string' && timeStr.trim()) {
            const parseResult = parseTimeString(timeStr);
            if (!parseResult.valid) {
                errors.push(`第${index + 1}个成绩格式错误: ${parseResult.error}`);
            }
        }
    });
    
    // 特殊规则验证
    const validTimes = times.filter(t => {
        if (typeof t === 'object') return t.status !== 'dnf';
        const parsed = parseTimeString(t);
        return parsed.valid && parsed.status !== 'dnf';
    });
    
    // 对于需要计算平均的项目，检查最少有效成绩数
    if (config.scoringMethod === 'ao5' && validTimes.length < 3) {
        errors.push('5次去头尾平均至少需要3个有效成绩');
    }
    
    if (config.scoringMethod === 'mo3' && validTimes.length === 0) {
        errors.push('3次平均至少需要1个有效成绩');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// 生成成绩摘要文本
export function generateScoreSummary(playerData, projectName) {
    const config = getProjectConfig(projectName);
    const processed = processPlayerResult(playerData, projectName);
    
    let summary = `${processed.name}`;
    
    if (processed.result !== null) {
        summary += ` - ${processed.resultDisplay}`;
        
        // 添加计分方式说明
        switch (config.scoringMethod) {
            case 'single':
                summary += ' (最佳单次)';
                break;
            case 'mo3':
                summary += ' (3次平均)';
                break;
            case 'ao5':
                summary += ' (5次去头尾平均)';
                break;
        }
    } else {
        summary += ' - DNF';
    }
    
    return summary;
}

// 导出成绩数据为CSV格式
export function exportProjectResultsToCSV(results, projectName) {
    const config = getProjectConfig(projectName);
    const rankedResults = calculateProjectRanking(results, projectName);
    
    // CSV头部
    const headers = ['排名', '姓名', '轮次'];
    
    // 根据项目添加成绩列
    for (let i = 1; i <= config.attempts; i++) {
        headers.push(`成绩${i}`);
    }
    headers.push('最终结果');
    
    // CSV数据行
    const rows = rankedResults.map(result => {
        const row = [
            result.rank,
            result.name,
            result.round || 1
        ];
        
        // 添加各次成绩
        for (let i = 0; i < config.attempts; i++) {
            const time = result.times[i];
            row.push(time ? time.display : '');
        }
        
        // 添加最终结果
        row.push(result.resultDisplay);
        
        return row;
    });
    
    // 生成CSV内容
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    return csvContent;
}

// 比较两次周赛中同一选手的成绩变化
export function comparePlayerProgress(oldResult, newResult, projectName) {
    const oldProcessed = processPlayerResult(oldResult, projectName);
    const newProcessed = processPlayerResult(newResult, projectName);
    
    if (oldProcessed.result === null || newProcessed.result === null) {
        return {
            hasImprovement: false,
            improvement: null,
            improvementDisplay: '-'
        };
    }
    
    const improvement = oldProcessed.result - newProcessed.result;
    const hasImprovement = improvement > 0;
    
    return {
        hasImprovement: hasImprovement,
        improvement: improvement,
        improvementDisplay: hasImprovement 
            ? `-${formatTimeDisplay(Math.abs(improvement))}` 
            : `+${formatTimeDisplay(Math.abs(improvement))}`
    };
}
