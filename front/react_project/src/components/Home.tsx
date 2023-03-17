import "../styles/Home.scss"
import React, { useContext, useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom"
import { UserContext } from "../user/UserContext";
import {User} from "../models";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { useSpring, animated } from "react-spring";
import SearchUserBar from "./SearchUserBar";

interface BallProps {
    x: number,
    y: number,
    vx: number,
    vy: number,
    r: number,
}


const BALL_RADIUS = 15;
// const CONTAINER_HEIGHT = window.innerHeight;
// const CONTAINER_WIDTH = window.innerWidth;




const BallContainer = (props) => {
    const Ball = (ball: BallProps) => {
        return (
            <animated.circle className='ball' cx={ball.x + props.CONTAINER_WIDTH / 2} cy={ball.y} r={ball.r} fill="url(#grad)"/> //fill='red' style={{ boxShadow: ' 0px 30px 10px rgba(0,0,0,0.78)' }}
        );
    }
    return (
        <svg width={props.CONTAINER_WIDTH} height={props.CONTAINER_HEIGHT}>
            {props.balls.map(ball => (
                Ball(ball)
            ))}
              <defs>
                <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#475750" stopOpacity={1}/>
                <stop offset="100%" stopColor="#2c3632" stopOpacity={1}/>
                </radialGradient>
            </defs>
        </svg>
    );
}

const updateBalls = (balls: BallProps[], CONTAINER_HEIGHT: number, CONTAINER_WIDTH: number, pageElements: DOMRect[]) => {
    const G = 0.01;
    const damping = 0.998;
    const restitution = 0.98;
    
    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        const bottom = CONTAINER_HEIGHT - ball.r;
        const left_wall = -CONTAINER_WIDTH / 2 + ball.r;
        const right_wall = CONTAINER_WIDTH / 2 - ball.r;
        ball.vy += G;// * dt;
        ball.vx *= damping;
        ball.vy *= damping;
        ball.x += ball.vx;// * dt;
        ball.y += ball.vy;// * dt;
        
        ///////// COLLISION WITH ELEMENTS
        // console.log(pageElements);
        for (let j = 0; j < pageElements.length; j++) {
            /// TOP
            if ((ball.y > pageElements[j].top - ball.r - 5 && ball.y < pageElements[j].top - ball.r + 15) && (ball.x > pageElements[j].left - CONTAINER_WIDTH / 2 && ball.x < pageElements[j].right - CONTAINER_WIDTH / 2)) {
                ball.y = pageElements[j].top - ball.r - 5;
                ball.vy *= -restitution;
                ball.y += ball.vy;
            }
            /// BOTTOM
            if ((ball.y < pageElements[j].bottom + ball.r - 5 && ball.y > pageElements[j].bottom + ball.r - 15) && (ball.x > pageElements[j].left - CONTAINER_WIDTH / 2 && ball.x < pageElements[j].right - CONTAINER_WIDTH / 2)) {
                ball.y = pageElements[j].bottom + ball.r - 5;
                ball.vy *= -restitution;
                ball.y += ball.vy;
            }
            /// LEFT
            if ((ball.y < pageElements[j].bottom && ball.y > pageElements[j].top - ball.r + 5) && (ball.x + ball.r > pageElements[j].left  - CONTAINER_WIDTH / 2 + 5 && ball.x + ball.r < pageElements[j].left  - CONTAINER_WIDTH / 2 + 0.1 * pageElements[j].width)) {
                ball.x = pageElements[j].left - CONTAINER_WIDTH / 2 + 5 - ball.r;
                ball.vx *= -restitution;
                ball.x += ball.vx;
            }
            /// RIGHT
            if ((ball.y < pageElements[j].bottom && ball.y > pageElements[j].top - ball.r + 5) && (ball.x - ball.r < pageElements[j].right  - CONTAINER_WIDTH / 2 - 5 && ball.x - ball.r > pageElements[j].right  - CONTAINER_WIDTH / 2 - 0.1 * pageElements[j].width)) {
                ball.x = pageElements[j].right - CONTAINER_WIDTH / 2 - 5 + ball.r;
                ball.vx *= -restitution;
                ball.x += ball.vx;
            }
        }
        // if ((ball.y < titleBox.bottom && ball.y > titleBox.top - ball.r + 3) && (ball.x - ball.r < titleBox.right - CONTAINER_WIDTH / 2 && ball.x - ball.r > titleBox.right - CONTAINER_WIDTH / 2 - 0.1 * titleBox.width)) {
        //     ball.x = titleBox.right - CONTAINER_WIDTH / 2 ;
        //     ball.vx *= -restitution;
        //     ball.x += ball.vx;
        // }
        
        ///////// COLLISION WITH BORDER OF SCREEN
        if (ball.x < left_wall) {
            ball.x = left_wall;
            ball.vx *= -restitution;
            ball.x += ball.vx;
        }
        if (ball.x > right_wall) {
            ball.x = right_wall;
            ball.vx *= -restitution;
            ball.x += ball.vx;
        }
        
        //////// WHEN BALL OUT OF SCREEN, DELETE IT AND RECREATE ANOTHER
        if (ball.y > CONTAINER_HEIGHT + ball.r / 2) {
            balls.splice(i, 1);
            let x = (Math.random() - 0.5) * (CONTAINER_WIDTH - BALL_RADIUS / 2) + BALL_RADIUS / 2;
            let y = Math.random() * -1000;
            let vx = (Math.random() - 0.5) * 8;
            let vy = (Math.random() - 0.5) * 2;
            let r = (Math.random() * 10) + 15;
            // // let vy = 0;

            // let x = 0 * (CONTAINER_WIDTH - BALL_RADIUS / 2) + BALL_RADIUS / 2;
            // let y = 150;
            // let vx = 6;
            // let vy = 0;
            // let r = 15;
            balls.push({x, y, vx, vy, r});
        }
    }
    
    // handle collisions
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const dx = balls[j].x - balls[i].x;
            const dy = balls[j].y - balls[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDistance = balls[i].r + balls[j].r;
            
            if (dist < minDistance) {
                // there is a collision
                const overlap = 0.5 * (minDistance - dist);
                const moveX = overlap * (dx / dist);
                const moveY = overlap * (dy / dist);
            
                balls[i].x -= moveX;
                balls[i].y -= moveY;
                balls[j].x += moveX;
                balls[j].y += moveY;

                const nx = dx / dist;
                const ny = dy / dist;
                const p = 2.2 * (balls[i].vx * nx + balls[i].vy * ny - balls[j].vx * nx - balls[j].vy * ny) / (balls[i].r + balls[j].r);
                balls[i].vx -= p * (balls[j].r * 0.80) * nx;//* balls[j].r * nx;
                balls[i].vy -= p * (balls[j].r * 0.80) * ny;//* balls[j].r * ny;
                balls[j].vx += p * (balls[i].r * 0.80) * nx;//* balls[i].r * nx;
                balls[j].vy += p * (balls[i].r * 0.80) * ny;//* balls[i].r * ny;
            }
        }
    }

}

