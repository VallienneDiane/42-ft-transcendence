import "../styles/Game.css"
import React, { useEffect, useRef, useState } from 'react'
import socket from "../socket";


const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [gameState, setGameState] = useState({
        ballPosition: {x: 0, y: 0},
        myPaddlePosition: {x: 0, y:0 },
        oponentPaddlePosition: {x: 0, y:0 }
    })

    useEffect(() => {
        // Set the initial ball position based on the width of the canvas element
        if (canvasRef.current) {
          setGameState((prevState) => ({
            ...prevState,
            ballPosition: { x: canvasRef.current ? canvasRef.current.width / 2 : 0, y: canvasRef.current ? canvasRef.current.height / 2 : 0},
          }));
        }
      }, []);

    useEffect(() => {
        if (socket) {
            socket.on('gameState', (gameState) => {
                setGameState(gameState);
            });
        }
    }, [socket]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext("2d")!;
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);

                // context.fillStyle = "green";
                // context.fillRect(10, 10, 150, 100);
                context.beginPath();
                context.arc(gameState.ballPosition.x, gameState.ballPosition.y, 6, 0, Math.PI * 2);
                context.fillStyle = 'red';
                context.fill();

                context.fillStyle = 'blue';
                context.fillRect(canvas.width - 8, gameState.myPaddlePosition.y, 8, 50);
                context.fillRect(gameState.oponentPaddlePosition.x, gameState.oponentPaddlePosition.y, 8, 50);
            }
        }
    }, []);

    return (
        <div id='Game'>
            <h1>Game Page</h1>
            <canvas ref={canvasRef}>bla</canvas>
        </div>
    )
}

export default Game;