import { Injectable } from '@nestjs/common';

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
    ball: Simple_Ball;
    
}
