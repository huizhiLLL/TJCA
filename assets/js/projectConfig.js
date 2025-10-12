// 魔方项目配置
// 定义不同项目的比赛规则和计算方式

export const PROJECT_CONFIG = {
    // 标准项目 - 5把去头尾平均
    "三阶": {
        attempts: 5,
        scoringMethod: "ao5", // average of 5 (去头尾平均)
        timeFormat: "standard", // 标准时间格式 (秒.毫秒)
        displayName: "三阶",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "二阶": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "standard",
        displayName: "二阶",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "四阶": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "extended", // 支持超过1分钟的时间
        displayName: "四阶",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "五阶": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "extended",
        displayName: "五阶",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "三阶单手": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "standard",
        displayName: "三阶单手",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    
    // 大阶项目 - 3把直接平均
    "六阶": {
        attempts: 3,
        scoringMethod: "mo3", // mean of 3 (直接平均)
        timeFormat: "extended",
        displayName: "六阶",
        description: "3把成绩直接计算平均值，有DNF则平均为DNF"
    },
    "七阶": {
        attempts: 3,
        scoringMethod: "mo3",
        timeFormat: "extended",
        displayName: "七阶",
        description: "3把成绩直接计算平均值，有DNF则平均为DNF"
    },
    
    // 盲拧项目 - 按最佳单次排名，同时显示3次平均
    "三阶盲拧": {
        attempts: 3,
        scoringMethod: "single_with_mo3", // best single for ranking, mean of 3 for average display
        timeFormat: "extended",
        displayName: "三阶盲拧",
        description: "3把成绩，按最佳单次排名，同时显示3次平均"
    },
    "四阶盲拧": {
        attempts: 3,
        scoringMethod: "single_with_mo3",
        timeFormat: "extended",
        displayName: "四阶盲拧", 
        description: "3把成绩，按最佳单次排名，同时显示3次平均"
    },
    "五阶盲拧": {
        attempts: 3,
        scoringMethod: "single_with_mo3",
        timeFormat: "extended",
        displayName: "五阶盲拧",
        description: "3把成绩，按最佳单次排名，同时显示3次平均"
    },
    
    // 特殊项目
    "最少步": {
        attempts: 3,
        scoringMethod: "mo3",
        timeFormat: "moves", // 步数格式，不是时间
        displayName: "最少步",
        description: "3次尝试，记录步数，计算3次平均（保留两位小数），有DNF则平均为DNF"
    },
    "魔表": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "standard",
        displayName: "魔表",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "五魔方": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "extended",
        displayName: "五魔方",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "金字塔": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "standard",
        displayName: "金字塔",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "斜转": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "standard",
        displayName: "斜转",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    },
    "SQ1": {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "standard",
        displayName: "SQ1",
        description: "5把成绩，去掉最好和最差，计算中间3把的平均值"
    }
};

// 获取项目配置
export function getProjectConfig(projectName) {
    return PROJECT_CONFIG[projectName] || {
        attempts: 5,
        scoringMethod: "ao5",
        timeFormat: "standard",
        displayName: projectName,
        description: "默认配置：5把成绩，去掉最好和最差，计算中间3把的平均值"
    };
}

// 获取项目应该录入的成绩数量
export function getProjectAttempts(projectName) {
    const config = getProjectConfig(projectName);
    return config.attempts;
}

// 获取项目的计分方式
export function getProjectScoringMethod(projectName) {
    const config = getProjectConfig(projectName);
    return config.scoringMethod;
}

// 获取项目的时间格式类型
export function getProjectTimeFormat(projectName) {
    const config = getProjectConfig(projectName);
    return config.timeFormat;
}

// 检查项目是否支持DNF
export function projectSupportsDNF(projectName) {
    const config = getProjectConfig(projectName);
    // 最少步项目不支持DNF（记录步数，不是时间）
    return config.timeFormat !== "moves";
}

// 检查项目是否支持+2
export function projectSupportsPlus2(projectName) {
    const config = getProjectConfig(projectName);
    // 最少步和盲拧项目通常不支持+2
    return config.timeFormat !== "moves" && !projectName.includes("盲拧");
}

// 获取所有项目名称列表
export function getAllProjects() {
    return Object.keys(PROJECT_CONFIG);
}

// 按类别分组项目
export function getProjectsByCategory() {
    return {
        "速拧项目": ["三阶", "二阶", "四阶", "五阶", "三阶单手"],
        "大阶项目": ["六阶", "七阶"],
        "盲拧项目": ["三阶盲拧", "四阶盲拧", "五阶盲拧"],
        "特殊项目": ["最少步", "魔表", "五魔方", "金字塔", "斜转", "SQ1"]
    };
}
