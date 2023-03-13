import { Injectable } from '@nestjs/common';
import { btoaPolyfill } from 'js-base64';
import { Ball } from './Ball';
import { Vec2 } from './math/Vec2';

interface ballpos {
	x: number,
	y: number,
	r: number,
}

interface gameState {
	ballPosition: ballpos[],
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number },
  }

@Injectable()
export class GameEngineService {

	public gs: gameState;
	ballz: Ball[];
	n;
	aspectratio;

	constructor() {
		this.n = 2;
		this.ballz = [];
		this.aspectratio = 16/9;
		this.gs = { ballPosition: [], paddleOne: { x: 0, y: 0.5 }, paddleTwo: { x: this.aspectratio, y: 0.5 } };

		for (let index = 0; index < this.n; index++) {
			//let position = new Vec2(Math.random(), Math.random());
			let position = new Vec2(0.5, 0.5);
			let radius = Math.random() * 0.05 + 0.05;
			//let radius = 0.1;
			this.ballz[index] = new Ball(position, radius);
		}
	}

	main_loop() {
		this.ballz.forEach((ball, index) => {
			ball.update_self_position();
			for (let i = index + 1; i < this.ballz.length; i++) {
				if (Ball.coll_det_bb(this.ballz[index], this.ballz[i])) {
					Ball.penetration_resolution_bb(this.ballz[index], this.ballz[i]);
					//Ball.collision_response_bb(this.ballz[index], this.ballz[i]);
				}
			}
		});
		for (let index = 0; index < this.n; index++) {
			let bp: ballpos;
			bp = {
				x: this.ballz[index].position.x,
				y: this.ballz[index].position.y,
				r: this.ballz[index].r,
			}
			console.log(this.gs.ballPosition[index]);
			this.gs.ballPosition[index] = bp;
		}
	}

	game_init() {
		console.log("creating game");
	}
}
