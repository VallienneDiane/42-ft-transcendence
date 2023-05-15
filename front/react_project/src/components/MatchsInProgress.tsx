import "../styles/Base.css"
import "../styles/MatchInProgress.scss"

import React, { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { User } from "../models";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { userService } from "../services/user.service";


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
    winner: string;
    disconnection_occure: boolean;
}

interface SpecMode {
    active: boolean,
    player1_login: string | null
}

interface inProgressProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    setSpecMode: React.Dispatch<React.SetStateAction<SpecMode>>,
    toggleSpecMode: (toggle: boolean, player1_login: string | null) => void,
    waitMatch: boolean,
}

const MatchsInProgress: React.FC<inProgressProps> = (props) => {

    let user: User | null = null;

    const [matchs, setMatchs] = useState<MatchState[]>([]);
    const matchsRef = useRef<MatchState[]>([]);


    useEffect(() => {
        matchsRef.current = matchs;
    }, [matchs])

    useEffect(() => {
        if (props.socket) {
            props.socket.on('Match_Update', (matchUpdate: Match_Update) => {
                if (accountService.isLogged()) {
                    let decodedToken: JwtPayload = accountService.readPayload()!;
                    const id = decodedToken.sub;
                    userService.getUserWithAvatar(id!)
                        .then(response => {
                            user = response.data;
                            if ((matchUpdate.login === null || matchUpdate.login === user?.login) && (matchUpdate.match.player1_score !== 5 && matchUpdate.match.player2_score !== 5)) {
                                setMatchs(prevMatchs => {
                                    const updatedMatchs = prevMatchs.map(match => {
                                        if (match.player1_login === matchUpdate.match.player1_login) {
                                            return {
                                                ...match,
                                                player1_score: matchUpdate.match.player1_score,
                                                player2_score: matchUpdate.match.player2_score,
                                            };
                                        }
                                        return match;
                                    });
                                    if (!updatedMatchs.some(match => match.player1_login === matchUpdate.match.player1_login)) {
                                        return [...updatedMatchs, matchUpdate.match];
                                    }
                                    return updatedMatchs;
                                });
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
            })

            props.socket.on('Match_End', (matchEnd: MatchEnd) => {
                setMatchs(matchsRef.current.filter(match => match.player1_login !== matchEnd.player1_login));
            })
        }
    }, [props.socket]);

    const watchMatch = (event: React.MouseEvent<HTMLDivElement>) => {
        props.toggleSpecMode(true, event.currentTarget.getAttribute('data-key'));
        if (props.waitMatch === false) {
            props.socket.emit('Spectator_Request', { player1_login: event.currentTarget.getAttribute('data-key') });
        }
    }

    return (
        <div id="matchsInProgress">
            <div id="header">
                <h2>Matchs in progress</h2>
                <div id="colHeader">
                    <div>PLAYER 1</div>
                    <div>SCORE</div>
                    <div>PLAYER 2</div>
                </div>
            </div>
            <div id="content">
                {matchs.length > 0 ?
                    matchs.map((match: MatchState) => {
                        return (
                            <div className="match" key={match.player1_login} data-key={match.player1_login} onClick={watchMatch}>
                                <div><span>{match.player1_login}</span></div>
                                <div><span>{match.player1_score}</span></div>
                                <div className="watchMatch">Watch in direct<FontAwesomeIcon icon={faCircle} className="redDot" /></div>
                                <div><span>{match.player2_score}</span></div>
                                <div><span>{match.player2_login}</span></div>
                            </div>
                        )
                    })
                    :
                    <div id="noMatch">
                        <p>No Match in progress</p>
                    </div>
                }
            </div>
        </div>
    )
}

export default MatchsInProgress;