import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { _id, week, date, contests } = ctx.body || {};
    
    if (!_id) {
      return {
        code: 400,
        message: '缺少周赛ID'
      };
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (week) updateData.week = week;
    if (date) updateData.date = date;
    if (contests) updateData.contests = contests;
    
    const result = await db.collection('weeklyContests')
      .doc(_id)
      .update(updateData);
    
    if (result.updated === 0) {
      return {
        code: 404,
        message: '周赛记录不存在'
      };
    }
    
    return {
      code: 200,
      message: '更新周赛记录成功',
      data: result
    };
  } catch (error) {
    console.error('更新周赛记录失败:', error);
    return {
      code: 500,
      message: '更新周赛记录失败',
      error: error.message
    };
  }
}
