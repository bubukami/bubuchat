import { User } from '../models';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

export class AuthService {
  async register(username: string, email: string, password: string) {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      status: 'offline',
    });

    const token = this.generateToken(user.id, user.username, user.email);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
      },
    };
  }

  async login(username: string, password: string) {
    const user = await User.findOne({
      where: {
        username,
      },
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    const token = this.generateToken(user.id, user.username, user.email);

    await user.update({
      status: 'online',
      last_seen: new Date(),
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
      },
    };
  }

  async logout(userId: number) {
    await User.update(
      {
        status: 'offline',
        last_seen: new Date(),
      },
      {
        where: { id: userId },
      }
    );
  }

  private generateToken(id: number, username: string, email: string): string {
    return jwt.sign(
      {
        id,
        username,
        email,
      },
      process.env.JWT_SECRET || 'secret',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      } as any
    );
  }

  async getUserById(id: number) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] } as any,
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  async updateOnlineStatus(userId: number, status: 'online' | 'offline' | 'away') {
    await User.update(
      {
        status,
        last_seen: new Date(),
      },
      {
        where: { id: userId },
      }
    );
  }
}

export default new AuthService();
