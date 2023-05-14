import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPercent } from "@fortawesome/free-solid-svg-icons";

export default function MatchHistory(props: {userId: string}) {
    const {socketGame} = useContext(SocketContext);
    const [history, setHistory] = useState<{
        matchId: string,
        winnerId: string,
        winnerLogin: string,
        scoreWinner: number,
        loserId: string,
        loserLogin: string,
        scoreLoser: number}[]>([]);
    const [matchWon, setMatchWon] = useState<number>(0);
    const [matchLost, setMatchLost] = useState<number>(0);


    useEffect(() => {
            socketGame.emit("matchHistory", {userId: props.userId});
    }, [props.userId]);

    useEffect(() => {
        socketGame.on("matchHistory", (data: {
            matchId: string,
            winnerId: string,
            winnerLogin: string,
            scoreWinner: number,
            loserId: string,
            loserLogin: string,
            scoreLoser: number}[] ) => {
            let win = 0;
            let loose = 0;
            data.forEach((elt) => {
                if (elt.winnerId == props.userId)
                    ++win;
                else
                    ++loose;
            });
            setMatchWon(win);
            setMatchLost(loose);
            setHistory(data);
        })

        return () => {
            socketGame.off("matchHistory");
        }
    }, [props.userId])

    return (
        <div id="score">
            <div id="stats">
                <h2>Statistics</h2>
                <div className="bloc">
                    <div className="element">
                        <span>{matchWon}</span><h3>win{matchWon > 1 && "s"}</h3>
                    </div>
                    <div className="element">
                        <span>{matchLost}</span><h3>lost{matchLost > 1 && "s"}</h3>
                    </div>
                    {matchLost + matchWon != 0 ? 
                        <div className="element">
                            <span>{(100 * matchWon / (matchLost + matchWon)).toFixed(0)}</span><h3>% of success</h3>
                        </div> : null}
                </div>
            </div>
            <div id="history">
                    <h2>Match history</h2>
            {history.length > 0 && <ul id="matchList">
                <div id="firstRow" className="scoreTab">
                    <span>Winner</span>
                    <span>Scores</span>
                    <span>Loser</span>
                </div>
                {history.map((elt) => (
                    <li id="historyElement" className="scoreTab" key={elt.matchId}>
                        <div className="row winner">
                            <span id="name" >{elt.winnerLogin}</span>
                            <span id="scoreW">{elt.scoreWinner}</span>
                        </div>
                        <div className="row loser">
                            <span id="scoreL">{elt.scoreLoser == -1 ? "give up" : elt.scoreLoser}</span>
                            <span id="name" >{elt.loserLogin}</span>
                        </div>
                    </li>
                ))}
            </ul>}
            </div>
        </div>
    )
}