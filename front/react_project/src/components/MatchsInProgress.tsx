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

interface inProgressProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
}

const MatchsInProgress: React.FC<inProgressProps> = (props) => {

    const [matchs, setMatchs] = useState<MatchState[]>([
        {player1_login: "JOUEUR1", player2_login: "JOUEUR2", player1_score: 3, player2_score: 1, super_game_mode: false, game_has_started: true},
        {player1_login: "Rorger", player2_login: "Conrnard", player1_score: 2, player2_score: 0, super_game_mode: false, game_has_started: true},
        {player1_login: "Roger", player2_login: "Connard", player1_score: 2, player2_score: 0, super_game_mode: false, game_has_started: true},
        // {player1_login: "Michellangelloooooooooooooooooooooooooooooooooooooiiiiii", player2_login: "Michellangelloooooooooooooooooooooooooooooooooooooiiiiiifez", player1_score: 0, player2_score: 10, super_game_mode: false, game_has_started: true},
        // {player1_login: "Michellangelloooooooooooiiiiii", player2_login: "Oui", player1_score: 0, player2_score: 10, super_game_mode: false, game_has_started: true},
        // {player1_login: "Michellangeiiii", player2_login: "Ouiii", player1_score: 0, player2_score: 10, super_game_mode: false, game_has_started: true},
    ]);

    

    // useEffect(() => {
    //     console.log("display matchs", matchs);
    // }, [matchs])


    useEffect(() => {
        // triggered when receiving socket data, update match list
        if (props.socket) {

            props.socket.on('Match_Update', (matchUpdate: MatchState) => {
                // console.log('match update', matchUpdate);
                // matchs.map((match) => {
                //     console.log(match.player1_login, matchUpdate.player1_login);
                // })
                
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
        // console.log("event", event.currentTarget.attributes);
        // console.log("je veux voir le match de ", event.currentTarget.getAttribute('data-key'));
        props.socket.emit('Spectator_Request', event.currentTarget.getAttribute('data-key'))
    }

    return (
        <div id="matchsInProgress">
            <div id="header">
                <div>Matchs in progress</div>
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
                    No Match in progress
                </div>
                }
            </div>
            {/* <table>
                <thead>
                    <tr>
                        <th colSpan={4}>Matchs in progress</th>
                    </tr>
                    <tr>
                        <th colSpan={1}>PLAYER 1</th>
                        <th colSpan={2}>SCORE</th>
                        <th colSpan={1}>PLAYER 2</th>
                    </tr>
                </thead>
                <tbody>
                    {matchs.length > 0 ?
                    
                    matchs.map((match: MatchState) => {
                        return (
                            <tr>
                                <td>{match.player1_login}</td>
                                <td>{match.player1_score}</td>
                                <td>{match.player2_score}</td>
                                <td>{match.player2_login}</td>
                            </tr>
                        )
                    })
                :
                <div id="noMatch">
                    No Match in progress
                </div>
                }
                </tbody>
            </table> */}
        </div>
    )
}

export default MatchsInProgress;