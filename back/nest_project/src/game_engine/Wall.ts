import { Vec2 } from "./math/Vec2";

export class Wall {

    start: Vec2;
    end: Vec2;
    x_position;
    y_position;
    length;

    constructor(v1: Vec2, v2: Vec2) {
        this.start = v1;
        this.end = v2;
        this.x_position = this.start.x;
        this.length = this.end.sub(this.start).mag();
        this.y_position = this.start.y + (this.length / 2);
    }

    wallUnit() {
        return (this.end.sub(this.start).normalize());
    }
}