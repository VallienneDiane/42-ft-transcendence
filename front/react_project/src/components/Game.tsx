import "../styles/Base.css"
import "../styles/Game.scss"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import socketIOClient from 'socket.io-client'
import io from 'socket.io-client'
import { Socket } from 'socket.io-client'
import { accountService } from "../services/account.service";
import {DefaultEventsMap} from "@socket.io/component-emitter";

interface ball {
    x: number,
    y: number,
    r: number
}

interface gameState {
    ballPosition: ball[],
    paddleOne: {x: number, y: number},
    paddleTwo: {x: number, y: number}
}

interface inputState {
    up: boolean,
    down: boolean
}

const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [startGame, setStartGame] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>(null!);
    const [gameState, setGameState] = useState<gameState>();
    const [inputState, setInputState] = useState<inputState>({up: false, down: false});

    if (socket === null) {
        setSocket(io('localhost:3000', {
            transports: ['websocket'],
            auth: {token: accountService.getToken()}
        }));
    }

    const launchGame = () => {
        // On click on 'start' button, start the game
        if (socket !== null && startGame === false) {
            socket.emit('Game_start');
            console.log(startGame);
            setStartGame(true);
        }
    }


    useEffect(() => {
        // Set the initial position of elements based on the width and height of the canvas element
        if (canvasRef.current) {
            setGameState({
                ballPosition: [
                    { x: canvasRef.current ? canvasRef.current.width / 2 : 0, y: canvasRef.current ? canvasRef.current.height / 2 : 0, r: 5},
                ],
                paddleOne: {x: 0, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 },
                paddleTwo: {x: 1, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 }
            });
        }
    }, []);

    useEffect(() => {
        // triggered when receiving socket data, update position of elements
        if (socket) {
            socket.on('connect', () => {
                console.log('Connected to server!');
            });
            
            socket.on('Game_Update', (gameState: gameState) => {
                setGameState(gameState);
                setGameState((prevState) => ({
                    ...prevState,
                    ballPosition: gameState.ballPosition.map((ball) => ({
                        x: ball.x / (16 / 9),
                        y: ball.y,
                        r: ball.r
                    })),
                    paddleOne: { x: gameState.paddleOne.x / (16 / 9), y: gameState.paddleOne.y },
                    paddleTwo: { x: gameState.paddleTwo.x / (16 / 9), y: gameState.paddleTwo.y }
                }));
            });
        }
    }, [socket]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        console.log(event.key);
        if (event.key === "ArrowUp") {
            setInputState({up: true, down : false});
        }
        else if (event.key === "ArrowDown") {
            setInputState({up: false, down : true});
        }
        // socket.emit('Game_Input_Down', event.key);
    }, []);
    
    const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.key === "ArrowUp") {
            setInputState((prevState) => ({
                ...prevState,
                up: false
            }));
        }
        else if (event.key === "ArrowDown") {
            setInputState((prevState) => ({
                ...prevState,
                down: false
            }));
        }
        // socket.emit('Game_Input_Up', event.key);
    }, []);
    
    useEffect(() => {
        const intervalId = setInterval(() => {
            
            if (inputState.up === true) {
                socket.emit('Game_Input', "ArrowUp");
            }
            else if (inputState.down === true) {
                socket.emit('Game_Input', "ArrowDown");
            }

        }, 10)

        return () => {
            clearInterval(intervalId);
        }
    }, [inputState]);

    // Get css colors variables to use it in the canva
    const style = getComputedStyle(document.documentElement);
    const ballColor = style.getPropertyValue('--ball-color');
    const secondaryColor = style.getPropertyValue('--secondary-color');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && gameState) {
            const context = canvas.getContext("2d")!;
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);

                gameState!.ballPosition.forEach((ball) => {
                    context.beginPath();
                    context.arc(ball.x * canvas.width, ball.y * canvas.height, ball.r * canvas.height, 0, Math.PI * 2);
                    context.fillStyle = ballColor;
                    context.fill();
                    context.stroke()
                })
                // context.beginPath();
                // context.arc(gameState.ballPosition[0].x, gameState.ballPosition[0].y, 5, 0, Math.PI * 2);
                // context.fillStyle = 'black';
                // context.fill();
                // context.arc(gameState.ballPosition[1].x, gameState.ballPosition[1].y, 5, 0, Math.PI * 2);

                context.fillStyle = secondaryColor;
                context.fillRect(gameState!.paddleOne.x * canvas.width, gameState!.paddleOne.y * canvas.height - 25, 8, 50);
                context.fillRect(gameState!.paddleTwo.x * canvas.width - 8, gameState!.paddleTwo.y * canvas.height - 25, 8, 50);
            }
        }
    }, [gameState]);

    const gameWidth = 600;

    return (
        <div id='Game' onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            <h1>Game Page</h1>
            <canvas ref={canvasRef} tabIndex={0} width={gameWidth} height={gameWidth / (16 / 9)}></canvas>
            <button id="startButton" onClick={launchGame}>START !</button>
        </div>
    )
}

export default Game;