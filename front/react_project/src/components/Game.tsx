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
import SocketContext from "./context"

interface ball {
    x: number,
    y: number,
    r: number
}

interface gameState {
    BallPosition: ball[],
    paddleOne: { x: number, y: number },
    paddleTwo: { x: number, y: number }
}

interface MatchState {
    player1_login: string;
    player2_login: string;
    player1_score: number;
    player2_score: number;
    super_game_mode: boolean;
    game_has_started: boolean;
}

interface MatchEnd {
    player1_login: string;
    winner: string;
    disconnection_occure: boolean;
}

interface inputState {
    up: boolean,
    down: boolean
}

interface Players {
    player1_login: string,
    player2_login: string,
    player1_score: number,
    player2_score: number,
}


const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // const [startGame, setStartGame] = useState<boolean>(false);
    const [waitMatch, setWaitMatch] = useState<boolean>(false); // A init à false
    const {socketGame, disconnectGame} = React.useContext(SocketContext);
    const [matchInProgress, setMatchInProgress] = useState<boolean>(false); // A init à false
    const [buttonReady, setButtonReady] = useState<boolean>(false); // A init à false
    const [playerReady, setPlayerReady] = useState<boolean>(false);
    let ready: boolean = false;
    const [timer, setTimer] = useState<boolean>(false); // A init à false
    const [countdown, setCountdown] = useState<number | string>(3);
    const countDownDiv = useRef<HTMLElement>(null);
    const [players, setPlayers] = useState<Players>();
    // const [players, setPlayers] = useState<Players>({ player1_login: "", player1_score: 0, player2_score: 0, player2_login: "" });
    const playersRef = useRef<Players>();
    const [gameState, setGameState] = useState<gameState>();
    const [inputState, setInputState] = useState<inputState>({ up: false, down: false });

    const launchClassic = () => {
        // On click on 'start' button, start the game
        // setTimer(true); ////////////// TO DELETE
        // countDownDiv.current!.classList.add('zoom')

        if (socketGame !== null && !matchInProgress) {
            socketGame.emit('Public_Matchmaking', { super_game_mode: false });
            setWaitMatch(true);
        }
    }

    const launchGame = () => {
        // On click on 'start' button, start the game
        if (socketGame !== null && !matchInProgress) {
            socketGame.emit('Public_Matchmaking', { super_game_mode: true });
            setWaitMatch(true);
        }
    }

    const informReady = () => {
        // On click on 'ready' button, inform server that the player is ready
        if (socketGame !== null) {
            socketGame.emit('Ready');
        }
        setPlayerReady(true);
        document.getElementById('readyButton')?.classList.replace('notReady', 'ready');
    }


    // useEffect(() => {
    //     // Set the initial position of elements based on the width and height of the canvas element
    //     if (canvasRef.current) {
    //         setGameState({
    //             BallPosition: [
    //                 { x: canvasRef.current ? canvasRef.current.width / 2 : 0, y: canvasRef.current ? canvasRef.current.height / 2 : 0, r: 5 },
    //             ],
    //             paddleOne: { x: 0, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 },
    //             paddleTwo: { x: 1, y: canvasRef.current ? canvasRef.current.height / 2 - 25 : 0 }
    //         });
    //     }
    // }, []);

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
        // triggered when receiving socketGame data, update position of elements
        if (socketGame) {
            socketGame.on('Already_On_Match', () => {
                console.log('Already on match');
                document.getElementById("gamePanel")!.innerHTML = "<div>ALREADY ON MATCH !!!!</div>";
            });

            socketGame.on('connect', () => {
                console.log('Connected to server!');
            });

            socketGame.on('Players', (gamePlayers: Players) => {
                setWaitMatch(false);
                setMatchInProgress(true);
                setButtonReady(true);
                ready = true;
                setPlayers(prevPlayers => {
                    return {
                        ...prevPlayers!,
                        player1_login: gamePlayers.player1_login,
                        player2_login: gamePlayers.player2_login,
                        player1_score: 0,
                        player2_score: 0
                    }
                })
                playersRef.current = gamePlayers;;
            })

            socketGame.on('Game_Update', (gameState: gameState) => {
                if (ready === true) {
                    setTimer(true);
                }
                setButtonReady(false);
                ready = false;
                setGameState(gameState);
                setGameState((prevState) => ({
                    ...prevState,
                    BallPosition: gameState.BallPosition.map((ball) => ({
                        x: ball.x / (16 / 9),
                        y: ball.y,
                        r: ball.r
                    })),
                    paddleOne: { x: gameState.paddleOne.x / (16 / 9), y: gameState.paddleOne.y },
                    paddleTwo: { x: gameState.paddleTwo.x / (16 / 9), y: gameState.paddleTwo.y }
                }));
            });

            socketGame.on('Match_Update', (matchUpdate: MatchState) => {
                if (playersRef.current?.player1_login === matchUpdate.player1_login) {
                    setPlayers(prevPlayers => {
                        return {
                            ...prevPlayers!,
                            player1_score: matchUpdate.player1_score,
                            player2_score: matchUpdate.player2_score,
                        }
                    })
                }
            })

            socketGame.on('Match_End', (matchEnd: MatchEnd) => {
                setWaitMatch(false);
                setMatchInProgress(false);
                setCountdown(3);
                setPlayerReady(false)
                ready = false;
            })
        }
    }, [socketGame]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.key === "ArrowUp") {
            if (inputState.up === false) {
                socketGame.emit('Game_Input', { input: "ArrowUp" });
            }
            // setInputState({ up: true, down: false });
            setInputState((prevState) => ({
                ...prevState,
                up: true
            }));
        }
        else if (event.key === "ArrowDown") {
            if (inputState.down === false) {
                socketGame.emit('Game_Input', { input: "ArrowDown" });
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
                socketGame.emit('Game_Input', { input: "ArrowUp" });
            }
            setInputState((prevState) => ({
                ...prevState,
                up: false
            }));
        }
        else if (event.key === "ArrowDown") {
            if (inputState.down === true) {
                socketGame.emit('Game_Input', { input: "ArrowDown" });
            }
            setInputState((prevState) => ({
                ...prevState,
                down: false
            }));
        }
    };


    const [gameWidth, setGameWidth] = useState<number>(window.innerWidth * 0.8);
    const [gameHeight, setGameHeight] = useState<number>(window.innerWidth * 0.8 / (16 / 9));
    // Handle windows resizing
    useEffect(() => {
        function handleResize() {
            setGameWidth(document.getElementById('gamePanel')!.getBoundingClientRect().width);
            setGameHeight(document.getElementById('gamePanel')!.getBoundingClientRect().width / (16 / 9));
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

                gameState!.BallPosition.forEach((ball) => {
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

    const TEST = () => {
        socketGame.emit('Test');
    }

    return (
        <div id='Game' onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            {/* <h1>Game Page</h1> */}
            <MatchsInProgress socket={socketGame} />
            <div id="gamePanel">
                {matchInProgress ?
                    <div id="players">
                        <div className="player">
                            <div>{players?.player1_login}</div>
                            <div>{players?.player1_score}</div>
                        </div>
                        <div id="separator"></div>
                        <div className="player">
                            <div>{players?.player2_score}</div>
                            <div>{players?.player2_login}</div>
                        </div>
                    </div>
                    : null}
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
                    {buttonReady ? <button id="readyButton" className="notReady" onClick={informReady}>{playerReady ? "Game will start soon !" : "READY ?"}</button> : null}
                    {timer ? <div ref={countDownDiv} id="countDown">{countdown}</div> : null}
                    <canvas ref={canvasRef} tabIndex={0} width={gameWidth} height={gameHeight}></canvas>
                </div>
                {/* <button onClick={TEST}>TEST</button> */}
            </div>
        </div>
    )
}

export default Game;

// Match_Update
// Match_End