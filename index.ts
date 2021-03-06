import {promises as fs} from 'fs';
import {shuffle, range, negate, isEmpty, groupBy} from 'lodash';
import yargs from 'yargs/yargs';
import type {Clause} from './common';
import {dnf2cnf, exactOne, parseInput} from './common';

const options = yargs(process.argv.slice(2))
	.string('board')
	.string('dict')
	.string('output-chars')
	.string('output-cnf')
	.demandOption(['board', 'dict', 'output-chars', 'output-cnf']).argv;

(async () => {
	const {constraints, cells} = parseInput(await fs.readFile(options.board));

	const dictionaryBuffer = await fs.readFile(options.dict);
	const words = dictionaryBuffer.toString().split('\n').filter(negate(isEmpty)).filter((word) => !(/^[ーっんぢづぁぃぅぇぉゃゅょ]/).test(word));
	const wordsByLength = groupBy(words, (word) => word.length);

	const charset = Array.from(new Set(words.map((word) => Array.from(word)).flat()));
	const cellChars = cells.map(() => shuffle(charset));
	const cellCharMaps = cellChars.map((chars) => new Map(chars.map((c, i) => [c, i])));

	await fs.writeFile(options['output-chars'], JSON.stringify(cellChars));

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

	await fs.writeFile(options['output-cnf'], [
		`p cnf ${nextIndex - 1} ${cnf.length}`,
		...cnf.map((clause) => {
			clause.push(0);
			return clause.join(' ');
		}),
	].join('\n'));
})();
