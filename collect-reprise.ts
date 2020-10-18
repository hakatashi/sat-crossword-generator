import {promises as fs} from 'fs';
import yargs from 'yargs/yargs';

const options = yargs(process.argv.slice(2)).demandOption(['board', 'cnf', 'chars']).argv;

(async () => {
	let input = (await fs.readFile(options.board)).toString().replace(/ /g, '　');
	const lines = (await fs.readFile(options.cnf)).toString().split('\n');
	const chars: string[][] = JSON.parse((await fs.readFile(options.chars)).toString());

	const variables: number[] = [];

	for (const line of lines) {
		const tokens = line.split(' ');
		if (tokens[0] === 's') {
			if (tokens[1] !== 'SATISFIABLE') {
				console.error('UNSAT :(');
				return;
			}
		}

		if (tokens[0] === 'v') {
			for (const token of tokens.slice(1)) {
				variables.push(parseInt(token));
			}
		}
	}

	for (const [i, charList] of chars.entries()) {
		const charVariables = variables.slice(i * 7, i * 7 + 7);
		const charIndex = parseInt(charVariables.map((v) => v > 0 ? '1' : '0').join(''), 2);
		input = input.replace('*', charList[charIndex]);
	}

	console.log(input);
})();
