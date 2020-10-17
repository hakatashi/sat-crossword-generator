import {promises as fs} from 'fs';

(async () => {
  const lines = (await fs.readFile('output3.txt')).toString().split('\n');
  const chars: string[][] = JSON.parse((await fs.readFile('chars.json')).toString());

  for (const line of lines) {
    const tokens = line.split(' ').slice(1);
    for (const token of tokens) {
      const n = parseInt(token);
      if (n > 0) {
        const cell = Math.floor((n - 1) / chars[0].length);
        const charIndex = (n - 1) % chars[0].length;
        console.log(chars[cell][charIndex]);
      }
    }
  }
})();