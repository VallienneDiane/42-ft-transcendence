import { Injectable, Inject } from '@nestjs/common';
import { Simple_ball } from './Simple_Ball';
import { Simple_paddle } from './Simple_paddle';
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
export class PongEngineService {

    public gs: gameState;
    ball: Simple_ball;
    p1: Simple_paddle;
    p2: Simple_paddle;
    pl1: Socket;
    pl2: Socket;
    pl1_ready: boolean;
    pl2_ready: boolean;
    spectator: Socket[];
    aspect_ratio = 16/9;
    cooldown = 60;
    cooldown_start;
    game_is_ready: boolean;

    constructor () {
        this.ball = new Simple_ball();
        this.p1 = new Simple_paddle();
        this.p2 = new Simple_paddle();
        this.pl1_ready = false;
        this.pl2_ready = false;
        this.game_is_ready = false;
        this.spectator = [];
        this.cooldown_start = 0;
        this.p2.x_position = this.aspect_ratio - 0.025;
        this.gs = {ballPosition: [{x: this.ball.x_position, y: this.ball.y_position, r: this.ball.r}],
        paddleOne: {x: this.p1.x_position, y: this.p1.y_position},
        paddleTwo: {x: this.p2.x_position, y: this.p2.y_position}};
        //console.log("from pong engine service ;y player are :" + pl1 + "and" + pl2);
    }

    set_player(player1: Socket, player2: Socket) {
        this.pl1 = player1;
        this.pl2 = player2;
        console.log("2 player has been set the match can start player 1 :" + this.pl1.id + "player 2 :" + this.pl2.id);
    }
    
    /**
     * check if both player are readym if so set the corresponding flag to true
     * @param player the socket of the ready player
     */
    set_player_ready(player: Socket) {
        if (player === this.pl1) {
            this.pl1_ready = true;
        }
        else if (player === this.pl2) {
            this.pl2_ready = true;
        }
        if (this.pl1_ready && this.pl2_ready) {
            this.game_is_ready = true;
        }
    }

    main_loop() {
        if (!this.game_is_ready) {
            return;
        }
        this.cooldown_start++;
        if (this.ball.state === "dead") {
            this.ball = new Simple_ball();
            this.cooldown_start = 0;
        }
        let bp: ballpos;
        bp = {
            x: this.ball.x_position,
            y: this.ball.y_position,
            r: this.ball.r,
        };
        this.gs.ballPosition[0] = bp;
        this.gs.paddleOne = {
            x: this.p1.x_position - 0.015,
            y: this.p1.y_position + this.p1.lenght/2
        };

        this.gs.paddleTwo = {
            x: this.p2.x_position + 0.015,
            y: this.p2.y_position + this.p2.lenght/2
        };
        if (this.cooldown_start - this.cooldown < 0)
            return;
        this.ball.update_self_position(this.p1, this.p2);
    }
}
