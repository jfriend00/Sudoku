const utils = require('./utils.js');
const cellsToStr = utils.cellsToStr;
const sudokuPatternInfo = require('./sudoku-patterns.js');
const patterns = sudokuPatternInfo.patterns;
const unsolved = sudokuPatternInfo.unsolved;
const {SpecialSet, SpecialMap, MapOfArrays, MapOfSets, MapOfMaps, ArrayOfSets} = require('./specialset.js');    
const {LinkData, AllLinkData, PairLinkData} = require('./links.js');


// Another source of hard puzzles and knowledge: http://sudoku.ironmonger.com/home/home.tpl?board=094002160126300500000169040481006005062010480900400010240690050019005030058700920
// A long list of solving rules: http://aunegl.com/sudoku-faq.htm

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
//   Block and column / Row Interaction (pointing pairs/trips)
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



    



// fill array with all possible values
const allValues = [];
for (let i = 0; i < boardSize; i++) {
    allValues[i] = i + 1;
}
const allValuesSet = new SpecialSet(allValues);

// some utils


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
        if (!this.value && this.possibles.has(val)) {
            let level = nestLevel || 0;
            let leading = Array(level).fill(" ").join("");
            this.board.log(leading + `removing possible ${val} from ${this.xy()} ${this.pList()}`);
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
    
    hasAny(...possibles) {
        for (let p of possibles) {
            if (this.possibles.has(p)) {
                return true;
            }
        }
        return false;
    }
    
    isBuddy(cell) {
        return this.tileNum === cell.tileNum || this.row === cell.row || this.col === cell.col;
    }
    

}

class BoardError extends Error {
    constructor(msg) {
        super(msg);
    }
}

class DeferredQueue {
    constructor(board) {
        if (!(board instanceof Board)) {
            throw new Error("Must pass board to DeferredQueue() constructor");
        }
        this.board = board;
        this.queue = [];
    }

    // meant as an internal method
    _add(cell, p, msg, level) {
        if (cell.possibles.has(p)) {
            this.board.logLevel(level, `queuing to remove possible ${p} from ${cell.xy()} ${cell.possibles.toBracketString()}`);
            this.queue.push({cell, p, msg, level});
            return 1;
        }
        return 0;
    }
    
    clear() {
        this.queue = [];
    }
    
    // cellsIn is an array or set of cells
    // exclusions is an optional array or set of cells
    // possibleClearList is an array or set of possibles
    // msg is a message to be sent to this.saveSolution() if any possibles
    //    are going to be removed
    // level is an optional level of indentation for log messages (defaults to 0)
    // exclusions may be null
    // msg and level do not need to be passed if not needed
    // Returns: cnt of possibles it thinks will be removed (in the future)
    clearPossibles(cellsIn, possibleClearList, msg, level, exclusions) {
        let pCnt = 0;
        let cells = cellsIn;
        if (exclusions) {
            if (!(cellsIn instanceof SpecialSet)) {
                cells = new SpecialSet(cellsIn);
            }
            cells = cells.difference(exclusions);
        }
        for (let cell of cells) {
            for (let p of possibleClearList) {
                pCnt += this._add(cell, p, msg, level);
            }
        }
        return pCnt;
    }
    
