const utils = require('./utils.js');
const sudokuPatternInfo = require('./sudoku-patterns.js');
const patterns = sudokuPatternInfo.patterns;
const unsolved = sudokuPatternInfo.unsolved;
const SpecialSet = require('./specialset.js');    

        // http://www.stolaf.edu/people/hansonr/sudoku/12rules.htm
        // technique names
        //    naked tuples (doubles, triples, quads)
        //    x-wing
        //    swordfish
        //    n-grid
        //    n-locked candidates
        // 
        
        // hidden tuples
        //   If n candidates are possible in a set of n columns of a given row and those n candidates 
        //   are not possible elsewhere in that row, then no other candidates are possible in those n cells.
        //   Same applies to columns and tiles
        //
        // grid analysis (x-wing, swordfish)
        //   If a candidate k is possible in the intersection of n rows and n columns
        //   but is not possible elsewhere in those n rows, then it is also not possible
        //   elsewhere in those n columns
        
        // https://www.kristanix.com/sudokuepic/sudoku-solving-techniques.php
        //   Sole candidate 
        //        No other possibles for a cell as all other values are already intersected in row/col/tile
        //   Unique candidate 
        //        Since each tile must contain all numbers, sometimes there's only one spot in the tile where a given number can go)
        //   Block and column / Row Interaction
        //        If the only places a given value can be in a cell are in the same row or column, then you can eliminate
        //        those values from the neighboring tiles in that row or column
        //   Block / Block Interaction
        //        Not sure how to describe this one (see above web link)
        //   Naked Pair
        //        When you have two cells in any row/col/tile that have the same two possibles, then those two cells
        //        must contain those values and they cannot exist anywhere else in that row/col/tile
        //   X-Wing
        //        Rectangle of four cells that can contain a particular value and no other cell in those 
        //        one of two rows or two colums or two tiles can contain that value.  Then, you know that two
        //        of the four cells must be that value and they must be diagonal from each other.  You can eliminate
        //        those values as possibles from any other cells in the row/column (the other direction from what you already
        //        had eliminated)
        //   Swordfish
        //        More complicated version of x-wing
        //        I do not understand this one yet
        //   Forcing Chain
        //        I do not understand this one yet (mini guess and test that leads to the same value
        //        for some cell regardless of what you guess for some other cell
        //
        // ****** This is the best site with great explanations, examples and test puzzles ******
        // http://www.sadmansoftware.com/sudoku/solvingtechniques.php (and test puzzles for every test here)
        // SDK files are saved Sudoku puzzles in SadMan Sudoku format
        //   Naked Single (sole candidate)
        //   Hidden single (unique candidate)
        //   Block and column/row interactions
        //        When examining a tile, you determine that a given number must be in a certain row or column 
        //        within that tile.  That means you can eliminate that number from that row or column in any of 
        //        the neighboring tiles.
        //   Naked Pair, Triplet, Quad
        //        Same as above
        //        Can be applied to triplets or quads, but in those cases each piece of the triplet or quad is the
        //        only place a given set of values can be and all values don't have to be possible in all parts of
        //        the triplet or quad
        //   Hidden Pair, Triplet, Quad
        //        Pair: Only two cells in same row/col/tile have the same two possibles (even though they have lots
        //        of other possibles).  Then those two cells must contain those two values and you can eliminate
        //        all the other possibles for those two cells.  If the two cells are in a row or column and the two 
        //        cells are in the same tile, then you can eliminate those two values from elsewhere in the tile
        //   XY-Wing
        //        I don't know how to recognize this one in code
        //   Colouring
        //        I don't know how to recognize this one in code
        //   Remote Pairs
        //        Chains of pairs where no matter which way you guess on anyone in the chain, you get
        //        an intersecting cell that can't be either value of the pair
        //        Don't know how to code this one
        //   XY-Chain
        //        Chain of connected cells each with only pairs allows you to eliminate various values
        //        because no matter which way you start the chain, you find intersecting cells that can't
        //        have certain values in the chain
        //        I don't know how to recognize this one in code
        //   Forcing Chains
        //        Following connected pairs yields same result for some cell no matter which value you start
        //        with in the chain.  This is kind of a guess and test, but the guesses are swiftly determinate.
        //        I don't know how to recognize this one in code
        
        
// Things to code for sure:
//   Naked Pair
//   Naked Triplet
//   Naked Quad
//   X-Wing
//   Hidden Pair
//   Hidden Triplet






// board is array of objects {val: num, possibles: {}, row: x, col: y, index: n}
// val === 0, means empty, val > 0 means number assigned

const boardSize = 9;
const tileSize = Math.sqrt(boardSize);



    

class SpecialMap extends Map {
    constructor(arg) {
        super(arg);
    }
    
    toArray() {
        return Array.from(this);
    }
    
    toSortedArrayNumber() {
        return this.toArray().sort((a,b) => a - b);
    }
    
    toNumberString() {
        return this.toSortedArrayNumber().join(",");
    }
    
    
}

// initialize a Map of Sets
class MapOfSets extends Map {
    constructor(num, baseKey) {
        super();
        let base = baseKey || 0;
        let end = base + num;
        for (var i = base; i < end; i++) {
            this.set(i, new SpecialSet());
        }
    }
}

class MapOfMaps extends Map {
    constructor(num, baseKey) {
        super();
        let base = baseKey || 0;
        let end = base + num;
        for (var i = base; i < end; i++) {
            this.set(i, new SpecialMap());
        }
    }
}

class ArrayOfSets extends Array {
    constructor(num) {
        super();
        for (var i = 0; i < num; i++) {
            this.push(new SpecialSet());
        }
    }
}


// fill array with all possible values
const allValues = [];
for (let i = 0; i < boardSize; i++) {
    allValues[i] = i + 1;
}
const allValuesSet = new SpecialSet(allValues);

// some utils

function cellsToStr(collection) {
    let results = [];
    for (let cell of collection) {
        results.push(cell.xy());
    }
    return results.join(" ");
}

// a single cell in the board
class Cell {
    constructor(val, row, col, index, board) {
        this.value = val;
        this.row = row;
        this.col = col;
        this.tileNum = board.getTileNum(row, col);
        this.index = index;
        this.possibles = new SpecialSet();
        this.board = board;
    }
    
    clone(newBoard) {
        let newCell = new Cell(this.value, this.row, this.col, this.index, newBoard);
        newCell.possibles = this.possibles.clone();
        return newCell;
    }
    
    // calculates a hash of the possibles for a cell
    calcPossiblesHash() {
        // set has to be sorted to make predictable hash
        let items = Array.from(this.possibles).sort((a,b) => { return a - b});
        let total = 0;
        
        items.forEach((num, index) => {
            let multiplier = Math.pow(boardSize + 1, index);
            total += num * multiplier;
        });
        return total;
    }    
    
    // returns true if value was set
    // sets dirty flag on cell if possible value was cleared
    clearPossibleValue(val, nestLevel) {
        if (this.possibles.has(val)) {
            let level = nestLevel || 0;
            let leading = Array(level).fill(" ").join("");
            this.board.log(leading + `removing possible ${val} from ${this.xy()}`, this.possibles);
            this.possibles.delete(val);
            this.dirty = true;
            /* 
            // even though we know the value of this cell here, we can't set it 
            // because then possibles elsewhere will have invalid values leading to bugs
            // so we catch this cell in a future pass of processSingles()
            if (this.possibles.size === 1) {
                this.value = Array.from(this.possibles)[0];
                this.possibles.clear();
                // FIXME, need to re-examine other dependencies, now that this cell is known
            } */
            return 1;
        }
        return 0;
    }
    
    xy() {
        return `(${this.row}, ${this.col})`;
    }
    
    pList() {
        return this.possibles.toBracketString();
    }
    
    setValue(val) {
        this.value = val;
        this.possibles.clear();
        this.dirty = true;
    }
    
    static outputCellList(list) {
        let output = [];
        for (let cell of list) {
            output.push(cell.xy());
        }
        return output.join(" ");
    }
    
    // calcs the position from the left of top of the box of this tileNum
    // if dir === "row", then it calcs how many tiles the tileNum is from the left edge
    // if dir === "column", then it calcs how many tiles the tileNum is from the top edge
    // for a 9x9 board, this returns 0, 1 or 2 for legal tileNum values
    static calcTilePosition(dir, tileNum) {
        return dir === "row" ? tileNum % tileSize : Math.floor(tileNum / tileSize);
    }
    
    // get our position in the row or column
    getPosition(dir) {
        if (dir === "row") {
            return this.col;
        } else {
            return this.row;
        }
    }
    

}

class BoardError extends Error {
    constructor(msg) {
        super(msg);
    }
}

class Board {
    constructor(board) {
        this.data = [];
        this.loggingEnabled = true;
		this.solutions = [];
        if (board) {
            // auto-convert string-formatted sdk Sudoku board format strings into arrays
            if (typeof board === "string") {
                // remove whitespace, convert "." to "0", split into array, then convert to numbers
                board = board.replace(/\s/g, "").replace(/\./g, "0").split("").map(cell => +cell);
            }
            let rowCntr = 0, colCntr = 0;
            this.data = board.map((item, index) => {
                if (colCntr >= boardSize) {
                    ++rowCntr;
                    colCntr = 0;
                }
                return new Cell(item, rowCntr, colCntr++, index, this);
            });
        }
    }
    
    // make a clone of this board
    clone() {
        let newBoard = new Board();
        for (let cell of this.data) {
            newBoard.data.push(cell.clone(newBoard));
        }
        return newBoard;
    }
    
