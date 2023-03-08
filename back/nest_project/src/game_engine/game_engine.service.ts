import { Injectable } from '@nestjs/common';
import { Ball } from './Ball';
import { Vec2 } from './math/Vec2';

interface gameState {
	ballPosition: {x: number, y: number},
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number }
  }

@Injectable()
export class GameEngineService {
	ball: Ball = new Ball(0.5, 0.5, 0.1, new Vec2(0, 0));

	public gs: gameState;

	constructor() {
		this.gs = {
			ballPosition: {x: 0.5, y: 0.5},
			paddleOne: {x: 1, y: 0.5},
			paddleTwo: {x: 0, y: 0.5}
		};
	}

	hello() {
		console.log('heuuu ca marche ?');
	}

	main_loop() {
		this.ball.update_self_position();
		this.gs.ballPosition.x = this.ball.position.x;
		this.gs.ballPosition.y = this.ball.position.y;
		console.log("game was updated");
	}

	game_init() {
		console.log("creating game");
	}
}
