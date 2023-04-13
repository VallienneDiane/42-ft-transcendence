import "../styles/Base.css"
import "../styles/Game.scss"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import socketIOClient from 'socket.io-client'
import io from 'socket.io-client'
import { Socket } from 'socket.io-client'
import { accountService } from "../services/account.service";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import MatchsInProgress from "./MatchsInProgress"
import SearchUserBar from "./SearchUserBar"

interface ball {
    x: number,
    y: number,
    r: number
}

interface gameState {
    ballPosition: ball[],
    paddleOne: { x: number, y: number },
    paddleTwo: { x: number, y: number }
}

interface inputState {
    up: boolean,
    down: boolean
}

interface Players {
    player1_login: string,
    player2_login: string,
}


const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // const [startGame, setStartGame] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>(null!);
    const [waitMatch, setWaitMatch] = useState<boolean>(false); // A init à false
    const [matchInProgress, setMatchInProgress] = useState<boolean>(false); // A init à false
    const [buttonReady, setButtonReady] = useState<boolean>(false); // A init à false
    const [playerReady, setPlayerReady] = useState<boolean>(false);
    let ready: boolean = false;
    const [timer, setTimer] = useState<boolean>(false); // A init à false
    const [countdown, setCountdown] = useState<number | string>(3);
    const countDownDiv = useRef<HTMLElement>(null);
    const [players, setPlayers] = useState<Players>();
    const [gameState, setGameState] = useState<gameState>();
    const [inputState, setInputState] = useState<inputState>({ up: false, down: false });

    if (socket === null) {
        console.log("new socket");
        setSocket(io('localhost:3000', {
            transports: ['websocket'],
            auth: { token: accountService.getToken() }
        }));
    }

     const launchClassic = () => {
        // On click on 'start' button, start the game
        // setTimer(true); ////////////// TO DELETE
        // countDownDiv.current!.classList.add('zoom')

        if (socket !== null && !matchInProgress) {
            socket.emit('Public_Matchmaking', {super_game_mode: false});
             setWaitMatch(true);
        }
    }
    
    const launchGame = () => {
        // On click on 'start' button, start the game
        if (socket !== null && !matchInProgress) {
            socket.emit('Public_Matchmaking', {super_game_mode: true});
            setWaitMatch(true);
        }
    }

    const informReady = () => {
        // On click on 'ready' button, inform server that the player is ready
        if (socket !== null) {
            socket.emit('Ready');
        }
        setPlayerReady(true);
    }


    useEffect(() => {
        // Set the initial position of elements based on the width and height of the canvas element
        if (canvasRef.current) {
            setGameState({
                ballPosition: [
                    { x: canvasRef.current ? canvasRef.current.width / 2 : 0, y: canvasRef.current ? canvasRef.current.height / 2 : 0, r: 5 },
                ],
                paddleOne: { x: 0, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 },
                paddleTwo: { x: 1, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 }
            });
        }
    }, []);

    // countdown handler
    useEffect(() => {
        if (timer === true && countDownDiv.current !== undefined) {
            let intervalId: NodeJS.Timeout;
            intervalId = setInterval(() => {
                countDownDiv.current!.classList.add('zoom')
                if (countdown === "GO !") {
                    setTimer(false);
                }
                else {
                    setCountdown(countdown as number - 1);
                    if (countdown === 1) {
                        setCountdown("GO !");
                    }
                }
            }, 800)
            return () => {
                clearInterval(intervalId);
            };
        }
    }, [timer, countdown])

    useEffect(() => {
        // triggered when receiving socket data, update position of elements
        if (socket) {
            socket.on('Allready_On_Match', () => {
                console.log('Already on match');
                document.getElementById("gamePanel")!.innerHTML = "<div>ALREADY ON MATCH !!!!</div>";
            });

            socket.on('connect', () => {
                console.log('Connected to server!');
            });

            socket.on('Players', (players: Players) => {
                console.log("Players : ", players);
                setWaitMatch(false);
                setMatchInProgress(true);
                setButtonReady(true);
                ready = true;
                setPlayers(players);
            })

            // socket.on('matchsInProgress', (matchs: Match[]) => {
            //     setMatchs(matchs);
            // })

            socket.on('Game_Update', (gameState: gameState) => {
                console.log("JUST RECEIVED GAME UPDATE EVENT -------------------------------------------------------------------------------------");
                if (ready === true) {
                    setTimer(true);
                }
                setButtonReady(false);
                ready = false;
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

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.key === "ArrowUp") {
            if (inputState.up === false) {
                socket.emit('Game_Input', {input: "ArrowUp"});
            }
            // setInputState({ up: true, down: false });
            setInputState((prevState) => ({
                ...prevState,
                up: true
            }));
        }
        else if (event.key === "ArrowDown") {
            if (inputState.down === false) {
                socket.emit('Game_Input', {input: "ArrowDown"});
            }
            // setInputState({ up: false, down: true });
            setInputState((prevState) => ({
                ...prevState,
                down: true
            }));
        }
    };
    
    const handleKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.key === "ArrowUp") {
            if (inputState.up === true) {
                socket.emit('Game_Input', {input: "ArrowUp"});
            }
            setInputState((prevState) => ({
                ...prevState,
                up: false
            }));
        }
        else if (event.key === "ArrowDown") {
            if (inputState.down === true) {
                socket.emit('Game_Input', {input: "ArrowDown"});
            }
            setInputState((prevState) => ({
                ...prevState,
                down: false
            }));
        }
        // socket.emit('Game_Input_Up', event.key);
    };

    
    const [gameWidth, setGameWidth] = useState<number>(window.innerWidth * 0.8);
    const [gameHeight, setGameHeight] = useState<number>(window.innerWidth * 0.8 / (16 / 9));
    // Handle windows resizing
    useEffect(() => {
        function handleResize() {
            // setContainerHeight(window.innerHeight);
            setGameWidth(window.innerWidth * 0.8);
            setGameHeight(window.innerWidth * 0.8 / (16 / 9));
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    // Get css colors variables to use it in the canva
    const style = getComputedStyle(document.documentElement);
    const ballColor = style.getPropertyValue('--ball-color');
    const secondaryColor = style.getPropertyValue('--secondary-color');

    useEffect(() => {
        let paddleWidth: number = gameWidth * 0.014;
        let paddleHeight: number = gameHeight * 0.17;
        const canvas = canvasRef.current;
        if (canvas && gameState) {
            const context = canvas.getContext("2d")!;
            if (context) {
                context.clearRect(0, 0, gameWidth, gameHeight);

                gameState!.ballPosition.forEach((ball) => {
                    context.beginPath();
                    context.arc(ball.x * gameWidth, ball.y * gameHeight, ball.r * gameHeight, 0, Math.PI * 2);
                    context.fillStyle = ballColor;
                    context.fill();
                    context.stroke()
                })

                context.fillStyle = secondaryColor;
                context.fillRect(gameState!.paddleOne.x * gameWidth, gameState!.paddleOne.y * gameHeight - paddleHeight / 2, paddleWidth, paddleHeight);
                context.fillRect(gameState!.paddleTwo.x * gameWidth - paddleWidth, gameState!.paddleTwo.y * gameHeight - paddleHeight / 2, paddleWidth, paddleHeight);
            }
        }
    }, [gameState, gameWidth]);

    return (
        <div id='Game' onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            {/* <h1>Game Page</h1> */}
            <MatchsInProgress socket={socket}/>
            <div id="gamePanel">
                {matchInProgress ? <div>{players?.player1_login} VS {players?.player2_login}</div> : null}
                <div id="gameField">
                    {matchInProgress || waitMatch ?
                    null
                    :
                    <div id="gameSelector">
                        {/* <h2>Select your opponent</h2>
                        <SearchUserBar /> */}
                        <h2>Select your game</h2>
                        <div id="gameButtons">
                            <button className={`gameButton ${waitMatch || matchInProgress ? "locked" : ""}`} onClick={launchClassic}>CLASSIC</button>
                            <button className={`gameButton ${waitMatch || matchInProgress ? "locked" : ""}`} onClick={launchGame}>SUPER</button>
                        </div>
                    </div>
                    
                    }
                    {waitMatch ? <div id="waitingMsg">Waiting for a worthy opponnent ...</div> : null}
                    {buttonReady ? <button id="readyButton" onClick={informReady}>{playerReady ? "Game will start soon !" : "READY ?"}</button> : null}
                    {timer ? <div ref={countDownDiv} id="countDown">{countdown}</div> : null}
                    <canvas ref={canvasRef} tabIndex={0} width={gameWidth} height={gameHeight}></canvas>
                </div>
            </div>
        </div>
    )
}

export default Game;

// Match_Update
// Match_End