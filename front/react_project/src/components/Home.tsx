import "../styles/Home.scss"
import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom"

interface BallProps {
    x: number,
    y: number,
    vx: number,
    vy: number,
    r: number,
}

interface BallContainerProps {
    CONTAINER_WIDTH: number,
    CONTAINER_HEIGHT: number,
    balls: BallProps[],
}

interface PageElement {
    element: DOMRect | null,
    hit: boolean,
}

const DarkenColor = function (stringColor: string, percent: number) {
    let r: number = parseInt(stringColor.substring(2, 4), 16) * percent / 100;
    let g: number = parseInt(stringColor.substring(4, 6), 16) * percent / 100;
    let b: number = parseInt(stringColor.substring(6, 8), 16) * percent / 100;

    // console.log('r', Math.round(r).toString(16).padStart(2, '0'));
    // console.log('g', Math.round(g).toString(16).padStart(2, '0'));
    // console.log('b', Math.round(b).toString(16).padStart(2, '0'));

    return (`#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`);
}

const style = getComputedStyle(document.documentElement);
const ballColor = style.getPropertyValue('--ball-color');
const ballShadowColor = DarkenColor(ballColor, 70);

// console.log(ballColor, ballShadowColor);

const BallContainer = (props: BallContainerProps) => {

    const Ball = (ball: BallProps) => {
        return (
            <circle className='ball' cx={ball.x + props.CONTAINER_WIDTH / 2} cy={ball.y} r={ball.r} fill="url(#grad)" /> //fill='red' style={{ boxShadow: ' 0px 30px 10px rgba(0,0,0,0.78)' }}
        );
    }
    return (
        <svg width={props.CONTAINER_WIDTH} height={props.CONTAINER_HEIGHT}>
            {props.balls.map((ball: BallProps) => (
                Ball(ball)
            ))}
            <defs>
                <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor={ballColor} stopOpacity={1} />
                    <stop offset="95%" stopColor={ballShadowColor} stopOpacity={1} />
                    {/* <stop offset="100%" stopColor="#000" stopOpacity={1} /> */}
                </radialGradient>
            </defs>
        </svg>
    );
}

