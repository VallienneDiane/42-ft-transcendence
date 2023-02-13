import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container_test = document.getElementById('test');
const test = createRoot(container_test!);

interface TIS_props {}
interface TIS_State {
  date: Date;
}
interface TIS_timerID {
  n: number;
}

class Clock extends React.Component<TIS_props, TIS_State> {

  timerID: number;
  constructor(props: TIS_props) {
    super(props);
    this.state = {date: new Date()};
    this.timerID = 0;
  }

  componentDidMount(): void {
   this.timerID = setInterval(
     () => this.tick(), 1000
   );
  }

  componentWillUnmount(): void {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      date: new Date()
    });
  }

  render() {
    return (
      <div>
        <h2>
          Heure via classe : {this.state.date.toLocaleTimeString()}
        </h2>
      </div>
    );
  }
}

test.render(
<div>
  <Clock />
  <Clock />
  <Clock />
</div>);