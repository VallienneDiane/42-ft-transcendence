

export class Simple_paddle {

    x_position;
    y_position;
    lenght;
    speed;
    up: boolean;
    down: boolean;

    constructor () {
        this.x_position = 0.025;
        this.lenght = 0.17;
        this.y_position = 0.5 - (this.lenght / 2);
        this.speed = 3/60;
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
            if (this.y_position + this.lenght > 1) {
                this.y_position = 1 - this.lenght;
            }
        }
    }

    /**
     * set the up and down flag correctly in a XOR way
     * @param body the key pressed in string format
     */
    process_input (body: any) {
        console.log("process input : " + body);
        if (body === "ArrowUp" || body === "w") {
            this.up = !this.up;
            if (this.up) {
                this.down = false;
            }
        }
		if (body === "ArrowDown" || body === "s") {
            this.down = !this.down;
            if (this.down) {
                this.up = false;
            }
        }
    }
}