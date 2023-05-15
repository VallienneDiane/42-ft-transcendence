import { Vec2 } from "./Vec2";
import { Ball } from "../Ball";
import { Wall } from "../Wall";

export class Collision {

    /* Ball collision thing */

    /**
     * step 1 detecting a collision
     * @param b1 
     * @param b2 
     * @returns 
     */
    static coll_det_bb(b1: Ball, b2: Ball) {

        if (b1.r + b2.r >= (b1.position.sub(b2.position)).mag())
        {
            return true;
        }
        return false;
    }
    
    /**
     * step 2 repositioning the balls proportionnaly to their mass
     * @param b1 
     * @param b2 
     */
    static penetration_resolution_bb(b1: Ball, b2: Ball) {

        let dist = b1.position.sub(b2.position);
        let penetration_depth = b1.r + b2.r - dist.mag();
        let penetration_resolution = dist.normalize().mult(penetration_depth / (b1.inv_mass + b2.inv_mass));
        b1.position = b1.position.add(penetration_resolution.mult(b1.inv_mass));
        b2.position = b2.position.add(penetration_resolution.mult(-b2.inv_mass));
    }
    
    /**
     * step 3 recalculating the correct velocity
     * @param b1 
     * @param b2 
     */
    static collision_response_bb(b1: Ball, b2: Ball) {

        let normal = b1.position.sub(b2.position).normalize();
        let relative_velocity = b1.speed.sub(b2.speed);
        let separation_velocity = Vec2.dot(relative_velocity, normal);
        let new_separation_velocity = separation_velocity * Math.min(b1.elasticity, b2.elasticity);
        
        let vel_diff = new_separation_velocity + separation_velocity;
        let impulse = vel_diff / (b1.inv_mass + b2.inv_mass);
        let impulse_vec = normal.mult(impulse);
    
        b1.speed = b1.speed.add(impulse_vec.mult(-b1.inv_mass));
        b2.speed = b2.speed.add(impulse_vec.mult(b2.inv_mass));
    }

    /* Wall collision thing */

    /**
     * step1 find the closest point from the ball center to the wall
     * @param b 
     * @param w 
     * @returns 
     */
    static closest_point_bw(b: Ball, w: Wall) {

        let ball_to_wall_start = w.start.sub(b.position);
        if (Vec2.dot(w.wallUnit(), ball_to_wall_start) > 0)
            return (w.start);

        let ball_to_wall_end = w.end.sub(b.position);
        if (Vec2.dot(w.wallUnit(), ball_to_wall_end) < 0)
            return (w.end);

        let closest_dist = Vec2.dot(w.wallUnit(), ball_to_wall_start);
        let closest_vec = w.wallUnit().mult(closest_dist);
        return (w.start.sub(closest_vec));
    }

    /**
     * step 2 check if the collision hapenned
     * @param b 
     * @param w 
     * @returns 
     */
    static coll_det_bw(b: Ball, w: Wall) {

        let closest_dist_vec = Collision.closest_point_bw(b, w).sub(b.position);
        if (closest_dist_vec.mag() <= b.r) {
            return true;
        }
        return false;
    }

    /**
     * step 3 reposition the ball correctly
     * @param b 
     * @param w 
     */
    static penetration_resolution_bw(b: Ball, w: Wall) {

        let closest_point = Collision.closest_point_bw(b, w);
        let resolution_vec = b.position.sub(closest_point);
        let resolution_vec_normal = resolution_vec.normalize();
        let resolution_magnitude = b.r - resolution_vec.mag();
        b.position = b.position.add(resolution_vec_normal.mult(resolution_magnitude));
    }

    /**
     * step 4 recalculate the ball velocity
     * @param b 
     * @param w 
     */
    static collision_resolution_bw(b:Ball, w: Wall) {
        let normal = b.position.sub(Collision.closest_point_bw(b, w)).normalize();
        let normal_velocity = Vec2.dot(normal, b.speed);
        let new_separation_velocity = -normal_velocity * b.elasticity;
        b.speed = b.speed.add(normal.mult(-normal_velocity + new_separation_velocity));
        if (w.is_a_paddle) {
            let ratio = (b.position.y - (w.y_position + w.length/2))/(w.length/2);
            if (ratio >=0) {
                b.speed.y = Math.min(ratio * 1/60, 1/60);
            }
            else {
                b.speed.y = Math.max(ratio * 1/60, -1/60);
            }
        }
    }
}

