import { Vec2 } from "./Vec2";

export class Ball {

	position: Vec2;
	r;
	speed: Vec2;

	constructor (x, y, r, speed: Vec2) {
		this.position = new Vec2(x, y);
		this.r = r;
		this.speed = new Vec2(0, 0);
	}


}