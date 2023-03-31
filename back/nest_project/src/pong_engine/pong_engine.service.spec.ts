import { Test, TestingModule } from '@nestjs/testing';
import { PongEngineService } from './pong_engine.service';

describe('PongEngineService', () => {
  let service: PongEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PongEngineService],
    }).compile();

    service = module.get<PongEngineService>(PongEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
