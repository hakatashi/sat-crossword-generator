import {promises as fs} from 'fs';
import yargs from 'yargs/yargs';

const options = yargs(process.argv.slice(2))
	.string('board')
	.string('cnf')
	.string('chars')
	.demandOption(['board', 'cnf', 'chars']).argv;

(async () => {
	let input = (await fs.readFile(options.board)).toString().replace(/ /g, '　');
	const lines = (await fs.readFile(options.cnf)).toString().split('\n');
	const chars: string[][] = JSON.parse((await fs.readFile(options.chars)).toString());

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
				const n = parseInt(token);
				if (n > 0) {
					const cell = Math.floor((n - 1) / chars[0].length);
					const charIndex = (n - 1) % chars[0].length;
					input = input.replace('*', chars[cell][charIndex]);
				}
			}

			if (!input.includes('*')) {
				console.log(input);
				return;
			}
		}
	}
})();
