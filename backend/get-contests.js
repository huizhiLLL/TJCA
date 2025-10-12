import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { week, project } = ctx.query || {};
    
    let filter = {};
    if (week) filter.week = week;
    
    const result = await db.collection('weeklyContests')
      .where(filter)
      .orderBy('date', 'desc')
      .get();
    
    let contests = result.data;
    
    // 如果指定了项目，过滤结果
    if (project) {
      contests = contests.map(week => ({
        ...week,
        contests: week.contests.filter(contest => contest.project === project)
      })).filter(week => week.contests.length > 0);
    }
    
    return {
      code: 200,
      message: '获取周赛记录成功',
      data: contests
    };
  } catch (error) {
    console.error('获取周赛记录失败:', error);
    return {
      code: 500,
      message: '获取周赛记录失败',
      error: error.message
    };
  }
}
