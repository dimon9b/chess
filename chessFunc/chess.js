const LETTERS = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'],
	  BOARD_SIZE = LETTERS.length,
	  START_FIGURES_POSITION = {
		pawn: {
			white: ['H2', 'G2', 'F2', 'E2', 'D2', 'C2', 'B2', 'A2'],
			black: ['H7', 'G7', 'F7', 'E7', 'D7', 'C7', 'B7', 'A7']
		},
		rook: {
			white: ['H1', 'A1'],
			black: ['H8', 'A8']
		},
		horse: {
			white: ['G1', 'B1'],
			black: ['G8', 'B8']
		},
		elephant: {
			white: ['F1', 'C1'],
			black: ['F8', 'C8']
		},
		king: {
			white: ['E1'],
			black: ['E8']
		},
		queen: {
			white: ['D1'],
			black: ['D8']
		}
	  },
	  COLORS = ['white', 'black'],
	  COLORS_QUANTITY = COLORS.length;


class Figure {
	constructor (sType, sColor, sStartPos) {
		this.name = sType + '_' + sColor + '_' + sStartPos;
		this.type = sType;
		this.color = sColor;
		this.startPos = sStartPos;
		this.currentPos = sStartPos;
		this.movementType;
		this.step;
		this.selected = false;
		this.status = 'alive';
	}

	createParams(sName) {
		switch(sName) {
			case 'pawn':
				this.movementType = 'pawn';
				this.step = 2;
				break;

			case 'rook':
				this.movementType = 'line';
				this.step = 8;
				break;

			case 'horse':
				this.movementType = 'horse';
				this.step = 3;
				break;

			case 'elephant':
				this.movementType = 'diagonal';
				this.step = 8;
				break;

			case 'king':
				this.movementType = 'line_diagonal';
				this.step = 1;
				break;

			case 'queen':
				this.movementType = 'line_diagonal';
				this.step = 8;
				break;

			default:
				this.movementType = 'line_diagonal';
				this.step = 1;
				break;
		}
	}

	replaceFigure(pos) {
		this.currentPos = pos;
	}
}

class chessConstructor {

	constructor(sSelector){
		this.elem = document.getElementById(sSelector);
		this.cells = [];
		this.figuresOnTable = {};
		this.createProperties();
		this.createEvents();
		this.chessFigureIsSelected = false;
		this.selectedFigure = null;
		this.stepWantsToMove = 0;
		this.whoseTurn = 'white';
		this.attacking = false;
	}

	createProperties() {
		this.createTable();
		this.createFigures();
		this.placeFiguresOnTable();
	}
	
	createEvents() {
		for (let cell in this.cells) {
			this.cells[cell].addEventListener("click", this.clickOnCell.bind(this));
		}
	}

	createTable() {
		for (let i = 0; i < BOARD_SIZE; i++) {
			let row = this.createElem('row', this.elem, i, 0);
			for (let j = 0; j < BOARD_SIZE; j++) {
				let cell = this.createElem('cell', row, j, i);
				this.cells.push(cell);
			}
		}
	}

	createElem(elem, place, idx, prevIdx){
		let div = document.createElement("div");

		div.className = "chess-" + elem;
		div.id = elem === 'cell' ? LETTERS[idx] + (prevIdx + 1) : 'row' + (idx + 1);
		place.appendChild(div);

		return div;
	}

	createFigures() {
		for(let key in START_FIGURES_POSITION) {
			for (let i = 0; i < COLORS_QUANTITY; i++) {
				START_FIGURES_POSITION[key][COLORS[i]].forEach((pos) => {
					this.figuresOnTable[key + '_' + COLORS[i] + '_' + pos] = new Figure(key, COLORS[i], pos)
					this.figuresOnTable[key + '_' + COLORS[i] + '_' + pos].createParams(key)
				})
			}
		}
	}

	placeFiguresOnTable() {
		for(let key in this.figuresOnTable) {
			let div = document.createElement("div");
			div.className = "chess_figure " + this.figuresOnTable[key].type + "_" + this.figuresOnTable[key].color;
			div.id = this.figuresOnTable[key].name;
			this.elem.querySelector('#' + this.figuresOnTable[key].startPos).appendChild(div);
		}
	}