    log() {
        if (this.loggingEnabled) {
            console.log.apply(console, arguments);
        }
    }

    // returns the number of open cells (0 means the board is solved);
    // options is an optional argument
    // {skipSinglePossible: true}
    checkBoard(options) {
        options = options || {};
        let conflicts = new SpecialSet();
        let openCells = new SpecialSet();
        let board = this;
        
        function error(cell, msg) {
            conflicts.add(cell);
            board.log(`checkBoard() error ${msg}, ${cell.xy()}`);
        }
        
        this.iterateCellsByStructureAll((cells, tag, num) => {
            // check this cells array to make sure that:
            //     no assigned values are repeated
            //     no possibles exist for an assigned value
            //     no cells have no value and no possibles
            //     every value is accounted for in either an assigned value or a possible
            //     no cells have only a single possible
            let assignedVals = new SpecialSet();
            let possibleVals = new SpecialSet();
            
            // collect all assignedVals and possibleVals
            cells.forEach(cell => {
                if (cell.value) {
                    // check if this assigned value already used
                    if (assignedVals.has(cell.value)) {
                        error(cell, `assigned value ${cell.value} repeated in ${tag}`);
                    } else {
                        assignedVals.add(cell.value);
                    }
                } else {
                    openCells.add(cell);
                    if (!options.skipSinglePossible) {
                        if (cell.possibles.size === 1) {
                            error(cell, `cells has a single possible and no value`);
                        }
                    }
                    possibleVals.addTo(cell.possibles);
                    if (cell.possibles.size === 0) {
                        error(cell, `cell has no possibles and no assigned value`);
                    }
                }
            });
            // check for possibles and assigned values overlapping
            let overlapVals = assignedVals.intersection(possibleVals);
            if (overlapVals.size > 0) {
                error(cells[0], `possibles and assigned values overlap in ${tag}:${num} (probably errant possible value) ${overlapVals.toNumberString()}`);
            }
            
            let unionVals = assignedVals.union(possibleVals);
            if (unionVals.size !== boardSize) {
                error(cells[0], `not all values accounted for in either possibles or assigned values in ${tag}:${num}, values present: ${unionVals.toNumberString()}`);
            }
        });
        
        if (conflicts.size === 0) {
            if (openCells.size === 0) {
                this.log("Board is solved");
            } else {
                this.log(`Board is valid, still ${openCells.size} open cells`);
            }
        } else {
            throw new BoardError("Board errors");
        }
        return openCells.size;
    }
    
    // iterates a row and calls the callback once for each cell in the row
    // it passes the callback the cell and the index within the row
    iterateRow(row, fn) {
        let startCell = row * boardSize;
        let endCell = startCell + boardSize;
        for (let index = startCell, pos = 0; index < endCell; index++, pos++) {
            if (fn(this.data[index], pos) === false) {
                return false;
            }
        }
        return true;
    }

    iterateColumn(column, fn) {
        for (let index = column, row = 0; row < boardSize; index += boardSize, row++) {
            if (fn(this.data[index], row) === false) {
                return false;
            }
        }
        return true;
    }

    iterateTile(tileNum, fn) {
        var startColumn = (tileNum % tileSize) * tileSize, 
            endColumn = startColumn + tileSize,
            startRow = Math.floor(tileNum / tileSize) * tileSize,
            endRow = startRow + tileSize;
        var index;
        
        for (var col = startColumn; col < endColumn; col++) {
            for (var row = startRow, pos = 0; row < endRow; row++, pos++) {
                index = (row * boardSize) + col;
                if (fn(this.data[index], pos) === false) {
                    return false;
                }
            }
        }
        return true;
    }
    
    iterateRowOpenCells(row, fn) {
        this.iterateRow(row, (cell, index) => {
            if (cell.value === 0) {
                fn.call(this, cell, index);
            }
        });
    }
    
    iterateColumnOpenCells(col, fn) {
        this.iterateColumn(col, (cell, index) => {
            if (cell.value === 0) {
                fn.call(this, cell, index);
            }
        });
    }
    
    iterateTileOpenCells(tileNum, fn) {
        this.iterateTile(tileNum, (cell, index) => {
            if (cell.value === 0) {
                fn.call(this, cell, index);
            }
        });
    }
    