const Home: React.FC = () => {
    let decodedToken: JwtPayload = accountService.readPayload()!;

    const h1_title = useRef(null);
    const link_game = useRef(null);
    const link_chat = useRef(null);
    const [time, setTime] = useState(performance.now());
    
    const [CONTAINER_HEIGHT, setContainerHeight] = useState<number>(window.innerHeight);
    const [CONTAINER_WIDTH, setContainerWidth] = useState<number>(window.innerWidth);

    const [titleBox, setTitleBox] = useState<DOMRect>();
    const [linkGameBox, setLinkGameBox] = useState<DOMRect>();
    const [linkChatBox, setLinkChatBox] = useState<DOMRect>();
    const [pageElements, setPageElements] = useState<DOMRect[]>([]);

    useEffect(() => {
        function getElementDim() {
            const element1 = h1_title.current;
            const element2 = link_game.current;
            const element3 = link_chat.current;
            if (element1 && element2 && element3) {
                setTitleBox(element1.getBoundingClientRect());
                setLinkGameBox(element2.getBoundingClientRect());
                setLinkChatBox(element3.getBoundingClientRect());
            }
        }
        // getElementDim();
        window.addEventListener('resize', getElementDim);
        
        return () => {
            window.removeEventListener('resize', getElementDim);
        };
    }, [])
    
    useEffect(() => {
        setPageElements([titleBox!, linkGameBox!, linkChatBox!]);
        console.log('after set', pageElements);

    }, [titleBox, linkGameBox, linkChatBox])
    
    useEffect(() => {
        function handleResize() {
            console.log('win resize');
            setContainerHeight(window.innerHeight);
            setContainerWidth(window.innerWidth);
        }
    
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    const [balls, setBalls] = useState<BallProps[]>([]);
    useEffect(() => {
        const initBalls: BallProps[] = [];

        for (let i = 0; i < 15; i++) {
            let x = (Math.random() - 0.5) * (CONTAINER_WIDTH - BALL_RADIUS / 2) + BALL_RADIUS / 2;
            let y = Math.random() * -1000;
            let vx = (Math.random() - 0.5) * 8;
            let vy = (Math.random() - 0.5) * 2;
            let r = (Math.random() * 10) + 15;
            // let vy = 0;
            initBalls.push({x, y, vx, vy, r});
        }

        ///// TEST ONE BALL
            // let x = 0 * (CONTAINER_WIDTH - BALL_RADIUS / 2) + BALL_RADIUS / 2;
            // let y = 150;
            // let vx = -6;
            // let vy = 0;
            // let r = 15;
            // // let vy = 0;
            // initBalls.push({x, y, vx, vy, r});
        ////////
        
        setBalls(initBalls);
    }, []);
    
    useEffect(() => {
        const intervalId = setInterval(() => {
            updateBalls(balls, CONTAINER_HEIGHT, CONTAINER_WIDTH, pageElements);
            setTime(performance.now());

        }, 0.01)

        return () => {
            clearInterval(intervalId);
        }
    }, [balls, CONTAINER_HEIGHT, CONTAINER_WIDTH, pageElements]);

    return (
        <div id="Home">
            <BallContainer balls={balls} CONTAINER_HEIGHT={CONTAINER_HEIGHT} CONTAINER_WIDTH={CONTAINER_WIDTH}/>
            <div id="title">
                
                <div>
                    <h1 ref={h1_title}>ft_transcendance</h1>
                    <div className="shadow"></div>
                </div>
            </div>
            {/* <p>Bonjour {decodedToken?.login} !</p> */}
            {/* <SearchUserBar/> */}
            {/* <p>Ici on aura les boutons pour rejoindre des parties etc</p> */}
            <div id="links">
                
                <NavLink ref={link_game} className="navLink" to="/game">Affronte tes amis ou regarde une partie en cours !</NavLink>
                <NavLink ref={link_chat} className="navLink" to="/chat">Viens discuter sur le Chat</NavLink>
            </div>
        </div>
    )
}

export default Home;