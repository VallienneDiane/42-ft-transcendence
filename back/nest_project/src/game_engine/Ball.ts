import { Vec2 } from "./math/Vec2";

export class Ball {

	position: Vec2;
	r;
	speed: Vec2;
	acc: Vec2;
	acceleration;
	colision_number;
	friction;

	constructor (x, y, r) {
		this.position = new Vec2(x, y);
		this.r = r;
		this.speed = new Vec2(0, 0);
		this.acc = new Vec2(0, 0);
		this.colision_number = 0;
		this.acceleration = 0.001;
		this.friction = 0.6;
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

	coll_det_bb(b1, b2) {
		return (b1.r + b1.r >= (b1.pos.subr(b2.pos)).length());
	}

}