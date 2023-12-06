import { NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

export class LogMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(
      `[REQ] ${req.method} ${req.url} ${new Date().toLocaleString('kr')}`
    );

    next();
  }
}
