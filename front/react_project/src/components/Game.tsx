import "../styles/Game.css"
import React, { useEffect, useRef, useState } from 'react'
import socket from "../socket";


const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [gameState, setGameState] = useState({
        ballPosition: {x: 0, y: 0},
        myPaddlePosition: {x: 0, y: 0 },
        oponentPaddlePosition: {x: 0, y:0 }
    })
    
    useEffect(() => {
        // Set the initial position of elements based on the width and height of the canvas element
        if (canvasRef.current) {
          setGameState((prevState) => ({
              ...prevState,
              ballPosition: { x: canvasRef.current ? canvasRef.current.width / 2 : 0, y: canvasRef.current ? canvasRef.current.height / 2 : 0},
              myPaddlePosition: {x: 0, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 },
              oponentPaddlePosition: {x: 0, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 }
          }));
        }
      }, []);

    useEffect(() => {
        // triggered when receiving socket data, update position of elements
        if (socket) {
            socket.on('gameState', (gameState) => {
                setGameState(gameState);
            });
        }
    }, [socket]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        // Update the paddle position in the component's state
        console.log(event.key);
        if (event.key === 'ArrowUp') {
            setGameState((prevState) => ({
                ...prevState,
                myPaddlePosition: {
                    ...prevState.myPaddlePosition,
                    y: prevState.myPaddlePosition.y - 2,
                },
            }));
        }
        else if (event.key === 'ArrowDown') {
            setGameState((prevState) => ({
                ...prevState,
                myPaddlePosition: {
                    ...prevState.myPaddlePosition,
                    y: prevState.myPaddlePosition.y + 2,
                },
            }));
        }
      };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext("2d")!;
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);

                context.beginPath();
                context.arc(gameState.ballPosition.x, gameState.ballPosition.y, 4, 0, Math.PI * 2);
                context.fillStyle = 'black';
                context.fill();

                context.fillStyle = 'grey';
                context.fillRect(canvas.width - 8, gameState.myPaddlePosition.y, 8, 50);
                context.fillRect(gameState.oponentPaddlePosition.x, gameState.oponentPaddlePosition.y, 8, 50);
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