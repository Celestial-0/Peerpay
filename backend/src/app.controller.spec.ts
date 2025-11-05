import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('getHome', () => {
    it('should serve the index.html file', () => {
      const mockResponse = {
        sendFile: jest.fn(),
      } as unknown as Response;

      appController.getHome(mockResponse);

      expect(mockResponse.sendFile).toHaveBeenCalledWith(
        join(__dirname, '..', 'test', 'ui', 'index.html'),
      );
    });
  });
});
