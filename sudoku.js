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

// fill array with all possible values
const allValues = [];
for (let i = 0; i < boardSize; i++) {
    allValues[i] = i + 1;
}


const boards = [
 [7,8,0,1,0,0,4,0,0,
  5,0,6,0,3,7,0,0,1,
  0,0,3,0,0,0,0,6,0,
  9,7,0,0,6,0,3,0,0,
  6,0,0,3,0,4,0,5,0,
  3,5,0,0,1,9,0,0,4,
  0,0,9,0,0,0,5,0,0,
  2,6,5,8,9,0,0,0,0,
  0,3,7,0,4,5,2,0,0],
  
  [0,0,0,8,0,0,0,0,1,
   2,0,0,0,3,4,9,6,0,
   3,0,4,0,9,0,0,0,2,
   0,0,5,3,0,6,0,0,0,
   0,4,0,0,0,0,5,0,0,
   7,0,2,1,0,0,0,0,0,
   9,5,0,2,0,0,0,4,0,
   0,0,7,4,6,5,0,0,0,
   4,0,3,0,8,0,0,2,0],
 
  [0,0,0,5,0,0,2,0,7,    // this is a very hard one
   0,9,0,0,0,0,4,0,0,
   7,0,6,0,0,4,0,8,3,
   0,4,0,0,5,0,0,0,8,
   0,0,9,4,0,3,7,0,0,
   5,0,0,0,8,0,0,2,0,
   1,6,0,2,0,0,3,0,9,
   0,0,4,0,0,0,0,7,0,
   9,0,7,0,0,1,0,0,0],

  [0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0],

  [0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0,
   0,0,0,0,0,0,0,0,0]
];

let nakedPair1 = 
   `32...14..
    9..4.2..3
    ..6.7...9
    8.1..5...
    ...1.6...
    ...7..1.8
    1...9.5..
    2..8.4..7
    ..45...31`;
    
let nakedPair2 = 
   `7.....2.1
    ..38.7...
    26.....5.
    6.19..4..
    .2.....8.
    ..4..29.6
    .3.....49
    ...1.58..
    8.6.....7`;
    
let blockBlock1 = 
    `.....3948
    3.9..85..
    ..4.....2
    5..9.....
    ..7.1.6..
    .....7..1
    6.....1..
    ..87..2.9
    1753.....`;

let hiddenQuad = `
    5.26..7..
    ...9...1.
    ......385
    ..4.961..
    .........
    ..527.9..
    837......
    .6...9...
    ..9..82.3`;
    
// xwing with 6 from (2,2)-(2,3) to (8,2)-(8,3)    
// allows you to clear all other possible 6 from colummsn 2 and 3
let xwing1 = `
    ...13...5     
    .4....2..
    8..9.....
    ....5.9..
    ..2...4..
    ..3.6....
    .....3..6
    ..5....1.
    7...28...`;
    
class SpecialSet extends Set {
    constructor(arg) {
        super(arg);
    }
   
    addTo(iterable) {
        iterable.forEach(item => {
            this.add(item);
        });
    }
    
    equals(otherSet) {
        if (otherSet.size !== this.size) return false;
        let equals = true;
        otherSet.forEach(item => {
            if (!this.has(item)) {
                equals = false;
            }
        });
        return equals;
    }
    
