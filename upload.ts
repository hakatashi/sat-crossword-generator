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

	const files = await fs.readdir('outputs');
	for (const file of files) {
		console.log(file);
		const type = file.match(/^board-(.)-/)![1];
		const board = await fs.readFile(path.join('outputs', file));
		const id = path.basename(file, '.txt').replace('board', 'grossword');
		await Boards.doc(id).set({
			category: 'grossword',
			type: `grossword-${type}`,
			board: board.toString(),
			used_at: null,
		});
	}
})();

