import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('list');
const list = createRoot(container!);

interface TIS_number {
  number: number;
}

interface TIS_numberVector {
  numbers: number[];
}

const numbers: number[] = [1, 2, 3, 4, 5];
const doubled: number[] = numbers.map((number) => number * 2);

function ListNumber(value: TIS_number): JSX.Element {
  return <li>{value.number}</li>;
}

function ListNumbers(numbers: TIS_numberVector): JSX.Element {
  const _numbers: number[] = numbers.numbers;
  const listItems: JSX.Element[] = _numbers.map(
    (number) =>
    <ListNumber key={number.toString()} number={number} />
  );

  return (
    <ul>{listItems}</ul>
  );
}

list.render(
  <ListNumbers numbers={doubled} />
);