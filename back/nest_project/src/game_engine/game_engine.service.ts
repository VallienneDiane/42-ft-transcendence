import { Injectable } from '@nestjs/common';
import { Ball } from './Ball';

@Injectable()
export class GameEngineService {

	ball: Ball;

	hello() {
		console.log('heuuu ca marche ?');
	}

	main_loop() {
		this.ball.update_self_position();
		console.log("game was updated");
	}

	game_init() {
		console.log("creating game");
	}
}
