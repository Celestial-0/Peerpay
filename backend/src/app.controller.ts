import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';
import { join } from 'path';
import { Public } from './auth/auth.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHome(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'test', 'ui', 'index.html'));
  }
}
