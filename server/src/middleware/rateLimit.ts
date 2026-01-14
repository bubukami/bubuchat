import rateLimit from 'express-rate-limit';

export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      code: 429,
      msg: message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const generalLimiter = createRateLimiter(
  15 * 60 * 1000,
  100,
  '请求过于频繁，请稍后重试'
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000,
  5,
  '登录请求过于频繁，请稍后重试'
);
