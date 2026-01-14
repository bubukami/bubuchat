import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('错误:', error);

  res.status(500).json({
    code: 500,
    msg: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};
