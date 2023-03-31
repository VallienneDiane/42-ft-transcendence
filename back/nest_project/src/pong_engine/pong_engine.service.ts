import { Injectable } from '@nestjs/common';
import { Simple_ball } from './Simple_Ball';
import { Simple_paddle } from './Simple_paddle';

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
export class PongEngineService {

    public gs: gameState;
    ball: Simple_ball;
    p1: Simple_paddle;
    p2: Simple_paddle;
    aspect_ratio = 16/9;

    constructor () {
        this.ball = new Simple_ball();
        this.p1 = new Simple_paddle();
        this.p2 = new Simple_paddle();
        this.p2.x_position = this.aspect_ratio - 0.01;
        this.gs = {ballPosition: [{x: this.ball.x_position, y: this.ball.y_position, r: this.ball.r}],
        paddleOne: {x: this.p1.x_position, y: this.p1.y_position},
        paddleTwo: {x: this.p2.x_position, y: this.p2.y_position}};
    }

    main_loop() {
        this.ball.update_self_position(this.p1, this.p2);
        let bp: ballpos;
        bp = {
            x: this.ball.x_position,
            y: this.ball.y_position,
            r: this.ball.r,
        };
        this.gs.ballPosition[0] = bp;
        this.gs.paddleOne = {
            x: this.p1.x_position,
            y: this.p1.y_position + this.p1.lenght/2
        };
    }
}