const updateBalls = (balls: BallProps[], CONTAINER_HEIGHT: number, CONTAINER_WIDTH: number, pageElements: { element: DOMRect | null, hit: boolean }[]) => {
    const gravity = 0.01;
    const frottement = 0.998;
    const restitution = 0.98;

    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        const bottom = CONTAINER_HEIGHT - ball.r;
        const left_wall = -CONTAINER_WIDTH / 2 + ball.r;
        const right_wall = CONTAINER_WIDTH / 2 - ball.r;
        ball.vy += gravity;// * dt;
        ball.vx *= frottement;
        ball.vy *= frottement;
        ball.x += ball.vx;// * dt;
        ball.y += ball.vy;// * dt;

        ///////// COLLISION WITH ELEMENTS
        for (let j = 0; j < pageElements.length; j++) {
            if (pageElements[j].element !== null) {
                /// TOP
                if ((ball.y > pageElements[j].element!.top - ball.r - 5 && ball.y < pageElements[j].element!.top - ball.r + 15) && (ball.x > pageElements[j].element!.left - CONTAINER_WIDTH / 2 - 7 && ball.x < pageElements[j].element!.right - CONTAINER_WIDTH / 2 + 7)) {
                    ball.y = pageElements[j].element!.top - ball.r - 5;
                    if (ball.vy > 1.5) {
                        pageElements[j].hit = true;
                    }
                    ball.vy *= -restitution;
                    ball.y += ball.vy;
                }
                /// BOTTOM
                if ((ball.y < pageElements[j].element!.bottom + ball.r && ball.y > pageElements[j].element!.bottom + ball.r - 15) && (ball.x > pageElements[j].element!.left - CONTAINER_WIDTH / 2 && ball.x < pageElements[j].element!.right - CONTAINER_WIDTH / 2)) {
                    ball.y = pageElements[j].element!.bottom + ball.r;
                    ball.vy *= -restitution;
                    ball.y += ball.vy;
                }
                /// LEFT
                if ((ball.y < pageElements[j].element!.bottom && ball.y > pageElements[j].element!.top - ball.r + 5) && (ball.x + ball.r > pageElements[j].element!.left - CONTAINER_WIDTH / 2 + 5 && ball.x + ball.r < pageElements[j].element!.left - CONTAINER_WIDTH / 2 + 0.1 * pageElements[j].element!.width)) {
                    ball.x = pageElements[j].element!.left - CONTAINER_WIDTH / 2 + 5 - ball.r;
                    if (ball.vx > 1.5) {
                        pageElements[j].hit = true;
                    }
                    ball.vx *= -restitution;
                    ball.x += ball.vx;
                }
                /// RIGHT
                if ((ball.y < pageElements[j].element!.bottom && ball.y > pageElements[j].element!.top - ball.r + 5) && (ball.x - ball.r < pageElements[j].element!.right - CONTAINER_WIDTH / 2 - 5 && ball.x - ball.r > pageElements[j].element!.right - CONTAINER_WIDTH / 2 - 0.1 * pageElements[j].element!.width)) {
                    ball.x = pageElements[j].element!.right - CONTAINER_WIDTH / 2 - 5 + ball.r;
                    if (ball.vx < -1.5) {
                        pageElements[j].hit = true;
                    }
                    ball.vx *= -restitution;
                    ball.x += ball.vx;
                }

            }
        }

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
            let x = (Math.random() - 0.5) * (CONTAINER_WIDTH - ball.r / 2) + ball.r / 2;
            let y = Math.random() * -500;
            let vx = (Math.random() - 0.5) * 8;
            let vy = (Math.random() - 0.5) * 2;
            let r = (Math.random() * 5) + 15;
            // // let vy = 0;

            // let x = 0 * (CONTAINER_WIDTH - BALL_RADIUS / 2) + BALL_RADIUS / 2;
            // let y = 150;
            // let vx = 6;
            // let vy = 0;
            // let r = 15;
            balls.push({ x, y, vx, vy, r });
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

    const h1_title = useRef<HTMLHeadingElement>(null);
    const link_chat = useRef<HTMLAnchorElement>(null);
    const link_game = useRef<HTMLAnchorElement>(null);
    const [time, setTime] = useState(performance.now());

    const [CONTAINER_HEIGHT, setContainerHeight] = useState<number>(window.innerHeight);
    const [CONTAINER_WIDTH, setContainerWidth] = useState<number>(window.innerWidth);

    const [titleBox, setTitleBox] = useState<DOMRect>();
    const [linkGameBox, setLinkGameBox] = useState<DOMRect>();
    const [linkChatBox, setLinkChatBox] = useState<DOMRect>();
    const [pageElements, setPageElements] = useState<PageElement[]>([]);

    const [hover, setHover] = useState<number>(1);



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
        getElementDim();
        window.addEventListener('resize', getElementDim);

        return () => {
            window.removeEventListener('resize', getElementDim);
        };
    }, [hover])

    useEffect(() => {
        // setPageElements([
        //     { element: titleBox!, hit: pageElements !== undefined ? false : pageElements[0].hit },
        //     { element: linkGameBox!, hit: pageElements !== undefined ? false : pageElements[1].hit },
        //     { element: linkChatBox!, hit: pageElements !== undefined ? false : pageElements[2].hit }
        // ]);
        setPageElements([
            { element: titleBox!, hit: false},
            { element: linkGameBox!, hit: false},
            { element: linkChatBox!, hit: false}
        ]);

    }, [titleBox, linkGameBox, linkChatBox])

    // Handle windows resizing
    useEffect(() => {
        function handleResize() {
            setContainerHeight(window.innerHeight);
            setContainerWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Generate first bunch of balls
    const [balls, setBalls] = useState<BallProps[]>([]);
    useEffect(() => {
        const initBalls: BallProps[] = [];

        for (let i = 0; i < 15; i++) {
            let x = (Math.random() - 0.5) * CONTAINER_WIDTH;
            let y = Math.random() * -1000;
            let vx = (Math.random() - 0.5) * 8;
            let vy = (Math.random() - 0.5) * 2;
            let r = (Math.random() * 5) + 15;
            // let vy = 0;
            initBalls.push({ x, y, vx, vy, r });
        }
        setBalls(initBalls);
    }, []);

    // Refresh balls positions
    useEffect(() => {
        const intervalId = setInterval(() => {
            updateBalls(balls, CONTAINER_HEIGHT, CONTAINER_WIDTH, pageElements);
            setTime(performance.now());

        }, 0.01)

        return () => {
            clearInterval(intervalId);
        }
    }, [balls, CONTAINER_HEIGHT, CONTAINER_WIDTH, pageElements]);
    
    useEffect(() => {

        if (pageElements[0] !== undefined && h1_title.current) {

            if(pageElements[0].hit === true) {
                h1_title.current.classList.add('hit');
                setTimeout(() => {
                    
                    h1_title.current!.classList.remove('hit');
                    pageElements[0].hit = false;
                }, 120); 
            }
        }

    }, [pageElements[0]?.hit]);
    

    const onHoverTitle = () => {
        // pageElements.splice(0, 1);
        pageElements[0] = {element: null, hit: false};
    }

    const onHoverGame = () => {
        pageElements.splice(1, 1);
    }

    const onHoverChat = () => {
        pageElements.splice(2, 1);
    }

    const mouseLeave = () => {
        setHover(-hover);
    }

    return (
        <div id="Home">
            <BallContainer balls={balls} CONTAINER_HEIGHT={CONTAINER_HEIGHT} CONTAINER_WIDTH={CONTAINER_WIDTH} />
            <div id="title">

                <div>
                    <h1 ref={h1_title} onMouseEnter={onHoverTitle} onMouseLeave={mouseLeave} className="navLink" >ft_transcendance</h1>
                    <div className="shadow"></div>
                </div>
            </div>
            <div id="links">
                <div>
                    <NavLink ref={link_game} onMouseEnter={onHoverGame} onMouseLeave={mouseLeave} className="navLink" to="/game">GAME</NavLink>
                    <div className="shadow"></div>
                </div>
                <div>
                    <NavLink ref={link_chat} onMouseEnter={onHoverChat} onMouseLeave={mouseLeave} className="navLink" to="/chat">CHAT</NavLink>
                    <div className="shadow"></div>
                </div>
            </div>
        </div>
    )
}

export default Home;