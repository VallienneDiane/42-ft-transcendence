
/**
 * a 2D basic vector class
 */
export class Vec2 {

	public x: number;
	public y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	get copy() {
		return new Vec2(this.x, this.y);
	}

	setCoordinates(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	mag() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	add(v: Vec2) {
		return new Vec2(this.x + v.x, this.y + v.y);
	}

	sub(v: Vec2) {
		return new Vec2(this.x - v.x, this.y - v.y);
	}

	mult(x: number): Vec2 {
		return new Vec2(this.x * x, this.y * x);
	}

	normalize(): Vec2 {
		if (this.mag() === 0)
			return (new Vec2(0, 0))
		return (new Vec2(this.x / this.mag(), this.y / this.mag()));
	}

	static dot(v1: Vec2, v2: Vec2) {
		return (v1.x * v2.x + v1.y * v2.y);
	}

}