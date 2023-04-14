import { Injectable, Inject } from '@nestjs/common';
import { Simple_ball } from './Simple_Ball';
import { Simple_paddle } from './Simple_paddle';
import { Socket } from 'socket.io';
import { UserEntity } from 'src/user/user.entity';
import { CreateMatchDto } from 'src/match/CreateMatch.dto';
import { MatchService } from 'src/match/Match.service';
import { UserService } from 'src/user/user.service';
import { GameInputDTO } from 'src/game_update_center/game_update_center.dto';

/**
 * use to store info on a ball
 */
interface BallPosition {
	x: number,
	y: number,
	r: number,
}

/**
 * use to share the game state
 */
interface GameState {
	BallPosition: BallPosition[],
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number },
}

/**
 * use to store the match state
 */
interface MatchState {
    player1_login: string;
    player2_login: string;
    player1_score: number;
    player2_score: number;
    super_game_mode: boolean;
    game_has_started: boolean;
}

/**
 * use to send the match end state
 */
interface MatchEnd {
    player1_login: string;
    winner: string;
    disconnection_occure: boolean;
}

@Injectable()
export class PongEngineService {

    // gamestat related
    gs: GameState;
    ms: MatchState;
    ball: Simple_ball;
    p1: Simple_paddle;
    p2: Simple_paddle;

    // player related
    pl1: Socket;
    pl2: Socket;
    user1: UserEntity;
    user2: UserEntity;
    pl1_ready: boolean;
    pl2_ready: boolean;
    pl1_score: number;
    pl2_score: number;
    victory_condition: string;

    // game related
    aspect_ratio = 16/9;
    cooldown = 180; // cooldown between ball respawn
    cooldown_start;
    game_must_stop: boolean;
    loop: any; // set_interval function handle for stoping the game
    userservice;
    matchservice;
    server: any;
    match_end_state: MatchEnd;
    waiting: Set<string>;

    constructor (userservice: UserService, matchservice: MatchService) {
        // creating game object
        this.ball = new Simple_ball();
        this.p1 = new Simple_paddle();
        this.p2 = new Simple_paddle();

        // initialazing player stuff
        this.pl1_ready = false;
        this.pl2_ready = false;
        this.game_must_stop = false;
        this.pl1_score = 0;
        this.pl2_score = 0;
        this.userservice = userservice;
        this.matchservice = matchservice;

        // initialyzing game stuff
        this.cooldown_start = 0;
        this.p2.x_position = this.aspect_ratio - 0.025;
        this.gs = {BallPosition: [{x: this.ball.x_position, y: this.ball.y_position, r: this.ball.r}],
        paddleOne: {x: this.p1.x_position - 0.015, y: this.p1.y_position + this.p1.length/2},
        paddleTwo: {x: this.p2.x_position + 0.015, y: this.p2.y_position + this.p1.length/2}};
        this.match_end_state = {player1_login: "", winner: "", disconnection_occure: false};
        console.log("from pong engine service player are :", this.pl1, "and ", this.pl2);
    }

    /**
     * set the player for the game instance
     * @param player1 
     * @param player2 
     * @param user_entity1 player 1 data
     * @param user_entity2 player 2 data
     */
    set_player(player1: Socket, player2: Socket, user_entity1: UserEntity, user_entity2: UserEntity, server: any, waiting: Set<string>, match: MatchState) {
        this.server = server;
        this.pl1 = player1;
        this.pl2 = player2;
        this.user1 = user_entity1;
        this.user2 = user_entity2;
        this.waiting = waiting;
        this.ms = match;
        this.update_match_state();
        this.match_end_state.player1_login = this.user1.login;
        console.log("2 player has been set the match can start player 1 : ", this.pl1.id, "player 2 : ", this.pl2.id);
    }

