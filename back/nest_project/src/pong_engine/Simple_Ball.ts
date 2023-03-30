import { Simple_paddle } from "./Simple_paddle";

export class Simple_ball {

    apesct_ratio = 16/9;
    x_position;
    y_position;
    x_speed;
    y_speed;
    r;
    state;

    constructor () {
        this.x_position = 0.5 * this.apesct_ratio;
        this.y_position = 0.5;
        let signe = (Math.random() - 0.5) > 0 ? 1 : -1;
        this.x_speed = (signe/120) * this.apesct_ratio;
        this.y_speed = (Math.random() - 0.5) * Math.random()/120;
        this.r = 0.06;
        this.state = "alive";
    }

    /**
     * return the closest point to the paddle p
     */
    closest_point_bw(p: Simple_paddle) {

        if (this.y_position <= p.y_position)
            return (p.y_position);
        else if (this.y_position >= p.y_position + p.lenght)
            return (p.y_position + p.lenght);
        return this.y_position;
    }

    /**
     * update everything thing on the board according to the pong rule
     * @param p1 the left paddle as a Simple_paddle object
     * @param p2 the right paddle as a Simple_paddle object
     * @returns nothing
     */
    update_self_position(p1: Simple_paddle, p2: Simple_paddle) {

        /* update position */
        this.x_position = this.x_position + this.x_speed;
        this.y_position = this.y_position + this.y_speed;

        /* check collision with upper wall */
        if (this.y_position - this.r < 0) {
            this.y_position = this.r;
            this.y_speed = -this.y_speed;
        }

        /* check collision with lower wall */
        if (this.y_position + this.r > 1) {
            this.y_position = 1 - this.r;
            this.y_speed = -this.y_speed;
        }

        /* check collision with paddle one */
        if (this.x_position - this.r < p1.x_position && Math.sqrt(Math.pow(this.x_position - p1.x_position, 2) + Math.pow(this.y_position - this.closest_point_bw(p1), 2)) <= this.r) {
            
            console.log("colide p1");
            this.x_position = this.r + p1.x_position;
            this.x_speed = -this.x_speed;
            let ratio = (this.y_position - (p1.y_position + p1.lenght/2))/(p1.lenght/2);
            if (ratio >=0) {
                this.y_speed = Math.min(ratio * 1/60, 1/60);
            }
            else {
                this.y_speed = Math.max(ratio * 1/60, -1/60);
            }
        }

        /* check collision with paddle two */
        if (this.x_position + this.r > p2.x_position && Math.sqrt(Math.pow(this.x_position - p2.x_position, 2) + Math.pow(this.y_position - this.closest_point_bw(p2), 2)) <= this.r) {

            console.log("colide p2");
            this.x_position = p2.x_position - this.r;
            this.x_speed = -this.x_speed;
            let ratio = (this.y_position - (p2.y_position + p2.lenght/2))/(p2.lenght/2);
            if (ratio >=0) {
                this.y_speed = Math.min(ratio * 1/60, 1/60);
            }
            else {
                this.y_speed = Math.max(ratio * 1/60, -1/60);
            }
        }

        /* check if goal */
        if ((this.x_position - this.r < 0) || (this.x_position + this.r > this.apesct_ratio)) { //TODO register the goal
            this.state = "dead";
            return;
        }
    }
}