    iterateAll(fn) {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                fn.call(this, row, col);
            }
        }
    }
    
    iterateOpenCells(fn) {
        this.iterateAll((row, col) => {
            let cell = this.getCell(row, col);
            if (cell.value === 0) {
                fn.call(this, cell, row, col);
            }                
        });
    }
    
    // this iterates all the rows, columns or tiles depending upon what is passed for dir
    // dir can be "row", "column" or "tile"
    iterateOpenCellsX(dir, fn) {
        for (var i = 0; i < boardSize; i++) {
            let cells = this.getOpenCellsX(dir, i);
            fn.call(this, cells, i, dir);
        }
    }
    
    getTileNum(row, col) {
        let tileRow = Math.floor(row / tileSize);
        let tileColumn = Math.floor(col / tileSize);
        return (tileRow * tileSize) + tileColumn;
    }
    
    getRowCol(index) {
        let row = Math.floor(index / boardSize);
        let col = index - (row * boardSize);
        return {row, col};
    }
    
    getIndex(row, col) {
        return (row * boardSize) + col;
    }
    
    getCell(row, col) {
        return this.data[this.getIndex(row, col)];
    }
    
    getOpenCellsX(dir, value) {
        if (dir === "row") {
            return this.getOpenCellsRow(value);
        } else if (dir === "tile") {
            return this.getOpenCellsTile(value);
        } else {
            return this.getOpenCellsColumn(value);
        }
    }
    
    getOpenCellsRow(row) {
        let results = [];
        this.iterateRowOpenCells(row, cell => {
            results.push(cell);
        });
        return results;
    }
    
    getOpenCellsColumn(col) {
        let results = [];
        this.iterateColumnOpenCells(col, cell => {
            results.push(cell);
        });
        return results;
    }
    
    // can be passed either (row, col) or (tileNum)
    // can be called as either of:
    // getOpenCellsTile(row, col)
    // getOpenCellsTile(tileNum) {
    getOpenCellsTile(row, col) {
        let results = [], tileNum;
        
        // see if both row,col passed or just tileNum
        if (typeof col === "undefined") {
            tileNum = row;
        } else {
            tileNum = this.getTileNum(row, col);
        }
        this.iterateTileOpenCells(tileNum, (cell, index) => {
            results.push(cell);
        });
        return results;
    }

    // buddies are defined as any cell that shares a row, col or tile with the passsed in row,col
    // they do not include the cell in the passed in row,col
    // returns an array of cells
    // This accepts either (row, col, returnSet) or (cell, returnSet)
    // returnSet is optional
    getOpenCellsBuddies(rowArg, colArg, returnSetArg) {
        let row = rowArg, col = colArg, returnSet = returnSetArg, cell = rowArg;
        if (cell instanceof Cell) {
            // args must have been (cell, returnSet)
            returnSet = colArg;
            row = cell.row;            
            col = cell.col;
        }
        let buddies = new SpecialSet();
        buddies.addTo(this.getOpenCellsRow(row));
        buddies.addTo(this.getOpenCellsColumn(col));
        buddies.addTo(this.getOpenCellsTile(row, col));
        // remove passed in cell
        buddies.delete(this.getCell(row, col));
        if (returnSet) {
            return buddies;
        } else {
            return buddies.toArray();
        }
    }
    
    getCellsBuddies(row, col, returnSet) {
        let buddies = new SpecialSet();
        buddies.addTo(this.getCellsRow(row));
        buddies.addTo(this.getCellsColumn(col));
        buddies.addTo(this.getCellsTile(row, col));
        // remove passed in cell
        buddies.delete(this.getCell(row, col));
        if (returnSet) {
            return buddies;
        } else {
            return buddies.toArray();
        }
    }
    
    getCellsRow(row) {
        let results = [];
        this.iterateRow(row, cell => {
            results.push(cell);
        });
        return results;
    }
    
    getCellsColumn(col) {
        let results = [];
        this.iterateColumn(col, cell => {
            results.push(cell);
        });
        return results;
    }
    
    getCellsRowSet(row) {
        let results = new SpecialSet();
        this.iterateRow(row, (cell, index) => {
            results.add(cell);
        });
        return results;
    }
    
    getCellsColumnSet(col) {
        let results = new SpecialSet();
        this.iterateColumn(col, cell => {
            results.add(cell);
        });
        return results;
    }
    // can be passed either (row, col) or (tileNum)
    getCellsTile(row, col) {
        let results = [], tileNum;
        
        // see if both row,col passed or just tileNum
        if (typeof col === "undefined") {
            tileNum = row;
        } else {
            tileNum = this.getTileNum(row, col);
        }
        this.iterateTile(tileNum, (cell, index) => {
            results.push(cell);
        });
        return results;
    }
    
    // can be passed either (row, col) or (tileNum)
    getCellsTileSet(row, col) {
        let results = new SpecialSet(), tileNum;
        
        // see if both row,col passed or just tileNum
        if (typeof col === "undefined") {
            tileNum = row;
        } else {
            tileNum = this.getTileNum(row, col);
        }
        this.iterateTile(tileNum, (cell, index) => {
            results.add(cell);
        });
        return results;
    }
    
    // Iterate all rows, columns and tiles
    // pass the iterator an array of open cells
    // If the skipTile argument is present, then don't iterate tiles, only rows/cols
    //
    // If the callback returns "again", then it will repeat the unit it was just on
    iterateOpenCellsByStructureAll(skipTile, f) {
        let fn = f;
        if (typeof skipTile === "function") {
            fn = skipTile;
            skipTile = false;
        }
        let cells;
        for (let row = 0; row < boardSize; row++) {
            do {
                cells = this.getOpenCellsRow(row);
            } while (fn.call(this, cells, "row", row) === "again");
        }
        for (let col = 0; col < boardSize; col++) {
            do {
                cells = this.getOpenCellsColumn(col);
            } while (fn.call(this, cells, "column", col) === "again");
        }
        if (!skipTile) {
            for (let tileNum = 0; tileNum < boardSize; tileNum++) {
                do {
                    cells = this.getOpenCellsTile(tileNum);
                } while (fn.call(this, cells, "tile", tileNum) === "again");
            }
        }
    }
    
    // Iterate all rows, columns and tiles
    // pass the iterator an array of cells
    // If the skipTile argument is present, then don't iterate tiles, only rows/cols
    iterateCellsByStructureAll(skipTile, f) {
        let fn = f;
        if (typeof skipTile === "function") {
            fn = skipTile;
            skipTile = false;
        }
        let cells;
        for (let row = 0; row < boardSize; row++) {
            cells = this.getCellsRow(row);
            fn.call(this, cells, "row", row);
        }
        for (let col = 0; col < boardSize; col++) {
            cells = this.getCellsColumn(col);
            fn.call(this, cells, "column", col);
        }
        if (!skipTile) {
            for (let tileNum = 0; tileNum < boardSize; tileNum++) {
                cells = this.getCellsTile(tileNum);
                fn.call(this, cells, "tile", tileNum);
            }
        }
    }
    
    // options {openOnly: true, excludes: list}
    // excludes list must be array or set if present
    getAffectedCells(row, col, options) {
        let opts = options || {};
        // collect all affected cells in a Set (so no cell is repeated)
        let list = this.getCellsRowSet(row);
        this.getCellsColumn(col).forEach(cell => list.add(cell));
        this.getCellsTile(this.getTileNum(row, col)).forEach(cell => list.add(cell));
        
        // if we only want open cells, then remove ones that have a value
        if (opts.openOnly) {
            list.forEach(cell => {
                if (cell.value) {
                    list.delete(cell);
                }
            });
        }
        
        if (opts.excludes) {
            opts.excludes.forEach(item => list.delete(item));
        }
        return list;
    }

    // Iterate all affected cells a Set at a time
    // Calls the callback with a Set of row/col/tile cells
    // The passed in row/col cell is automatically removed from each Set
    // If the callback returns false, the iteration will stop
    iterateAffectedCellsByStructure(row, col, fn) {
        let homeCell = this.getCell(row, col);
        let b = this;
        
        function run(method, arg) {
            let cells = b[method](arg);
            cells.delete(homeCell);
            return fn.call(b, cells);
        }
        // stop iteration early if any callback returns false
        if (run("getCellsRowSet", row) === false) return;
        if (run("getCellsColumnSet", col) === false) return;
        run("getCellsTileSet", this.getTileNum(row, col));
    }
    
    // iterate all intersecting row/col/tile cells that are not in the excludes list
    // options.excludes must be an array or a set or not passed if the property exists
    // callback is passed one cell at a time
    iterateAffectedCells(row, col, options, fn) {
        // deal with variable arguments
        if (!fn) {
            fn = options;
            options = {};
        }
        options.openOnly = false;
        let list = this.getAffectedCells(row, col, options);
        for (let cell of list) {
            fn.call(this, cell);
        }
    }

    // iterate all intersecting row/col/tile cells that are not in the excludes list
    // and are currently open
    iterateAffectedOpenCells(row, col, options, fn) {
        // deal with variable arguments
        if (!fn) {
            fn = options;
            options = {};
        }
        options.openOnly = true;
        let list = this.getAffectedCells(row, col, options);
        for (let cell of list) {
            fn.call(this, cell);
        }
    }
    
    setValue(cell, val, nestLevel) {
        // check if value already done by someone else
        if (cell.value === val) {
            return 0;
        }
        if (!val) {
            return 0;
        }
        let totalCellsSet = 1;
        let level = nestLevel || 0;
        let leading = Array(level).fill(" ").join("");
        this.log(leading + `setValue: ${cell.xy()} to ${val}`);
        cell.setValue(val);
        totalCellsSet += this.clearBuddyPossibles(cell, level + 1);
        return totalCellsSet;
    }
    
    clearBuddyPossibles(cell, nestLevel) {
        let level = nestLevel || 0;
        let totalCellsSet = 0;
        let val = cell.value;
        if (!val) return;
        
        let waitingCells = [];
        let cells = this.getAffectedCells(cell.row, cell.col, {openOnly: true});
        cells.forEach(c => {
            c.clearPossibleValue(val, level)
            if (c.possibles.size === 1) {
                // keep track of cells we need to set
                waitingCells.push(c);
            }
        });
        // now that we're done with our work, deal with the dirty cells 
        // that each have only a single possible value
        waitingCells.forEach(c => {
            // note: This is recursive, so we have to protect against the fact that
            // this cell might have already been set by the recursive behavior
            if (!c.value) {
                if (!c.possibles.getFirst()) {
                    let i = 1;    // place to put a breakpoint
                }
                totalCellsSet += this.setValue(c, c.possibles.getFirst(), level + 1);
            }
        });
        return totalCellsSet;        
    }
    
    // pass an array or set of cells
    // pass an array of set of possibles to clear
    // clear all those possibles from all those cells
    // If any cells are left with only a single possible, then process those too
    clearListOfPossibles(cells, possibleClearList, nestLevel) {
        let level = nestLevel || 0;
        let waitingCells = [];
        let totalCellsSet = 0;
        
        cells.forEach(c => {
            possibleClearList.forEach(p => {
                totalCellsSet += c.clearPossibleValue(p, level);
            });
            if (c.possibles.size === 1) {
                waitingCells.push(c);
            }
        });
        // now that we're done with our work, deal with the dirty cells 
        // that each have only a single possible value
        waitingCells.forEach(c => {
            // note: This is recursive, so we have to protect against the fact that
            // this cell might have already been set by the recursive behavior
            if (!c.value) {
                totalCellsSet += this.setValue(c, c.possibles.getFirst(), level + 1);
            }
        });
        return totalCellsSet;
    }
    
    // returns a map of sets that tells you which cells each possible value is in
    // The map is indexed by possible value
    //     The value in the map for each possible is a set of cells
    getPossibleMap(cells) {
        let pMap = new SpecialMap();
        for (let cell of cells) {
            for (let p of cell.possibles) {
                // lookup the possible value in the pMap for this tile and add this cell to it
                let set = pMap.get(p);
                if (!set) {
                    set = new SpecialSet();
                    pMap.set(p, set);
                }
                set.add(cell);
            }
        }
        return pMap;
    }
    
    // gets a map of cells by tile where the tileNum is the index
    // and a set of cells is the value for each tile that has a cell present
    // using this, you can figure out how the cells are distributed across tiles
    //   how many in each tile, if more than one in any tile, etc...
    getTileMap(cells) {
        let tileMap = new Map();
        for (let cell of cells) {
            let mapEntry = tileMap.get(cell.tileNum);
            if (!mapEntry) {
                mapEntry = new SpecialSet();
                tileMap.set(cell.tileNum, mapEntry);
            }
            mapEntry.add(cell);
        }
        return tileMap;
    }
    
    // get all possibles for a given cell by eliminating all values
    // already set in the row/col/tile
    getPossibles(row, col) {
        let homeCell = this.getCell(row, col);
        
        // start out with all possible values
        let possibles = new SpecialSet(allValues);
        
        this.iterateAffectedCells(row, col, [homeCell], cell => {
            possibles.delete(cell.value);
        });
        
        // this.log(`possibles ${homeCell.xy()}: `, possibles);
        return possibles;
    }
    
    setAllPossibles() {
        let valuesSet = 0;
        this.iterateOpenCells((cell, row, col) => {
            let possibles = cell.possibles = this.getPossibles(row, col);
            
            if (possibles.size === 0) {
                this.log("board error: (" + row + ", " + col + ") has no possibles and no value");
            } else if (possibles.size === 1) {
                // if only one possible, then set the value
                cell.setValue(possibles.getFirst());
                this.log(`Found (${row}, ${col}) has only one possible value of ${cell.value}`);
                ++valuesSet;
            }
        });
        return valuesSet;
    }
    
    // process naked singles and hidden singles
    // naked single is when a cell only has one possible value
    // hidden single is when a there is no other cell in the column, row or tile that can have a given value
    //    then that value must be in this cell
    processSingles() {
        this.log("Processing naked and hidden singles");
        // Check each possible in row/col/tile to see if it is the only cell that could have that value
        // If so, set its value and clear possibles in all directions for that new value
        function run() {
            let valuesSet = 0;
            
            this.iterateOpenCells((cell, row, col) => {
                // This callback is called for each open cell
                
                // If only one possible value set it (naked single)
                if (cell.possibles.size === 1) {
                    this.log(`Found cell ${cell.xy()} with only one possible, setting value of ${cell.possibles.getFirst()}`);
                    this.setValue(cell, cell.possibles.getFirst());
                    ++valuesSet;
                    return;
                }
                
                // get each row/col/tile for this cell
                this.iterateAffectedCellsByStructure(row, col, cells => {
                    // will get called three times (row/col/tile) with a set of cells, 
                    // home cell has been eliminated from the set
                    let union = new SpecialSet();
                    cells.forEach(cell => {
                        if (cell.value) {
                            union.add(cell.value);
                        } else {
                            union.addTo(cell.possibles);
                        }
                    });
                    // if all values are not accounted for, then that value MUST go in this cell
                    if (union.size !== boardSize) {
                        if (union.size !== (boardSize - 1)) {
                            throw new BoardError(`Got bad union for possibles on cell ${cell.xy()}`);
                        }
                        // now figure out which value is missing
                        let missing = allValuesSet.difference(union);
                        let val = missing.getFirst();
                        this.log(`Found ${cell.xy()} is only cell that can have ${val}`);
                        valuesSet += this.setValue(cell, val);
                    }
                });
                
            });
            return valuesSet;
        }
        // run this until no more values are changed
        while(run.call(this)) {}
        this.checkBoard();
    }
    
    // A naked pair is any two buddies that have exactly the same two possibles.  Since one of each of the two cells
    // must have one of each of the two values (because they are buddies), then all other cells in the common row/col/tile must not have
    // that value and their possibles for that value can be cleared
    processNakedPairs() {
        let possiblesCleared = 0;
        this.log("Processing Naked Pairs");
        this.iterateOpenCellsByStructureAll(cells => {
            // here we have an array of cells to process (will be a row, column or tile)
            let pairs = new Map();
            cells.forEach(cell => {
                if (cell.possibles.size === 2) {
                    let hash = cell.calcPossiblesHash();
                    if (pairs.has(hash)) {
                        // get other cell in the pair
                        let cell2 = pairs.get(hash);
                        // found a matching pair, so remove this pair from any other possibles in this cells array
                        this.log(`found matching pair: ${cell2.xy()}, ${cell.xy()}`, cell.possibles)
                        
                        // for each cell in the array we are processing
                        // if it's not one of the cells in the pair, then clear each of the possible values from it
                        let cellSet = new SpecialSet(cells);
                        cellSet.remove([cell, cell2]);
                        this.clearListOfPossibles(cellSet, cell.possibles);
                    } else {
                        pairs.set(hash, cell);
                    }
                }
            });
        });
        return possiblesCleared;
    }
    
    processNakedTriplesQuads() {
        let possiblesCleared = 0;
       
        // this is brute force - create all triple and quad combinations and check them
        this.iterateOpenCellsByStructureAll(cells => {
            for (let len of [3,4]) {
                // if there aren't enough cells, then no need to look further
                if (cells.length <= len) continue;
                let combos = utils.makeCombinations(cells, len);
                for (let combo of combos) {
                    // check this to see if it's a triple/quad
                    let union = new SpecialSet();
                    for (let cell of combo) {
                        union.addTo(cell.possibles);
                    }
                    if (union.size === len) {
                        this.log(`found ${utils.makeQtyStr(len)} {${union.toNumberString()}} in cells ${cellsToStr(combo)}`);
                        // clear all possibles in the union from the other cells on the set
                        let exclusionCells = new SpecialSet(cells);
                        exclusionCells.remove(combo);
                        let newPossiblesCleared = this.clearListOfPossibles(exclusionCells, union, 1);
                        possiblesCleared += newPossiblesCleared;
                        
                        // we have to stop processing this set of cells because they may no longer all be open
                        // and the combinations may no longer be valid
                        // Because we have possiblesCleared that are non-zero, we will get called again to
                        // do the additional work
                        // return "again" causes iterateOpenCellsByStructureAll() to re-call this callback with
                        // a newly calculated set of cells
                        if (newPossiblesCleared) return "again";
                    }
                }
            }
        });
        
        return possiblesCleared;
    }
    
    // If there are only two cells or three cells in a tile that can contain a particular possible value and those cells
    // share a row or column, then that possible can be cleared from the rest of that row or column
    processPointingPairsTriples() {
        this.log("Processing  Pointing Pairs/Triples");
        let possiblesCleared = 0;

        // for each possible value that is present in the tile, build a set of which cells it can be in
        // we then look at which possible values are present in only 2 or 3 cells and then
        // see which of those are only one row number and/or column number
        for (let tileNum = 0; tileNum < boardSize; tileNum++) {
            let cells = this.getOpenCellsTile(tileNum);
            let pMap = this.getPossibleMap(cells);
            // at this point, we know which cells each possible is present in
            // let's find the ones that are in two or three cells and look at them further
            // Use ES6 iteration so we can return out of the whole thing
            for (let [p, set] of pMap) {
                if (set.size === 2 || set.size === 3) {
                    // need to figure out of these cells are in same row or col
                    for (let dir of ["row", "col"]) {
                        let union = new SpecialSet();
                        for (let cell of set) {
                            union.add(cell[dir]);
                        }
                        // if the union of all the row or col numbers has only one value, they must all have the same value
                        if (union.size === 1) {
                            // all the matched cells must all be in the same row/col here
                            // can clear other possibles from this row/col
                            this.log(`found pointing ${utils.makeQtyStr(set.size)} for possible ${p} consisting of ${cellsToStr(set)}`);
                            // now clear things - get the open cells in this row or col
                            let clearCells = new SpecialSet(this.getOpenCellsX(dir, union.getFirst()));
                            // remove any from this tile
                            clearCells.remove(cells);
                            let newPossiblesCleared = this.clearListOfPossibles(clearCells, [p]);
                            possiblesCleared += newPossiblesCleared;
                            // After we clear some possibles here, it seems likely that the pMap is no longer accurate
                            // so we have to return and let it all start over
                            if (newPossiblesCleared) return possiblesCleared;
                        }
                    }
                }
            }
        }
        
        return possiblesCleared;
    }
    
    // This technique is very similar to naked subsets, but instead of affecting other cells with the same row, 
    // column or block, candidates are eliminated from the cells that hold the subset. If there are N cells, 
    // with N candidates between them that don't appear elsewhere in the same row, column or block, then 
    // any other candidates for those cells can be eliminated.
    //
    // What makes this complicated to detect is that all N candidates don't have to appear in each of the N cells
    // as long as they don't appear anywhere else.  And, of course the reason they are called hidden subsets is that
    // there can be other possibles with them.  In fact, it's those other possibles that will get eliminated from
    // the matched hidden pair/triple/quad by this scheme.
    //
    // The basic idea for this algorithm is as follows:
    // For every row/col/tile
    //    Make possible map for each possible value (tells you which cells a given possible is in)
    //    For each possible value in the map where the set of cells is 2, 3 or 4 long:
    //        Test the current set to see if it's already a pair, triple or quad
    //        Create a set of the other cells and use it to then make all the combinations 
    //            of triples or quads you can with the original set of cells and then
    //            test each one to see if it's a legal triple or quad
    processHiddenSubset() {
        this.log("Processing  Hidden Subset");
        let possiblesCleared = 0, pCleared;
        
        // analyze all rows, columns and tiles
        this.iterateOpenCellsByStructureAll((cells, type, typeNum) => {
            // get map of possibles in this list of cells
            if (cells.length < 3) return;
            let pMap = this.getPossibleMap(cells);
            for (let [p, set] of pMap) {
                // if there are more than 4 cells this value is in, it can't be a key value in a pair, triple or quad
                if (set.size < 2 || set.size > 4) return;
                // make a set of open cells not in the original set to be considered for triples or quads
                let otherCellSet = new SpecialSet(cells);
                otherCellSet.remove(set);
                
                // The pMap is invalidated if we actually change any possibles, so we have return out and start over
                // In this particular case, we don't ever actually set any cells, so the cells array is OK
                // but the pMap iteration is potentially off so it has to be started over
                // These returns are from the callback, not from the outer function

                // test directly to see if it is a pair, triple or quad already (based on it's length)
                pCleared = testSubset.call(this, set, otherCellSet);
                possiblesCleared += pCleared;
                if (pCleared) return "again";
                
                // test for manufactured triples
                pCleared = makeSubsets.call(this, set, otherCellSet, 3);
                possiblesCleared += pCleared;
                if (pCleared) return "again";
                
                // test for manufactured quads
                pCleared = makeSubsets.call(this, set, otherCellSet, 4);
                possiblesCleared += pCleared;
                // can't be two quads in the same row/col so we just return here
                if (pCleared) return;
            }
        });
        
        // test for triple and quad
        function makeSubsets(startingSet, otherCellSet, desiredSize) {
            let cnt = 0;
            // calc how much we need to add to the existing set
            var deltaSize = desiredSize - startingSet.size;
            // if nothing to add, then there's nothing new to manufacture so nothing to do here
            // set set by itself has already been tested
            if (deltaSize > 0) {
                // test for a quad by trying all combinations of two other cells with this
                let combos = utils.makeCombinations(Array.from(otherCellSet), deltaSize);
                for (let cellsToTry of combos) {
                    let candidateSet = new SpecialSet(startingSet);
                    candidateSet.addTo(cellsToTry);
                    let otherSet = new SpecialSet(otherCellSet);
                    otherSet.remove(cellsToTry);
                    cnt += testSubset.call(this, candidateSet, otherSet);
                }                    
            }
            return cnt;
        }
        
        function testSubset(candidateSet, otherCellSet) {
            let cnt = 0;
            // the algorithm here is to get the union of all possibles in the otherCellSet
            // eliminate those from each of the candidates
            // make sure you have at least two possibles left in each candidate
            // Then take the union of all possibles in the candidates and see if it matches the candidateSet.size
            // So you have N unique possibles in N cells that do not appear anywhere in the row/col/tile outside of those N cells
            let otherUnion = new SpecialSet();
            let candidateUnion = new SpecialSet();
            
            // get union of other cell possibles
            for (let cell of otherCellSet) {
                otherUnion.addTo(cell.possibles);
            }
            
            // iterate through each cell in the candidateSet to collect the candidateUnion
            // we also want to figure out if this set is naked or not
            // It's naked if there are no extra possibles
            let isHidden = false;
            for (let cell of candidateSet) {
                // set what is in our candidate cell, that is not in the otherUnion
                let diff = cell.possibles.difference(otherUnion);
                if (cell.possibles.intersection(otherUnion).size) {
                    // since we found some overlap with the otherUnion, this is a hidden pair/triple/quad
                    isHidden = true;
                }
                
                if (diff.size < 2) {
                    // have to be at least two common possibles in each cell
                    return cnt;
                }
                // accumulate the durable possibles from our candidate cells
                candidateUnion.addTo(diff);
            }
            // See if we have N possibles contained only in N cells
            if (candidateUnion.size === candidateSet.size) {
                if (isHidden) {
                    this.log(`found hidden subset ${utils.makeQtyStr(candidateSet.size)} with values {${candidateUnion.toNumberString()}} in ${Cell.outputCellList(candidateSet)}`);
                    // clear possibles in the candidateSet that are in the otherUnion
                    for (let cell of candidateSet) {
                        let removing = cell.possibles.intersection(otherUnion);
                        if (removing.size) {
                            this.log(` removing possibles {${removing.toNumberString()}} from ${cell.xy()}`)
                            cnt += cell.possibles.remove(removing);
                        }
                    }
                } else {
                    this.log(`found already processed naked ${utils.makeQtyStr(candidateSet.size)} with values {${candidateUnion.toNumberString()}} in ${Cell.outputCellList(candidateSet)}`);
                }
            }
            return cnt;
        }
        
        return possiblesCleared;
    }
    

    // Demo: http://www.sadmansoftware.com/sudoku/xwing.php
    // When a given value can only be in two particular same spots in each of two particular rows or columns
    // then it must be in one of the other for each and no other cells in the common rows or columns 
    // can be either of the two values
    processXwing() {
        // So you're looking for a value that can only occur in two spots in a row or column
        // And, there's another of the same type of row or column that the same two values can also only
        // occur in those same two spots
        // When that is the case, you can eliminate those two values from all the other possibles
        // Note: we're getting a full structure (not just open cells) so that the index into the cells
        //   array will be a column number so it can be compare to other rows and columns
        
        let possiblesCleared = 0;
        
        // accumulate row and column key strings into the candidates structure
        // so future rows/cols in the iteration can find matches with them
        let candidates = {row: new Map(), column: new Map()};
        this.iterateCellsByStructureAll("skipTile", (cells, type, typeNum) => {
            // cells is array of cells
            // type is "row" or "column"
            // typeNum is the row or column number
            
            // There's a new MapOfSets object for each row
            // The key in the Map is the possible value
            // The value in the map is a set of indexes in this row that the possible value appears
            // pMap[possibleVal] is a set of indexes that the possibleVal appears in this row
            // the pMap data structure is only used temporarily to find pairs in a row or column
            let pMap = new MapOfSets(boardSize, 1);
            
            // for all the cells in the row
            // add each possible to the right set of the pMap
            cells.forEach((cell, index) => {
                if (!cell.value) {
                    cell.possibles.forEach(p => {
                        pMap.get(p).add(index);
                    });
                }
            });
            
            // this.log("pMap", pMap);
            // pMap is the same type of pMap in processHiddenSubset()
            // it tells us which cells each possible is in within a given row or column
            
            
            
            // cycle through the pMap to look for each possible value in this row/col 
            // that appears in only two cells in that row/col
            // when we find it, create a key that describes it and store that in the candidates[type] map
            // The key is the index in the map.  The value in the map is the typeNum (row or column number)
            // So, if we're iterating rows, the typeNum is the row number and the key contains 
            // the possible value and the two columns numbers that contain that possible value
            pMap.forEach((set, digit) => {
                // only pay attention to the possible value that are only contained in two cells in this row/col
                if (set.size === 2) {
                    // Make a combined key out of value + pos1 + pos2 so you can see
                    // if any other row has that same combined key
                    // create custom key
                    let key = digit + ":" + set.toNumberString();    // "1:2,3"
                    if (candidates[type].has(key)) {
                        // We found an x-wing pattern
                        //    The variable digit is the possible value we're matching
                        //    The variable set contains the two indexes
                        //    The variable typeNum contains the current row/col
                        //    The variable candidates[type].get(key) contains the original current row/col
                        // So, we need to clear all digit possibles from the other cells in the two indexes
                        // typeNum is the row number we are iterating with the current pMap
                        // prior pMaps for this row are in candidates[type] which for a row is candidate.row
                        // candidates[type].get(key) is the prior row number we matched
                        // set contains the two column numbers
                        let rows = [candidates[type].get(key), typeNum]
                        let columns = Array.from(set);
                        // if type not row, then swap row/col values
                        if (type !== "row") {
							[rows, columns] = [columns, rows];
                        }
                        this.log(`Found x-wing pattern by ${type}: value=${digit} ` +
                            `${this.getCell(rows[0], columns[0]).xy()}, ${this.getCell(rows[0], columns[1]).xy()}, ` + 
                            `${this.getCell(rows[1], columns[0]).xy()}, ${this.getCell(rows[1], columns[1]).xy()}`);
                            
                        let getFnName;
                        if (type === "row") {
                            getFnName = "getCellsColumn";
                        } else {
                            getFnName = "getCellsRow";
                        }
                        let position1 = candidates[type].get(key);
                        let position2 = typeNum;
                        set.forEach(x => {
                            let cells = this[getFnName](x);
                            cells.forEach((cell, index) => {
                                // if this cell is not our actual x-wing match, then clear the two
                                // target possible values from these
                                if (index !== position1 && index !== position2) {
                                    // debug code, next three lines
                                    if (cell.possibles.has(digit)) {
                                        this.log(`Removing possible ${digit} from ${cell.xy()}`, cell.possibles);
                                    }
                                    if (!cell.value && cell.possibles.delete(digit)) {
                                        ++possiblesCleared;
                                    }
                                }
                            });
                        });
                        // 
                    } else {
                        candidates[type].set(key, typeNum);
                    }
                }
            });
        });
        
        return possiblesCleared;
    }
    
    // Good description of Finned X-Wing: http://www.sudokuwiki.org/Finned_X_Wing
    // A Finned X-Wing consists of an X-Wing + one row that has a few extra values directly connected and in the same tile
    // In the Sashimi Finned Wing, you can have extra corner values on one corner and not have the actual corner itself
    // But all Finned X-Wings have a base two cells in a row/col that fits the 
    //    normal X-Wing rule (no other matching possibles in the row/col)
    // Fins can be in the same tile as an x-wing node.  Can only have one set of fins.
    processXWingFinned() {
        let possiblesCleared = 0;

        function run(dir) {
            
            let dirProp = dir === "row" ? "row" : "col";
            let dirOppositeProp = dir === "row" ? "col" : "row";
            
            // this is indexed by a string that indicates what possible number and cells it could be an x-wing for
            //    of this form: "1:4,8" which means possible value 1 in positions 4 and 8
            // The value in the mapis an array of sets of pairs of cells that are the only pair 
            //   that have this possible in this row/col
            let cleanCandidates = new Map();
            
            // this is indexed by a string that indicates what possible number and tileIndexes it occupies
            //    of this form: "1:0,2" which means possible value 1 in tileIndexes 0 and 2
            let cleanCandidatesTileIndex = new Map();
            
            let finnedCandidates = [];
            
            this.iterateOpenCellsX(dir, (cells, i) => {
                // can't be part of any xWing if it doesn't have at least two open cells
                if (cells.length < 2) return;
                
                // get map of which possibles are in which cells
                let pMap = this.getPossibleMap(cells);
                for (let [p, set] of pMap) {
                    // if there are exactly two in this row/col, then this is a clean candidate for an x-wing
                    // lets remember it in the cleanCandidates
                    if (set.size === 2) {
                        // create the string descriptor for it
                        let pair = Array.from(set);
                        // create cleanIndexStr like this "1:4,8" which uniquely describes the possible and the two positions it is in
                        let cleanIndexStr = `${p}:${pair[0].getPosition(dir)},${pair[1].getPosition(dir)}`;                        
                        let match = cleanCandidates.get(cleanIndexStr);
                        if (match) {
                            let xwingCells = match.union(set);
                            this.log(`!!found normal X-Wing for possible ${p} by ${dir}, cells: ${Cell.outputCellList(xwingCells)}`);
                        } else {
                            cleanCandidates.set(cleanIndexStr, set);
                            let tilepos0 = Cell.calcTilePosition(dir, pair[0].tileNum);
                            let tilepos1 = Cell.calcTilePosition(dir, pair[1].tileNum);
                            if (tilepos0 !== tilepos1) {
                                // example "1:0,8" which means possible value 1 in tileIndex 0 and column 8
                                // A clean candidate can have two possible matches, first tileIndex with second position
                                //     and second tileIndex with first position
                                // Either can be a match so we put them both in the map
                                // finMatch is the cell that matches up with the finCorner on the other side
                                // We can use finMatch to get the row/column that we're supposed to clear possibles from
                                let col0 = pair[0].getPosition(dir);
                                let col1 = pair[1].getPosition(dir);
                                let tileIndexStr = `${p}:${tilepos0},${col1}`;
                                cleanCandidatesTileIndex.set(tileIndexStr, {set, rowcol: i, finMatchColumn: col0, finMatchCell: pair[0]});
                                tileIndexStr = `${p}:${tilepos1},${col0}`;
                                cleanCandidatesTileIndex.set(tileIndexStr, {set, rowcol: i, finMatchColumn: col1, finMatchCell: pair[1]});
                            }
                        }
                    }
                    // You can have a finned x-wing with only two cells in a row when the x-wing corner is missing, but there
                    // is another cell in the row of the corner and in the same tileNum as the corner
                    // A valid finned row is 1-3 cells in one tile and 1 cell in another tile
                    // There can be only one finned candidate per row because there can be no other cells with that possible
                    //    value in the row for it to be a finned candidate (whew, that simplifies it a bit)
                    // Find all valid finned rows
                    if (set.size >= 2 && set.size <= (tileSize + 1)) {
                        // The index of this map is the tileNum
                        // The value is a set of cells in that tile
                        let tileMap = this.getTileMap(set);
                        
                        
                        // must be exactly two entries in this to be legal (can't have cells in all three tiles and
                        //     can't make a finned match in one tile)
                        if (tileMap.size === 2) {
                            let singles = [];
                            let fins = [];
                            // do a pass through the tileMap to load each entry into either the 
                            // singles array or the fins array
                            for (let [tileNum, cellSet] of tileMap) {
                                let tilePos = Cell.calcTilePosition(dir, tileNum);
                                if (cellSet.size === 1) {
                                    let cell = cellSet.getFirst();
                                    singles.push({pos: cell.getPosition(dir), cellSet, tilePos, tileNum, p});
                                } else {
                                    fins.push({cellSet, tilePos, tileNum, p});
                                }
                            }
                            // now build the finnedCandidates array
                            if (singles.length === 2) {
                                // both singles, we make two separate entries, with either single acting as the fin
                                // add fin candidate with singles[0] acting as the fin and singles[1] as the single cell
                                finnedCandidates.push({
                                    indexStr: `${p}:${singles[0].tilePos},${singles[1].pos}`, 
                                    fin: singles[0].cellSet, 
                                    finTileNum: singles[0].tileNum,
                                    cell: singles[1].cellSet.getFirst(), 
                                    p: p, 
                                    dir: dir, 
                                    rowcol: i
                                });
                                // add fin candidate with singles[1] acting as the fin and singles[0] as the single cell
                                finnedCandidates.push({
                                    indexStr: `${p}:${singles[1].tilePos},${singles[0].pos}`, 
                                    fin: singles[1].cellSet, 
                                    fileTileNum: singles[1].tileNum,
                                    cell: singles[0].cellSet.getFirst(), 
                                    p: p, 
                                    dir: dir, 
                                    rowcol: i
                                });
                            } else if (fins.length === 1) {
                                // must be an actual fin and a single
                                finnedCandidates.push({
                                    indexStr:`${p}:${fins[0].tilePos},${singles[0].pos}`, 
                                    fin: fins[0].cellSet, 
                                    finTileNum: fins[0].tileNum,
                                    cell: singles[0].cellSet.getFirst(), 
                                    p: p, 
                                    dir: dir, 
                                    rowcol: i
                                });
                            }
                        }
                    }
                    
                }
                
            });
            // at this point, we have all the cleanCandidates and finnedCandidates for all the rows or columns (whichever it is we are iterating)
            // we can compare a cleanCandidate with a finnedCandidate to find a finned x-wing match
            if (finnedCandidates.length && cleanCandidatesTileIndex.size) {
                // for each finned candidate, see if there's a matching cleanCandidate
                for (let finItem of finnedCandidates) {
                    if (cleanCandidatesTileIndex.has(finItem.indexStr)) {
                        // FIXME: http://hodoku.sourceforge.net/en/tech_sdp.php says the the elimination strategy is to eliminate
                        // any possibles that can see both the fin cell and the corresponding clean single which eliminates
                        // some additional possibles in the tile of the corresponding clean single (the ones in the same column as the fin)
                        // This page does not talk about a multi-value fin
                        // It says to eliminate the candidate possible in intersection of the buddies of the fin cell and the corresponding
                        // clean single cell.  So, we'd just get both sets of buddies and intersect them both and eliminate in that group of cells.
                        let clean = cleanCandidatesTileIndex.get(finItem.indexStr);
                        if (clean.rowcol !== finItem.rowcol) {
                            // Reminder: example "1:0,8" which means possible value 1 in tileIndex 0 and column 8
                            // So, we matched two of these strings.  This will match for either a regular x-wing or
                            // a finned x-wing.  It's a finned match if either the fin has more than one cell in it or
                            // if the fin does not contain the corner
                            
                            // clean.finMatchColumn is the column that the single, pretending to be a fin is in.  That is our
                            // clearing column and is what we compare to the fin to see if the fin covers that or not
                            let isFinnedMatch = false;
                            if (finItem.fin.size > 1) {
                                isFinnedMatch = true;
                            } else {
                                // now see if the single cell fin is not in corner so it's still a finned match
                                let finnedCol = finItem.fin.getFirst().getPosition(dir);
                                if (finnedCol !== clean.finMatchColumn) {
                                    isFinnedMatch = true;
                                }
                            }
                            if (isFinnedMatch) {
                                this.log(`found finned X-Wing: ${dir}, possible ${finItem.p}, finCells: ${Cell.outputCellList(finItem.fin)}, single: ${finItem.cell.xy()}, other pair: ${Cell.outputCellList(clean.set)}`)
                                // the possibles we can clear are the ones that are in the fin corner column and buddies with the fin
                                // since the fin must be in the same tile as the corner, this means that we're to clear possibles from
                                // the fine tile that have the same column or row as the corner
                                // clean.finMatchColumn is the column we want to be clearing from
                                // we can get the tileNum from any cell in the fin
                                
                                if (finItem.fin.size > 1) {
                                    // clear possible finItem.p that are in finItem.finTileNum and in clean.finMatchColumn
                                    // but are not in the cells in finItem.fin or clean.set
                                    let cells = new SpecialSet(this.getOpenCellsTile(finItem.finTileNum).filter(c => {
                                        return c[dirOppositeProp] === clean.finMatchColumn;
                                    }));
                                    cells.remove(finItem.fin);
                                    cells.remove(clean.set);
                                    possiblesCleared += this.clearListOfPossibles(cells, [finItem.p], 1)
                                } else {
                                    // http://hodoku.sourceforge.net/en/tech_sdp.php shows how a single fin cell can clear more
                                    // than the above case.  
                                    // FIXME: This single fin cell can exist with or without the fin corner,
                                    //    but it does not appear the extra elimination works if there are multiple cells in the fin
                                    //    not counting the corner cell
                                    // For a single fin cell, intersect its buddies with the buddies of the 
                                    // corresponding clean cell and clear all of this possible from the overlapping buddies
                                    let finCell = finItem.fin.getFirst();
                                    let cleanCell = clean.finMatchCell;
                                    let finBuddies = this.getOpenCellsBuddies(finCell, true);
                                    let cleanBuddies = this.getOpenCellsBuddies(cleanCell, true);
                                    let cellsToClear = finBuddies.intersection(cleanBuddies);
                                    cellsToClear.delete(finCell);
                                    cellsToClear.delete(cleanCell);
                                    possiblesCleared += this.clearListOfPossibles(cellsToClear, [finItem.p], 1);
                                }
                                
                            }
                        }
                    }
                }
            }
        }
        
        // analyze both rows and columns
        run.call(this, "row");
        run.call(this, "column");
        return possiblesCleared;
    }

    processSwordfish() {
        let possiblesCleared = 0;
        
        let candidates = {row: [], column: []};
        this.iterateCellsByStructureAll("skipTile", (cells, type, typeNum) => {
            // Create an array of sets for each row
            // Each entry in the array corresponds to a possible value - 1 (0 position in the array is for cell value 1)
            // Each entry in the array is a set of cells that contain that possible value for the row
           let pMap = new MapOfSets(boardSize, 1);
            // iterate these cells, position is the position in the row/col
            // typeNum is the row or column number
            cells.forEach((cell, position) => {
                if (!cell.value) {
                    cell.possibles.forEach(p => {
                        pMap.get(p).add(position);
                    });
                }
            });
            // Now remove any sets from the map that don't have the right size
            // The swordfish pattern only wants 2 or 3 cells per row
            pMap.forEach((set, val) => {
                if (set.size < 2 || set.size > 3) {
                    // remove wrong size items from the map
                    pMap.delete(val);
                }
            });            // typeNum is row/col number, so this is assigning a pMap object for that row/col into the array
            candidates[type][typeNum] = pMap;
        });
        
        // We're looking for 3 rows that have the same possible value in exactly 2-3 positions
        // And there are exactly 2 other rows that also have only the same 2-3 positions
        // If found, those 3 rows and those 3 columns form a swordfish formation and we can eliminate
        // the possible value from the 3 target columns in all the other rows
        //
        // The map of sets for each row looks like this:
        // pMap Map {
        //  3 => Set { 3, 4 },            // A possible 3 is in cells 3 and 4
        //  7 => Set { 3, 4 },            // A possible 7 is in cells 3,4
        //  8 => Set { 0, 1, 3 },         // A possible 8 is in cells 0,1,3
/*
        // debugging output
        ["row", "column"].forEach(tag => {
            let arr = candidates[tag];
            this.log(`Output ${tag}:`);
            this.log(arr);
        });  
*/
        
        ["row", "column"].forEach(tag => {
            let arr = candidates[tag];
            
            // build an array of maps for each separate value so we have
            // all the candidate rows for a given cellValue and we can then
            // just look at all combinations of 3 of them at a time
            
            for (let cellValue = 1; cellValue <= boardSize; cellValue++) {
                // array of objects of this form: {rowNum: n, cells: map}
                let candidateRows = [];
                arr.forEach((map, rowNum) => {
                    let testSet = map.get(cellValue);
                    if (testSet) {
                        candidateRows.push({rowNum: rowNum, cells: testSet});
                    }
                });
                if (candidateRows.length >= 3) {
                    // try all combinations of 3 rows to see if any qualify
                    let combinations = utils.makeCombinations(candidateRows, 3);
                    combinations.forEach(arr => {
                        let candidateCells = arr[0].cells.union(arr[1].cells, arr[2].cells);
                        if (candidateCells.size === 3) {
                            let rows = arr.map(item => item.rowNum);
                            this.log(`found swordfish for value ${cellValue}, ${tag === "row" ? "columns" : "rows"} ${candidateCells.toBracketString()} and ${tag}s [${rows.join(",")}]`);
                            
                            // get opposite direction for clearing
                            let direction = (tag === "row" ? "column" : "row");
                            candidateCells.forEach(num => {
                                possiblesCleared += this.clearPossibles(direction, num, cellValue, new Set(rows));                                
                            });
                        }
                    })
                }
            }
        });
            
        return possiblesCleared;
    }
    
    processXYWing() {
        // for each cell that has only two possibles
        //     find any buddies that also has two possibles where one of the possibles overlaps
        //     with the original cell
        //     Then, look for a second buddy that has only two possibles, but overlaps with the other
        //     possible from the original
        
        let possiblesCleared = 0;
        
        // try every open cell
        this.iterateOpenCells((cell, row, col) => {
            if (cell.possibles.size === 2) {
                let buddies = this.getOpenCellsBuddies(row, col);
                // filter out cells that don't have proper overlap
                let candidates = buddies.filter(candidate => {
                    // only allow cells with two possibles that have one in common with the original
                    if (candidate.possibles.size !== 2) return false;
                    return cell.possibles.intersection(candidate.possibles).size === 1;
                });
                // here candidates contains an array of cells with the proper overlap
                // we need to find two that match the opposite.  
                // The simplest way to do that is to try all combinations of two
                let combinations = utils.makeCombinations(candidates, 2);
                combinations.forEach(arr => {
                    // At this point, arr contains two cells that each have one and only one possible
                    // in common with the pivot cell.  We already know that.
                    // Also need to show:
                    //    Each test cell overlaps with a different possible in the pivot
                    //    Each test cell has one possible in common with the other test cell
                    // 
                    // To be an XYWing pattern, 
                    // find the possible intersection for each with the original cell
                    let intersect1 = cell.possibles.intersection(arr[0].possibles);
                    let intersect2 = cell.possibles.intersection(arr[1].possibles);
                    // if the union of those intersection is 2, then each matches a different possible
                    // from the original cell and we have the pattern
                    if (intersect1.union(intersect2).size === 2) {
                        // now see if the test cells have a single overlap with each other
                        let leafIntersect = arr[0].possibles.intersection(arr[1].possibles);
                        if (leafIntersect.size === 1) {
                            // what we have here may be an XYWing or it may be a hidden triplet (which is also an XYWing)
                            //    (if all three cells are in the same row/col/tile)
                            // Note because this requires all three cells to each only have two
                            //    possibles, this is not the generic case for hidden triplets
                            let matches = arr.concat(cell);
                            if (matches[0].row === matches[1].row && matches[0].row === matches[2].row) {
                                // all in same row
                                this.log(`found triplet in same row: ${matches[0].xy()}, ${matches[1].xy()}, ${matches[2].xy()}`)
                            } else if (matches[0].col === matches[1].col && matches[0].col === matches[2].col) {
                                // all in same col
                                this.log(`found triplet in same col: ${matches[0].xy()}, ${matches[1].xy()}, ${matches[2].xy()}`)
                            } else if (matches[0].tileNum === matches[1].tileNum && matches[0].tileNum === matches[2].tileNum) {
                                // all in same tileNum
                                this.log(`found triplet in same tile: ${matches[0].xy()}, ${matches[1].xy()}, ${matches[2].xy()}`)
                            } 
                            // must actually be XYWing pattern
                            this.log(`found XYWing with pivot ${cell.xy()} ${cell.pList()} and cells ${arr[0].xy()} ${arr[0].pList()}, ${arr[1].xy()} ${arr[1].pList()}`);

                            // For the leaf pair (not including the pivot cell)
                            //     Find common buddies
                            //     Find the common possible value
                            //     Eliminate that possible from the common buddies
                            let c1 = arr[0];
                            let c2 = arr[1];
                            let buds1 = this.getOpenCellsBuddies(c1, true);
                            let buds2 = this.getOpenCellsBuddies(c2, true);
                            // get intersection of two buddies and remove the third cell (probably not required, but seems safe)
                            let cellsToClear = buds1.intersection(buds2);
                            possiblesCleared += this.clearListOfPossibles(cellsToClear, leafIntersect)
                            this.checkBoard();
                        }
                    }
                });
            }
        });
        return possiblesCleared;
        
    }
    
    processXCyles() {
        let possiblesCleared = 0;
        // find isolated pairs, try each value and see what common possibles are eliminated in both cases
        this.log("Trying XCyles");
        let candidateCells = new Map();
        let pairCells = new SpecialSet();
        this.iterateOpenCellsByStructureAll(cells => {
            for (let cell of cells) {
                // if only two values, then try each one
                if (cell.possibles.size === 2) {
                    pairCells.add(cell);
                }
            }
            
            // find out which possible values only exist in two cells in this unit
            let pMap = this.getPossibleMap(cells);
            for (let [p, set] of pMap) {
                if (set.size === 2) {
                    // create a unique string key
                    // 29:3    where 29 is the index of the cell and 3 is the possible value to try
                    // so we don't repeat any items in the candidateCells map
                    for (let cell of set) {
                        if (!pairCells.has(cell)) {
                            let key = `${cell.index}:${p}`;
                            candidateCells.set(key, {cell, p});
                        }
                    }
                }
            }
        });
        for (let [key, cellData] of candidateCells) {
            this.log(` XCycle: possible ${cellData.p} in ${cellData.cell.xy()} is a candidate for XCycle analysis`);
        }
        
        // iterate all pairCells
        for (let cell of pairCells) {
            // check the value here for safety in case it was modified during this iteration
            if (!cell.value && cell.possibles.size === 2) {
                let row = cell.row;
                let col = cell.col;
                
                let bAlt1 = this.clone();
                bAlt1.loggingEnabled = false;
                let bAlt2 = this.clone();
                bAlt2.loggingEnabled = false;
                
                let pArray = cell.possibles.toArray();
                let p1 = pArray[0];
                let p2 = pArray[1];
                let p1OK = true;
                let p2OK = true;
                // now set this cell to the p1 value in the bAlt1 board
                try {
                    this.log(` Trying value ${p1} in ${cell.xy()} ${cell.possibles.toBracketString()}`)
                    bAlt1.setValue(bAlt1.getCell(row, col), p1, 1);
                    bAlt1.checkBoard();
                } catch(e) {
                    p1OK = false;
                }
                
                if (p1OK) {
                    try {
                        this.log(` Trying value ${p2} in ${cell.xy()} ${cell.possibles.toBracketString()}`)
                        bAlt2.setValue(bAlt2.getCell(row, col), p2, 1);
                        bAlt2.checkBoard();
                    } catch(e) {
                        p2OK = false;
                    }
                    if (p2OK) {
                        // both p1 and p2 passed checkBoard()
                        this.log(" Both p1 and p2 passed checkBoard");
                        // need to see what possibles were cleared in both scenarios
                        this.iterateOpenCells((cell, row, col) => {
                            let posOrig = cell.possibles;
                            let bAltCell1 = bAlt1.getCell(row, col);
                            let bAltCell2 = bAlt2.getCell(row, col);
                            let pos1 = bAltCell1.possibles.clone();
                            let pos2 = bAltCell2.possibles.clone();
                            if (bAltCell1.value) {
                                pos1.add(bAltCell1.value);
                            }
                            if (bAltCell2.value) {
                                pos2.add(bAltCell2.value);
                            }
                            // calc the possibles that were removed from each alternate
                            let diff1 = posOrig.difference(pos1);
                            let diff2 = posOrig.difference(pos2);
                            // get the possibles that were removed from both alternates
                            let both = diff1.intersection(diff2);
                            if (both.size !== 0) {
                                this.log(`  On cell ${cell.xy()}, both scenarios removed possibles ${both.toBracketString()}`);
                            } else {
                                
                            }
                        });
                    } else {
                        // only p1 passed checkBoard()
                        this.log(" Only p1 passed checkBoard");
                        // apply setValue(p1) to main board
                        this.log(` XCycle setValue: ${cell.xy()}, value ${p1}`);
                        possiblesCleared += this.setValue(cell, p1, 1);
                    }
                } else {
                    this.log(" p1 did not pass checkBoard");                        
                    // assume p2 would have passed
                    this.log(` XCycle setValue: ${cell.xy()}, value ${p2}`);
                    possiblesCleared += this.setValue(cell, p2, 1);
                }
            }
        }
        
        // now try single possibles in the candidate cells
        for (let cellData of candidateCells.values()) {
            let {cell, p} = cellData;
            if (!cell.value && cell.possibles.has(p)) {
                // try one possible as the value in each candidateCell
                // three possible outcomes here
                // 1) checkBoard() fails in which case we can remove this possible
                // 2) checkBoard() returns 0 meaning it solved the puzzle
                // 3) checkBoard() does not fail and does not return 0 which means we don't know anything more about this value
                let tryOK = true;
                try {
                    this.log(` Trying value ${p} in ${cell.xy()} ${cell.possibles.toBracketString()}`);
                    let bAlt = this.clone();
                    bAlt.loggingEnabled = false;
                    bAlt.setValue(bAlt.getCell(cell.row, cell.col), p);
                    // if this solved the puzzle, then set this value and be done
                    if (bAlt.checkBoard() === 0) {
                        possiblesCleared += this.setValue(cell, p, 1);
                        break;
                    } else {
                        // try solving this board
                        this.log(`  Solve attempt`);
                        // avoid recursion here by skipping processXCycles in the call to .solve()
                        let numOpenCells = bAlt.solve({skipMethods: ["processXCyles"], skipCalcPossibles: true});
                        if (numOpenCells === 0) {
                            this.log(` Board solved with this xcycle guess`);
                            possiblesCleared += this.setValue(cell, p, 1);
                            break;
                        } else {
                            this.log(`  Board OK after trying value, but not solved (${numOpenCells} open cells), nothing to conclude`);
                        }
                    }
                } catch(e) {
                    // expected possible board error
                    if (e instanceof BoardError) {
                        tryOK = false;
                    } else {
                        // programming or unexpected error, don't eat this error
                        throw e;
                    }
                }
                if (!tryOK) {
                    // this value caused an invalid board, therefore it can't be an 
                    // acceptable possible value and can be removed
                    this.log(`  Board failed after trying value, clearing possible ${p} in ${cell.xy()} ${cell.possibles.toBracketString()}`);
                    this.clearListOfPossibles([cell], [p], 1);
                }
            }
        }
        return possiblesCleared;
    }
    
    // type is "row", "column" or "tile"
    // num is the row number, column number or tile number
    // val is the possible value to clear
    // exceptions is a set of indexes or cells not to touch
    clearPossibles(type, num, val, exceptions) {
        let cnt = 0;
        
        // build iteration function name
        let iterateFn = "iterate" + utils.leadingCap(type) + "OpenCells";
        this[iterateFn](num, (cell, index) => {
            // if neither cell or index is in the exceptions list, then we can clear the possible
            if (!exceptions || (!exceptions.has(cell) && !exceptions.has(index))) {
                if (cell.possibles.delete(val)) {
                    this.log(`clearPossibles: cell:${cell.xy()}, val:${val}`);
                    if (cell.possibles.size === 0) {
                        this.log('error: clearPossibles left no possibles'); 
                    }
                    ++cnt;
                }
            }
        });
        return cnt;
    }
    
    
    
    countOpen() {
        let cnt = 0;
        this.iterateOpenCells((cell, row, col) => {
            //this.log("Open (" + row + ", " + col + ")", cell.possibles);
            ++cnt;
        });
        return cnt;
    }
    
    outputBoard() {
        let all = [];
        for (let i = 0; i < boardSize; i++) {
            let row = [];
            this.iterateRow(i, (cell, index) => {
                row.push(cell.value);
            });
            all.push(row.join(""));
        }
        return all.join("");
    }
    
    outputPossibles(always) {
        // make an array of arrays for possibles (one array for each cell)
        // each array for each cell is blank filled and then possibles replace blanks where present
        let foundPossibles = false;
        let possibles = this.data.map(cell => {
            let cellData = new Array(boardSize);
            if (cell.value) {
                cellData.fill("" + cell.value);
            } else {
                cellData.fill(" ");
                cell.possibles.forEach(p => {
                    foundPossibles = true;
                    cellData[p - 1] = "" + p;
                });
            }
            return cellData;
        });
        
        if (!foundPossibles && !always) {
            return;
        }
        
        // create empty output grid
        let numRows = boardSize * (tileSize + 1);
        let numCols = numRows;
        let outputGrid = [];
        for (let i = 0; i < numRows; i++) {
            outputGrid[i] = new Array(numCols);
            outputGrid[i].fill(" ");
        }
        
        possibles.forEach((cellData, index) => {
            // calc where data for a given cell index starts
            let baseRow = Math.floor(index / boardSize) * (tileSize + 1);
            let baseCol = (index % boardSize) * (tileSize + 1);
            //this.log(index, baseRow, baseCol);
            cellData.forEach((p, i) => {
                let row = Math.floor(i / tileSize);
                let col = Math.floor(i % tileSize);
                outputGrid[baseRow + row][baseCol + col] = p;
            });
        });
        outputGrid.forEach((row, index) => {
            if ((index + 1) % (tileSize + 1) === 0) {
                row.fill("-");
            }
            row.forEach((val, index) => {
                if ((index + 1) % (tileSize + 1) === 0) {
                    row[index] = "|";
                }
            });
        });
        // Add top border
        outputGrid.unshift(outputGrid[3].slice());
        
        // Add numbers along the top
        let topNumbers = [" "];
        for (let i = 0; i < boardSize; i++) {
            topNumbers.push(i + "   ");
        }
        outputGrid.unshift(topNumbers);
        
        // Add numbers and border along the left
        let cntr = 0;
        for (let i = 0; i < outputGrid.length; i++) {
            // output left border
            if (i === 0) {
                outputGrid[i].unshift(" ");
            } else {
                outputGrid[i].unshift("|");
            }
            
            // output row label
            if ((i - 3) % 4 === 0) {
                outputGrid[i].unshift(cntr);
                ++cntr;
            } else {
                outputGrid[i].unshift(" ");
            }
            outputGrid[i].unshift(" ");
        }
        
        // output the 2D array to console
        outputGrid.forEach(row => {
            this.log(row.join(""));
        });
    }
    
    // Solve the puzzle, returns number of openCells
    // options 
    //   skipCalcPossibles: true               for cloned boards that already have possibles calculated
    //   skipMethods: [meth1, meth2]           array of method names to skip
    solve(options = {}) {
        // keep setting possibles while we still find more values to set
        // this could be made faster by only revisiting impacted cells

        let skipMethods;
        if (typeof options.skipMethods === "string") {
            skipMethods = new SpecialSet([options.skipMethods]);
        } else {
            skipMethods = new SpecialSet(options.skipMethods);
        }
        this.log("Initial Board import/export:");
        this.log(this.outputBoard());
        this.outputPossibles(true);
        if (!options.skipCalcPossibles) {
            while(this.setAllPossibles()) {}
        }


        let processMethods = [
            "processNakedPairs",
            "processNakedTriplesQuads",
            "processPointingPairsTriples",
            "processHiddenSubset",
            "processXwing",
            "processSwordfish",
            "processXYWing",
            "processXWingFinned",
            "processXCyles"
        ];

        let openCells;
        try {
            let more = 0;
            do {
                this.log(`Still ${this.countOpen()} open cells`);
                this.outputPossibles();
                this.processSingles();
                this.outputPossibles();
                let method;
                for (let pIndex = 0; pIndex < processMethods.length; ++pIndex) {
                    // Call all process methods until one returns that it changed something
                    // then start back at the beginning to reproces the simpler look at possibles
                    // If we get through all of them with nothing changing, then we're done
                    this.processSingles();
                    this.outputPossibles();
                    method = processMethods[pIndex];
                    if (!skipMethods.has(method)) {
                        more = this[method]();
                        if (this.checkBoard({skipSinglePossible: true}) === 0) {
                            // we are done, make sure more is 0 and break
                            more = 0;
                            break;
                        }
                        if (more) break;
                    }
                }
            } while (more);
            openCells = this.checkBoard();
        } catch(e) {
            this.outputPossibles();
            this.log(`Final Board: ${name} ${this.outputBoard()}` );
            throw e;
        }
        this.outputPossibles();
        this.log(`Final Board: ${name} ${this.outputBoard()}` );
        if (openCells) {
            this.log(`Still ${this.countOpen()} open cells`);
        }
        return openCells;
    }

}


