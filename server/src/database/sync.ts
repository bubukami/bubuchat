import sequelize from '../src/utils/database';
import { User, Message, Conversation } from '../src/models';

async function syncDatabase() {
  try {
    console.log('开始同步数据库...');

    await sequelize.authenticate();
    console.log('数据库连接成功');

    await sequelize.sync({ force: false });
    console.log('数据库表同步成功');

    console.log('数据库同步完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库同步失败:', error);
    process.exit(1);
  }
}

syncDatabase();