	clickOnCell(e) {
		if (!this.chessFigureIsSelected) {
			if (e.target.classList.contains('chess_figure') && this.figuresOnTable[e.target.id].color === this.whoseTurn) {
				this.chessFigureIsSelected = true;
				e.target.classList.add('selected');

				this.selectedFigure = this.figuresOnTable[e.target.id];
				this.figuresOnTable[this.selectedFigure.name].selected = true;
			}
		} else {
			if (e.target.classList.contains('chess_figure')) {
				this.attacking = true;
				this.ifCanAttack(e) && this.canFigureMoveThere(e) && this.attack(e) && this.changeTurn(e);
			} else if (e.target.classList.contains('chess-cell')) {
				this.canFigureMoveThere(e) && this.moveFigure(e) && this.changeTurn(e);
			}
			this.chessFigureIsSelected = false;
			this.elem.querySelector('.selected') && this.elem.querySelector('.selected').classList.remove('selected');

			this.figuresOnTable[this.selectedFigure.name].selected = false;
			this.selectedFigure = null;

			if (this.attacking) this.attacking = false;
		}
	}

	ifCanAttack(e) {
		return this.selectedFigure.color !== this.figuresOnTable[e.target.id].color;
	}

	canFigureMoveThere(e) {
		let usingType = this.howIWantToMove(e);
		if (this.comparingTypeOfMove(usingType, this.selectedFigure.movementType) && !this.isThereAnyFigureOnWay(e, usingType)){
			return true;
		} else {
			return false;
		}
	}

	howIWantToMove(e) {
		let letterFrom = this.selectedFigure.currentPos.charAt(0),
			letterTo = this.attacking ? e.target.parentElement.id.charAt(0) : e.target.id.charAt(0),
			numberFrom = parseInt(this.selectedFigure.currentPos.charAt(1)),
			numberTo = this.attacking ? parseInt(e.target.parentElement.id.charAt(1)) : parseInt(e.target.id.charAt(1)),
			usingType = null,
			onLetters = letterFrom === letterTo,
			onNumbers = numberFrom === numberTo;

		console.log(letterFrom, numberFrom, letterTo, numberTo, this.selectedFigure.name, this.attacking, e.target.id, e.target.parentElement.id)

		if ((this.selectedFigure.type === 'pawn') && onLetters && ( ( (numberFrom < numberTo) && (numberFrom >= numberTo - this.selectedFigure.step) && (this.selectedFigure.color === 'white')) || ((numberFrom > numberTo) && (numberFrom <= parseInt(numberTo) + this.selectedFigure.step) && (this.selectedFigure.color === 'black')))){
			usingType = 'pawn';
			this.stepWantsToMove = Math.abs(numberFrom - numberTo);
		} else if (onLetters) {
			usingType = 'line';
			this.stepWantsToMove = Math.abs(numberFrom - numberTo);
		} else if (onNumbers) {
			usingType = 'line';
			this.stepWantsToMove = Math.abs(LETTERS.indexOf(letterFrom) - LETTERS.indexOf(letterTo));
		} else if (Math.abs(numberFrom - numberTo) === Math.abs( LETTERS.indexOf(letterFrom) - LETTERS.indexOf(letterTo) ) ) {
			usingType = 'diagonal';
			this.stepWantsToMove = Math.abs(LETTERS.indexOf(letterFrom) - LETTERS.indexOf(letterTo));
		} else if ((Math.abs(numberFrom - numberTo) + Math.abs( LETTERS.indexOf(letterFrom) - LETTERS.indexOf(letterTo))) === 3 ) {
			usingType = 'horse';
			this.stepWantsToMove = 3;
		} else {
			usingType = 'unknown';
			this.stepWantsToMove = 0;
		}

		return usingType;
	}

	comparingTypeOfMove(usingType, needsType) {
		if (needsType.indexOf('_') === -1) {
			if (usingType === needsType && this.stepWantsToMove <= this.selectedFigure.step) return true;
		} else {
			let typesArray = needsType.split('_');
			for (let i = 0; i < typesArray.length; i++) {
				if (usingType === typesArray[i] && this.stepWantsToMove <= this.selectedFigure.step) return true;
			}
		}
		return false;
	}

