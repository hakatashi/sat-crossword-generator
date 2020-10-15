import {promises as fs} from 'fs';

(async () => {
  const lines = (await fs.readFile('output2.txt')).toString().split('\n');
  const chars: string[] = JSON.parse((await fs.readFile('chars.json')).toString());

  for (const line of lines) {
    const tokens = line.split(' ').slice(1);
    for (const token of tokens) {
      const n = parseInt(token);
      if (n > 0) {
        console.log(chars[(n - 1) % chars.length]);
      }
    }
  }
})();