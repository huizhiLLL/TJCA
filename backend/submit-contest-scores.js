import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { contestId, project, players } = ctx.body || {};
    
    if (!contestId || !project || !players) {
      return {
        code: 400,
        message: '缺少必要参数：contestId, project, players'
      };
    }
    
    // 获取周赛记录
    const contestResult = await db.collection('weeklyContests')
      .doc(contestId)
      .get();
    
    if (!contestResult.data) {
      return {
        code: 404,
        message: '周赛记录不存在'
      };
    }
    
    const contest = contestResult.data;
    
    // 查找对应的项目
    const projectIndex = contest.contests.findIndex(c => c.project === project);
    if (projectIndex === -1) {
      return {
        code: 404,
        message: '项目不存在'
      };
    }
    
    // 为每个成绩记录添加轮数和时间戳
    const playersWithMetadata = players.map(player => ({
      ...player,
      round: player.round || 1, // 默认第1轮
      submittedAt: new Date().toISOString(), // 提交时间戳
      submittedBy: player.submittedBy || 'admin' // 提交者（可选）
    }));
    
    // 更新项目成绩
    contest.contests[projectIndex].results = playersWithMetadata;
    
    // 更新周赛记录
    const updateResult = await db.collection('weeklyContests')
      .doc(contestId)
      .update({
        contests: contest.contests,
        updatedAt: new Date()
      });
    
    return {
      code: 200,
      message: '提交成绩成功',
      data: {
        project: project,
        playersCount: players.length,
        totalTimes: players.reduce((sum, player) => sum + (player.times || []).length, 0)
      }
    };
  } catch (error) {
    console.error('提交成绩失败:', error);
    return {
      code: 500,
      message: '提交成绩失败',
      error: error.message
    };
  }
}
