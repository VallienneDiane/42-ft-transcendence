import { Simple_paddle } from "./Simple_paddle";

export class Simple_ball {

    x_position;
    y_position;
    x_speed;
    y_speed;
    r;
    apesct_ratio = 16/9;
    state;

    constructor () {
        this.x_position = 0.5 * this.apesct_ratio;
        this.y_position = 0.5;
        this.x_speed = (1/60) * this.apesct_ratio;
        this.y_speed = Math.random()/60;
        this.r = 0.06;
        this.state = "alive";
    }

    simple_collide_check(p: Simple_paddle) {

        let previous_x_position = this.x_position - this.x_speed;
        let previous_y_position = this.y_position - this.y_speed;
        let back_in_time_vec_x = previous_x_position - this.x_position;
        let back_in_time_vec_y = previous_y_position - this.y_position;
        let aligne_moment_ratio = Math.abs(p.x_position - this.x_position)/back_in_time_vec_x;
        let aligne_y_position = aligne_moment_ratio * back_in_time_vec_y;
        return ((aligne_y_position > p.y_position && aligne_y_position < p.y_position + p.lenght) // ball inside the paddle
        || (aligne_y_position + this.r > p.y_position) // ball above the paddle
        || (aligne_y_position - this.r > p.y_position + p.lenght)) // ball bellow the paddle
    }

    update_self_position(p1: Simple_paddle, p2: Simple_paddle) {

        /* update position */
        this.x_position = this.x_position + this.x_speed;
        this.y_position = this.y_position + this.y_speed;

        /* check collision with upper wall */
        if (this.y_position - this.r < 0) {
            if (this.y_position < 0) {
                this.y_position = -this.y_position;
            }
            this.y_position += this.r * (1 + Math.abs(this.y_speed/(2 * this.x_speed)));
            this.y_speed = -this.y_speed;
        }

        /* check collision with lower wall */
        if (this.y_position + this.r > 1) {
            if (this.y_position > 1) {
                this.y_position -= (this.y_position - 1) * 2;
            }
            this.y_position -= this.r * (1 + Math.abs(this.y_speed/(2 * this.x_speed)));
            this.y_speed = -this.y_speed;
        }

        /* check collision with paddle one */
        if (this.x_position - this.r < p1.x_position && this.simple_collide_check(p1)) {
            if (this.x_position < p1.x_position) {
                this.x_position += (Math.abs(this.x_position - p1.x_position)) * 2;
            }
            this.x_position += this.r * (1 + Math.abs(this.x_speed/(2 * this.y_speed)));
            this.x_speed = -this.x_speed;
        }

        /* check collision with paddle two */
        if (this.x_position + this.r > p2.x_position && this.simple_collide_check(p2)) {
            if (this.x_position > p1.x_position) {
                this.x_position -= (Math.abs(this.x_position - p2.x_position)) * 2;
            }
            this.x_position -= this.r * (1 + Math.abs(this.x_speed/(2 * this.y_speed)));
            this.x_speed = -this.x_speed;
        }

        /* check if goal */
        if ((this.x_position - this.r < 0) || (this.x_position + this.r > this.apesct_ratio)) {
            this.state = "dead";
            return;
        }
    }
}