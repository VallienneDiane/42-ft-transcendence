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
		this.speed = new Vec2(0, 0);
		this.acc = new Vec2(0, 0);
		this.r = r;
		this.colision_number = 0;
		this.acceleration = 0.001;
		this.friction = 0.00003;
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
		if (body === "ArrowDown")
			this.acc.y = this.acceleration;
		if (body === "ArrowRight")
			this.acc.x = this.acceleration;
		if (body === "ArrowLeft")
			this.acc.x = -this.acceleration;
	}

	update_self_position() {
		this.speed.setCoordinates((this.speed.x + this.acc.x) * (1 - this.friction), (this.speed.y + this.acc.y) * (1 - this.friction));
		this.position.add(this.speed);
		this.acc.setCoordinates(0, 0);
	}

	static coll_det_bb(b1: Ball, b2: Ball) {
		if (b1.r + b1.r >= (b1.position.subr(b2.position)).length)
		{
			console.log("collision");
			return true;
		}
		return false;
	}

	static penetration_resolution_bb(b1: Ball, b2: Ball) {
		let dist = b1.position.subr(b2.position);
		let penetration_depth = b1.r + b2.r - dist.length;
		let penetration_resolution: Vec2 = dist.normalize().mult(penetration_depth / (b1.inv_mass + b2.inv_mass));
		b1.position = b1.position.addr(penetration_resolution.mult(b1.inv_mass));
		b2.position = b2.position.addr(penetration_resolution.mult(-b2.inv_mass));
	}

	static collision_response_bb(b1: Ball, b2: Ball) {
		let normal = b1.position.subr(b2.position).normalize();
		console.log("NORMAL :", normal);
		let relative_velocity = b1.speed.subr(b2.speed);
		let separation_velocity = relative_velocity.dot(normal);
		let new_separation_velocity = separation_velocity * Math.min(b1.elasticity, b2.elasticity);

		let vel_diff = new_separation_velocity - separation_velocity;
		let impulse = vel_diff / (b1.inv_mass + b2.inv_mass);
		let impulse_vec = normal.mult(impulse);

		b1.speed.add(impulse_vec.mult(-1));
		b2.speed.add(impulse_vec);
	}

}