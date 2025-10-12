import cloud from '@lafjs/cloud'

export default async function (ctx) { // FunctionContext
  try {
    const db = cloud.database();
    const method = ctx.method;
    
    switch (method) {
      case 'GET':
        return await getContests(db, ctx.query);
      case 'POST':
        return await createContest(db, ctx.body);
      case 'PUT':
        return await updateContest(db, ctx.body);
      case 'DELETE':
        return await deleteContest(db, ctx.query);
      default:
        return {
          code: 405,
          message: '不支持的请求方法',
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
        };
    }
  } catch (error) {
    console.error('周赛接口错误:', error);
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    };
  }
}

/**
 * 获取周赛记录列表
 * GET /contests?week=xxx&project=xxx
 */
async function getContests(db, query) {
  try {
    const { week, project } = query || {};
    
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

/**
 * 创建周赛记录
 * POST /contests
 * Body: { week, date, contests }
 */
async function createContest(db, body) {
  try {
    const { week, date, contests } = body || {};
    
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

/**
 * 更新周赛记录
 * PUT /contests
 * Body: { _id, week?, date?, contests? }
 */
async function updateContest(db, body) {
  try {
    const { _id, week, date, contests } = body || {};
    
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

/**
 * 删除周赛记录
 * DELETE /contests?_id=xxx
 */
async function deleteContest(db, query) {
  try {
    const { _id } = query || {};
    
    if (!_id) {
      return {
        code: 400,
        message: '缺少周赛ID'
      };
    }
    
    const result = await db.collection('weeklyContests')
      .doc(_id)
      .remove();
    
    if (result.deleted === 0) {
      return {
        code: 404,
        message: '周赛记录不存在'
      };
    }
    
    return {
      code: 200,
      message: '删除周赛记录成功',
      data: result
    };
  } catch (error) {
    console.error('删除周赛记录失败:', error);
    return {
      code: 500,
      message: '删除周赛记录失败',
      error: error.message
    };
  }
}
