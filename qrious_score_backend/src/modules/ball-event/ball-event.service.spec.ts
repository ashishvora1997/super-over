import { Test, TestingModule } from '@nestjs/testing';
import { BallEventService } from './ball-event.service';

describe('BallEventService', () => {
  let service: BallEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: BallEventService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BallEventService>(BallEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
