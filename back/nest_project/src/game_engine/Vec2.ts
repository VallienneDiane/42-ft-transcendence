import { runInThisContext } from "vm";

export class Vec2 {

	x;
	y;

	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	get copy() {
		return new Vec2(this.x, this.y);
	}

	setCoordinates(x, y) {
		this.x = x;
		this.y = y;
	}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	get sqlengh() {
		return (this.x * this.x + this.y * this.y);
	}

	add(v: Vec2) {
		this.x += v.x;
		this.y += v.y;
	}

	sub(v: Vec2) {
		this.x -= v.x;
		this.y -= v.y;
	}

	mult(x) {
		this.x *= x;
		this.y *= x;
	}

	div(x) {
		this.x /= x;
		this.y /= x;
	}
	
	set Magnitude(m) {
		if (this.length === 0) return;
		this.mult(m / this.length);
	}

	normalize() {
		if (this.length === 0) return;
		this.div(this.length);
	}

	dot(v: Vec2) {
		return (this.x * v.x + this.y * v.y);
	}

	normal() {
		return new Vec2(-this.y, this.x).normalize();
	}

}