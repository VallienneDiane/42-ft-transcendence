import { Vec2 } from "./Vec2";
import { Ball } from "../Ball";
import { Wall } from "../Wall";
import { ConsoleLogger } from "@nestjs/common";

export class Collision {

    /* Ball collision thing */
    static coll_det_bb(b1: Ball, b2: Ball) {
        if (b1.r + b2.r >= (b1.position.sub(b2.position)).mag())
        {
            console.log("collision");
            return true;
        }
        return false;
    }
    
    static penetration_resolution_bb(b1: Ball, b2: Ball) {
        let dist = b1.position.sub(b2.position);
        let penetration_depth = b1.r + b2.r - dist.mag();
        let penetration_resolution = dist.normalize().mult(penetration_depth / (b1.inv_mass + b2.inv_mass));
        b1.position = b1.position.add(penetration_resolution.mult(b1.inv_mass));
        b2.position = b2.position.add(penetration_resolution.mult(-b2.inv_mass));
    }
    
    static collision_response_bb(b1: Ball, b2: Ball) {
        let normal = b1.position.sub(b2.position).normalize();
        let relative_velocity = b1.speed.sub(b2.speed);
        let separation_velocity = Vec2.dot(relative_velocity, normal);
        let new_separation_velocity = separation_velocity * Math.min(b1.elasticity, b2.elasticity);
        
        let vel_diff = new_separation_velocity + separation_velocity;
        let impulse = vel_diff / (b1.inv_mass + b2.inv_mass);
        let impulse_vec = normal.mult(impulse);
        console.log(vel_diff);
    
        b1.speed = b1.speed.add(impulse_vec.mult(-b1.inv_mass));
        b2.speed = b2.speed.add(impulse_vec.mult(b2.inv_mass));
    }

    /* Wall collision thing */
    static closest_point_bw(b: Ball, w: Wall) {

        let ball_to_wall_start = w.start.sub(b.position);
        if (Vec2.dot(w.wallUnit(), ball_to_wall_start) > 0)
            return (w.start);

        let ball_to_wall_end = w.end.sub(b.position);
        if (Vec2.dot(w.wallUnit(), ball_to_wall_end) > 0)
            return (w.end);

        let closest_dist = Vec2.dot(w.wallUnit(), ball_to_wall_start);
        let closest_vec = w.wallUnit().mult(closest_dist);
        return (w.start.sub(closest_vec));
    }
}

