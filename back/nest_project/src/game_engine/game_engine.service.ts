import { Injectable } from '@nestjs/common';
import { Ball } from './Ball';
import { Vec2 } from './math/Vec2';

interface gameState {
	ballPosition: Ball[],
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number },
  }

@Injectable()
export class GameEngineService {

	ballz: Ball[];
	n;

	public gs: gameState;

	constructor() {
		this.n = 2;
		this.ballz = [];

		for (let index = 0; index < this.n; index++) {
			let position = new Vec2(Math.random(), Math.random());
			let radius = Math.random() * 0.1;
			this.ballz[index] = new Ball(position, radius);
		}

		this.gs = {
			ballPosition: this.ballz,
			paddleOne: {x: 1, y: 0.5},
			paddleTwo: {x: 0, y: 0.5}
		};
	}

	main_loop() {
		this.ballz.forEach((ball) => {
			ball.update_self_position();
		});
		for (let index = 0; index < this.n; index++) {
			this.gs.ballPosition[index].position = this.ballz[index].position;
		}
		console.log("game was updated");
		console.log("acc : {}, {}", this.ballz[0].acc.x, this.ballz[0].acc.y);
	}

	game_init() {
		console.log("creating game");
	}
}
