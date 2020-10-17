import {promises as fs} from 'fs';
import {shuffle, range, maxBy, negate, isEmpty, groupBy} from 'lodash';

interface Cell {
  x: number,
  y: number,
}

type Constraint = number[];

type Clause = number[];

const dnf2cnf = (clauses: Clause[], cnf: Clause[], inputNextIndex: number) => {
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

const exactOne = (variables: number[], cnf: Clause[]) => {
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

(async () => {
  const inputBuffer = await fs.readFile('input.txt');
  const lines = inputBuffer.toString().split('\n').filter(negate(isEmpty));

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

  const dictionaryBuffer = await fs.readFile('dictionary.txt');
  const words = dictionaryBuffer.toString().split('\n').filter(negate(isEmpty));
  const wordsByLength = groupBy(words, (word) => word.length);

  const charset = Array.from(new Set(words.map((word) => Array.from(word)).flat()));
  const cellChars = cells.map(() => shuffle(charset));
  const cellCharMaps = cellChars.map((chars) => new Map(chars.map((c, i) => [c, i])));

  await fs.writeFile('chars.json', JSON.stringify(cellChars));
  
  const cnf: Clause[] = [];

  let nextIndex = 1;
  for (const cell of cells) {
    const variables = range(nextIndex, nextIndex + charset.length);
    exactOne(variables, cnf);
    nextIndex += charset.length;
  }

  for (const constraint of constraints) {
    const limitedWords = wordsByLength[constraint.length];
    const dnf: Clause[] = [];

    for (const word of limitedWords) {
      const clause = constraint.map((char, i) => (
        char * charset.length + cellCharMaps[char].get(word[i])! + 1
      ));
      dnf.push(clause);
    }

    nextIndex = dnf2cnf(dnf, cnf, nextIndex);
  }

  console.log(`p cnf ${nextIndex - 1} ${cnf.length}`);
  for (const clause of cnf) {
    clause.push(0);
    console.log(clause.join(' '));
  }
})();