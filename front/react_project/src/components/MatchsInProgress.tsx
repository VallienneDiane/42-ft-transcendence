import React, { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { DefaultEventsMap } from "@socket.io/component-emitter";


interface MatchState {
    player1_login: string;
    player2_login: string;
    player1_score: number;
    player2_score: number;
    super_game_mode: boolean;
    game_has_started: boolean;
}

interface inProgressProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
}

const MatchsInProgress: React.FC<inProgressProps> = (props) => {
    const [matchs, setMatchs] = useState<MatchState[]>([
        {player1_login: "JOUEUR1", player2_login: "JOUEUR2", player1_score: 3, player2_score: 1, super_game_mode: false, game_has_started: true},
        {player1_login: "Roger", player2_login: "Connard", player1_score: 2, player2_score: 0, super_game_mode: false, game_has_started: true},
        {player1_login: "Michellangelloooooooooooooooooooooooooooooooooooooiiiiii", player2_login: "Oui", player1_score: 0, player2_score: 10, super_game_mode: false, game_has_started: true},
    ]);


    useEffect(() => {
        // triggered when receiving socket data, update position of elements
        if (props.socket) {

            props.socket.on('Match_Update', (match: MatchState) => {
                console.log("Match_Update ", match);
                // setMatchs(matchs);
            })

        }
    }, [props.socket]);


    return (
        <div id="matchsInProgress">
            <table>
                <thead>
                    {/* <tr>
                        <th colSpan="4">Matchs in progress</th>
                    </tr>
                    <tr>
                        <th colSpan="1">PLAYER 1</th>
                        <th colSpan="2">SCORE</th>
                        <th colSpan="1">PLAYER 2</th>
                    </tr> */}
                </thead>
                {/* <tbody>
                    {matchs.map((match: Match) => {
                        return (
                            <tr>
                                <td>{match.login1}</td>
                                <td>{match.score1}</td>
                                <td>{match.score2}</td>
                                <td>{match.login2}</td>
                            </tr>
                        )
                    })}
                </tbody> */}
            </table>
        </div>
    )
}

export default MatchsInProgress;