import { Router } from 'express';
import { User, Message, Conversation } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { generalLimiter } from '../middleware/rateLimit';
import { Op } from 'sequelize';

const router = Router();

router.get('/users', authMiddleware, generalLimiter, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
      });
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
      },
      attributes: ['id', 'username', 'email', 'avatar', 'status', 'last_seen'],
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: error.message || '获取用户列表失败',
    });
  }
});

router.get('/conversations', authMiddleware, generalLimiter, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
      });
    }

    const conversations = await Conversation.findAll({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          model: User,
          as: 'otherUser',
          attributes: ['id', 'username', 'avatar', 'status'],
        },
      ],
      order: [['last_message_at', 'DESC']],
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: conversations,
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: error.message || '获取会话列表失败',
    });
  }
});

router.get('/messages/:userId', authMiddleware, generalLimiter, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
      });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const userIdNum = parseInt(userId as string);

    const { count, rows } = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          {
            sender_id: req.user.id,
            receiver_id: userIdNum,
          },
          {
            sender_id: userIdNum,
            receiver_id: req.user.id,
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatar'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const messages = rows.reverse();

    await Message.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          sender_id: userIdNum,
          receiver_id: req.user.id,
          is_read: false,
        },
      }
    );

    res.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: messages,
        total: count,
        page,
        limit,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: error.message || '获取消息记录失败',
    });
  }
});

router.post('/messages/:userId/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
      });
    }

    const { userId } = req.params;
    const userIdNum = parseInt(userId as string);

    await Message.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          sender_id: userIdNum,
          receiver_id: req.user.id,
          is_read: false,
        },
      }
    );

    res.json({
      code: 200,
      msg: '标记已读成功',
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: error.message || '标记已读失败',
    });
  }
});

router.delete('/messages/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
      });
    }

    const { id } = req.params;
    const messageId = parseInt(id as string);

    const message = await Message.findByPk(messageId);

    if (!message) {
      return res.status(404).json({
        code: 404,
        msg: '消息不存在',
      });
    }

    if (message.sender_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        msg: '无权删除该消息',
      });
    }

    await message.destroy();

    res.json({
      code: 200,
      msg: '删除成功',
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: error.message || '删除消息失败',
    });
  }
});

export default router;
