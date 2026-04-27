import { Test, TestingModule } from '@nestjs/testing';
import { BallEventController } from './ball-event.controller';
import { BallEventService } from './ball-event.service';

describe('BallEventController', () => {
  let controller: BallEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BallEventController],
      providers: [
        {
          provide: BallEventService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<BallEventController>(BallEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
