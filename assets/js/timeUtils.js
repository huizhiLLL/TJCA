// 时间格式处理工具
// 支持多种时间格式的解析、验证和显示

// 时间状态枚举
export const TIME_STATUS = {
    NORMAL: 'normal',
    PLUS2: 'plus2',
    DNF: 'dnf'
};

// 解析时间字符串，支持多种格式
export function parseTimeString(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
        return { valid: false, error: '无效的时间格式' };
    }

    const trimmed = timeStr.trim().toUpperCase();

    // 检查DNF
    if (trimmed === 'DNF') {
        return {
            valid: true,
            time: null,
            status: 'dnf',
            display: 'DNF',
            sortValue: Infinity
        };
    }

    // 检查+2格式
    let isPlus2 = false;
    let baseTimeStr = trimmed;
    if (trimmed.endsWith('+')) {
        isPlus2 = true;
        baseTimeStr = trimmed.slice(0, -1);
    }

    // 解析时间值
    const timeResult = parseTimeValue(baseTimeStr);
    if (!timeResult.valid) {
        return timeResult;
    }

    const finalTime = isPlus2 ? timeResult.seconds + 2 : timeResult.seconds;
    const displayTime = isPlus2 ? `${formatTimeDisplay(finalTime)}+` : timeResult.display;

    return {
        valid: true,
        time: finalTime,
        status: isPlus2 ? 'plus2' : 'normal',
        display: displayTime,
        sortValue: finalTime,
        originalTime: timeResult.seconds
    };
}

// 解析具体的时间数值，支持多种格式
function parseTimeValue(timeStr) {
    if (!timeStr) {
        return { valid: false, error: '时间不能为空' };
    }

    // 格式1: 纯秒数 (如: 5.89, 12.34)
    if (/^\d+\.?\d*$/.test(timeStr)) {
        const seconds = parseFloat(timeStr);
        if (isNaN(seconds) || seconds < 0) {
            return { valid: false, error: '无效的秒数格式' };
        }
        return {
            valid: true,
            seconds: seconds,
            display: formatTimeDisplay(seconds)
        };
    }

    // 格式2: 分:秒 (如: 1:23.45, 2:15)
    const minSecMatch = timeStr.match(/^(\d+):(\d+(?:\.\d+)?)$/);
    if (minSecMatch) {
        const minutes = parseInt(minSecMatch[1]);
        const seconds = parseFloat(minSecMatch[2]);
        
        if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
            return { valid: false, error: '无效的分:秒格式' };
        }
        
        const totalSeconds = minutes * 60 + seconds;
        return {
            valid: true,
            seconds: totalSeconds,
            display: formatTimeDisplay(totalSeconds)
        };
    }

    // 格式3: 小时:分:秒 (如: 1:23:45, 0:45:12.34)
    const hourMinSecMatch = timeStr.match(/^(\d+):(\d+):(\d+(?:\.\d+)?)$/);
    if (hourMinSecMatch) {
        const hours = parseInt(hourMinSecMatch[1]);
        const minutes = parseInt(hourMinSecMatch[2]);
        const seconds = parseFloat(hourMinSecMatch[3]);
        
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || 
            hours < 0 || minutes < 0 || seconds < 0 || 
            minutes >= 60 || seconds >= 60) {
            return { valid: false, error: '无效的小时:分:秒格式' };
        }
        
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        return {
            valid: true,
            seconds: totalSeconds,
            display: formatTimeDisplay(totalSeconds)
        };
    }

    // 格式4: 步数 (如: 25, 30 - 用于最少步项目)
    if (/^\d+$/.test(timeStr)) {
        const moves = parseInt(timeStr);
        if (isNaN(moves) || moves < 0) {
            return { valid: false, error: '无效的步数格式' };
        }
        return {
            valid: true,
            seconds: moves, // 对于步数，直接存储数值
            display: moves.toString()
        };
    }

    return { valid: false, error: '不支持的时间格式' };
}

