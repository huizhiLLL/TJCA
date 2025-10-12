import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { week, date, contests } = ctx.body || {};
    
    // 参数验证
    if (!week || !date || !contests || !Array.isArray(contests)) {
      return {
        code: 400,
        message: '缺少必要参数',
        required: ['week', 'date', 'contests']
      };
    }
    
    // 检查周次是否已存在
    const existingWeek = await db.collection('weeklyContests')
      .where({ week })
      .get();
    
    if (existingWeek.data.length > 0) {
      return {
        code: 409,
        message: '该周次已存在'
      };
    }
    
    // 创建周赛记录
    const newContest = {
      week,
      date,
      contests,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('weeklyContests').add(newContest);
    
    return {
      code: 200,
      message: '创建周赛记录成功',
      data: {
        _id: result.id,
        ...newContest
      }
    };
  } catch (error) {
    console.error('创建周赛记录失败:', error);
    return {
      code: 500,
      message: '创建周赛记录失败',
      error: error.message
    };
  }
}