    // play back the queue now and actually remove the possibles
    run() {
        let changeCnt = 0;
        let lastMsg, lastDisplayedMsg;
        for (let {cell, p, msg, level} of this.queue) {
            if (msg && msg !== lastDisplayedMsg) {
                this.board.logLevel(level, `processing: ${msg}`);
                lastDisplayedMsg = msg;
            }
            changeCnt = this.board.clearListOfPossibles([cell], [p], level + 1);
            if (changeCnt && msg && msg !== lastMsg) {
                this.board.saveSolution(msg);
                lastMsg = msg;
            }
        }
        return changeCnt;
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
    
    logLevel(level, msg) {
        let leading = Array(level).fill(" ").join("");
        this.log(leading + msg);
    }
    
    saveSolution(str) {
        this.solutions.push(str.trim());
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
    
    // store saveSolution message if any possibles are cleared
    clearListOfPossiblesMsg(cells, possibleClearList, msg, nestLevel) {
        let cnt = this.clearListOfPossibles(cells, possibleClearList, nestLevel);
        if (cnt) {
            this.saveSolution(msg);
        }
        return cnt;
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
        // this is brute force - create all triple and quad combinations and check them
        let queue = new DeferredQueue(this);
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
                        let msg = `found ${utils.makeQtyStr(len)} {${union.toNumberString()}} in cells ${cellsToStr(combo)}`;
                        this.log(msg);
                        queue.clearPossibles(cells, union, msg, 1, combo);
                    }
                }
            }
        });
        // now actually run the deferred removals
        return queue.run();
    }
    
    // look through all rows and columns
    // If we find any row/col that has 2 or 3 open cells for a given possible and those open cells are
    // all in the same tile, then we know that value must be in that row/col in that tile.  We can clear
    // that possible from all other cells in the tile
    processBlockRowCol() {
        this.log("Processing  Block Row/Col Interaction");
        let queue = new DeferredQueue(this);
        
        this.iterateCellsByStructureAll("skipTile", (cells, dir, dirNum) => {
            let pMap = this.getPossibleMap(cells);
            for (let [p, set] of pMap) {
                if (set.size === 2 || set.size === 3) {
                    // see if the whole set of cells is in the same tile
                    let tileNumUnion = SpecialSet.unionFromProp("tileNum", set);
                    // if we have only one tile, then we found our condition
                    if (tileNumUnion.size === 1) {
                        let msg = `found interaction between tile and ${dir} ${dirNum} for possible ${p} in cells: ${cellsToStr(set)}, clearing possible ${p} from rest of tile`
                        this.log(msg);
                        // we can eliminate this possible from anywhere else in the tile
                        let tileCells = new SpecialSet(this.getOpenCellsTile(tileNumUnion.getFirst()));
                        queue.clearPossibles(tileCells, [p], msg, 1, cells);
                    }
                }
            }                
        });
        // run the deferred removals
        return queue.run();
    }
    
    // If there are only two cells or three cells in a tile that can contain a particular possible value and those cells
    // share a row or column, then that possible can be cleared from the rest of that row or column
    processPointingPairsTriples() {
        this.log("Processing  Pointing Pairs/Triples");
        let queue = new DeferredQueue(this);

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
                        // get union of all row or col numbers
                        let union = SpecialSet.unionFromProp(dir, set);
                        // if the union of all the row or col numbers has only one value, they must all have the same value
                        if (union.size === 1) {
                            // all the matched cells must all be in the same row/col here
                            // can clear other possibles from this row/col
                            let msg = `found pointing ${utils.makeQtyStr(set.size)} for possible ${p} consisting of ${cellsToStr(set)}`;
                            this.log(msg);
                            // now clear things - get the open cells in this row or col
                            let clearCells = this.getOpenCellsX(dir, union.getFirst());
                            queue.clearPossibles(clearCells, [p], msg, 1, cells);
                        }
                    }
                }
            }
        }
        
        return queue.run();
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
        let queue = new DeferredQueue(this);
        
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
                testSubset.call(this, set, otherCellSet);
                
                // test for manufactured triples
                makeSubsets.call(this, set, otherCellSet, 3);
                
                // test for manufactured quads
                makeSubsets.call(this, set, otherCellSet, 4);
            }
        });
        
        // test for triple and quad
        function makeSubsets(startingSet, otherCellSet, desiredSize) {
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
                    testSubset.call(this, candidateSet, otherSet);
                }                    
            }
        }
        
        function testSubset(candidateSet, otherCellSet) {
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
                    return;
                }
                // accumulate the durable possibles from our candidate cells
                candidateUnion.addTo(diff);
            }
            // See if we have N possibles contained only in N cells
            if (candidateUnion.size === candidateSet.size) {
                if (isHidden) {
                    let msg = `found hidden subset ${utils.makeQtyStr(candidateSet.size)} with values {${candidateUnion.toNumberString()}} in ${Cell.outputCellList(candidateSet)}`;
                    this.log(msg);
                    // clear possibles in the candidateSet that are in the otherUnion
                    for (let cell of candidateSet) {
                        let removing = cell.possibles.intersection(otherUnion);
                        if (removing.size) {
                            queue.clearPossibles([cell], removing, msg, 1);
                        }
                    }
                } else {
                    // this.log(`found already processed naked ${utils.makeQtyStr(candidateSet.size)} with values {${candidateUnion.toNumberString()}} in ${Cell.outputCellList(candidateSet)}`);
                }
            }
        }
        
        return queue.run();
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
                        let output = `found x-wing pattern by ${type}: value=${digit} ` +
                            `${this.getCell(rows[0], columns[0]).xy()}, ${this.getCell(rows[0], columns[1]).xy()}, ` + 
                            `${this.getCell(rows[1], columns[0]).xy()}, ${this.getCell(rows[1], columns[1]).xy()}`;
                        this.log(output);
                            
                        let getFnName;
                        if (type === "row") {
                            getFnName = "getCellsColumn";
                        } else {
                            getFnName = "getCellsRow";
                        }
                        let position1 = candidates[type].get(key);
                        let position2 = typeNum;
                        let origPossiblesCleared = possiblesCleared;
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
                        if (possiblesCleared !== origPossiblesCleared) {
                            this.saveSolution(output);
                        }
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
                                let output = `found finned X-Wing: ${dir}, possible ${finItem.p}, finCells: ${Cell.outputCellList(finItem.fin)}, single: ${finItem.cell.xy()}, other pair: ${Cell.outputCellList(clean.set)}`;
                                this.log(output)
                                // the possibles we can clear are the ones that are in the fin corner column and buddies with the fin
                                // since the fin must be in the same tile as the corner, this means that we're to clear possibles from
                                // the fine tile that have the same column or row as the corner
                                // clean.finMatchColumn is the column we want to be clearing from
                                // we can get the tileNum from any cell in the fin
                                
                                let origPossiblesCleared = possiblesCleared;
                                
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
                                
                                if (possiblesCleared !== origPossiblesCleared) {
                                    this.saveSolution(output);
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

    // swordfish (3 rows covering 3 columns) and jellyfish (4 rows covering 4 columns)
    // NOTE: An xwing pattern is really just a fish with 2 columns/2 rows so we could use this code for x-wings too
    processFish() {
        let possiblesCleared = 0;
        
        function run(width, name) {
            let pCnt = 0;
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
                    if (set.size < 2 || set.size > width) {
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
            //  3 => Set { 3, 4 },            // A possible 3 is in positions 3 and 4
            //  7 => Set { 3, 4 },            // A possible 7 is in positions 3,4
            //  8 => Set { 0, 1, 3 },         // A possible 8 is in positions 0,1,3
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
                // all the candidate rows for a given possible and we can then
                // just look at all combinations of 3 of them at a time
                
                for (let possible = 1; possible <= boardSize; possible++) {
                    // create array of objects of this form: {rowNum: n, positions: map}
                    let candidateRows = [];
                    arr.forEach((map, rowNum) => {
                        let testSet = map.get(possible);
                        if (testSet) {
                            // candidateRows is the list of rows that have the right number of possibles 
                            // for the possible we're testing in this iteration of the loop
                            candidateRows.push({rowNum: rowNum, positions: testSet});
                        }
                    });
                    // if we found enough rows for this possible number
                    if (candidateRows.length >= width) {
                        // try all combinations of these rows to see if any qualify
                        let combinations = utils.makeCombinations(candidateRows, width);
                        combinations.forEach(arr => {
                            let candidatePositions = new SpecialSet();
                            for (let item of arr) {
                                candidatePositions.addTo(item.positions);
                            }
                            if (candidatePositions.size === width) {
                                let rows = arr.map(item => item.rowNum);
                                let output = `found ${name} for value ${possible}, ${tag === "row" ? "columns" : "rows"} ${candidatePositions.toBracketString()} and ${tag}s [${rows.join(",")}]`;
                                this.log(output);
                                
                                // get opposite direction for clearing
                                let direction = (tag === "row" ? "column" : "row");
                                let origPossiblesCleared = pCnt;
                                candidatePositions.forEach(num => {
                                    pCnt += this.clearPossibles(direction, num, possible, new Set(rows));                                
                                });
                                if (pCnt !== origPossiblesCleared) {
                                    this.saveSolution(output);
                                }
                            }
                        })
                    }
                }
            });
            return pCnt;
        }

        // look for the larger ones first
        possiblesCleared += run.call(this, 4, "jellyfish");      // jellyfish
        possiblesCleared += run.call(this, 3, "swordfish");      // swordfish
            
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
                            let output = `found XYWing with pivot ${cell.xy()} ${cell.pList()} and cells ${arr[0].xy()} ${arr[0].pList()}, ${arr[1].xy()} ${arr[1].pList()}`;
                            this.log(output);

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
                            possiblesCleared += this.clearListOfPossiblesMsg(cellsToClear, leafIntersect, output);
                        }
                    }
                });
            }
        });
        return possiblesCleared;
        
    }
    
    // Documentation of rectangles: http://www.sudokuwiki.org/Unique_Rectangles
    // type 1 is a rectangle where three corners are the same pair and one corner has extra possibles
    //     you can remove the pair from that corner that has extras
    // type 2 is a rectangle where two neighboring cells of the rectange that are in the same tile
    //     each have one extra possible.  In this case, the one extra possible must appear
    //     in at least one of those cells so you can eliminate it from elsewhere in the tile 
    //     or from the row/col of the two rectangle cells that have the 
    //     extra possible (called the roof of the rectangle)
    // type 2B is the same as type 2, but the roof cells are not in the same tile.  Here
    //     you can only eliminate the extra possible from the row/col of the roof, not
    //     from the tile (as in type 2)
    // type 2C has the extra possible in two opposite corners of the rectangle.  Here
    //     the extra possible must exist in one of the two corners so you can remove it
    //     from the intersection of the two corner's buddies (which is usually just from
    //     one intersecting cell)
    // type 3 is a rectangle where there is the usual floor with two naked matching pairs.
    //     The roof contains two extra possibles.  We know that one or both of those extras
    //     must be used to avoid the rectangle pattern.  This creates a pseudo cell that acts
    //     like a naked pair.  If that naked pair is elsewhere in the row/col of the roof,
    //     then those two possible values can be eliminated from elsewhere in the row/col
    //     of the roof (cells that are not in the rectangle and not the naked pair)
    // type 3B is like type3, but the roof cells are in the same tile.  Then, you can also 
    //     look for the locked pair inside the tile and, if found, eliminate the pair from
    //     elsewhere in the tile
    // type 3B with triple pseudo cells (instead of just pair)
    // type 4 is a type 3 rectangle with a total of two extra possibles in the two roof corners
    //     and the two roof corners are in the same tile and one of the corner possibles is
    //     no where else in the tile (therefore it must occupy one of the corners).  Then
    //     you can remove the other corner possible from the roof because it can't be
    //     present or you'd have the impossible pattern
    // type 4B is the same as type 4, but the roof corners are not in the same tile and
    //     the roof possible exists uniquely in the row/col (rather than uniquely in the tile
    //     as with type 4).  The reduction is the same as with Type 4, to remove the other corner value.
    processRectangles() {
        this.log("processRectangles");
        
        function run(firstRun) {
            let pCnt = 0;
            // idea is to create a list of all possible pairs in each cell
            // and then use that to find all common pairs in the row
            // and then compare that to all other rows to find rows
            // that have the same pair match in the same two columns
            // We don't have to do both rows and columns since the detection
            // in rows includes both cases.
            
            // We're going to need to be able to make all possible pairs from a set
            // each entry in pairMatchMap represents a pair that exists within a row.
            // The key in the map is "29:08", value is an array of two cells with possibles 2 and 9 
            //    in the same row and in columns 0 and 8 in this example
            let pairMatchMap = new MapOfArrays();
            for (let row = 0; row < boardSize; row++) {
                let cells = this.getOpenCellsRow(row);
                // for each row, make a map of all pairs available
                // key is a string like "29" which signifies a 29 pair
                //     value is an array of all cells that contain that pair (each one in a different column)
                let pairRowMap = new MapOfArrays();
                for (let c of cells) {
                    // for each cell make all possible pairs of possibles
                    let combos = utils.makeCombinations(c.possibles, 2);
                    for (let item of combos) {
                        // make key string like "29"
                        let pairStr = item.sort((a,b) => {b-a}).join("");
                        pairRowMap.add(pairStr, c);
                    }
                }
                // so now we have a pairRowMap for this row that tells us all pairs that exist in this row
                // find all combinations of pairs that exist more than once
                // Let's create a pairMatchIdentifier string that looks like this:
                //    "29:08"
                //    29 - the pair in sorted order
                //    08 - the two columns it appears in
                // Then, we can put that in a map where the data in the map is an array of cells that contain that pairMatchIdentifier
                let pairMatchIdentifier;
                for (let [key, cellArray] of pairRowMap) {
                    if (cellArray.length > 1) {
                        if (firstRun) {
                            this.log(`found common pair {${key}} in row ${row} in columns ${JSON.stringify(cellArray.map(c => c.col))}`);
                        }
                        // if this pair appears in more than one place, we have to create all combinations of it
                        let combos = utils.makeCombinations(cellArray, 2);
                        for (let columnPair of combos) {
                            pairMatchIdentifier = key + ":" + columnPair.map(c => c.col).join("");
                            // add these two cells from this row to the pairMatchMap
                            pairMatchMap.add(pairMatchIdentifier, columnPair);
                        }
                    }
                }
            }
            // now the pairMatchMap is fully populated - build combinations and process them
            for (let [key, cellArray] of pairMatchMap) {
                if (cellArray.length > 1) {
                    let rectangles = utils.makeCombinations(cellArray, 2);
                    for (let r of rectangles) {
                        // accumulate all tile numbers because the rectangle must be spread out across exactly two tiles
                        let tileNums = SpecialSet.unionFromProp("tileNum", r[0], r[1]);
                        if (tileNums.size == 2) {
                            let pair = key.split(":")[0].split("").map(n => +n);
                            let pairSet = new SpecialSet(pair);
                            let output = `with pair ${pair.join("")} in rows ${r[0][0].row},${r[1][0].row} and in columns ${r[0][0].col},${r[0][1].col}`;
                            if (firstRun) {
                                this.log("found rectangle candidate " + output);
                            }
                            // now lets see how many corners have extra cells
                            let allCells = r[0].concat(r[1]);
                            // cells that have extra possibles
                            let haveExtras = [];
                            // map where cell is index and extra possibles is the value for each cell
                            let extraPossibles = new Map();
                            // accumulated extra possibles
                            let extras = new SpecialSet();
                            
                            for (let c of allCells) {
                                if (c.possibles.size > 2) {
                                    haveExtras.push(c);
                                    let extraOnes = c.possibles.difference(pairSet);
                                    extraPossibles.set(c, extraOnes);
                                    extras.addTo(extraOnes);
                                }
                            }
                            if (haveExtras.size === 0) {
                                throw new BoardError("Found naked rectangle which means multiple solutions");
                            }
                            if (haveExtras.length === 1) {
                                // must be type 1, clear the core pair from this cell
                                let msg = `found type 1 rectangle ${output}`;
                                this.log(msg);
                                let cnt = this.clearListOfPossiblesMsg(haveExtras, pair, msg, 1);
                                pCnt += cnt;
                                if (cnt) {
                                    return pCnt;
                                }
                            } else if (haveExtras.length === 2) {
                                // All type2 conditions have the same requirements
                                //    Two of the corners have exactly one extra possible value
                                // 
                                // When that happens, you can remove that extra possible from any cells
                                // that can see both corners with the extra possible
                                
                                let r1 = haveExtras[0], r2 = haveExtras[1];                            
                                let r1Extras = extraPossibles.get(r1), r2Extras = extraPossibles.get(r2);
                                if (r1Extras.size === 1 && r1Extras.equals(r2Extras)) {
                                    // It is a regular Type 2 - can remove the extra possible from 
                                    // all cells outside the roof that can see both roof cells
                                    // first get the extra possible
                                    let msg = `found type 2 rectangle ${output}`;
                                    this.log(msg);
                                    let commons = this.getOpenCellsBuddies(r1, true).intersection(this.getOpenCellsBuddies(r2, true));
                                    let cnt = this.clearListOfPossiblesMsg(commons, r1Extras, msg, 1);
                                    pCnt += cnt;
                                    if (cnt) {
                                        // have to return here because previously saved data structures can be wrong 
                                        // now that we've cleared possibles
                                        return pCnt;
                                    }
                                } else if (extras.size === 2) {
                                    // could be a Type 3 with two extra possibles among the two roof cells
                                    this.log(`could be type 3 or 4 rectangle ${output}`);
                                    // In the intersectionof the buddies of the two roof cells, we need to find a naked pair
                                    // that matches the two extra possibles.  If we find that, then our two roof cells serve
                                    // as a pseudo cell that interacts with the naked pair and then we can remove the two
                                    // possibles that are found in the naked pair from other cells in the intersection between 
                                    // the buddies of the two roof cells and the naked pair cell.  In a complication, there
                                    // could be more than one naked pair match found and you can process each separately.
                                    
                                    // First find a naked pair
                                    let commons = this.getOpenCellsBuddies(r1, true).intersection(this.getOpenCellsBuddies(r2, true));
                                    let cnt = 0;
                                    for (let c of commons) {
                                        if (c.possibles.equals(extras)) {
                                            let msg = `found type 3 rectangle intersecting with naked pair ${extras.toBracketString()} in ${c.xy()} ${output}`
                                            this.log(msg);
                                            let pairBuddies = this.getOpenCellsBuddies(c, true);
                                            cnt += this.clearListOfPossiblesMsg(pairBuddies.intersection(commons), extras, msg, 1);
                                            pCnt += cnt;
                                        }
                                    }
                                    // have to return here because other data is now invalid because we changed possibles
                                    if (cnt) {
                                        return pCnt;
                                    } else {
                                        // either didn't detect type 3 or didn't remove anything so, let's check for type 4
                                        // in type 4, the two roof cells are a conjugate pair for one of the two corner values
                                        // therefore that value MUST exist in one of the roof cells.  Therefore, the other
                                        // value cannot exist in those two cells or we'd have the impossible rectangle so that
                                        // other value can be eliminated.
                                        // If we get the common buddies of the two roof cells and see no other possibles that match
                                        // one of the two corner values, then we have a type 4
                                        for (let p of pairSet) {
                                            let found = false;
                                            for (let c of commons) {
                                                if (c.possibles.has(p)) {
                                                    found = true;
                                                    break;
                                                }
                                            }
                                            if (!found) {
                                                // one of the values was not anywhere in the common elements
                                                // the other pair can be removed from the roof cells
                                                let single = pairSet.clone();
                                                single.delete(p);
                                                let msg = `found type 4 rectangle where we can remove ${single.getFirst()} from roof cells ${output}`;
                                                this.log(msg);
                                                cnt = this.clearListOfPossiblesMsg([r1, r2], single, msg, 1);
                                                pCnt += cnt;
                                                if (cnt) {
                                                    return pCnt;
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                // TODO: 
                                //     3/3B with triple pseudo cells
                            }
                        }                    
                    }
                }
            }
            
            return pCnt;
        }
        
        // call this repeatedly until no more are found
        let cnt = 0, lastCnt, first = true;
        do {
            lastCnt = run.call(this, first);
            first = false;
            cnt += lastCnt;
        } while(lastCnt);
        return cnt;
    }
    
    processAlignedPairExclusions() {
        this.log("processing alignedPairExclusions");
        let pCnt = 0;
        
        // There is not a lot written about what are good candidates for this.  I will start by assuming that
        // we are looking for two cells within the same tile, aligned by row or column that have 3 or more possibles
        
        let candidatePairs = [];
        for (let tileNum = 0; tileNum < boardSize; tileNum++) {
            let cells = this.getOpenCellsTile(tileNum).filter(c => c.possibles.size > 2);
            // just get all combinations of two open cells in this tile
            let combos = utils.makeCombinations(cells, 2);
            for (let pair of combos) {
                // now test them to see if they are row or col aligned
                if (pair[0].row === pair[1].row || pair[0].col === pair[1].col) {
                    candidatePairs.push(pair);
                }
            }
        }
        // now we have all the candidate aligned pairs
        // Steps:
        //    Build a list of all possible two values combinations for this pair
        //    Remove any combination where both cells have the same value (because they are in the same tile, this is not possible)
        //    Build a list of common buddies
        //    Go through the list of buddies and remove any combination that directly matches a buddy pair
        
        for (let pair of candidatePairs) {
            let pCombos = new SpecialSet();
            let pair1 = pair[0];
            let pair2 = pair[1];
            for (let p1 of pair1.possibles) {
                for (let p2 of pair2.possibles) {
                    if (p1 !== p2) {
                        pCombos.add([p1, p2]);
                    }
                }
            }
            // now see if any of these combos overlap with shared buddy pairs
            let commons = this.getOpenCellsBuddies(pair1, true).intersection(this.getOpenCellsBuddies(pair2, true));
            commons.remove(c => c.possibles.size === 2);
            
            // if any of these pair cells contain common possibles, we can create some pseudo cells
            // for example if there's a 17 and a 37 that can both see each other, we can create a 13 pseudo cell 
            // because 13 is also eliminated from the pair
            // filter out combinations that can't see each other
            let matches = utils.makeCombinations(commons, 2).filter(match => {
                return match[0].tileNum === match[1].tileNum || match[0].row === match[1].row || match[0].col === match[1].col;
            });
            for (let match of matches) {
                let intersect = match[0].possibles.intersection(match[1].possibles);
                if (intersect.size === 1) {
                    // they have one common possible so we can use the other two possibles values as a pseudo cell
                    let union = match[0].possibles.union(match[1].possibles);
                    union.remove(intersect);
                    // add a pseudo cell to the list
                    commons.add({possibles: union});
                }
            }
            
            // for each pair-wise combination of possibles, see if any of them match any existing cells
            // or pseudo cells in the commons set.  If they do, remove them since they are not an allowed combination
            for (let c of commons) {
                for (let combo of pCombos) {
                    if (c.possibles.equals(new SpecialSet(combo))) {
                        pCombos.delete(combo);
                    }
                }
            }
            // now we have a remaining set of legal pCombos
            // we want to see if any possibles in either cell have been eliminated from all legal combos
            
            function check(pairCell, index) {
                let removes = [];
                for (let p of pairCell.possibles) {
                    let found = false;
                    for (let combo of pCombos) {
                        if (combo[index] === p) {
                            found = true;
                            break;
                        }
                    }
                    // did not find p in any combo for pair1, can remove it as a possibility
                    if (!found) {
                        removes.push(p);
                    }
                }
                if (removes.length) {
                    let output = `found aligned pair exclusion for possibles ${removes.join(",")} in cell ${pairCell.xy()} in pair ${cellsToStr(pair)}`;
                    this.log(output);
                    this.saveSolution(output);
                    return this.clearListOfPossibles([pairCell], removes, 1);
                }
                return 0;
            }
            
            pCnt += check.call(this, pair1, 0);
            pCnt += check.call(this, pair2, 1);
        }
        
        return pCnt;
    }
    
    // Reference: http://www.sudokuwiki.org/XYZ_Wing
    processXYZWing() {
        this.log("processing XYZWing");
        let pCnt = 0;
        
        this.iterateOpenCells((cell, row, col) => {
            // look for possible hinge cell that has 3 possible values
            if (cell.possibles.size === 3) {
                let leafCells = [];
                let buddies = this.getOpenCellsBuddies(cell, true);
                for (let c of buddies) {
                    // look for leaf cell that is a buddy and has exactly 2 possibles 
                    // and both are in common with hinge
                    if (c.possibles.size === 2) {
                        let commonP = c.possibles.intersection(cell.possibles);
                        if (commonP.size === 2) {
                            leafCells.push(c);
                        }
                    }
                }
                if (leafCells.length > 1) {
                    // Generate all combinations and see which ones meet the criteria
                    // of having a different two common possibles with the hinge
                    let allCombos = utils.makeCombinations(leafCells, 2);
                    for (let combo of allCombos) {
                        // this condition would be a naked pair and should not happen because it should have already
                        // eliminated the hinge, but we check for it just to be safe
                        let c1 = combo[0], c2 = combo[1];
                        if (c1.possibles.equals(c2.possibles)) continue;
                        // get the common possible between these two
                        let commonPossible = c1.possibles.intersection(c2.possibles);
                        // get common buddies among all three cells
                        let sharedBuddies = buddies.intersection(this.getOpenCellsBuddies(c1)).intersection(this.getOpenCellsBuddies(c2));
                        let msg = `found XYZWing with hinge cell ${cell.xy()} and leafs ${cellsToStr(combo)}, removing possible ${commonPossible.getFirst()}`
                        this.log(msg);
                        pCnt += this.clearListOfPossiblesMsg(sharedBuddies, commonPossible, msg, 1);
                    }
                }
            }
        });
        
        return pCnt;
    }
    
    // returns an array indexed by possible value (1-9) index
    //   of maps by cell where the data is a set of other cells it has a strong link to
    // Example:  let strongLinkCells3 = all[3].get(c)
    //    gives you a set of cells that have strong links to c
    // Need: Ability to remove a link (and the corresponding back link) when it is used
    //       Ability to get next link when your chain runs into a dead-end
    //       Ability to keep track of a N chains of cells that we have already followed
    calcLinks() {
        return new AllLinkData(this);
    }
    
    processXChains() {
        this.log("processing X Chains");
        let pCnt = 0;
        
        // identify potential starting cells
        // follow strong, then weak links until we get overlap between ends of the chain
        // then remove possibles in cells that see both ends of the chain
        // The ends of the chain become like a bivalue pair for that one possible value
        let links = this.calcLinks();
        links.list();


        // allChains is an array indexed by possible value
        // The data in each allChains array cell is an array of chains for that possible value
        let allChains = links.makeStrongChains();
        
        // loop for each possible value
        for (let p = 1; p <= boardSize; p++) {
            
            let pChains = allChains[p].chains;
            let allCells = links.getAllCells(p);
            // we've now built all the chains for this possible value
            // now let's color them
            // In the color map, a cell is the index and a color will either be -1 or 1
            for (let [chainObjIndex, chainObj] of pChains.entries()) {
                // separate colorMap for each chainObj
                let colorMap = new SpecialMap();
                chainObj.colorMap = colorMap;
                this.log(`Processing chain obj ${chainObjIndex+1} of ${pChains.length}`);
                for (let [i, segment] of chainObj.segments.entries()) {
                    // Find out if anything in the chain already has a color (because it is connected
                    //   to a previous chain segment)
                    // If so, start with that color on that cell
                    // colors are either 1 or -1 (so they are easy to invert)
                    this.log(` Processing chain segment ${i+1} of ${chainObj.segments.length}: ${cellsToStr(segment)}`);
                    let startIndex = 0;
                    let startColor = 1;
                    for (let i = 0; i < segment.length; i++) {
                        let cell = segment[i];
                        if (colorMap.has(cell)) {
                            startIndex = i;
                            startColor = colorMap.get(cell);
                            break;
                        }
                    }
                    // if the startIndex is odd, then the start value for the chain is the 
                    // opposite of the color of that cell
                    if (startIndex % 2 !== 0) {
                        startColor *= -1;
                    }
                    let currentColor = startColor;
                    for (let cell of segment) {
                        let testColor = colorMap.get(cell);
                        if (testColor && testColor !== currentColor) {
                            let msg = `  Found mismatched color for possible ${p} at ${cell.xy()} in segment ${cellsToStr(segment)}`;
                            this.log(msg);
                            throw new BoardError(msg);
                        }
                        colorMap.set(cell, currentColor);
                        this.log(`  Color ${currentColor} for possible ${p} at ${cell.xy()}`);
                        currentColor *= -1;
                    }
                }
            }
            // all chains are colored now, we need to look for violations
            // Rule 2 (from http://www.sudokuwiki.org/Singles_Chains) says that if there is more than one cell from the same chain
            // with the same color in any unit (row/col/tile), then all cells with that color in that unit must be off
            
            for (let [i, chainObj] of pChains.entries()) {
                // separate color map for each chain
                let colorMap = chainObj.colorMap;
                let colorSet = new SpecialSet(colorMap.keys());
                let cells = Array.from(colorMap.keys());
                for (let [index, c1] of cells.entries()) {
                    let c1Color = colorMap.get(c1), c2Color, c2;
                    // for each cell, check the rest of the cells to see if we have a Rule 2 violation
                    for (let i = index + 1; i < cells.length; i++) {
                        c2 = cells[i];
                        if (c1 !== c2) {
                            c2Color = colorMap.get(c2);
                            // if same row/col/tileNum and colors are the same, it's a violation
                            if (c1Color === c2Color && (c1.row === c2.row || c1.col === c2.col || c1.tileNum === c2.tileNum)) {
                                // found Rule 2 violation, remove all the cells in this chain that have the c1color
                                // keep only cells that have the offending color
                                let removes = colorSet.filter(c => {
                                    return colorMap.get(c) === c1Color;
                                });
                                let msg = ` found xchain Rule 2 violation between ${cellsToStr([c1, c2])}, able to remove possible ${p} from ${cellsToStr(removes)}`;
                                this.log(msg);
                                pCnt += this.clearListOfPossiblesMsg(removes, [p], msg, 1);
                                // have to return here because lots of things may have changed when we cleared that possible
                                return pCnt;                                
                            }
                        }
                    }
                }
                // Rule 4 says that if any candidate not in the chain can see two different colors in the chain, then it can
                // be eliminated
                
                // get other cells that have this possible that are not in the current chain
                let otherCells = allCells.difference(colorMap);
                for (let cell of otherCells) {
                    // temporary debugging
                    let buds = this.getOpenCellsBuddies(cell, true);
                    let overlap = this.getOpenCellsBuddies(cell, true).intersection(colorSet);
                    if (overlap.size >= 2) {
                        let accumulateColors = new SpecialSet();
                        for (let o of overlap) {
                            accumulateColors.add(colorMap.get(o));
                        }
                        if (p === 5 && cell.row === 4 && cell.col === 2) {
                            let i = 1;   // set breakpoint here
                        }
                        if (accumulateColors.size > 1) {
                            let msg = `  found xchain Rule 4 violation for possible ${p} - cell ${cell.xy()} can see more than one color in chain`;
                            this.log(msg);
                            pCnt += this.clearListOfPossiblesMsg([cell], [p], msg, 1);
                            // have to return here because lots of things may have changed when we cleared that possible
                            return pCnt;
                        }
                    }
                }
            }
            
        }
        
        return pCnt;
    }
    
    processXYChains() {
        let pCnt = 0;
        this.log("processXYChains");
        
        let data = new PairLinkData(this);
        let chainList = data.makeXYChains();
        let queue = [];
        for (let chain of chainList) {
            let c1 = chain.first().cell;
            let c2 = chain.last().cell;
            let p = chain.last().pLinkOther;
            let msg = ` xy chain, possible ${p}, chain ending ${c1.xy()} ${c1.possibles.toBracketString()}, ${c2.xy()} ${c2.possibles.toBracketString()}, eliminate cells that can see both ends, chain: ${chain.cellsToStr()}`;
            this.log(msg);
            this.queueOverlappingPossibles(queue, c1, c2, p, msg, 2, chain.getCells());
        }
        // now process all the queued removals
        pCnt += this.clearQueue(queue);
        return pCnt;
    }
    
    clearOverlappingPossibles(c1, c2, p, msg, indent, excludes) {
        let b1 = this.getOpenCellsBuddies(c1, true);
        let b2 = this.getOpenCellsBuddies(c2, true);
        let clearCells = b1.intersection(b2);
        if (excludes) {
            clearCells.remove(excludes);
        }
        return this.clearListOfPossiblesMsg(clearCells, [p], msg, indent);
    }
    
    queueOverlappingPossibles(queue, c1, c2, p, msg, indent, excludes) {
        let origLen = queue.length;
        let curMsg = msg;
        let b1 = this.getOpenCellsBuddies(c1, true);
        let b2 = this.getOpenCellsBuddies(c2, true);
        let clearCells = b1.intersection(b2);
        if (excludes) {
            clearCells.remove(excludes);
        }
        for (let cell of clearCells) {
            if (cell.possibles.has(p)) {
                let leading = Array(indent + 1).fill(" ").join("");
                this.log(leading + `queueing to remove possible ${p} from ${cell.xy()} ${cell.possibles.toBracketString()}`);
                queue.push({cell, p, indent, msg: curMsg});
                curMsg = null;
            }
        }
        return queue.length - origLen;
    }
    
    clearQueue(queue) {
        this.log("processing queued removals");
        let pCnt = 0, changeCnt, checkStop = -1;
        for (let item of queue) {
            // temporarily for debugging purposes, only clear the first set of items from the queue
            if (checkStop == 0) {
                break;
            }
            if (item.msg) {
                --checkStop;
            }
            changeCnt = this.clearListOfPossibles([item.cell], [item.p], item.indent);
            if (changeCnt && item.msg) {
                this.saveSolution(item.msg);
            }
            pCnt += changeCnt;
        }
        return pCnt;
    }
    
    // Source: http://www.sudokuwiki.org/X_Cycles and http://www.sudokuwiki.org/X_Cycles_Part_2
    // Eliminations
    //   Nice loops rule 1: Continuous loop, no imperfections
    //       Eliminate any possibles that share a unit with both ends of a weak link
    //   Nice loops rule 2:
    //       If two adjacent strong links in a loop, then the apex of the intersection between
    //       the two strong links has to have the value of the loop, therefore you can set its value
    //   Nice loops rule 3:
    //       For an open chain that has a strong link at both ends, you can eliminate the possible
    //       from any cells that see both ends of the chain (because on end of the other has to
    //       have the value (they are essentially a locked pair)
    
    
    processAlternatingChains() {
        let pCnt = 0;
        this.log("processAlternatingChains");
        let links = this.calcLinks();
        let allChains = links.makeAlternatingChains();
        
        // now eliminate any possibles we can because of these chains
        // For now, we assume all links are alternating strong/weak/strong
        // No chains start or end with weak links
        for (let p = 1; p < allChains.length; ++p) {
            let altChainList = allChains[p];
            this.log(`Alternating Chains for ${p}:`);
            altChainList.list(this);
        }
        for (let p = 1; p < allChains.length; ++p) {
            this.log(`Examining chains for ${p}`);
            let altChainList = allChains[p];
            
            // separate out circular and non-circular chains            
            let {circularChains, nonCircularChains} = altChainList.splitCircular();
            circularChains.sort((a, b) => {
                // sort chains so longest is first
                return b.length - a.length;
            });
            
            for (let altChain of circularChains) {
                let cell = altChain.getStrongStrongCircular();
                if (cell) {
                    // apply nice loops rule 2 - two strong links together force the apex to have the value
                    let msg = ` found alternating chain loop with two strong links, setting value of ${cell.xy()} to ${p}, ${altChain.cellsToStr()}`;
                    this.log(msg);
                    this.saveSolution(msg);
                    pCnt += this.setValue(cell, p, 2);
                    return pCnt;
                } 
                // do Nice Loops 1 eliminations
                // Find each weak link
                let weaks = altChain.getWeakLinks();
                let msg = ` found alternating chain loop for possible ${p} ${altChain.cellsToStr()}`;
                this.log(msg);
                let clearCells = new SpecialSet();
                for (let item of weaks) {
                    let b1 = this.getOpenCellsBuddies(item[0], true);
                    let b2 = this.getOpenCellsBuddies(item[1], true);
                    clearCells.addTo(b1.intersection(b2));
                }
                pCnt += this.clearListOfPossiblesMsg(clearCells, [p], msg, 2);
                if (pCnt !== 0) {
                    return pCnt;
                }
            }
            for (let altChain of nonCircularChains) {
                // not circular, look for eliminations based on Nice Loops Rule 3
                let [s1, s2] = altChain.getStrongEndCells();
                let msg = ` found alternating open chain for possible ${p}, eliminating cells that can see both ends ${altChain.cellsToStr()}`;
                this.log(msg);
                pCnt += this.clearOverlappingPossibles(s1, s2, p, msg, 2);
                if (pCnt !== 0) {
                    return pCnt;
                }
            }
        }
        return pCnt;
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
        // give us some logging for debug reasons
        for (let [key, cellData] of candidateCells) {
            this.log(` XCycle: possible ${cellData.p} in ${cellData.cell.xy()} is a candidate for XCycle analysis`);
        }
        for (let cell of pairCells) {
            let pair = cell.possibles.toArray();
            this.log(` XCycle pair cell: possible ${pair[0]} and  ${pair[1]} in ${cell.xy()} are candidates for XCycle analysis`);
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
                let output = "";
                try {
                    output = ` Trying value ${p1} in ${cell.xy()} ${cell.possibles.toBracketString()}`;
                    this.log(output)
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
                                this.log(`  FIXME: If this situation actually happens on a real board, we need to write code to clear these possibles`);
                            } else {
                                // no possibles removed in both scenarios
                            }
                        });
                    } else {
                        // only p1 passed checkBoard()
                        this.log(" Only p1 passed checkBoard");
                        // apply setValue(p1) to main board
                        this.log(` XCycle setValue: ${cell.xy()}, value ${p1}`);
                        possiblesCleared += this.setValue(cell, p1, 1);
                        this.saveSolution(`Tried values {${p1} and ${p2}} in ${cell.xy()} and only ${p1} led to a valid board so set that value`);
                    }
                } else {
                    this.log(" p1 did not pass checkBoard");                        
                    // assume p2 would have passed
                    this.log(` XCycle setValue: ${cell.xy()}, value ${p2}`);
                    possiblesCleared += this.setValue(cell, p2, 1);
                    this.saveSolution(`Tried value ${p1} in ${cell.xy()} and it failed so set only other value ${p2} as the value`);
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
                    let output = ` Trying value ${p} in ${cell.xy()} ${cell.possibles.toBracketString()}`;
                    this.log(output);
                    let bAlt = this.clone();
                    bAlt.loggingEnabled = false;
                    bAlt.setValue(bAlt.getCell(cell.row, cell.col), p);
                    // if this solved the puzzle, then set this value and be done
                    if (bAlt.checkBoard() === 0) {
                        possiblesCleared += this.setValue(cell, p, 1);
                        this.saveSolution(output + " - solved puzzle immediately");
                        break;
                    } else {
                        // try solving this board
                        this.log(`  Solve attempt`);
                        // avoid recursion here by skipping processXCycles in the call to .solve()
                        let numOpenCells = bAlt.solve({skipMethods: ["processXCyles"], skipCalcPossibles: true});
                        if (numOpenCells === 0) {
                            this.log(` Board solved with this xcycle guess`);
                            possiblesCleared += this.setValue(cell, p, 1);
                            this.saveSolution(output + " - solved puzzle after further solve alogorithms");
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
                    let output = `  Board failed after trying value, clearing possible ${p} in ${cell.xy()} ${cell.possibles.toBracketString()}`;
                    this.log(output);
                    possiblesCleared += this.clearListOfPossibles([cell], [p], 1);
                    this.saveSolution(output);
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
            "processBlockRowCol",
            "processHiddenSubset",
            "processXYChains",
            "processAlternatingChains",
            "processXChains",
            "processAlignedPairExclusions",
            "processRectangles",
            "processFish",
            "processXwing",
            "processXYWing",
            "processXYZWing",
            "processXWingFinned",
//            "processXCyles"
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
            this.log(`Final Board: ${options.name} ${this.outputBoard()}` );
            throw e;
        }
        this.outputPossibles();
        this.log(`Final Board: ${options.name} ${this.outputBoard()}` );
        if (openCells) {
            this.log(`Still ${this.countOpen()} open cells`);
        }
        return openCells;
    }

}


// Idea for a new scheme based on the x-cycles concept is that you find a cell with two possibles and you try each value in it
// and then remove any possibles that are removed from both tries.  Identify a strong link (a possible value that only has 
// one other possible value in the same row/col/tile

// options here are passed straight through to b.solve()
// options.showSolutionsSummary means to show the summary of solutions
function runBoard(boardStr, name, options = {}) {
    name = name || "";
    let opts = Object.assign({}, options);
    opts.name = opts.name || name;
    if (opts.name) {
        console.log(`Running board ${opts.name}`);
    }
    let b = new Board(boardStr);
    let opens = b.solve(opts);
    
    if (opts.showSolutionsSummary) {
        console.log("\nSolutions:\n", b.solutions.join("\n "));
    }
    
    return opens;
}

// node sudoku.js [-noguess] [-x=processAlignedPairExclusions] boardName
// node sudoku.js [-noguess] [-x=processAlignedPairExclusions] boardString
function processArgs() {
    let options = {skipMethods: []};
    let args = process.argv.slice(2);
    for (let arg of args) {
        if (arg.charAt(0) === "-") {
            if (arg.startsWith("-x=")) {
                options.skipMethods.push(arg.slice(3));
            } else {
                switch(arg) {
                    case "-noguess":
                        options.skipMethods.push("processXCyles");
                        break;
                    default:
                        console.log(`Unexpected argument ${arg}`);
                        process.exit(1);
                        break;
                }
            }
        } else {
            // if arg contains only digits, then must be a sudoku pattern
            if (!/\D/.test(arg)) {
                options.puzzle = arg;
            } else {
                // must be a boardname
                options.name = arg;
                options.puzzle = patterns[arg];
                if (!options.puzzle) {
                    console.log(`Puzzle name ${arg} not found in pre-built puzzle list`);
                    process.exit(1);
                }
            }
        }
    }
    return options;
}

function run() {
    // process the command line arguments
    let options = processArgs();

    let openResults = [], solvedResults = [];
    // if puzzle is already known here, then just run that puzzle
    if (options.puzzle) {
        options.showSolutionsSummary = true;
        runBoard(options.puzzle, options.name, options);
    } else {
        // no puzzle specified, run all the puzzles
        let boardNames = Object.keys(patterns);
        for (name of boardNames) {
            console.log("-----------------------------------------------------------------------------------------------------------------");
                let numOpenCells = runBoard(patterns[name], name, options);
                if (numOpenCells) {
                    openResults.push({name, numOpenCells});
                } else {
                    solvedResults.push({name, numOpenCells});
                }
        }
    }
    console.log("-----------------------------------------------------------");
    let unexpected = [];
    for (let item of openResults) {
        let expectedOpenCells = unsolved[item.name];
        if (typeof expectedOpenCells === "undefined") {
            unexpected.push(`Puzzle ${item.name} was unsolved and had ${item.numOpenCells} open cells - expecting it to be solved.`);
        } else if (item.numOpenCells !== expectedOpenCells) {
            unexpected.push(`Puzzle ${item.name} was unsolved, had ${item.numOpenCells} open cells, expected ${expectedOpenCells} open cells.`);
        } else {
            console.log(`Puzzle ${item.name} was unsolved as expected with ${item.numOpenCells} open cells`);
        }
    }

    console.log("-----------------------------------------------------------");
    console.log(unexpected.join("\n"));
    
    unexpected = [];
    for (let {name} of solvedResults) {
        let expected = unsolved[name];
        if (expected) {
            unexpected.push(`Puzzle ${name} was solved, but we expected ${expected} open cells.`);
        }
    }
    console.log("-----------------------------------------------------------");
    console.log(unexpected.join("\n"));
    
}

run();


