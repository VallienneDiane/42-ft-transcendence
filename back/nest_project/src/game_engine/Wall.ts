import { Vec2 } from "./math/Vec2";

export class Wall {

    start: Vec2;
    end: Vec2;
    x_position;
    y_position;

    constructor(v1: Vec2, v2: Vec2) {
        this.start = v1;
        this.x_position = this.start.x;
        this.y_position = this.start.y
        this.end = v2;
    }

    wallUnit() {
        return (this.end.sub(this.start).normalize());
    }
}