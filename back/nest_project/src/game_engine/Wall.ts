import { Vec2 } from "./math/Vec2";

export class Wall {

    start: Vec2;
    end: Vec2;

    constructor(v1: Vec2, v2: Vec2) {
        this.start = v1;
        this.end = v2;
    }

    wallUnit() {
        return (this.end.sub(this.start).normalize());
    }
}