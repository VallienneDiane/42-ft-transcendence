import { Injectable } from '@nestjs/common';
import { Ball } from './Ball';
import { Vec2 } from './match/Vec2';
import { Wall } from './Wall';
import { Collision } from './match/Collision';
import { Socket } from 'socket.io';
import { Match } from 'src/match/Match';
import { UserEntity } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { MatchService } from 'src/match/Match.service';
import { CreateMatchDto } from 'src/match/CreateMatch.dto';

/**
 * use to store info on a ball
 */
interface ballpos {
	x: number,
	y: number,
	r: number,
}

/**
 * use to share the game state
 */
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
	userid1: string;
	userid2: string;
	pl1_ready: boolean;
	pl2_ready: boolean;
	pl1_score: number;
	pl2_score: number;
	victory_condition: string;

	aspect_ratio = 16/9;
    cooldown = 180; // cooldown between ball respawn
    cooldown_start;
    game_must_stop: boolean;
    loop: any; // set_interval function handle for stoping the game

	constructor(private userservice: UserService, matchservice: MatchService) {
		this.ballz = [];
		this.wallz = [];
		
		// creating the two ball
		let small_ball = new Ball(new Vec2(0.5 * this.aspect_ratio, 0.35), 0.04);
		this.set_ball_random_start(small_ball);
		let big_ball = new Ball(new Vec2(0.5 * this.aspect_ratio, 0.7), 0.08);
		this.ballz[0] = small_ball;
		this.ballz[1] = big_ball;

		// creating the pl1 and pl2 paddle respectivly
		this.wallz[0] = new Wall(new Vec2(0.025, 0.415), new Vec2(0.025, 0.585), true);
		this.wallz[1] = new Wall(new Vec2(this.aspect_ratio - 0.025, 0.415), new Vec2(this.aspect_ratio - 0.025, 0.585), true);

		// creating the wall
		this.wallz[2] = new Wall(new Vec2(0, 0), new Vec2(this.aspect_ratio, 0), false);
		this.wallz[3] = new Wall(new Vec2(0, 1), new Vec2(this.aspect_ratio, 1), false);

		// setting the game start and stop variables
		this.pl1_ready = false;
		this.pl2_ready = false;
		this.game_must_stop = false;
		this.pl1_score = 0;
		this.pl2_score = 0;
        this.cooldown_start = 0;

		// filling the gamestate
		this.gs = { ballPosition: [	{x: this.ballz[0].position.x, y: this.ballz[0].position.y, r: this.ballz[0].r},
									{x: this.ballz[1].position.x, y: this.ballz[1].position.y, r: this.ballz[1].r}],
		paddleOne: { x: this.wallz[0].x_position - 0.015, y: this.wallz[0].y_position + this.wallz[0].length/2 },
		paddleTwo: { x: this.wallz[1].x_position + 0.015, y: this.wallz[1].y_position + this.wallz[0].length/2 } };
		console.log("from game engine service player are :" + this.pl1 + "and" + this.pl2);

	}

	/**
	 * give a random speed to a ball
	 * @param ball the ball to witch you want to give a random speed
	 */
	set_ball_random_start(ball: Ball) {
		let signe = (Math.random() - 0.5) > 0 ? 1 : -1;
        ball.speed = new Vec2((signe/120) * this.aspect_ratio, (Math.random() - 0.5) * Math.random()/60);
	}

	/**
	 * set who is gonna play the game
	 * @param player1 se
	 * @param player2 
	 */
	set_player (player1: Socket, player2: Socket, login1: string, login2: string) {
		this.userid1 = login1;
		this.userid2 = login2;
		this.pl1 = player1;
		this.pl2 = player2;
	}

	/**
	 * tell the correct wall to process the input of the client
	 * @param client the client sendin the input
	 * @param key the input in string format
	 */
	process_input (client: Socket, key: string) {
		if (client === this.pl1) {
			this.wallz[0].process_input(key);
		}
		else {
			this.wallz[1].process_input(key);
		}
	}

	/**
	 * tell the game to stop
	 */
	stop_game() {
		this.game_must_stop = true;
	}

	/**
	 * set the readyness of the playerm if both are ready then the game start
	 * @param player the player sendin the ready signal
	 * @param server use to emit to the correct room
	 */
	set_player_ready (player: Socket, server: any) {
		if (player === this.pl1) {
            this.pl1_ready = !this.pl1_ready;
        }
        else if (player === this.pl2) {
            this.pl2_ready = !this.pl2_ready;
        }
        if (this.pl1_ready && this.pl2_ready) {
            let thiss = this;
            this.loop = setInterval(function() {
                if (thiss.game_must_stop) {
                    thiss.pl1_ready = false;
                    thiss.pl2_ready = false;
                    clearInterval(thiss.loop);
                }
                thiss.main_loop();
                server.to(thiss.pl1.id).emit('Game_Update', thiss.gs)
            }, 1000/60);
        }
	}

	max(n1: number, n2: number): number {
		if (n1 >= n2) {
			return n1;
		}
		return n2;
	}

	min(n1: number, n2: number): number {
		if (n1 < n2) {
			return n1;
		}
		return n2;
	}

	close_the_game() {
		let match: CreateMatchDto;
		match.score_winner = this.max(this.pl1_score, this.pl2_score);
		match.score_looser = this.min(this.pl1_score, this.pl2_score);
		match.winner = await this.userservice.findById(this.pl1_score > this.pl2_score ? this.userid1 : this.userid2);
		match.looser = await this.userservice.findById(this.pl1_score < this.pl2_score ? this.userid1 : this.userid2);
		this.game_must_stop = true;
	}

	main_loop() {
		this.cooldown_start++; // use to time the delay between balls respawn

		// check if a ball is dead
		if (this.cooldown_start - this.cooldown < 0) // don't do anything if on cooldown
			return;
		if (this.ballz[0].alive === false || this.ballz[1].alive === false) { // respawn a ball if there was a goal TODO register goal
            // spwan and set the new balls
			let small_ball = new Ball(new Vec2(0.5 * this.aspect_ratio, 0.35), 0.04);
			this.set_ball_random_start(small_ball);
			let big_ball = new Ball(new Vec2(0.5 * this.aspect_ratio, 0.7), 0.08);
			this.ballz[0] = small_ball;
			this.ballz[1] = big_ball;
			this.wallz[0].reset_self_y_position();
			this.wallz[1].reset_self_y_position();
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
			this.gs.paddleOne = {
				x: this.wallz[0].x_position - 0.015,
				y: this.wallz[0].y_position + this.wallz[0].length/2
			};
			this.gs.paddleTwo = {
				x: this.wallz[1].x_position + 0.015,
				y: this.wallz[1].y_position + this.wallz[1].length/2
			};
			// reset the timer
            this.cooldown_start = 0;
			return;
        }

		// update the paddle
		this.wallz[0].update_self_position();
		this.wallz[1].update_self_position();
		// for each ball check the collision with each wall then with the other ball
		this.ballz.forEach((ball, index) => {
			// update the ball position
			let r = ball.update_self_position();
			if (r === 1) {
				this.pl1_score++;
			}
			else if (r === 2) {
				this.pl2_score++;
			}
			if (this.pl1_score > 4 || this.pl2_score > 4) {
				this.game_must_stop = true;
				return;
			}

			// check for ball wall collision
			this.wallz.forEach((w) => {
				if (Collision.coll_det_bw(ball, w)) { // if collision
					Collision.penetration_resolution_bw(ball, w); // then do the repositionning
					Collision.collision_resolution_bw(ball, w); // and the change in speed
				}
			});

			// check ball ball collision
			for (let i = index + 1; i < this.ballz.length; i++) {
				if (Collision.coll_det_bb(this.ballz[index], this.ballz[i])) {
					Collision.penetration_resolution_bb(this.ballz[index], this.ballz[i]);
					Collision.collision_response_bb(this.ballz[index], this.ballz[i]);
				}
			}
		});

		// update the state of the game
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
		this.gs.paddleOne = {
            x: this.wallz[0].x_position - 0.015,
            y: this.wallz[0].y_position + this.wallz[0].length/2
        };
        this.gs.paddleTwo = {
            x: this.wallz[1].x_position + 0.015,
            y: this.wallz[1].y_position + this.wallz[1].length/2
        };
	}
}