	isThereAnyFigureOnWay(e, usingType) {
		let letterFrom = this.selectedFigure.currentPos.charAt(0),
			letterTo = this.attacking ? e.target.parentElement.id.charAt(0) : e.target.id.charAt(0),
			numberFrom = parseInt(this.selectedFigure.currentPos.charAt(1)),
			numberTo = this.attacking ? parseInt(e.target.parentElement.id.charAt(1)) : parseInt(e.target.id.charAt(1)),
			letterFromIndexOf = LETTERS.indexOf(letterFrom),
			letterToIndexOf = LETTERS.indexOf(letterTo);

		console.log(letterFrom, numberFrom, letterTo, numberTo, e.target.id, this.selectedFigure.currentPos)

		if (usingType === 'horse') return false;

		if (letterFrom === letterTo) {
			let direction = Math.sign(numberTo - numberFrom);
			for (let i = numberFrom + direction; Math.abs(i - numberTo) > 0; i += direction) {
				let checker = this.checkFigurePresence(letterFrom, i);
				if (checker) return true;
			}

		} else if (numberFrom === numberTo) {
			if (letterFromIndexOf < letterToIndexOf) {
				for (let i = letterFromIndexOf + 1; i < letterToIndexOf; i++) {
					let checker = this.checkFigurePresence(LETTERS[i], numberFrom);
					if (checker) return true;
				}
			} else {
				for (let i = letterFromIndexOf - 1; i > letterToIndexOf; i--) {
					let checker = this.checkFigurePresence(LETTERS[i], numberFrom);
					if (checker) return true;
				}
			}
		} else {
			if (letterFromIndexOf < letterToIndexOf && numberFrom < numberTo) {
				for (let i = letterFromIndexOf + 1; i < letterToIndexOf; i++) {
					let checker = this.checkFigurePresence(LETTERS[i], ++numberFrom);
					if (checker) return true;
				}
			} else if (letterFromIndexOf > letterToIndexOf && numberFrom < numberTo) {
				for (let i = letterFromIndexOf - 1; i > letterToIndexOf; i--) {
					let checker = this.checkFigurePresence(LETTERS[i], ++numberFrom);
					if (checker) return true;
				}
			} else if (letterFromIndexOf < letterToIndexOf && numberFrom > numberTo) {
				for (let i = letterFromIndexOf + 1; i < letterToIndexOf; i++) {
					let checker = this.checkFigurePresence(LETTERS[i], --numberFrom);
					if (checker) return true;
				}
			} else {
				for (let i = letterFromIndexOf - 1; i > letterToIndexOf; i--) {
					let checker = this.checkFigurePresence(LETTERS[i], --numberFrom);
					if (checker) return true;
				}
			}
		}
		return false;
	}


	checkFigurePresence(letter, number) {
		if (document.getElementById(letter + '' + number).hasChildNodes()) {
			console.log('there is some figure');
			return true;
		} else {
			return false;
		}
	}

	attack(e){
		let selectedCell = e.target.parentElement;

		e.target.remove(document.getElementById(this.figuresOnTable[e.target.id].name));
		this.figuresOnTable[e.target.id].status = 'dead';

		selectedCell.appendChild(document.getElementById(this.selectedFigure.name));
		this.figuresOnTable[this.selectedFigure.name].currentPos = selectedCell.id;
		if (this.selectedFigure.type === 'pawn') {
			this.figuresOnTable[this.selectedFigure.name].step = 1;
		}
		return true;
	}

	moveFigure(e) {
		e.target.appendChild(document.getElementById(this.selectedFigure.name));
		this.figuresOnTable[this.selectedFigure.name].currentPos = e.target.id;
		if (this.selectedFigure.type === 'pawn') {
			this.figuresOnTable[this.selectedFigure.name].step = 1;
		}
		return true;
	}

	changeTurn(e){
		this.whoseTurn === 'white' ? this.whoseTurn = 'black' : this.whoseTurn = 'white';
		return true;
	}
}