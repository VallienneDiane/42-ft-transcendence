import { Vec2 } from "./math/Vec2";

export class Rectangle {

	position: Vec2;
	length;
	width;

	constructor(position: Vec2, l: number, w: number) {
		this.position = position;
		this.length = l;
		this.width = w;
	}


}