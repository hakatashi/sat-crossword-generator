import {promises as fs, createWriteStream} from 'fs';
import type {WriteStream} from 'fs';
import {shuffle, range, negate, isEmpty, groupBy} from 'lodash';
import yargs from 'yargs/yargs';
import type {Clause} from './common';
import {parseInput} from './common';

const options = yargs(process.argv.slice(2)).demandOption(['board', 'dict', 'output-chars', 'output-cnf', 'output-header']).argv;

let clauseCount = 0;

const word2int = (word: string, charMaps: Map<string, number>[]) => {
	const number = parseInt(Array.from(word).map((char, i) => (
		charMaps[i].get(char)!.toString(2).padStart(7, '0')
	)).join(''), 2);
	return number;
};

// start, segmentStart: inclusive
// end, segmentEnd: exclusive
const encodeSegment = (start: number, end: number, segmentStart: number, segmentEnd: number, clausePrefix: Clause, cnf: Clause[]) => {
	if (segmentEnd <= start || end <= segmentStart) {
		return;
	}

	if (start <= segmentStart && segmentEnd <= end) {
		cnf.push(clausePrefix);
		return;
	}

	const segmentMedian = (segmentStart + segmentEnd) / 2;
	encodeSegment(start, end, segmentStart, segmentMedian, [...clausePrefix, 0], cnf);
	encodeSegment(start, end, segmentMedian, segmentEnd, [...clausePrefix, 1], cnf);
};

// start, end: inclusive
const encodeRange = (start: number, end: number, variables: number[], writer: WriteStream) => {
	if (start > end) {
		return;
	}

	const binaryClauses: Clause[] = [];
	encodeSegment(start, end + 1, 0, 2 ** variables.length, [], binaryClauses);

	for (const clause of binaryClauses) {
		const cnf = clause.map((condition, i) => condition === 0 ? variables[i] : -variables[i]);
		writer.write(cnf.join(' '));
		writer.write(' 0\n');
		clauseCount++;
	}
};

(async () => {
	const {constraints, cells} = parseInput(await fs.readFile(options.board));

	const dictionaryBuffer = await fs.readFile(options.dict);
	const words = dictionaryBuffer.toString().split('\n').filter(negate(isEmpty)).filter((word) => !(/^[ーっんぢづぁぃぅぇぉゃゅょ]/).test(word));
	const wordsByLength = groupBy(words, (word) => word.length);

	const charset = Array.from(new Set(words.map((word) => Array.from(word)).flat()));
	const cellChars = cells.map(() => shuffle(charset));
	const cellCharMaps = cellChars.map((chars) => new Map(chars.map((c, i) => [c, i])));

	await fs.writeFile(options.outputChars, JSON.stringify(cellChars));

	let nextIndex = 1;
	for (const cell of cells) {
		nextIndex += 7;
	}

	await fs.unlink(options.outputCnf);
	for (const constraint of constraints) {
		console.error(constraint);

		const writer = createWriteStream(options.outputCnf, {flags: 'a'});

		const charMaps = constraint.map((cell) => cellCharMaps[cell]);
		const words = wordsByLength[constraint.length];

		const wordNumbers = words.map((word) => word2int(word, charMaps));
		wordNumbers.sort((a, b) => a - b);

		const variables = constraint.map((cell) => range(cell * 7 + 1, cell * 7 + 8)).flat();
		let nextWordNumber = 0;
		for (const wordNumber of wordNumbers) {
			encodeRange(nextWordNumber, wordNumber - 1, variables, writer);
			nextWordNumber = wordNumber + 1;
		}

		encodeRange(nextWordNumber, 2 ** variables.length - 1, variables, writer);

		writer.end();

		await new Promise((resolve) => {
			writer.once('finish', () => {
				resolve();
			});
		});
	}

	await fs.writeFile(options.outputHeader, `p cnf ${nextIndex - 1} ${clauseCount}\n`);
})();
