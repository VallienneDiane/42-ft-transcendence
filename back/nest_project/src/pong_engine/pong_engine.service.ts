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
    }
    
}
