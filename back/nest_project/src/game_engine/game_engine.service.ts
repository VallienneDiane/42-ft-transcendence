import { Injectable } from '@nestjs/common';
import { Ball } from './Ball';
import { Vec2 } from "./math/Vec2";


@Injectable()
export class GameEngineService {

	ball: Ball = new Ball(0.5, 0.5, 2);

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