// Idea for a new scheme based on the x-cycles concept is that you find a cell with two possibles and you try each value in it
// and then remove any possibles that are removed from both tries.  Identify a strong link (a possible value that only has 
// one other possible value in the same row/col/tile


function runBoard(boardStr, name) {
    name = name || "";
    if (name) {
        console.log(`Running board ${name}`);
    }
    let b = new Board(boardStr);
    return b.solve();
}

let arg = process.argv[2];
let boardStr, name = "";
if (arg) {
    // argument can either be a sudoku board string or the name of a board already in our patterns file
    if (arg.match(/^\d/)) {
        boardStr = arg;
    } else {
        name = arg;
        boardStr = patterns[name];
    }
}

let openResults = [];
if (boardStr) {
    runBoard(boardStr, name);
} else {
    let boardNames = Object.keys(patterns);
    for (name of boardNames) {
        console.log("-----------------------------------------------------------------------------------------------------------------");
            let numOpenCells = runBoard(patterns[name], name);
            if (numOpenCells) {
                openResults.push({name, numOpenCells});
            }
    }
}
console.log("-----------------------------------------------------------");
let unexpected = [];
for (let item of openResults) {
    let expectedOpenCells = unsolved[item.name];
    if (typeof expectedOpenCells === "undefined") {
        unexpected.push(`Puzzle ${item.name} was unsolved, expecting it to be solved.`);
    } else if (item.numOpenCells !== expectedOpenCells) {
        unexpected.push(`Puzzle ${item.name} was unsolved, had ${item.numOpenCells} open cells, expected ${expectedOpenCells} open cells.`);
    } else {
        console.log(`Puzzle ${item.name} was unsolved as expected with ${item.numOpenCells} open cells`);
    }
}

console.log("-----------------------------------------------------------");
console.log(unexpected.join("/d"));
