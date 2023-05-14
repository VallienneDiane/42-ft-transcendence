import "../styles/Base.css"
import "../styles/Game.scss"
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router"
import socketIOClient from 'socket.io-client'
import io from 'socket.io-client'
import { Socket } from 'socket.io-client'
import { accountService } from "../services/account.service";
import { DefaultEventsMap } from "@socket.io/component-emitter";
import MatchsInProgress from "./MatchsInProgress"
import SearchUserBar from "./SearchUserBar"
import { SocketContext } from "./context"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faGamepad, faGear, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import { useLocation } from "react-router"
import { User } from "../models"
import { JwtPayload } from "jsonwebtoken"
import { userService } from "../services/user.service"
// import { faUp, faDown } from '@fortawesome/free-solid-svg-icons';

interface ball {
    x: number,
    y: number,
    r: number
}

interface gameState {
    BallPosition: ball[] | null,
    paddleOne: { x: number, y: number } | null,
    paddleTwo: { x: number, y: number } | null
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

interface SpecMode {
    active: boolean,
    player1_login: string | null
}

function SearchbarGame() {
    const {socket} = useContext(SocketContext);
    const {socketGame} = useContext(SocketContext);
    const ref = useRef<HTMLUListElement>(null);
    const [text, setText] = useState<string>("");
    const [isDropdown, setIsDropdown] = useState<boolean>(false);
    const [filtered, setFiltered] = useState<{ id: string, login: string }[]>([]);
    const [gameType, setGameType] = useState<string>("normal");

    const proposeGame = (event: any) => {
        if (gameType === "normal")
            socketGame.emit("Private_Matchmaking", {target: event.target.value, super_game_mode: false});
        else if (gameType === "super")
            socketGame.emit("Private_Matchmaking", {target: event.target.value, super_game_mode: true});
        resetFiltered();
    }

    const showSearchList = (event: any) => {
        socket.emit("listConnectedUsers");
        setIsDropdown(!isDropdown);
        displayList(event);
    }

    const displayList = (event: any) => {
        setText(event.target.value);

        if (event.target.value) {
            setFiltered(() => {
                const filteredUsers: { id: string, login: string }[] =
                filtered.filter((user: { id: string, login: string }) =>
                    user.login.startsWith(event.target.value));
                return filteredUsers;
            });
        }
    }

    const resetFiltered = () => {
        setText("");
        setFiltered([]);
        setIsDropdown(!isDropdown);
    }

    const closeSearchList = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            setIsDropdown(!isDropdown);
        }
    }

    const changeType = (e: any) => {
        setGameType(e.target.value);
    }

    useEffect(() => {
        if (socket) {
            socket.on("allConnectedUsers", (users: {userId: string, userLogin: string}[]) => {
                const payload: JwtPayload = accountService.readPayload()!;
                let newUserList: { id: string, login: string }[] = [];
                users.forEach((user) => {
                    if (payload.sub != user.userId)
                        newUserList.push({id: user.userId, login: user.userLogin});
                });
                newUserList.sort((a, b) => {return a.login.localeCompare(b.login);});
                // console.log("fetchUsers", newUserList);
                setFiltered(newUserList);
            })
    
            return () =>  {
                socket.off("allConnectedUsers");
            }
        }
    }, [socket]);

    useEffect(() => {
        document.addEventListener("mousedown", closeSearchList);
        return () => {
            document.removeEventListener("mousedown", closeSearchList);
        }
    }, [ref]);
    
    return (
        <div id="proposeGame">
            <h2>Propose a game</h2>
            <div className="buttons">
                <button className={gameType == "normal" ? "button push" : "button"} value="normal" onClick={changeType}>normal</button>
                <FontAwesomeIcon className="iconAction" icon={faGamepad} />
                <button className={gameType == "super" ? "button push" : "button"} value="super" onClick={changeType}>super</button>
            </div>
            <div id="searchbarWrapper">
                <div className="searchbar">
                    <input type="text" onChange={displayList} onClick={showSearchList} value={text} placeholder="Search..."/>
                    <FontAwesomeIcon className="svgSearch" icon={faMagnifyingGlass} />
                </div>
                {(filtered.length != 0 && isDropdown) &&
                <ul ref={ref}>
                    {filtered.map((elt: { id: string, login: string }, id: number) => (
                        <li className="searchElement" key={elt.id}>
                            <button value={elt.login} onClick={proposeGame}>{elt.login}</button>
                        </li>
                    ))}
                </ul>}
            </div>
        </div>
    )
}

