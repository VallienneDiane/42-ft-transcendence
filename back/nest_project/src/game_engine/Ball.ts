import { Vec2 } from "./math/Vec2";

export class Ball {

	public position: Vec2;
	public r;
	public speed: Vec2;
	acc: Vec2;
	acceleration;
	colision_number;
	friction;
	elasticity;
	mass;
	inv_mass;

	constructor (pos: Vec2, r) {
		this.position = pos;
		this.speed = new Vec2(0, 0);
		this.acc = new Vec2(0, 0);
		this.r = r;
		this.colision_number = 0;
		this.acceleration = 0.001;
		this.friction = 0;
		this.elasticity = 1.01;
		this.mass = Math.PI * r * r;
		if (this.mass === 0)
			this.inv_mass = 0;
		else
			this.inv_mass = 1 / this.mass;
		if (Math.random() * 2 - 1 > 0)
			this.acc.setCoordinates(0.0001, 0);
		else
			this.acc.setCoordinates(-0.0001, 0);
	}

	process_input (body: any) {
		if (body === "ArrowUp")
			this.acc.y = -this.acceleration;
		if (body === "ArrowDown")
			this.acc.y = this.acceleration;
		if (body === "ArrowRight")
			this.acc.x = this.acceleration;
		if (body === "ArrowLeft")
			this.acc.x = -this.acceleration;
	}

	update_self_position() {
		this.speed.setCoordinates((this.speed.x + this.acc.x) * (1 - this.friction), (this.speed.y + this.acc.y) * (1 - this.friction));
		this.position = this.position.add(this.speed);
		this.acc.setCoordinates(0, 0);
	}

}