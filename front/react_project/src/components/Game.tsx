import "../styles/Base.css"
import "../styles/Game.scss"
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router"
import { accountService } from "../services/account.service";
import MatchsInProgress from "./MatchsInProgress"
import { SocketContext } from "./context"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faGamepad, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import { useLocation } from "react-router"
import { User } from "../models"
import { JwtPayload } from "jsonwebtoken"
import { userService } from "../services/user.service"

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

interface Match_Update {
    match: MatchState;
    login: string;
}

interface MatchEnd {
    player1_login: string;
    player2_login: string;
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
    const { socket } = useContext(SocketContext);
    const { socketGame } = useContext(SocketContext);
    const ref = useRef<HTMLUListElement>(null);
    const [text, setText] = useState<string>("");
    const [isDropdown, setIsDropdown] = useState<boolean>(false);
    const [filtered, setFiltered] = useState<{ id: string, login: string }[]>([]);
    const [gameType, setGameType] = useState<string>("normal");

    const proposeGame = (event: any) => {
        if (gameType === "normal")
            socketGame.emit("Private_Matchmaking", { target: event.target.value, super_game_mode: false });
        else if (gameType === "super")
            socketGame.emit("Private_Matchmaking", { target: event.target.value, super_game_mode: true });
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
            socket.on("allConnectedUsers", (users: { userId: string, userLogin: string }[]) => {
                const payload: JwtPayload = accountService.readPayload()!;
                let newUserList: { id: string, login: string }[] = [];
                users.forEach((user) => {
                    if (payload.sub != user.userId)
                        newUserList.push({ id: user.userId, login: user.userLogin });
                });
                newUserList.sort((a, b) => { return a.login.localeCompare(b.login); });
                setFiltered(newUserList);
            })

            return () => {
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
                    <input type="text" onChange={displayList} onClick={showSearchList} value={text} placeholder="Search..." />
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
    const [waitMatch, setWaitMatch] = useState<boolean>(false);
    const { socketGame, disconnectGame } = React.useContext(SocketContext);
    const [matchInProgress, setMatchInProgress] = useState<boolean>(false);
    const [buttonReady, setButtonReady] = useState<boolean>(false);
    const [playerReady, setPlayerReady] = useState<boolean>(false);
    let ready: boolean = false;
    const [timer, setTimer] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | string>(3);
    const countDownDiv = useRef<HTMLDivElement>(null);
    const [players, setPlayers] = useState<Players | null>(null);
    const playersRef = useRef<Players>();
    const [gameState, setGameState] = useState<gameState>();
    const [inputState, setInputState] = useState<inputState>({ up: false, down: false });
    const [specMode, setSpecMode] = useState<SpecMode>({ active: false, player1_login: null });
    const specModeRef = useRef<SpecMode>({ active: false, player1_login: null });
    let specModeActive: boolean = false;
    let specMatchLogin: string | null = null;
    const [winner, setWinner] = useState<string>();



    const toggleSpecMode = (toggle: boolean, player1_login: string | null) => {
        if (waitMatch === true || playerReady === true) {
            return
        }
        specModeActive = toggle;
        specMatchLogin = player1_login;
        setSpecMode({ active: toggle, player1_login: player1_login });
    }

    const launchClassic = () => {
        if (socketGame !== null && !matchInProgress) {
            socketGame.emit('Public_Matchmaking', { super_game_mode: false });
            setWaitMatch(true);
        }
    }

    const launchGame = () => {
        if (socketGame !== null && !matchInProgress) {
            socketGame.emit('Public_Matchmaking', { super_game_mode: true });
            setWaitMatch(true);
        }
    }

    const informReady = () => {
        if (socketGame !== null) {
            socketGame.emit('Ready');
        }
        setPlayerReady(true);
        document.getElementById('readyButton')?.classList.replace('notReady', 'ready');
    }

    const quitCurrentMatch = () => {
        if (socketGame !== null) {
            if (specMode.active === true) {
                socketGame.emit('Quit_Spectator');
            }
            else {
                socketGame.emit('Quit_Match');
            }
        }
        setWaitMatch(false);
        setMatchInProgress(false);
        setTimer(false);
        setCountdown(3);
        setPlayerReady(false);
        setButtonReady(false);
        setPlayers(null);
        setSpecMode({ active: false, player1_login: null });
        ready = false;
        clearGame = true;
        setGameState({
            BallPosition: null,
            paddleOne: null,
            paddleTwo: null
        })
    }

    useEffect(() => {
        specModeRef.current = specMode;
    }, [specMode])

    useEffect(() => {
        if (socketGame) {
            socketGame.emit('Get_Status');
            socketGame.emit('Get_Matches');
        }
    }, [socketGame])

    useEffect(() => {
        toggleSpecMode(false, null);
        if (location.state != null && location.state.from === "invitation") {
            setWaitMatch(false);
            setMatchInProgress(true);
            setButtonReady(true);
            navigate("", { replace: true, state: null });
        }
    }, [])

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
        if (players) {
            playersRef.current = players;
        }
    }, [players])

