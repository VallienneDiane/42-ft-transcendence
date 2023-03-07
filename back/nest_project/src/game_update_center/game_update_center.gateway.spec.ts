import { Test, TestingModule } from '@nestjs/testing';
import { GameUpdateCenterGateway } from './game_update_center.gateway';

describe('GameUpdateCenterGateway', () => {
  let gateway: GameUpdateCenterGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameUpdateCenterGateway],
    }).compile();

    gateway = module.get<GameUpdateCenterGateway>(GameUpdateCenterGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
