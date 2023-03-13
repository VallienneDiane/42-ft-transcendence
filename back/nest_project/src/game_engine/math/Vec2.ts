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

	addr(v: Vec2) {
		return new Vec2(this.x + v.x, this.y + v.y);
	}

	sub(v: Vec2) {
		this.x -= v.x;
		this.y -= v.y;
	}

	subr(v: Vec2) {
		return new Vec2(this.x - v.x, this.y - v.y);
	}

	mult(x): Vec2 {
		this.x *= x;
		this.y *= x;
		return this;
	}

	div(x) {
		this.x /= x;
		this.y /= x;
	}
	
	set Magnitude(m) {
		if (this.length === 0) return;
		this.mult(m / this.length);
	}

	normalize(): Vec2 {
		if (this.length === 0) return;
		return (new Vec2(this.x / this.length, this.y / this.length));
	}

	dot(v: Vec2) {
		return (this.x * v.x + this.y * v.y);
	}

}