import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { _id, project, name, grade, single, average, date, competition } = ctx.body || {};
    
    if (!_id) {
      return {
        code: 400,
        message: '缺少记录ID'
      };
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (project) updateData.project = project;
    if (name) updateData.name = name;
    if (grade) updateData.grade = grade;
    if (single !== undefined) updateData.single = single;
    if (average !== undefined) updateData.average = average;
    if (date) updateData.date = date;
    if (competition) updateData.competition = competition;
    
    const result = await db.collection('schoolRecords')
      .doc(_id)
      .update(updateData);
    
    if (result.updated === 0) {
      return {
        code: 404,
        message: '记录不存在'
      };
    }
    
    return {
      code: 200,
      message: '更新校记录成功',
      data: result
    };
  } catch (error) {
    console.error('更新校记录失败:', error);
    return {
      code: 500,
      message: '更新校记录失败',
      error: error.message
    };
  }
}
