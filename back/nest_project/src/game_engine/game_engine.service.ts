import { Injectable } from '@nestjs/common';
import { btoaPolyfill } from 'js-base64';
import { Ball } from './Ball';
import { Vec2 } from './math/Vec2';
import { Wall } from './Wall';
import { Collision } from './math/Collision';

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
	wallz: Wall[];
	n;
	aspectratio;

	constructor() {
		this.n = 2;
		this.ballz = [];
		this.wallz = [];
		this.aspectratio = 16/9;
		this.gs = { ballPosition: [], paddleOne: { x: 0, y: 0.5 }, paddleTwo: { x: this.aspectratio, y: 0.5 } };

		this.wallz[0] = new Wall(new Vec2(0, 0), new Vec2(this.aspectratio, 0));
		this.wallz[1] = new Wall(new Vec2(this.aspectratio, 0), new Vec2(this.aspectratio, 1));
		this.wallz[2] = new Wall(new Vec2(this.aspectratio, 1), new Vec2(0, 1));
		this.wallz[3] = new Wall(new Vec2(0, 1), new Vec2(0, 0));
		// console.log(this.wallz);

		//this.ballz[0] = new Ball(new Vec2(0.2,0.2), 0.1);
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
			this.wallz.forEach((w) => {
				if (Collision.coll_det_bw(ball, w)) {
					Collision.penetration_resolution_bw(ball, w);
					Collision.collision_resolution_bw(ball, w);
				}
			});
			for (let i = index + 1; i < this.ballz.length; i++) {
				if (Collision.coll_det_bb(this.ballz[index], this.ballz[i])) {
					Collision.penetration_resolution_bb(this.ballz[index], this.ballz[i]);
					Collision.collision_response_bb(this.ballz[index], this.ballz[i]);
				}
			}
		});
		this.ballz.forEach((ball, index) => {
			let bp: ballpos;
			bp = {
				x: ball.position.x,
				y: ball.position.y,
				r: ball.r,
			}
			// console.log("test", this.gs.ballPosition[index]);
			this.gs.ballPosition[index] = bp;
		});
	}

	game_init() {
		console.log("creating game");
	}
}
