import "../styles/Game.css"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import socketIOClient from 'socket.io-client'
import io from 'socket.io-client'
import { Socket } from 'socket.io-client'
import { accountService } from "../services/account.service";
import {DefaultEventsMap} from "@socket.io/component-emitter";

interface position {
    x: number,
    y: number
}

interface gameState {
    ballPosition: position[],
    paddleOne: position,
    paddleTwo: position
  }

const Game: React.FC = () => {
const canvasRef = useRef<HTMLCanvasElement>(null);
const [startGame, setStartGame] = useState<boolean>(false);
const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>(null!);

if (socket === null) {
    setSocket(io('localhost:3000', {
        transports: ['websocket'],
        auth: {token: accountService.getToken()}
    }));
}
if (socket !== null && startGame === false) {
    socket.emit('Game_start');
    console.log(startGame);
    setStartGame(true);
}
// const socket = io('localhost:3000', {
//     transports: ['websocket'],
//     auth: {token: accountService.getToken()}
// });

const [gameState, setGameState] = useState<gameState>({
    ballPosition: [
        {x: 0, y: 0},
        {x: 0, y: 0},
    ],
    paddleOne: {x: 0, y: 0 },
    paddleTwo: {x: 0, y: 0 }
})

useEffect(() => {
    // Set the initial position of elements based on the width and height of the canvas element
    if (canvasRef.current) {
        setGameState((prevState) => ({
            ...prevState,
            ballPosition: [
                { x: canvasRef.current ? canvasRef.current.width / 2 : 0, y: canvasRef.current ? canvasRef.current.height / 2 : 0},
                { x: canvasRef.current ? canvasRef.current.width / 2 : 0, y: canvasRef.current ? canvasRef.current.height / 2 : 0},
            ],
            paddleOne: {x: 0, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 },
            paddleTwo: {x: 0, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 }
        }));
    }
}, []);

useEffect(() => {
    // triggered when receiving socket data, update position of elements
    if (socket) {
        console.log('socket', socket);
        socket.on('connect', () => {
            console.log('Connected to server!');
            socket.emit('Game_start');
        });
        
        socket.on('Game_Update', (gameState: gameState) => {
            console.log('gameState', gameState);
            // setGameState((prevState) => ({
            //     ...prevState,
            //     ballPosition: [
            //         { x: gameState.ballPosition[0].x * canvasRef.current!.width, y: gameState.ballPosition[0].y * canvasRef.current!.height },
            //         { x: gameState.ballPosition[1].x * canvasRef.current!.width, y: gameState.ballPosition[1].y * canvasRef.current!.height },

            //     ],
            //     paddleOne: { x: gameState.paddleOne.x * canvasRef.current!.width - 8, y: gameState.paddleOne.y * canvasRef.current!.height - 25 },
            //     paddleTwo: { x: gameState.paddleTwo.x * canvasRef.current!.width, y: gameState.paddleTwo.y * canvasRef.current!.height - 25 }
            // }));
            console.log('gameState before', gameState);
            setGameState({
                ballPosition: [
                    { x: gameState.ballPosition[0].x * canvasRef.current!.width, y: gameState.ballPosition[0].y * canvasRef.current!.height },
                    { x: gameState.ballPosition[1].x * canvasRef.current!.width, y: gameState.ballPosition[1].y * canvasRef.current!.height },

                ],
                paddleOne: { x: gameState.paddleOne.x * canvasRef.current!.width, y: gameState.paddleOne.y * canvasRef.current!.height - 25 },
                paddleTwo: { x: gameState.paddleTwo.x * canvasRef.current!.width - 8, y: gameState.paddleTwo.y * canvasRef.current!.height - 25 }
            });
            console.log('gameState after', gameState);
        });
    }
}, [socket]);

const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log(event.key);
    socket.emit('Game_Input', event.key);
}, [socket]);

useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        const context = canvas.getContext("2d")!;
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);

            context.beginPath();
            context.arc(gameState.ballPosition[0].x, gameState.ballPosition[0].y, 5, 0, Math.PI * 2);
            context.arc(gameState.ballPosition[1].x, gameState.ballPosition[1].y, 5, 0, Math.PI * 2);
            context.fillStyle = 'black';
            context.fill();

            context.fillStyle = 'grey';
            context.fillRect(canvas.width - 8, gameState.paddleOne.y, 8, 50);
            context.fillRect(gameState.paddleTwo.x, gameState.paddleTwo.y, 8, 50);
        }
    }
}, [gameState]);

    return (
        <div id='Game' onKeyDown={handleKeyDown}>
            <h1>Game Page</h1>
            <canvas ref={canvasRef} tabIndex={0} width="640" height="260"></canvas>
        </div>
    )
}

export default Game;