    useEffect(() => {
        if (socketGame) {
            socketGame.on("Connection_Accepted", () => {
                socketGame.emit('Get_Matches');
            });

            socketGame.on('Already_On_Match', () => {
                setWaitMatch(false);
            });

            socketGame.on('connect', () => {
            });

            socketGame.on('Players', (gamePlayers: Players) => {
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

            socketGame.on('Match_Update', (match: Match_Update) => {
                if (accountService.isLogged()) {
                    let decodedToken: JwtPayload = accountService.readPayload()!;
                    const id = decodedToken.sub;
                    userService.getUserWithAvatar(id!)
                        .then(response => {
                            user = response.data;
                            if (match.login === user!.login || (specModeRef.current.active === true && specModeRef.current.player1_login === match.match.player1_login) || (match.match.player1_login === user?.login && match.login === null) || (match.match.player2_login === user?.login && match.login === null)) {
                                setPlayers(prevPlayers => {
                                    return {
                                        ...prevPlayers!,
                                        player1_login: match.match.player1_login,
                                        player2_login: match.match.player2_login,
                                        player1_score: match.match.player1_score,
                                        player2_score: match.match.player2_score,
                                    }
                                })
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
            })

            socketGame.on('Match_End', (matchEnd: MatchEnd) => {
                if (accountService.isLogged()) {
                    let decodedToken: JwtPayload = accountService.readPayload()!;
                    const id = decodedToken.sub;
                    userService.getUserWithAvatar(id!)
                        .then(response => {
                            user = response.data;
                            if ((specModeRef.current.active === true && specModeRef.current.player1_login === matchEnd.player1_login) || matchEnd.player1_login === user?.login || matchEnd.player2_login === user?.login) {
                                setWaitMatch(false);
                                setMatchInProgress(false);
                                setTimer(false);
                                setCountdown(3);
                                setPlayerReady(false);
                                setButtonReady(false);
                                setPlayers(null);
                                setWinner(matchEnd.winner);
                                setSpecMode({ active: false, player1_login: null });
                                ready = false;
                                clearGame = true;
                                setGameState({
                                    BallPosition: null,
                                    paddleOne: null,
                                    paddleTwo: null
                                })
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
            })

            socketGame.on('nothing', () => {
            })

            socketGame.on('in matchmaking', () => {
                setWaitMatch(true);
            })

            socketGame.on('ongoing match', () => {
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
                setWaitMatch(false);
                setMatchInProgress(true);
                setButtonReady(true);
                ready = true;
                clearGame = false;
            })

            socketGame.on('spectator', (player1_login: string) => {
                setWaitMatch(false);
                setMatchInProgress(true);
                setButtonReady(false);
                ready = false;
                toggleSpecMode(true, player1_login);
            })
            return () => {
                socketGame.off('Connection_Accepted');
                socketGame.off('Players');
                socketGame.off('Match_Update');
                socketGame.off('Match_End');
                socketGame.off('nothing');
                socketGame.off('in matchmaking');
                socketGame.off('ongoing match');
                socketGame.off('ready in match');
                socketGame.off('in_match');
                socketGame.off('spectator');

            }
        }


    }, [socketGame]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.key === "ArrowUp") {
            if (inputState.up === false) {
                socketGame.emit('Game_Input', { input: "ArrowUp" });
            }
            setInputState((prevState) => ({
                ...prevState,
                up: true
            }));
        }
        else if (event.key === "ArrowDown") {
            if (inputState.down === false) {
                socketGame.emit('Game_Input', { input: "ArrowDown" });
            }
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
            <MatchsInProgress socket={socketGame} setSpecMode={setSpecMode} toggleSpecMode={toggleSpecMode} waitMatch={waitMatch} />
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
                                {winner != null ? <div id="winner">Winner: {winner} !</div> : null}
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
                    {specMode.active ? <div id="quit_spectator" onClick={quitCurrentMatch}>Quit spectator mode</div> : null}
                    {waitMatch ? <div id="quit_game" onClick={quitCurrentMatch}>Quit Waiting List ?</div> : null}
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
                            <p>Move your paddle down</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Game;