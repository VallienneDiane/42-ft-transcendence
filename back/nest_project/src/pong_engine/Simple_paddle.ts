import { GameInputDTO } from "src/game_update_center/game_update_center.dto";


export class Simple_paddle {

    x_position;
    length;
    y_position;
    speed;
    up: boolean;
    down: boolean;

    constructor () {
        this.x_position = 0.025;
        this.length = 0.17;
        this.y_position = 0.5 - (this.length / 2);
        this.speed = 1/60;
        this.up = false;
        this.down = false;
    }

    /**
     * update the paddle position
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
    }

    reset_self_y_position() {
        this.y_position = 0.5 - (this.length / 2);
    }

    /**
     * set the up and down flag correctly in a XOR way
     * @param body the key pressed in string format
     */
    process_input (body: GameInputDTO) {
        console.log("process input : ", body);
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