// 格式化时间显示
export function formatTimeDisplay(seconds, isMovesFormat = false) {
    if (seconds === null || seconds === undefined) {
        return '-';
    }

    if (isMovesFormat) {
        // 对于最少步，如果是整数则不显示小数，如果是平均值则保留两位小数
        return Number.isInteger(seconds) ? seconds.toString() : seconds.toFixed(2);
    }

    if (seconds === Infinity) {
        return 'DNF';
    }

    if (seconds < 0) {
        return '-';
    }

    // 小于60秒：显示为秒.毫秒
    if (seconds < 60) {
        return seconds.toFixed(2);
    }

    // 小于1小时：显示为分:秒.毫秒
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
    }

    // 大于等于1小时：显示为时:分:秒.毫秒
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
}

// 验证时间格式是否符合项目要求
export function validateTimeForProject(timeStr, projectName) {
    const parseResult = parseTimeString(timeStr);
    if (!parseResult.valid) {
        return parseResult;
    }

    // 根据项目类型进行额外验证
    if (projectName === '最少步') {
        // 最少步项目只接受整数步数
        if (parseResult.status !== 'dnf' && !Number.isInteger(parseResult.time)) {
            return { valid: false, error: '最少步项目只能输入整数步数' };
        }
    }

    return parseResult;
}

// 计算成绩统计（根据项目配置）
export function calculateResult(times, scoringMethod) {
    if (!times || times.length === 0) {
        return { result: null, display: '-' };
    }

    // 过滤有效成绩
    const validTimes = times.filter(t => t.status !== 'dnf');
    
    switch (scoringMethod) {
        case 'single':
            // 最佳单次
            return calculateBestSingle(times);
        case 'mo3':
            // 3次平均
            return calculateMeanOf3(times);
        case 'ao5':
            // 5次去头尾平均
            return calculateAverageOf5(times);
        case 'single_with_mo3':
            // 盲拧项目：按最佳单次排名，同时计算3次平均
            return calculateSingleWithMo3(times);
        default:
            return { result: null, display: '-' };
    }
}

// 计算最佳单次
function calculateBestSingle(times) {
    const validTimes = times.filter(t => t.status !== 'dnf');
    
    if (validTimes.length === 0) {
        return { result: null, display: 'DNF' };
    }

    const bestTime = Math.min(...validTimes.map(t => t.time));
    const bestResult = validTimes.find(t => t.time === bestTime);
    
    return {
        result: bestTime,
        display: bestResult.display,
        type: 'single'
    };
}

// 计算3次平均
function calculateMeanOf3(times) {
    if (times.length !== 3) {
        return { result: null, display: '-' };
    }

    const validTimes = times.filter(t => t.status !== 'dnf');
    
    if (validTimes.length === 0) {
        return { result: null, display: 'DNF' };
    }

    // 如果有DNF，按WCA规则处理
    if (validTimes.length < 3) {
        return { result: null, display: 'DNF' };
    }

    const sum = validTimes.reduce((acc, t) => acc + t.time, 0);
    const average = sum / validTimes.length;
    
    return {
        result: average,
        display: formatTimeDisplay(average),
        type: 'mo3'
    };
}

// 计算5次去头尾平均
function calculateAverageOf5(times) {
    if (times.length !== 5) {
        return { result: null, display: '-' };
    }

    // AO5规则：先按时间排序（DNF排最后），然后去头尾
    const sortedTimes = [...times].sort((a, b) => {
        // DNF排在最后（最慢）
        if (a.status === 'dnf' && b.status === 'dnf') return 0;
        if (a.status === 'dnf') return 1;
        if (b.status === 'dnf') return -1;
        return (a.time || 0) - (b.time || 0);
    });
    
    // 去掉最好（第一个）和最差（最后一个），保留中间3个
    const middleTimes = sortedTimes.slice(1, -1);
    
    // 检查中间3个成绩中是否还有DNF
    const middleHasDNF = middleTimes.some(t => t.status === 'dnf');
    if (middleHasDNF) {
        return { result: null, display: 'DNF' };
    }
    
    // 计算中间3个有效成绩的平均
    const sum = middleTimes.reduce((acc, t) => acc + t.time, 0);
    const average = sum / middleTimes.length;
    
    return {
        result: average,
        display: formatTimeDisplay(average),
        type: 'ao5'
    };
}

