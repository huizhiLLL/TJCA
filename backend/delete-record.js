import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const { _id } = ctx.query || {};
    
    if (!_id) {
      return {
        code: 400,
        message: '缺少记录ID'
      };
    }
    
    const result = await db.collection('schoolRecords')
      .doc(_id)
      .remove();
    
    if (result.deleted === 0) {
      return {
        code: 404,
        message: '记录不存在'
      };
    }
    
    return {
      code: 200,
      message: '删除校记录成功',
      data: result
    };
  } catch (error) {
    console.error('删除校记录失败:', error);
    return {
      code: 500,
      message: '删除校记录失败',
      error: error.message
    };
  }
}
