class GameOfLife {
	grid           = null;
	height         = 32;
	width          = 32;
	startRandCells = 100;
	tickSpeed      = 200;
	generation     = 0;
	paused         = false;
	tickId         = null;
	onTick         = null;

	constructor(options) {
		for (const prop in options) {
			this[prop] = options[prop];
		}

		if (this.grid === null) {
			throw "Grid element required";
		}

		this.cells = new Array(this.width * this.height);

		this.drawGrid();
	}

	drawGrid() {
		if (this.grid) {
			this.grid.innerHTML = null;
		}

		for (let y = 0; y < this.height; y++) {
			const row = document.createElement("div");

			row.classList.add("row");

			for (let x = 0; x < this.width; x++) {
				const col = document.createElement("div");

				col.classList.add("col");

				row.appendChild(col);

				const i = y * this.height + x;

				this.cells[i] = new Cell(this, col, i);
			}

			this.grid.appendChild(row);
		}
	}

	activateRandomCells(seed = null) {
		if (seed !== null && !isNaN(parseInt(seed, 10))) {
			seed = parseInt(seed, 10);

			// Modulus
			const m = Math.pow(2, 31); // 2147483648

			// Multiplier
			const a = 1103515245; // 0x41C64E6D

			// Increment
			const c = 12345; // 0x3039

			const table = new Array(this.cells.length);

			table[0] = seed;

			for (let i = 1; i < table.length; i++) {
				table[i] = (table[i-1] * a + c) % m;
			}

			for (let i = 0; i < table.length; i++) {
				if ((table[i] & 0x10000) > 0) {
					this.cells[i].live();
				}
			}
		} else {
			for (let i = 0; i < this.startRandCells; i++) {
				this.cells[Math.floor(Math.random() * this.cells.length)].live();
			}
		}
	}

	start() {
		this.tick();
	}

	pause() {
		this.paused = true;
	}

	resume() {
		this.paused = false;
		this.tick();
	}

	finish() {
		if (typeof this.onFinished === "function") {
			this.onFinished(this);
		}
	}

	clear() {
		clearTimeout(this.tickId);
		this.generation = 0;
		this.drawGrid();
	}

	tick() {
		if (!this.paused) {
			if (typeof this.onTick === "function") {
				this.onTick(this);
			}

			// Pass #1 - mark cells to live/die in next generation
			for (const cell of this.cells) {
				const { numLivingNeighbours } = cell;

				if (cell.alive) {
					if (numLivingNeighbours < 2 || numLivingNeighbours > 3) {
						cell.shouldDie = true;
					}
				}

				else if (numLivingNeighbours === 3) {
					cell.shouldLive = true;
				}
			}

			// Pass #2 - action changes marked in previous pass
			const that = this;

			this.tickId = setTimeout(function() {
				for (const cell of that.cells) {
					if (cell.shouldLive) {
						cell.live();
					}

					else if (cell.shouldDie) {
						cell.die();
					}
				}

				if (that.totalAlive > 0) {
					that.generation++;
					that.tick();
				} else {
					that.finish();
				}
			}, this.tickSpeed);
		}
	}

	get totalAlive() {
		return this.grid.querySelectorAll(".col.alive").length;
	}

	get totalDead() {
		return this.grid.querySelectorAll(".col:not(.alive)").length;
	}
}

class Cell {
	shouldLive = false;
	shouldDie  = false;

	constructor(grid, node, index) {
		this.grid  = grid;
		this.node  = node;
		this.index = index;
	}

	live() {
		this.node.classList.add("alive");
		this.shouldLive = false;
	}

	die() {
		this.node.classList.remove("alive");
		this.shouldDie = false;
	}

	get alive() {
		return this.node.classList.contains("alive");
	}

	get neighbours() {
		return {
			n  : this.north,
			ne : this.northeast,
			e  : this.east,
			se : this.southeast,
			s  : this.south,
			sw : this.southwest,
			w  : this.west,
			nw : this.northwest,
		}
	}

	get numLivingNeighbours() {
		return Object.values(this.neighbours).filter(cell => cell.alive).length;
	}

	get north() {
		// This cell is NOT in the first row
		if (this.index - this.grid.width >= 0) {
			return this.grid.cells[this.index - this.grid.width];
		}

		// Wrap to bottom
		return this.grid.cells[this.grid.height * (this.grid.width - 1) + this.index];
	}

	get east() {
		// End of row - wrap to west
		if ((this.index + 1) % this.grid.width === 0) {
			return this.grid.cells[this.index + 1 - this.grid.width];
		}

		return this.grid.cells[this.index + 1];
	}

	get south() {
		// This cell is in the last row
		if (this.index >= this.grid.cells.length - this.grid.width) {
			return this.grid.cells[this.index - (this.grid.cells.length - this.grid.width)];
		}

		// Wrap to top
		return this.grid.cells[this.index + this.grid.width];
	}

	get west() {
		// Beginning of row - wrap to east
		if (this.index % this.grid.width === 0) {
			return this.grid.cells[this.index + this.grid.width - 1];
		}

		return this.grid.cells[this.index - 1];
	}

	get northeast() {
		return this.north.east;
	}

	get southeast() {
		return this.south.east;
	}

	get southwest() {
		return this.south.west;
	}

	get northwest() {
		return this.north.west;
	}
}