    // Get first value.  Since sets are unordered, this is useful only for getting the ONLY value in the set
    getFirst() {
        return this.values().next().value;
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
    
    // remove items in this set that are in the otherIterable
    // returns a count of number of items removed
    remove(otherIterable) {
        let cnt = 0;
        otherIterable.forEach(item => {
            if (this.delete(item)) {
                ++cnt;
            }
        });
        return cnt;
    }
    
    // remove the items from this set that are not in the other iterable
    // return the  number of items removed
    removeNonMatching(iterable) {
        let cnt = 0;
        // if iterable has a "has" property, then we can just use it directly
        let other = iterable.hasOwnProperty("has") ? iterable : new SpecialSet(iterable);
        this.forEach(item => {
            if (!other.has(item)) {
                this.delete(item);
                ++cnt;
            }
        });
        return cnt;
    }
    
    // pass callback function that returns true to keep, false to remove
    // The callback function is passed the element to be tested
    removeCustom(fn) {
        let cnt = 0;
        this.forEach(item => {
            if (fn(item) === false) {
                this.delete(item);
                cnt++;
            }
        });
        return cnt;
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
    clearPossibleValue(val) {
        if (this.possibles.has(val)) {
            console.log(`removing possible ${val} from ${this.getRowColStr()}`, this.possibles);
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
    
    getRowColStr() {
        return `(${this.row}, ${this.col})`;
    }
    
}

class Board {
    constructor(board) {
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
    
    checkBoard() {
        let conflicts = new SpecialSet();
        
        function check(iterateFn) {
            let val;
            for (let i = 0; i < boardSize; i++) {
                let taken = {};
                iterateFn(i, (cell, index) => {
                    val = cell.value;
                    if (val > 0) {
                        if (!taken[val]) {
                            taken[val] = [index];
                        } else {
                            taken[val].push(index);
                            conflicts.add(taken[val]);
                        }
                    }
                });
            }
        }
        
        check(this.iterateRow.bind(this));
        check(this.iterateColumn.bind(this));
        check(this.iterateTile.bind(this));
        if (conflicts.size) {
            console.log("Conflicts found: ", conflicts);
        } else {
            console.log("Valid board");
        }
    }
    
    iterateRow(row, fn) {
        let startCell = row * boardSize;
        let endCell = startCell + boardSize;
        for (let index = startCell; index < endCell; index++) {
            if (fn(this.data[index], index) === false) {
                return false;
            }
        }
        return true;
    }

    iterateColumn(column, fn) {
        for (let index = column, row = 0; row < boardSize; index += boardSize, row++) {
            if (fn(this.data[index], index) === false) {
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
            for (var row = startRow; row < endRow; row++) {
                index = (row * boardSize) + col;
                if (fn(this.data[index], index) === false) {
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
    
    getOpenCellsRow(row) {
        let results = [];
        this.iterateRowOpenCells(row, (cell, index) => {
            results.push(cell);
        });
        return results;
    }
    
    getOpenCellsColumn(col) {
        let results = [];
        this.iterateColumnOpenCells(col, (cell, index) => {
            results.push(cell);
        });
        return results;
    }
    
    // can be passed either (row, col) or (tileNum)
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
    
    getCellsRow(row) {
        let results = [];
        this.iterateRow(row, (cell, index) => {
            results.push(cell);
        });
        return results;
    }
    
    getCellsColumn(col) {
        let results = [];
        this.iterateColumn(col, (cell, index) => {
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
        this.iterateColumn(col, (cell, index) => {
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
    iterateOpenCellsByStructureAll(skipTile, f) {
        let fn = f;
        if (typeof skipTile === "function") {
            fn = skipTile;
            skipTile = false;
        }
        let cells;
        for (let row = 0; row < boardSize; row++) {
            cells = this.getOpenCellsRow(row);
            fn.call(this, cells, "row", row);
        }
        for (let col = 0; col < boardSize; col++) {
            cells = this.getOpenCellsColumn(col);
            fn.call(this, cells, "column", col);
        }
        if (!skipTile) {
            for (let tileNum = 0; tileNum < boardSize; tileNum++) {
                cells = this.getOpenCellsTile(tileNum);
                fn.call(this, cells, "tile", tileNum);
            }
        }
    }
    
    // Iterate all rows, columns and tiles
    // pass the iterator an array of cells
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
        list.forEach(cell => {
            fn.call(this, cell);
        });
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
        list.forEach(cell => {
            fn.call(this, cell);
        });
        
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
        
        // console.log(`possibles ${homeCell.getRowColStr()}: `, possibles);
        return possibles;
    }
    
    setAllPossibles() {
        let valuesSet = 0;
        this.iterateOpenCells((cell, row, col) => {
            let possibles = cell.possibles = this.getPossibles(row, col);
            
            if (possibles.size === 0) {
                console.log("board error: (" + row + ", " + col + ") has no possibles and no value");
            } else if (possibles.size === 1) {
                // if only one possible, then set the value
                let arr = Array.from(possibles);
                cell.value = arr[0];
                cell.possibles.clear();
                console.log(`Found (${row}, ${col}) has only one possible value of ${cell.value}`);
                ++valuesSet;
            }
        });
        return valuesSet;
    }
    
    // process naked singles and hidden singles
    processSingles() {
        console.log("Procesing singles");
        // Check each possible in row/col/tile to see if it is the only cell that could have that value
        // If so, set its value and clear possibles in all directions for that new value
        function run() {
            let valuesSet = 0;
            
            this.iterateOpenCells((cell, row, col) => {
                // This callback is called for each open cell
                // For each of the possibles, we want to check if any other cell in the row/col/tile could have this value
                // If not, then this cell must be assigned that value
                let valueWasSet = false;
                this.iterateAffectedCellsByStructure(row, col, cells => {
                    // cells is a Set of cells to check, current cell has been eliminated from the Set
                    for (let possibleVal of cell.possibles) {
                        let found = false;
                        cells.forEach(c => {
                            if (c.possibles.has(possibleVal)) {
                                found = true;
                            }
                        });
                        // if it was not found in any other cell in this row/col/tile
                        // then this cell must have this value
                        if (!found) {
                            console.log(`Found (${row}, ${col}) is only cell that can have ${possibleVal}`);
                            cell.value = possibleVal;
                            cell.possibles.clear();
                            cell.dirty = true;
                            valueWasSet = true;
                            ++valuesSet;
                            // tell iteration we can stop now
                            return false;
                        }
                    }
                });
                // if we set a value, then we need to remove that possible from all other directions
                // and we need to revisit the other cells to see if any of the possibles we removed
                // from here now make them the only cell that could have some value, but that 2nd
                // step will be done in another iteration
                if (valueWasSet) {
                    let val = cell.value;
                    this.iterateAffectedOpenCells(row, col, c => {
                        c.possibles.delete(val);
                    });
                }
            });
            return valuesSet;
        }
        // run this until no more values are changed
        while(run.call(this)) {}
        this.checkBoard();
        
        // look for identical naked pairs in the same row, column or tile that are "locked"
//        this.analyzeNakedPairs();
        
        
    }
    
    // allows you to eliminate possibilities from anywhere else besides the pair (in common row or col)
    // and in the tile if the pair is within a common tile
    processNakedPairs() {
        let possiblesCleared = 0;
        console.log("Processing Naked Pairs");
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
                        console.log(`found matching pair: ${cell2.getRowColStr()}, ${cell.getRowColStr()}`, cell.possibles)
                        
                        // for each cell in the array we are processing
                        // if it's not one of the cells in the pair, then clear each of the possible values from it
                        cells.forEach(c => {
                            if (c !== cell && c !== cell2) {
                                cell.possibles.forEach(val => {
                                    possiblesCleared += c.clearPossibleValue(val);
                                });
                            }
                        });
                        
                    } else {
                        pairs.set(hash, cell);
                    }
                }
            });
        });
        this.checkBoard();
        return possiblesCleared;
    }
    
    // Block and Column / Row Interactions
    // When you examine a block, you determine that a given possible value are all in one row or column
    //    then you can eliminate that value from elsewhere in the row or column
    processTileCommonRowCol() {
        console.log("Processing Common Row/Col");
        let possiblesCleared = 0;
        // for each tile
        for (let tileNum = 0; tileNum < boardSize; tileNum++) {
            // For each possible value in the tile, create a row map and a col map 
            // where the value of the map is an array of row and cols it can be in
            // If any item in the map only has one row or one col, then you can eliminate that
            // value from the cells outside this tile in that row/col
            // console.log(`${cell.getRowColStr()}:`, cell.possibles);
            let cells = this.getOpenCellsTile(tileNum);
            let rowMap = new Map(), colMap = new Map();
            // fill up maps with empty sets
            for (let i = 1; i <= boardSize; i++) {
                rowMap.set(i, new SpecialSet());
                colMap.set(i, new SpecialSet());
            }
            cells.forEach(cell => {
                // iterate each possible
                cell.possibles.forEach(p => {
                    rowMap.get(p).add(cell.row);
                    colMap.get(p).add(cell.col);
                });
            });
            
            function clearOthers(map, method, tag) {
                // now look for any item in the rowMap or colMap that has one and only one value in the set
                map.forEach((set, possible) => {
                    if (set.size === 1) {
                        console.log(`Found common ${tag} value of ${possible} in tile ${tileNum}`);
                        let rowCol = set.values().next().value;
                        // need to eliminate possible from any other tiles in this row
                        // iterate this row, but skip cells in the current tile
                        this[method](rowCol).forEach(c => {
                            if (c.tileNum !== tileNum) {
                                possiblesCleared += c.clearPossibleValue(possible);
                            }
                        });
                    }
                });
            }
            
            clearOthers.call(this, rowMap, "getOpenCellsRow", "row");
            clearOthers.call(this, colMap, "getOpenCellsColumn", "col");                
        }
        
        return possiblesCleared;
    }
    
    // This technique is very similar to naked subsets, but instead of affecting other cells with the same row, 
    // column or block, candidates are eliminated from the cells that hold the subset. If there are N cells, 
    // with N candidates between them that don't appear elsewhere in the same row, column or block, then 
    // any other candidates for those cells can be eliminated.
    processHiddenSubset() {
        console.log("Processing  Hidden Subset");
        let possiblesCleared = 0;
        // analyze all rows, columns and tiles
        this.iterateOpenCellsByStructureAll(cells => {
            // create a map that keeps track of which index a given possible can be in
            // pMap: key is possible value, value is a Set of cell indexes that contain those possibles
            //       There are 9 (boardSize) entries in each pMap
            // pMap Map {
            //  1 => Set {},                  // no open cells contain possible 1
            //  2 => Set {},                  // no open cells contain possible 2
            //  3 => Set { 3, 4 },            // cells 3 and 4 contain possible 3
            //  4 => Set { 0, 1, 2, 4 },      // cells 0,1,2,4 contain possible 4
            //  5 => Set { 0, 1, 2, 3, 4 },   // cells 0,1,2,3,4 contain possible 4
            //  6 => Set {},                  // no open cells contain possible 6
            //  7 => Set { 3, 4 },            // cells 3,4 contain possible 7
            //  8 => Set { 0, 1, 3 },         // cells 0,1,3 contain possible 8
            //  9 => Set {} }                 // no open cells contain possible 9
            let pMap = new MapOfSets(boardSize, 1);
            // init pMap to an empty set for each possible value
            //for (let i = 1; i <= boardSize; i++) {
            //    pMap.set(i, new SpecialSet());
            //}
            // iterate these cells
            cells.forEach((cell, index) => {
                cell.possibles.forEach(p => {
                    pMap.get(p).add(index);
                });
            });
            
            function findSameStringsInMap(stringMap) {
                // stringMap looks like this:
                //  3 => "3,4",            // cells 3 and 4 contain possible 3
                //  4 => "0,1,2,4,         // cells 0,1,2,4 contain possible 4
                //  5 => "0,1,2,3,4",      // cells 0,1,2,3,4 contain possible 4
                //  7 => "3,4",            // cells 3,4 contain possible 7
                //  8 => "0,1,3",          // cells 0,1,3 contain possible 8
                // when it says "cells 3 and 4", it means the index into the cells array
                // key is possible number
                // value is stringified version of cell index array
                let matchMap = new Map();

                // count up how many of each string we have by collecting each string into it's own map
                // where the string is the key and the value is an object {cnt: x, keys: [key]}
                stringMap.forEach((str, possible) => {
                    // if we don't have this value, then initialize that map entry
                    if (!matchMap.has(str)) {
                        matchMap.set(str, {cnt: 1, possibles: [possible]});
                    } else {
                        let obj = matchMap.get(str);
                        obj.cnt++;
                        obj.possibles.push(possible);
                    }
                });
                
                // matchMap looks like this:
                // Map {
                //   '3,4' => { cnt: 2, possibles: [ 3, 7 ] },
                //   '0,1,2,4' => { cnt: 1, possibles: [ 4 ] },
                //   '0,1,3' => { cnt: 1, possibles: [ 8 ] } }                
                
                return matchMap;
            }
            
            function findSameSetsInMap(map) {
                // create a new map that converts the sets (that are values in the map) to strings for easier comparison
                // Sets are converted to an array, sorted, then stringified for easy comparison
                let stringMap = new Map();
                map.forEach((set, key) => {
                    // get rid of length set we aren't interested in
                    if (set.size >= 2 && set.size <= 4) {
                        stringMap.set(key, Array.from(set).sort((a, b) => a - b).join(","));
                    }
                }); 
                // stringMap looks like this:
                //  3 => "3,4",            // cells 3 and 4 contain possible 3
                //  4 => "0,1,2,4,         // cells 0,1,2,4 contain possible 4
                //  5 => "0,1,2,3,4",      // cells 0,1,2,3,4 contain possible 4
                //  7 => "3,4",            // cells 3,4 contain possible 7
                //  8 => "0,1,3",          // cells 0,1,3 contain possible 8
                // when it says "cells 3 and 4", it means the index into the cells array

                // now we need to find which entries have the same values
                let matchMap = findSameStringsInMap(stringMap);
                // matchMap looks like this:
                // Map {
                //   '3,4' => { cnt: 2, possibles: [ 3, 7 ] },
                //   '0,1,2,4' => { cnt: 1, possibles: [ 4 ] },
                //   '0,1,3' => { cnt: 1, possibles: [ 8 ] } }                
                return matchMap;
            }
            
            function makeName(val) {
                switch(val) {
                    case 2: 
                        return "pair";
                    case 3:
                        return "triple";
                    case 4:
                        return "quad";
                    default:
                        return "undefined, not pair, triple or quad";
                }
            }
            
            let matchMap = findSameSetsInMap(pMap);
            matchMap.forEach((obj, cellStr) => {
                let cnt = obj.cnt;
                // cellStr looks like this '1,2,4'
                // we're looking things where cnt is 2 and len is 3, cnt is 3 and len is 5, cnt is 4 and len is 7
                let cellIndexes = [], keepers, len = cellStr.length;
                if ((cnt === 2 && len === 3) || (cnt === 3 && len === 5) || (cnt === 4 && len === 7)) {
                    keepers = obj.possibles;
                    cellIndexes = cellStr.split(",").map(n => +n);
                    let cellDescription = cellIndexes.map(i => {
                        return cells[i].getRowColStr();
                    }).join(" ");
                    console.log(`Found hidden ${makeName(cnt)} [${keepers}] in cells ${cellDescription}`);
                    // console.log("pMap", pMap);
                    // console.log("matchMap", matchMap);
                    // console.log("cellIndexes", cellIndexes);
                }
                // now for each cell index, remove any other possible that is not keepers
                // by just setting the possibles to the keepers
                cellIndexes.forEach(i => {
                    let keepersSet = new SpecialSet(keepers);
                    let possibles = cells[i].possibles;
                    // for each of the current possibles, see if we are supposed to keep it or not
                    possibles.forEach(p => {
                        if (!keepersSet.has(p)) {
                            possibles.delete(p);
                            console.log(`  removing possible ${p} from ${cells[i].getRowColStr()}`)
                            ++possiblesCleared;
                        }
                    });
                });
            });
        });
        
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
        
        let candidates = {row: new SpecialSet(), column: new SpecialSet()};
        this.iterateCellsByStructureAll("skipTile", (cells, type, typeNum) => {
           let pMap = new MapOfSets(boardSize, 1);
            // iterate these cells, index here is the position in the row/col
            cells.forEach((cell, index) => {
                if (!cell.value) {
                    cell.possibles.forEach(p => {
                        pMap.get(p).add(index);
                    });
                }
            });
            console.log("pMap", pMap);
            // pMap is the same type of pMap in processHiddenSubset()
            // it tells us which cells each
            pMap.forEach((set, number) => {
                if (set.size === 2) {
                    // FIXME: finish writing this starting here
                    // idea: make a combined key out of value + col1 + col2 so you can see
                    // if any other row has that same combined key
                    // create custom key
                    let key = number + ", " + set.toNumberString();
                    console.log("key", typeNum, key);
                    if (candidates[type].has(key)) {
                        // found matching one !!!
                        // We have an x-wing pattern, but "problem here" - we need the prior row or column number
                        console.log("Found x-wing pattern: ", key);
                    } else {
                        candidates[type].add(key);
                    }
                }
            });
        });
        
    }
    
    countOpen() {
        let cnt = 0;
        this.iterateOpenCells((cell, row, col) => {
            //console.log("Open (" + row + ", " + col + ")", cell.possibles);
            ++cnt;
        });
        return cnt;
    }
    
    outputBoard() {
        for (let i = 0; i < boardSize; i++) {
            let row = [];
            b.iterateRow(i, (cell, index) => {
                row.push(cell.value);
            });
            console.log(row.join(","));
        }
    }
    
    outputPossibles() {
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
        
        if (!foundPossibles) {
            console.log("Board solved - no possibles");
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
            //console.log(index, baseRow, baseCol);
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
        outputGrid.forEach(row => {
            console.log("|" + row.join(""));
        });
        
/*      
        for (let i = 0; i < boardSize; i++) {
            let row = [];
            b.iterateRow(i, (cell, index) => {
                row.push(JSON.stringify(Array.from(cell.possibles)));
            });
            console.log(row.join(","));
        } 
*/        
        
    }

}



//let b = new Board(boards[2]);
let b = new Board(xwing1);

// keep setting possibles while we still find more values to set
// this could be made faster by only revisiting impacted cells
while(b.setAllPossibles()) {}

// now we have all initial possibles set
// for each cell, look at each possible vlaue and see if it is the 
// only cell in it's row, column or tile that can have that value
// If so, set it's value
let more = 0;
do {
    b.outputPossibles();
    
    b.processSingles();
    
    console.log(`Still ${b.countOpen()} open cells`);
    b.outputBoard();
    b.outputPossibles();

    more = b.processNakedPairs();
    console.log(`Still ${b.countOpen()} open cells`);
    b.outputBoard();
    b.outputPossibles();
    if (!more) {
        more = b.processTileCommonRowCol();
        if (!more) {
            more = b.processHiddenSubset();
        }
    }
    b.processXwing();
} while (more);


b.outputPossibles();

