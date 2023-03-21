

export class Simple_paddle {

    x_position;
    y_position;
    lenght;
    speed;

    constructor () {
        this.x_position = 0.01;
        this.lenght = 0.17;
        this.y_position = 0.5 - (this.lenght / 2);
        this.speed = 3/60;
    }

    /**
     * 
     * @param body the key pressed in string format
     */
    process_input (body: any) {
        console.log("process input : " + body);
        if (body === "ArrowUp" || body === "z") {
			this.y_position -= this.speed;
            if (this.y_position < 0) {
                this.y_position = 0;
            }
        }
		if (body === "ArrowDown" || body === "s") {
			this.y_position += this.speed;
            if (this.y_position + this.lenght > 1) {
                this.y_position = 1 - this.lenght;
            }
        }
    }
}