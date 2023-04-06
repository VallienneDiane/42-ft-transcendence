import React, { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { DefaultEventsMap } from "@socket.io/component-emitter";


interface Match {
    login1: string,
    login2: string,
    score1: number,
    score2: number
}

interface inProgressProps {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>,
}

const MatchsInProgress: React.FC<inProgressProps> = (props) => {
    const [matchs, setMatchs] = useState<Match[]>([
        {login1: "JOUEUR1", login2: "JOUEUR2", score1: 3, score2: 1},
        {login1: "Roger", login2: "Connard", score1: 2, score2: 0},
        {login1: "Michellangelloooooooooooooooooooooooooooooooooooooiiiiii", login2: "Oui", score1: 0, score2: 10},
    ]);


    useEffect(() => {
        // triggered when receiving socket data, update position of elements
        if (props.socket) {

            props.socket.on('matchsInProgress', (matchs: Match[]) => {
                setMatchs(matchs);
            })

        }
    }, [props.socket]);


    return (
        <div id="matchsInProgress">
            <table>
                <thead>
                    <tr>
                        <th colSpan="4">Matchs in progress</th>
                    </tr>
                    <tr>
                        <th colSpan="1">PLAYER 1</th>
                        <th colSpan="2">SCORE</th>
                        <th colSpan="1">PLAYER 2</th>
                    </tr>
                </thead>
                <tbody>
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
                </tbody>
            </table>
        </div>
    )
}

export default MatchsInProgress;