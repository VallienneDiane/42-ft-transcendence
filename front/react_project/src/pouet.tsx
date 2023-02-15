import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('pouet');
const pouet = createRoot(container!);

interface INumber {
  number: number;
}

interface Istring {
  string: string;
}

interface ITemperature {
   value: string;
   scale: string;
}

interface Iprops {
  value: string;
  scale: string;
  converter: any;
}

function toCelsius(f: number): number {
  return (f - 32) * 5 / 9;
}

function toFarhenheit(c: number): number {
  return (c * 9 / 5) + 32;
}

function tryConvert(temperature: string, convert: any): string {
  const input = parseFloat(temperature);
  if (Number.isNaN(input)) {
    return '';
  }
  const output: number = convert(input);
  const rounded: number = Math.round(output * 1000) / 1000;
  return rounded.toString();
}

function BoilingVerdict(temp: INumber): JSX.Element {
  return (
    <p>Water is{temp.number >= 100 
      ? ' boiling'
      : 'n\'t boiling'}
    </p>
  );
}

class TemperatureInput extends React.Component<Iprops, ITemperature> {
  constructor(props: Iprops) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event: any): void {
    this.props.converter(event.target.value);
  }

  render() {
    const value = this.props.value;
    const scale = this.props.scale;
    return (
      <fieldset>
        <legend>Enter the temperature in {scale} : </legend>
        <input value={value} onChange={this.handleChange} />
      </fieldset>
    );
  }
}

class Calculator extends React.Component<{}, ITemperature> {
  constructor(osef: {}) {
    super(osef);
    this.state = {value: '', scale: 'Celsius'};
    this.handleCelsiusChange = this.handleCelsiusChange.bind(this);
    this.handleFahrenheitChange = this.handleFahrenheitChange.bind(this);
  }

  handleCelsiusChange(temperature: string): void {
    this.setState({scale: 'Celcius', value: temperature});
  }

  handleFahrenheitChange(temperature: any): void {
    this.setState({scale: 'Fahrenheit', value: temperature});
  }

  render() {
    const scale = this.state.scale;
    const temperature = this.state.value;
    const celsius = scale === 'Fahrenheit' ? tryConvert(temperature, toCelsius) : temperature;
    const fahrenheit = scale === 'Celcius' ? tryConvert(temperature, toFarhenheit) : temperature;

    return (
      <div>
        <TemperatureInput scale={"Celcius"} value={celsius} converter={this.handleCelsiusChange} />
        <TemperatureInput scale={"Fahrenheit"} value={fahrenheit} converter={this.handleFahrenheitChange} />
        <BoilingVerdict number={parseFloat(celsius)} />
      </div>
    );
  }
}

pouet.render(
  <Calculator />
)