    update_match_state() {
        this.ms = {player1_login: this.user1.login, player2_login: this.user2.login, player1_score: this.pl1_score, player2_score: this.pl2_score, super_game_mode: false, game_has_started: this.pl1_ready && this.pl2_ready};
        // console.log("in update match state this.pl1.id : ", this.pl1.id);
        this.server.emit("Match_Update", this.ms);
    }
    
    /**
     * self explenatory
     * @param client the client doing the key pressing
     * @param input the key pressed in a GameInputDTO format
     */
    process_input (client: Socket, input: GameInputDTO) {
        console.log("key received", input);
        if (client === this.pl1) {
            this.p1.process_input(input);
        }
        else {
            this.p2.process_input(input);
        }
    }

    stop_game(player_leaving: Socket) {
        if (player_leaving === this.pl1) {
			this.pl1_score = -1;
		}
		else {
			this.pl2_score = -1;
		}
		this.match_end_state.disconnection_occure = true;
		this.game_must_stop = true;
		this.close_the_game();
    }
    
    /**
     * set the player ready
     * @param player the player clicking ready
     * @param server the server to emit to the room
    */
    set_player_ready(player: Socket) {
        if (player === this.pl1) {
            this.pl1_ready = true;
        }
        else if (player === this.pl2) {
            this.pl2_ready = true;
        }
        if (this.pl1_ready && this.pl2_ready) {
            let thiss = this;
            // console.log("room to emit", thiss.server);
            thiss.server.emit("Match_Update", this.ms);
            console.log(thiss.pl1.rooms, thiss.pl2.rooms);
            this.loop = setInterval(function() {
                if (thiss.game_must_stop) {
                    clearInterval(thiss.loop);
                }
                thiss.main_loop();
                // console.log("sending : ", thiss.gs);
                thiss.server.to(thiss.pl1.id).emit("Game_Update", thiss.gs);
                // console.log("JUST EMITE GAME UPDATE EVENT -------------------------------------------------------------------------------------");
            }, 1000/60);
        }
    }

    /**
	 * save the players score in the data base
	 */
    async close_the_game() {
        console.log("entering close_the_game");
        let match: CreateMatchDto = new CreateMatchDto();
        match.score_winner = Math.max(this.pl1_score, this.pl2_score);
        match.score_loser = Math.min(this.pl1_score, this.pl2_score);
        match.winner = this.pl1_score > this.pl2_score ? this.user1 : this.user2;
		this.match_end_state.winner = match.winner.login;
        match.loser = this.pl1_score < this.pl2_score ? this.user1 : this.user2;
        //console.log("the match to be register should be : ", match);
        await this.matchservice.createMatch(match);
        if (this.waiting.delete(this.user1.id)) {
            console.log("removed from waiting in pong engin close_the_game function");
        }
		this.server.emit("Match_End", this.match_end_state);
        let result = await this.matchservice.findMatch();
        //console.log("the score should be save and the match history is :", result);
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
            this.gs = {BallPosition: [{x: this.ball.x_position, y: this.ball.y_position, r: this.ball.r}],
            paddleOne: {x: this.p1.x_position - 0.015, y: this.p1.y_position + this.p1.length/2},
            paddleTwo: {x: this.p2.x_position + 0.015, y: this.p2.y_position + this.p2.length/2}};
            this.cooldown_start = 0;
            return;
        }

        // update paddle position
        this.p1.update_self_position();
        this.p2.update_self_position();

        // update ball position and check if there was a goal
        let r = this.ball.update_self_position(this.p1, this.p2);
        if (r === 1) {
            this.pl1_score++;
            this.update_match_state();
        }
        else if (r === 2) {
            this.pl2_score++;
            this.update_match_state();
        }
        if (this.pl1_score > 4 || this.pl2_score > 4) { // if end of match then save the score and close the game
            this.game_must_stop = true;
            this.close_the_game();
            console.log("past close_game");
            return;
        }

        // fill the game state
        this.gs.BallPosition = [{
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
