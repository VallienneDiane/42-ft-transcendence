import { Vec2 } from "./math/Vec2";

export class Ball {

	position: Vec2;
	r;
	speed: Vec2;
	acc: Vec2;
	acceleration;
	colision_number;
	friction;
	elasticity;
	mass;
	inv_mass;

	constructor (pos: Vec2, r) {
		this.position = pos;
		this.r = r;
		this.speed = new Vec2(0, 0);
		this.acc = new Vec2(0, 0);
		this.colision_number = 0;
		this.acceleration = 0.0001;
		this.friction = 0.1;
		this.elasticity = 1;
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
		else if (body === "ArrowDown")
			this.acc.y = this.acceleration;
		else if (body === "ArrowRight")
			this.acc.x = this.acceleration;
		else if (body === "ArrowLeft")
			this.acc.x = -this.acceleration;
		// if (!(body === "ArrowUp") && !(body === "ArrowDown"))
		// 	this.acc.y = 0;
		// if (!(body === "ArrowRight") && !(body === "ArrowLeft"))
		// 	this.acc.x = 0;
	}

	update_self_position() {
		this.speed.setCoordinates((this.speed.x + this.acc.x) * (1 - this.friction), (this.speed.y + this.acc.y) * (1 - this.friction));
		this.position.add(this.speed);
	}

	coll_det_bb(b1: Ball, b2: Ball) {
		return (b1.r + b1.r >= (b1.position.subr(b2.position)).length);
	}

	penetration_resolution_bb(b1: Ball, b2: Ball) {
		let dist = b1.position.subr(b2.position);
		let penetration_depth = b1.r + b2.r - dist.Magnitude();
		let penetration_resolution: Vec2 = dist.normalize().mult(penetration_depth / 2);
		b1.position = b1.position.addr(penetration_resolution);
		b2.position = b2.position.addr(penetration_resolution.mult(-1));
	}

	collision_response_bb(b1: Ball, b2: Ball) {
		let normal = b1.position.subr(b2.position).normalize();
		let relative_velocity = b1.speed.subr(b2.speed);
		let separation_velocity = relative_velocity.dot(normal) * this.elasticity;
		let separation_velocity_vec = normal.mult(separation_velocity);
		b1.speed.add(separation_velocity_vec);
		b2.speed.add(separation_velocity_vec.mult(-1));
	}

}