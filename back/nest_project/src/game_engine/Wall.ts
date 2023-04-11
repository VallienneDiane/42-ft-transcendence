import { GameInputDTO } from "src/game_update_center/game_update_center.dto";
import { Vec2 } from "./math/Vec2";

export class Wall {

    start: Vec2;
    end: Vec2;
    x_position;
    y_position;
    speed;
    length;
    up: boolean;
    down: boolean;
    is_a_paddle: boolean;

    constructor(v1: Vec2, v2: Vec2, paddle: boolean) {
        this.up = false;
        this.down = false;
        this.speed = 1/60;
        this.start = v1;
        this.end = v2;
        this.x_position = this.start.x;
        this.length = this.end.sub(this.start).mag();
        this.y_position = this.start.y;
        this.is_a_paddle = paddle;
    }

    /**
     * 
     * @returns the wall unit vector
     */
    wallUnit() {
        return ((this.end.sub(this.start)).normalize());
    }

    /**
     * the wall continue moving in the same direction
     */
    update_self_position() {
        if (this.up) {
			this.y_position -= this.speed;
            if (this.y_position < 0) {
                this.y_position = 0;
            }
        }
        else if (this.down) {
			this.y_position += this.speed;
            if (this.y_position + this.length > 1) {
                this.y_position = 1 - this.length;
            }
        }
        this.start.setCoordinates(this.x_position, this.y_position);
        this.end.setCoordinates(this.x_position, this.y_position + this.length);
    }

    /**
     * self explanatory
     */
    reset_self_y_position() {
        this.y_position = 0.5 - (this.length / 2);
    }

    /**
     * process the input
     * @param body a GameInputDTO
     */
    process_input (body: GameInputDTO) {
        console.log("process input : " + body);
        if (body.input === "ArrowUp" || body.input === "w") {
            this.up = !this.up;
            if (this.up) {
                this.down = false;
            }
        }
		if (body.input === "ArrowDown" || body.input === "s") {
            this.down = !this.down;
            if (this.down) {
                this.up = false;
            }
        }
    }
}