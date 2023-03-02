import { Test, TestingModule } from '@nestjs/testing';
import { GameEngineService } from './game_engine.service';

describe('GameEngineService', () => {
  let service: GameEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameEngineService],
    }).compile();

    service = module.get<GameEngineService>(GameEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
