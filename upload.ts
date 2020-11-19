import {promises as fs} from 'fs';
import path from 'path';
import firebase from 'firebase-admin';

(async () => {
	firebase.initializeApp({
		credential: firebase.credential.applicationDefault(),
		databaseURL: 'https://hakata-shi.firebaseio.com',
	});

	const db = firebase.firestore();
	const Boards = db.collection('crossword_boards');
	let cnt = 0;

	const files = await fs.readdir('outputs');
	for (const file of files) {
		console.log(file);
		const type = file.match(/^board-(.)-/)![1];
		if (type !== 'N') {
			continue;
		}
		cnt++;
		if (cnt > 100) {
			continue;
		}
		const board = await fs.readFile(path.join('outputs', file));
		const id = path.basename(file, '.txt').replace('board', 'grossword');
		const snapshot = await Boards.doc(id).get();
		if (!snapshot.exists) {
			await Boards.doc(id).set({
				category: 'grossword',
				type: `grossword-${type}`,
				board: board.toString(),
				used_at: null,
			});
		}
	}
})();

