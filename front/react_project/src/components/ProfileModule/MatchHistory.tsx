import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

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
            console.log("win: ", win, ", loose: ", loose);
            setMatchWon(win);
            setMatchLost(loose);
            setHistory(data);
        })
    }, [])

    return (
        <div id="score">
            <div id="stats">
                    <h2>Statistics</h2>
                    <h3>total win = {matchWon}</h3>
                    <h3>total lost = {matchLost}</h3>
                    <h3>ratio = {matchLost == 0 ? (matchWon == 0 ? "NaN" : "full perfect") : matchWon / matchLost}</h3>
            </div>
            <div id="history">
                    <h2>Match history</h2>
            <ul id="matchList">
                {history.map((elt) => (
                    <li id="historyElement" key={elt.matchId}>
                        <span id="winnerName" className="name">{elt.winnerLogin}</span>
                        <span id="winnerScore">{elt.scoreWinner}</span>
                        <span id="loserName" className="name">{elt.loserLogin}</span>
                        <span id="loserScore">{elt.scoreLoser}</span>
                    </li>
                ))}
            </ul>
            </div>
        </div>
    )
}