const Game: React.FC = () => {
    let user: User | null = null;
    const navigate = useNavigate();
    const location = useLocation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    let clearGame: boolean = false;
    // const [clearGame, setClearGame] = useState<boolean>(false);
    // const [startGame, setStartGame] = useState<boolean>(false);
    const [waitMatch, setWaitMatch] = useState<boolean>(false); // A init à false
    const {socketGame, disconnectGame} = React.useContext(SocketContext);
    const [matchInProgress, setMatchInProgress] = useState<boolean>(false); // A init à false
    const [buttonReady, setButtonReady] = useState<boolean>(false); // A init à false
    const [playerReady, setPlayerReady] = useState<boolean>(false);
    let ready: boolean = false;
    const [timer, setTimer] = useState<boolean>(false); // A init à false
    const [countdown, setCountdown] = useState<number | string>(3);
    const countDownDiv = useRef<HTMLDivElement>(null);
    const [players, setPlayers] = useState<Players | null >(null);
    // const [players, setPlayers] = useState<Players>({ player1_login: "", player1_score: 0, player2_score: 0, player2_login: "" });
    const playersRef = useRef<Players>();
    const [gameState, setGameState] = useState<gameState>();
    const [inputState, setInputState] = useState<inputState>({ up: false, down: false });
    const [specMode, setSpecMode] = useState<SpecMode>({active: false, player1_login: null});
    let specModeActive: boolean = false;
    let specMatchLogin: string | null = null;
    const [winner, setWinner] = useState<string>();

 
    
    const toggleSpecMode = (toggle: boolean, player1_login: string | null) => {
        console.log("TOGGLE SPEC MODE FUNCTION")
        specModeActive = toggle;
        specMatchLogin = player1_login;
        setSpecMode({active: toggle, player1_login: player1_login});
    }

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
        //     let { from } = location.state;
        //     if (from != null && from === "invitation") {
            //         console.log("Je viens depuis invite");
            //     }
    // }, [from])
    
    useEffect(() => {
        if (socketGame) {
            // socketGame.emit('Get_Status');
            socketGame.emit('Get_Matches');
            // console.log("ASK FOR STATUS");
            console.log("ASK FOR MATCHS");
        }
    }, [socketGame])
    
    useEffect(() => {
        console.log(location.state);
        if (location.state != null && location.state.from === "invitation") {
            console.log("Je viens d'invitation");
            setWaitMatch(false);
            setMatchInProgress(true);
            setButtonReady(true);
            navigate("", { replace: true, state: null });
        }
    }, [])
    
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
        console.log('Changes on players', players);
        if (players) {
            console.log('set players ref');
            playersRef.current = players;
        }
    }, [players])
    
    useEffect(() => {
        // triggered when receiving socketGame data, update position of elements
        if (socketGame) {
            socketGame.on("Connection_Accepted", () => {
                // socketGame.emit('Get_Status');
                // console.log("ASK FOR STATUS")
                socketGame.emit('Get_Matches');
                console.log("ASK FOR MATCHS");
            });
            
            socketGame.on('Already_On_Match', () => {
                console.log('Already on match');
                setWaitMatch(false);
                // document.getElementById("gamePanel")!.innerHTML = "<div>ALREADY ON MATCH !!!!</div>";
            });
            
            socketGame.on('connect', () => {
                console.log('Connected to server!');
            });
            
            socketGame.on('Players', (gamePlayers: Players) => {
                console.log("Players", gamePlayers);
                setWaitMatch(false);
                setMatchInProgress(true);
                setButtonReady(true);
                ready = true;
                clearGame = false;
                setPlayers(prevPlayers => {
                    return {
                        ...prevPlayers!,
                        player1_login: gamePlayers.player1_login,
                        player2_login: gamePlayers.player2_login,
                        player1_score: 0,
                        player2_score: 0
                    }
                })
                playersRef.current = gamePlayers;
            })
            
            socketGame.on('Game_Update', (gameState: gameState) => {
                // console.log("game update");
                if (ready === true) {
                    setTimer(true);
                }
                setButtonReady(false);
                ready = false;
                if (clearGame === false) {
                    setGameState((prevState) => ({
                        ...prevState,
                        BallPosition: gameState.BallPosition!.map((ball) => ({
                            x: ball.x / (16 / 9),
                            y: ball.y,
                            r: ball.r
                        })),
                        paddleOne: { x: gameState.paddleOne!.x / (16 / 9), y: gameState.paddleOne!.y },
                        paddleTwo: { x: gameState.paddleTwo!.x / (16 / 9), y: gameState.paddleTwo!.y }
                    }));
                }
            });
            
            socketGame.on('Match_Update', (matchUpdate: MatchState) => {
                clearGame = false;
                console.log("Match Update received", matchUpdate)
                // if (playersRef.current?.player1_login === matchUpdate.player1_login || specMode.player1_login === matchUpdate.player1_login || specMatchLogin === matchUpdate.player1_login) {
                    // console.log("Players set"),
                    // console.log(matchUpdate.player1_login),
                    // console.log(matchUpdate.player2_login),
                    // console.log(matchUpdate.player1_score),
                    // console.log(matchUpdate.player2_score),
                    setPlayers(prevPlayers => {
                        return {
                            ...prevPlayers!,
                            player1_login: matchUpdate.player1_login,
                            player2_login: matchUpdate.player2_login,
                            player1_score: matchUpdate.player1_score,
                            player2_score: matchUpdate.player2_score,
                        }
                    })
                    // playersRef.current! = matchUpdate;
                    // console.log("playersRef apres l'avoir set normalement...", playersRef);
                // }
            })
            
            socketGame.on('Match_End', (matchEnd: MatchEnd) => {
                setWaitMatch(false);
                setMatchInProgress(false);
                setTimer(false);
                setCountdown(3);
                setPlayerReady(false);
                setButtonReady(false);
                setPlayers(null);
                setWinner(matchEnd.winner);
                setSpecMode({active: false, player1_login: null});
                ready = false;
                clearGame = true;
                // setClearGame(true);
                // const canvas = canvasRef.current;
                // const context = canvas!.getContext("2d")!;
                // console.log('context', context);
                // context.clearRect(0, 0, gameWidth, gameHeight);
                setGameState({
                    BallPosition: null,
                    paddleOne: null,
                    paddleTwo: null
                })
            })
            
            socketGame.on('nothing', () => {
                console.log("nothing status received");
            })
            
            socketGame.on('in matchmaking', () => {
                console.log("in matchmaking status received");
                setWaitMatch(true);
            })
            
            socketGame.on('ongoing match', () => {
                console.log("ongoing match status received");
                setWaitMatch(false);
                setMatchInProgress(true);
                setButtonReady(false);
                ready = false;
            })

            socketGame.on('ready in match', (ask_by: string) => {
                if (accountService.isLogged() && user === null) {
                    let decodedToken: JwtPayload = accountService.readPayload()!;
                    const id = decodedToken.sub;
                    userService.getUserWithAvatar(id!)
                    .then(response => {
                        user = response.data;
                        if (ask_by === user!.login) {
                            console.log("ready in match status received");
                            setWaitMatch(false);
                            setMatchInProgress(true);
                            setButtonReady(true);
                            ready = true;
                            clearGame = false;
                            setPlayerReady(true);
                            document.getElementById('readyButton')?.classList.replace('notReady', 'ready');
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    });
                }
            })

            socketGame.on('in match', () => {
                console.log("in match status received");
                setWaitMatch(false);
                setMatchInProgress(true);
                setButtonReady(true);
                ready = true;
                clearGame = false;
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

    const [gameWidth, setGameWidth] = useState<number>(window.innerWidth * 0.96 * 0.75);
    const [gameHeight, setGameHeight] = useState<number>(window.innerWidth * 0.96 * 0.75 / (16 / 9));
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
    const styleColor = getComputedStyle(document.documentElement);
    const ballColor = styleColor.getPropertyValue('--ball-color');
    const thirdColor = styleColor.getPropertyValue('--third-color');
    const fourthColor = styleColor.getPropertyValue('--fourth-color');

    useEffect(() => {
        let paddleWidth: number = gameWidth * 0.014;
        let paddleHeight: number = gameHeight * 0.17;
        const canvas = canvasRef.current;
        if (canvas && gameState) {
            const context = canvas.getContext("2d")!;
            if (context) {
                context.clearRect(0, 0, gameWidth, gameHeight);
                if (gameState.BallPosition != null && gameState.paddleOne != null && gameState.paddleTwo != null) {
                    gameState!.BallPosition!.forEach((ball) => {
                        context.beginPath();
                        context.arc(ball.x * gameWidth, ball.y * gameHeight, ball.r * gameHeight, 0, Math.PI * 2);
                        context.fillStyle = ballColor;
                        context.fill();
                        context.stroke()
                    })
    
                    context.fillStyle = thirdColor;
                    context.fillRect(gameState!.paddleOne!.x * gameWidth, gameState!.paddleOne!.y * gameHeight - paddleHeight / 2, paddleWidth, paddleHeight);
                    context.fillStyle = fourthColor;
                    context.fillRect(gameState!.paddleTwo!.x * gameWidth - paddleWidth, gameState!.paddleTwo!.y * gameHeight - paddleHeight / 2, paddleWidth, paddleHeight);

                }

            }
        }
    }, [gameState, gameWidth]);

    return (
        <div id='Game' onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            {/* <h1>Game Page</h1> */}
            <MatchsInProgress socket={socketGame} setSpecMode={setSpecMode} toggleSpecMode={toggleSpecMode}/>
            <div id="gameContainer">
                <div id="gamePanel">
                    {(matchInProgress || specMode.active) ?
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
                        <canvas ref={canvasRef} tabIndex={0} width={gameWidth} height={gameHeight}></canvas>
                        {matchInProgress || waitMatch || specMode.active ?
                            null
                            :
                            <div id="gameSelector">
                                {winner != null ? <div id="winner">Winner: {winner} !</div>:null}
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
                    </div>
                    {/* <button onClick={TEST}>TEST</button> */}
                </div>
                <div id="instructions">
                    <SearchbarGame />
                    <div id="gameModes">
                        <h2>Game Modes</h2>
                        <div>
                        <h3>Classic</h3>
                            <p>The original pong game from 1972</p>
                        </div>
                        <div>
                            <h3>Super</h3>
                            <p>Keep an eye on every moving objects !</p>
                        </div>
                    </div>
                    <div id="controls">
                        <h2>Controls</h2>
                        <div>
                            <div className="icon">
                                <FontAwesomeIcon className="arrow" icon={faArrowUp} />
                                <div></div>
                            </div>
                            <p>Move your paddle up</p>
                        </div>
                        <div>
                            <div className="icon">
                                <FontAwesomeIcon className="arrow" icon={faArrowDown} />
                                <div></div>
                            </div>
                            <p>Move your paddle up</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Game;