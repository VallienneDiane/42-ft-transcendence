import "../styles/Base.css"
import "../styles/MatchInProgress.scss"

import React, { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";


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

interface SpecMode {
    active: boolean,
    player1_login: string | null
}

interface inProgressProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
    setSpecMode: React.Dispatch<React.SetStateAction<SpecMode>>,
    toggleSpecMode: (toggle: boolean, player1_login: string | null) => void,
    waitMatch: boolean,
    // specModeActive: boolean,
    // specMatchLogin: string | null
}

const MatchsInProgress: React.FC<inProgressProps> = (props) => {

    const [matchs, setMatchs] = useState<MatchState[]>([
        // {player1_login: "JOUEUR1", player2_login: "JOUEUR2", player1_score: 3, player2_score: 1, super_game_mode: false, game_has_started: true},
        // {player1_login: "Rorger", player2_login: "Conrnard", player1_score: 2, player2_score: 0, super_game_mode: false, game_has_started: true},
        // {player1_login: "Roger", player2_login: "Connard", player1_score: 2, player2_score: 0, super_game_mode: false, game_has_started: true},
        // {player1_login: "Michellangelloooooooooooooooooooooooooooooooooooooiiiiii", player2_login: "Michellangelloooooooooooooooooooooooooooooooooooooiiiiiifez", player1_score: 0, player2_score: 10, super_game_mode: false, game_has_started: true},
        // {player1_login: "Michellangelloooooooooooiiiiii", player2_login: "Oui", player1_score: 0, player2_score: 10, super_game_mode: false, game_has_started: true},
        // {player1_login: "Michellangeiiii", player2_login: "Ouiii", player1_score: 0, player2_score: 10, super_game_mode: false, game_has_started: true},
    ]);

    

    // useEffect(() => {
    //     console.log("display matchs", matchs);
    // }, [matchs])

        
    // useEffect(() => {
    //     setMatchs([]);
    //     if (props.socket !== null) {
    //         console.log("ASK FOR MATCHS");
    //         props.socket.emit('Get_Matches');      
    //     }
    // }, []);


    useEffect(() => {
        // triggered when receiving socket data, update match list
        if (props.socket) {

            props.socket.on('Match_Update', (matchUpdate: MatchState) => {
                console.log('match update in MatchInProgress');
                setMatchs(prevMatchs => {
                    const updatedMatchs = prevMatchs.map(match => {
                      if (match.player1_login === matchUpdate.player1_login) {
                          return {
                              ...match,
                              player1_score: matchUpdate.player1_score,
                              player2_score: matchUpdate.player2_score,
                            };
                        }
                        return match;
                    });
                    if (!updatedMatchs.some(match => match.player1_login === matchUpdate.player1_login)) {
                        return [...updatedMatchs, matchUpdate];
                    }
                    return updatedMatchs;
                });
            })

            props.socket.on('Match_End', (matchEnd: MatchEnd) =>  {
                console.log('match end', matchEnd);
                setMatchs(matchs.filter(match => match.player1_login !== matchEnd.player1_login));
            })
        }
    }, [props.socket]);

    const watchMatch = (event: React.MouseEvent<HTMLDivElement>) => {
        props.toggleSpecMode(true, event.currentTarget.getAttribute('data-key'));
        if (props.waitMatch === false) {
            props.socket.emit('Spectator_Request', {player1_login: event.currentTarget.getAttribute('data-key')});
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
                                <div className="watchMatch">Watch in direct<FontAwesomeIcon icon={faCircle} className="redDot"/></div>
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