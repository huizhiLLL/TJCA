import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { project, isCurrent } = ctx.query || {};
    
    let filter = {};
    if (project) filter.project = project;
    if (isCurrent !== undefined) filter.isCurrent = isCurrent === 'true';
    
    const result = await db.collection('schoolRecords')
      .where(filter)
      .orderBy('project', 'asc')
      .orderBy('date', 'desc')
      .get();
    
    return {
      code: 200,
      message: '获取校记录成功',
      data: result.data
    };
  } catch (error) {
    console.error('获取校记录失败:', error);
    return {
      code: 500,
      message: '获取校记录失败',
      error: error.message
    };
  }
}
