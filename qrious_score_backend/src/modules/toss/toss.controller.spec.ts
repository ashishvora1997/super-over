import { Test, TestingModule } from '@nestjs/testing';
import { TossController } from './toss.controller';

describe('TossController', () => {
  let controller: TossController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TossController],
    }).compile();

    controller = module.get<TossController>(TossController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
