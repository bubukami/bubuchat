import { Router } from 'express';
import { body } from 'express-validator';
import authService from '../services/authService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('用户名长度为3-50个字符'),
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const result = await authService.register(username, email, password);

      res.json({
        code: 200,
        msg: '注册成功',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        code: 400,
        msg: error.message || '注册失败',
      });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { username, password } = req.body;

      const result = await authService.login(username, password);

      res.json({
        code: 200,
        msg: '登录成功',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        code: 401,
        msg: error.message || '登录失败',
      });
    }
  }
);

router.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user) {
      await authService.logout(req.user.id);
    }

    res.json({
      code: 200,
      msg: '登出成功',
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: error.message || '登出失败',
    });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        msg: '未授权',
      });
    }

    const user = await authService.getUserById(req.user.id);

    res.json({
      code: 200,
      msg: '获取成功',
      data: user,
    });
  } catch (error: any) {
    res.status(404).json({
      code: 404,
      msg: error.message || '获取用户信息失败',
    });
  }
});

export default router;
