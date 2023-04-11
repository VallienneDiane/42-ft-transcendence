import { Injectable, Inject } from '@nestjs/common';
import { Simple_ball } from './Simple_Ball';
import { Simple_paddle } from './Simple_paddle';
import { Socket } from 'socket.io';
import { UserEntity } from 'src/user/user.entity';
import { CreateMatchDto } from 'src/match/CreateMatch.dto';
import { MatchService } from 'src/match/Match.service';
import { UserService } from 'src/user/user.service';

// TODO replace all interface with dto and validation
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

    gs: gameState;
    ball: Simple_ball;
    p1: Simple_paddle;
    p2: Simple_paddle;

    pl1: Socket;
    pl2: Socket;
    user1: UserEntity;
    user2: UserEntity;
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
    userservice;
    matchservice;

    constructor (userservice: UserService, matchservice: MatchService) {
        this.ball = new Simple_ball();
        this.p1 = new Simple_paddle();
        this.p2 = new Simple_paddle();

        this.pl1_ready = false;
        this.pl2_ready = false;
        this.game_must_stop = false;
        this.pl1_score = 0;
        this.pl2_score = 0;
        this.userservice = userservice;
        this.matchservice = matchservice;

        this.cooldown_start = 0;
        this.p2.x_position = this.aspect_ratio - 0.025;
        this.gs = {ballPosition: [{x: this.ball.x_position, y: this.ball.y_position, r: this.ball.r}],
        paddleOne: {x: this.p1.x_position - 0.015, y: this.p1.y_position + this.p1.length/2},
        paddleTwo: {x: this.p2.x_position + 0.015, y: this.p2.y_position + this.p1.length/2}};
        console.log("from pong engine service ;y player are :" + this.pl1 + "and" + this.pl2);
    }

    /**
     * set who are the two socket the input must be taken into acount
     * @param player1 
     * @param player2 
     */
    set_player(player1: Socket, player2: Socket, user_entity1: UserEntity, user_entity2: UserEntity) {
        this.pl1 = player1;
        this.pl2 = player2;
        this.user1 = user_entity1;
        this.user2 = user_entity2;
        console.log("2 player has been set the match can start player 1 :" + this.pl1.id + "player 2 :" + this.pl2.id);
    }
    
    /**
     * self explenatory
     * @param client the client doing the key pressing
     * @param key the key pressed
     */
    process_input (client: Socket, key: any) {
        console.log("key received" + key);
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

	async close_the_game() {
		console.log("entering close_the_game");
		let match: CreateMatchDto = new CreateMatchDto();
		match.score_winner = this.max(this.pl1_score, this.pl2_score);
		match.score_loser = this.min(this.pl1_score, this.pl2_score);
		match.winner = this.pl1_score > this.pl2_score ? this.user1 : this.user2;
		match.loser = this.pl1_score < this.pl2_score ? this.user1 : this.user2;
		console.log("the match to be register should be :", match);
		await this.matchservice.createMatch(match);
		let result = await this.matchservice.findMatch();
		console.log("the score should be save", result);
	}

    /**
     * check if both player are ready and start the game loop
     * @param player the socket of the ready player
     */
    set_player_ready(player: Socket, server: any) {
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

    /**
     * main loopm update ball position and game state
     * @returns nothing
     */
    main_loop() {
        this.cooldown_start++; // increment the cooldown counter
        if (this.cooldown_start - this.cooldown < 0) // don't do anything if on cooldown
            return;
        if (this.ball.alive === false) { // respawn a ball if there was a goal TODO register goal
            this.ball = new Simple_ball();
            this.p1.reset_self_y_position();
            this.p2.reset_self_y_position();
            this.gs = {ballPosition: [{x: this.ball.x_position, y: this.ball.y_position, r: this.ball.r}],
            paddleOne: {x: this.p1.x_position - 0.015, y: this.p1.y_position + this.p1.length/2},
            paddleTwo: {x: this.p2.x_position + 0.015, y: this.p2.y_position + this.p2.length/2}};
            this.cooldown_start = 0;
            return;
        }
        this.p1.update_self_position();
        this.p2.update_self_position();
        let r = this.ball.update_self_position(this.p1, this.p2);
        if (r === 1) {
            this.pl1_score++;
        }
        else if (r === 2) {
            this.pl2_score++;
        }
        if (this.pl1_score > 4 || this.pl2_score > 4) {
            this.game_must_stop = true;
            this.close_the_game();
            console.log("past close_game");
            return;
        }
        this.gs.ballPosition = [{
            x: this.ball.x_position,
            y: this.ball.y_position,
            r: this.ball.r,
        }];
        this.gs.paddleOne = {
            x: this.p1.x_position - 0.015,
            y: this.p1.y_position + this.p1.length/2
        };
        this.gs.paddleTwo = {
            x: this.p2.x_position + 0.015,
            y: this.p2.y_position + this.p2.length/2
        };
    }
}
