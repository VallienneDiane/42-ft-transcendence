import '../styles/App.css'
import React from 'react'

interface tis_string {
  string: string;
};

class Board extends React.Component {
  renderSquare(i: any) {
    return <Square value={i}  />;  }
    render() {
      const status = 'Next player: X';
  
      return (
        <div>
          <div className="status">{status}</div>
          <div className="board-row">
            {this.renderSquare("0")}
            {this.renderSquare("1")}
            {this.renderSquare("2")}
          </div>
          <div className="board-row">
            {this.renderSquare("3")}
            {this.renderSquare("4")}
            {this.renderSquare("5")}
          </div>
          <div className="board-row">
            {this.renderSquare("6")}
            {this.renderSquare("7")}
            {this.renderSquare("8")}
          </div>
        </div>
      );
    }
}

interface props {
};

interface state {
  value: any;
};

class Square extends React.Component<props, state> {
  constructor(props: props) {
    super(props);
    this.state = { // attention ne pas appeler this.setState() ici
      value: '',
    };
    }
  render() {
    return (
      <button
      className="square"
      onClick={() => this.setState({value: 'X'})}>
      {this.state.value}
    </button>
    );
  }
}

export default Board
