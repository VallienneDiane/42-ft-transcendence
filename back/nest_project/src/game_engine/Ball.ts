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

	constructor (pos: Vec2, r) {
		this.position = pos;
		this.speed = new Vec2(0, 0);
		this.r = r;
		this.colision_number = 0;
		this.friction = 0;
		this.elasticity = 1.01;
		this.mass = Math.PI * r * r;
		this.alive = true;
		if (this.mass === 0)
			this.inv_mass = 0;
		else
			this.inv_mass = 1 / this.mass;
	}

	update_self_position() {
		this.position = this.position.add(this.speed);
		if ((this.position.x - this.r < 0) || (this.position.x + this.r > this.aspect_ratio)) { //TODO register the goal
            this.alive = false;
            return;
        }
	}

}