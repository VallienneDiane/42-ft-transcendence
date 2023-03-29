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
	ballPosition: ballpos,
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number },
}

@Injectable()
export class PongEngineService {

    gs: gameState;
    ball: Simple_ball;
    p1: Simple_paddle;
    p2: Simple_paddle;

    pl1: Socket;
    pl2: Socket;
    pl1_ready: boolean;
    pl2_ready: boolean;
    spectator: Socket[];

    aspect_ratio = 16/9;
    cooldown = 90; // cooldown between ball respawn
    cooldown_start;
    game_is_ready: boolean;
    game_must_stop: boolean;
    loop;

    constructor () {
        this.ball = new Simple_ball();
        this.p1 = new Simple_paddle();
        this.p2 = new Simple_paddle();

        this.pl1_ready = false;
        this.pl2_ready = false;
        this.game_is_ready = false;
        this.game_must_stop = false;
        this.spectator = [];

        this.cooldown_start = 0;
        this.p2.x_position = this.aspect_ratio - 0.025;
        this.gs = {ballPosition: {x: this.ball.x_position, y: this.ball.y_position, r: this.ball.r},
        paddleOne: {x: this.p1.x_position, y: this.p1.y_position},
        paddleTwo: {x: this.p2.x_position, y: this.p2.y_position}};
        console.log("from pong engine service ;y player are :" + this.pl1 + "and" + this.pl2);
    }

    /**
     * set who are the two socket the input must be taken into acount
     * @param player1 
     * @param player2 
     */
    set_player(player1: Socket, player2: Socket) {
        this.pl1 = player1;
        this.pl2 = player2;
        console.log("2 player has been set the match can start player 1 :" + this.pl1.id + "player 2 :" + this.pl2.id);
    }
    
    process_input (client: Socket, key: any) {
        if (client === this.pl1) {
            this.p1.process_input(key);
        }
        else {
            this.p2.process_input(key);
        }
    }

    stop_game() {
        this.game_must_stop = true;
    }

    /**
     * check if both player are ready and start the game loop
     * @param player the socket of the ready player
     */
    set_player_ready(player: Socket, server) {
        if (player === this.pl1) {
            this.pl1_ready = !this.pl1_ready;
        }
        else if (player === this.pl2) {
            this.pl2_ready = !this.pl2_ready;
        }
        if (this.pl1_ready && this.pl2_ready) {
            this.game_is_ready = true;
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

    /**
     * main loopm update ball position and game state
     * @returns nothing
     */
    main_loop() {
        this.cooldown_start++; // increment the cooldown counter
        if (this.ball.state === "dead") { // respawn a ball if there was a goal TODO register goal
            this.ball = new Simple_ball();
            this.cooldown_start = 0;
        }
        if (this.cooldown_start - this.cooldown < 0) // don't do anything if on cooldown
            return;
        this.p1.update_self_position();
        this.p2.update_self_position();
        this.ball.update_self_position(this.p1, this.p2);
        this.gs.ballPosition = {
            x: this.ball.x_position,
            y: this.ball.y_position,
            r: this.ball.r,
        };
        this.gs.paddleOne = {
            x: this.p1.x_position - 0.015,
            y: this.p1.y_position + this.p1.lenght/2
        };

        this.gs.paddleTwo = {
            x: this.p2.x_position + 0.015,
            y: this.p2.y_position + this.p2.lenght/2
        };
    }
}
