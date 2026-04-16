import { Test, TestingModule } from '@nestjs/testing';
import { InningsService } from './innings.service';

describe('InningsService', () => {
  let service: InningsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InningsService],
    }).compile();

    service = module.get<InningsService>(InningsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
