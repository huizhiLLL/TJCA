import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { project, name, grade, single, average, date, competition } = ctx.body || {};
    
    // 参数验证
    if (!project || !name || !grade || !date || !competition) {
      return {
        code: 400,
        message: '缺少必要参数',
        required: ['project', 'name', 'grade', 'date', 'competition']
      };
    }
    
    // 检查是否已存在相同项目的记录
    const existingRecord = await db.collection('schoolRecords')
      .where({
        project: project,
        isCurrent: true
      })
      .get();
    
    // 如果存在当前记录，需要更新为历史记录
    if (existingRecord.data.length > 0) {
      await db.collection('schoolRecords')
        .where({
          project: project,
          isCurrent: true
        })
        .update({
          isCurrent: false
        });
    }
    
    // 创建新记录
    const newRecord = {
      project,
      name,
      grade,
      single: single || '',
      average: average || '',
      date,
      competition,
      isCurrent: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('schoolRecords').add(newRecord);
    
    return {
      code: 200,
      message: '创建校记录成功',
      data: {
        _id: result.id,
        ...newRecord
      }
    };
  } catch (error) {
    console.error('创建校记录失败:', error);
    return {
      code: 500,
      message: '创建校记录失败',
      error: error.message
    };
  }
}
