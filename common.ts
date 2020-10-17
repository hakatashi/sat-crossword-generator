import {maxBy, negate, isEmpty} from 'lodash';

export interface Cell {
  x: number,
  y: number,
}

export type Constraint = number[];

export type Clause = number[];

export const dnf2cnf = (clauses: Clause[], cnf: Clause[], inputNextIndex: number) => {
  let nextIndex = inputNextIndex;
  const initialClause: Clause = [];

  for (const clause of clauses) {
    if (clause.length === 1) {
      initialClause.push(clause[0]);
    } else {
      initialClause.push(nextIndex);
      for (const variable of clause) {
        cnf.push([-nextIndex, variable]);
      }
      nextIndex++;
    }
  }

  cnf.push(initialClause);

  return nextIndex;
};

export const exactOne = (variables: number[], cnf: Clause[]) => {
  const initialClause: Clause = [];

  for (const variable of variables) {
    initialClause.push(variable);
  }

  for (const [j, right] of variables.entries()) {
    for (const i of Array(j).keys()) {
      const left = variables[i];
      cnf.push([-left, -right]);
    }
  }

  cnf.push(initialClause);
};

export const parseInput = (input: Buffer) => {
  const lines = input.toString().split('\n').filter(negate(isEmpty));

  const cells: Cell[] = [];
  const width = maxBy(lines, (line) => line.length)!.length;
  const height = lines.length;

  for (const [y, line] of lines.entries()) {
    for (const [x, char] of Array.from(line).entries()) {
      if (char === '*') {
        cells.push({x, y});
      }
    }
  }

  const constraints: Constraint[] = [];

  for (const y of Array(height).keys()) {
    let consecutiveCells: Constraint = [];

    for (const x of Array(width).keys()) {
      const char = lines[y][x] || ' ';

      if (char === '*') {
        const cellIndex = cells.findIndex((c) => c.x === x && c.y === y);
        consecutiveCells.push(cellIndex);
      } else {
        if (consecutiveCells.length >= 3) {
          constraints.push(consecutiveCells);
        }
        consecutiveCells = [];
      }
    }

    if (consecutiveCells.length >= 3) {
      constraints.push(consecutiveCells);
    }
  }

  for (const x of Array(width).keys()) {
    let consecutiveCells: Constraint = [];

    for (const y of Array(height).keys()) {
      const char = lines[y][x] || ' ';

      if (char === '*') {
        const cellIndex = cells.findIndex((c) => c.x === x && c.y === y);
        consecutiveCells.push(cellIndex);
      } else {
        if (consecutiveCells.length >= 3) {
          constraints.push(consecutiveCells);
        }
        consecutiveCells = [];
      }
    }

    if (consecutiveCells.length >= 3) {
      constraints.push(consecutiveCells);
    }
  }

  return {constraints, cells};
};