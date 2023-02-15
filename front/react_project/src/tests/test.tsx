import '../styles/App.css'
import React from 'react'

type MyProps = {};
type MyState = {
    date: Date;
};


class Test extends React.Component<MyProps, MyState> {
constructor(props: MyProps) {
    super(props);
    this.state = {date: new Date()};
}

componentDidMount(): void {
    this.timerID = setInterval( () => this.tick(), 1000 );
}

componentWillUnmount() {
    clearInterval(this.timerID); // si Clock est retire du DOM, le minuteur sera arrete
}

tick() {   
    this.setState( {date: new Date()} ); // pour mettre a jour l'etat local
}

render() {
    return (
    <div>
        <h2>Il est {this.state.date.toLocaleTimeString()}.</h2>
    </div>
    );
}
}

export default Test