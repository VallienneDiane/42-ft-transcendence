import { Vec2 } from "./math/Vec2";

export class Ball {

	aspect_ratio = 16/9;
	public position: Vec2;
	public r;
	public speed: Vec2;
	colision_number;
	friction;
	elasticity;
	mass;
	alive: boolean;
	inv_mass;

	constructor (pos: Vec2, r: number) {
		this.position = pos;
		this.speed = new Vec2(0, 0);
		this.r = r;
		this.colision_number = 0;
		this.friction = 0;
		this.elasticity = 1.02;
		this.mass = Math.PI * r * r;
		this.alive = true;
		if (this.mass === 0)
			this.inv_mass = 0;
		else
			this.inv_mass = 1 / this.mass;
	}

	/**
	 * update the ball position and check if the ball is out of the screen, if so return a code
	 * @returns 2 if the ball escapte to the left of the screen, 1 if rigth, 0 if no goal
	 */
	update_self_position(): number {
		this.position = this.position.add(this.speed);
		if (this.position.x - this.r < 0) {
			this.alive = false;
            return 2;
		}
		else if (this.position.x + this.r > this.aspect_ratio) {
            this.alive = false;
            return 1;
        }
		return 0;
	}

}