// 计算盲拧项目：按最佳单次排名，同时计算3次平均
function calculateSingleWithMo3(times) {
    if (times.length !== 3) {
        return { result: null, display: '-', average: null, averageDisplay: '-' };
    }

    const validTimes = times.filter(t => t.status !== 'dnf');
    
    // 计算最佳单次（用于排名）
    let bestSingle = null;
    let bestSingleDisplay = 'DNF';
    if (validTimes.length > 0) {
        bestSingle = Math.min(...validTimes.map(t => t.time));
        const bestResult = validTimes.find(t => t.time === bestSingle);
        bestSingleDisplay = bestResult.display;
    }
    
    // 计算3次平均（用于显示）
    let average = null;
    let averageDisplay = 'DNF';
    if (validTimes.length === 3) {
        // 全部有效，计算平均
        const sum = validTimes.reduce((acc, t) => acc + t.time, 0);
        average = sum / validTimes.length;
        averageDisplay = formatTimeDisplay(average);
    }
    
    return {
        result: bestSingle,           // 用于排名的最佳单次
        display: bestSingleDisplay,   // 最佳单次显示
        average: average,             // 3次平均值
        averageDisplay: averageDisplay, // 3次平均显示
        type: 'single_with_mo3'
    };
}

// 比较两个成绩（用于排序）
export function compareResults(a, b, scoringMethod) {
    // DNF总是排在最后
    if (a.result === null && b.result === null) return 0;
    if (a.result === null) return 1;
    if (b.result === null) return -1;
    
    // 对于最少步，数值越小越好
    // 对于时间，数值越小越好
    return a.result - b.result;
}

// 生成时间输入提示文本
export function getTimeInputPlaceholder(projectName) {
    const examples = {
        '三阶': '如: 5.89 6.12+ 5.45 DNF 6.01',
        '二阶': '如: 1.23 2.45+ 1.89 2.01 DNF',
        '四阶': '如: 45.67 1:02.34+ 50.12 DNF 55.89',
        '五阶': '如: 1:25.67 1:35.12+ 1:30.45 DNF 1:28.90',
        '六阶': '如: 2:45.67 3:02.34 2:55.12',
        '七阶': '如: 4:15.67 4:35.12 4:25.45',
        '三阶盲拧': '如: 1:25.67 DNF 1:35.12',
        '四阶盲拧': '如: 5:25.67 DNF 6:15.34',
        '五阶盲拧': '如: 12:45.67 DNF 15:20.12',
        '最少步': '如: 25 30 28'
    };

    return examples[projectName] || '如: 5.89 6.12+ 5.45 DNF 6.01';
}

// 获取项目格式示例（用于帮助提示）
export function getProjectFormatExamples() {
    return [
        { project: '三阶', sample: '5.89 6.12+ DNF 5.45 6.01', description: '5把去头尾平均' },
        { project: '二阶', sample: '1.23 2.45+ 1.89 2.01', description: '5把去头尾平均' },
        { project: '四阶', sample: '45.67 1:02+ 50.12 DNF', description: '5把去头尾平均' },
        { project: '六阶', sample: '2:45.67 3:02.34 2:55.12', description: '3把直接平均' },
        { project: '七阶', sample: '4:15.67 4:35.12 5:02.45', description: '3把直接平均' },
        { project: '盲拧', sample: '1:25.67 DNF 1:35.12', description: '按最佳单次排名' },
        { project: '最少步', sample: '25 30 28', description: '3次平均（保留小数）' }
    ];
}
