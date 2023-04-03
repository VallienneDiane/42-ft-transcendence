import { Injectable } from '@nestjs/common';
import { Ball } from './Ball';
import { Vec2 } from './math/Vec2';
import { Wall } from './Wall';
import { Collision } from './math/Collision';
import { Socket } from 'socket.io';

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

	gs: gameState;
	ballz: Ball[];
	wallz: Wall[];

	pl1: Socket;
	pl2: Socket;
	pl1_ready: boolean;
	pl2_ready: boolean;

	aspect_ratio = 16/9;
    cooldown = 90; // cooldown between ball respawn
    cooldown_start;
    game_must_stop: boolean;
    loop; // set_interval function handle for stoping the game

	constructor() {
		this.ballz = [];
		this.wallz = [];
		
		let small_ball = new Ball(new Vec2(0.5 * this.aspect_ratio, 0.35), 0.04);
		this.set_ball_random_start(small_ball);
		let big_ball = new Ball(new Vec2(0.5 * this.aspect_ratio, 0.7), 0.08);
		this.ballz[0] = small_ball;
		this.ballz[1] = big_ball;

		this.wallz[0] = new Wall(new Vec2(0.025, 0.415), new Vec2(0.025, 0.585));
		this.wallz[1] = new Wall(new Vec2(this.aspect_ratio - 0.025, 0.415), new Vec2(this.aspect_ratio - 0.025, 0.585));

		this.wallz[2] = new Wall(new Vec2(0, 0), new Vec2(this.aspect_ratio, 0));
		this.wallz[3] = new Wall(new Vec2(0, 1), new Vec2(this.aspect_ratio, 1));

		this.pl1_ready = false;
		this.pl2_ready = false;
		this.game_must_stop = false;

        this.cooldown_start = 0;
		this.gs = { ballPosition: [	{x: this.ballz[0].position.x, y: this.ballz[0].position.y, r: this.ballz[0].r},
									{x: this.ballz[1].position.x, y: this.ballz[1].position.y, r: this.ballz[1].r}],
		paddleOne: { x: this.wallz[0].x_position, y: this.wallz[0].y_position },
		paddleTwo: { x: this.wallz[1].x_position, y: this.wallz[1].y_position } };
		console.log("from game engine service player are :" + this.pl1 + "and" + this.pl2);

	}

	set_ball_random_start(ball: Ball) {
		let signe = (Math.random() - 0.5) > 0 ? 1 : -1;
        ball.speed = new Vec2((signe/120) * this.aspect_ratio, (Math.random() - 0.5) * Math.random()/120);
	}

	stop_game() {
		this.game_must_stop = true;
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
