const utils = require('./utils.js');

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

let myPuzzleOrgDiabolic01092017 =
   `3.....869
    ...2...7.
    ..9.....5
    21..3.9..
    ....4....
    ..5.8..13
    5.....2..
    .7...6...
    846.....1`;

let myPuzzleOrgVeryHard01092017 = 
   `32.416.89
    ..8...3..
    ...3.5...
    4.......7
    ..36.14..
    5...2...3
    71..5..64
    .........
    8.6.4.2.1`;

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

// Go to http://www.sudokuwiki.org/sudoku.htm for help solving specific puzzles and seeing
// each algorithm applied    
// after removing some other things, the hidden triple is {3,5,6}:
// (5,1) {3,4,5,6}    
// (5,3) {1,4,5,6}
// (5,8) {3,5,6}
let hiddenTriplet = `
    .971..34.
    .1.23...7
    8..7.....
    ..9..2...
    .2.5.3.7.
    ...8..2..
    .....6..4
    9...57.6.
    .63..185.`;

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
    
let swordfish1 = `
    ...47.6..
    ..4...3.5
    92.......
    .31......
    ...936...
    ......28.
    .......16
    4.8...9..
    ..7.52...`;
    
let xywing1 = `
    .9.......
    ......678
    ....63.5.
    ...3.....
    ..8.5.2.1
    ..529.3..
    ..9..5...
    8...34...
    3.2..8..4`;    

// also contains triplets (5, 0), (5, 1), (5, 8) and (7, 1), (7, 3), (7, 8)    
let xywing2 = `
    684.7....
    3......7.
    ...51....
    8..4..1..
    .51.8.96.
    ..7..6..2
    ....45...
    .9......5
    ....2.843`;    

// 1-9-2017 on http://mypuzzle.org/sudoku, set to Diabolic (as of 1/10, still 40 cells open in my code)  
// requires multiple naked XY-Chains to solve  
let hardOnline1 = '320000869050200374009000125210635907000040002005082013500000206072006008846020701';
let hardOnline2 = '340007096000040307279306084003125009001070603790634015004762938900483001837591462';
let mypuzzleorg01022017veryhard = '207080006040002079500000004002030000000105000000020100800000007650900020900060805';
let mypuzzleorg01032017veryhard = '010070640200009000009500700020000000600703005000000030001002900000800001067090050';
    
let SpecialSet = require('./specialset.js');    
    

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

function showCellCollection(collection) {
    let results = [];
    for (let cell of collection) {
        results.push(cell.pos());
    }
    return results.join(" ");
}

// shortcut definition
let sc = showCellCollection;

// capitalize the first letter of the passed in string
function leadingCap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// return an array of arrays with all combinations of num length of the original
// array cells where order does not matter
// got this code online: http://www.w3resource.com/javascript-exercises/javascript-function-exercise-21.php
// This code is a little brute force in that it's making all possible permutations and 
// then just returning the ones of desired length, but for smallish arrays, it is easy
function makePermutations(arr, len) {
    let resultSet = [], result, x, i;
    
    // shortcut special cases
    if (arr.length < len) return [];
    if (arr.length === len) return [arr.slice(0)];    // return array of a single array (one combination)

    for (x = 0; x < Math.pow(2, arr.length); x++) {
        result = [];
        for (i = 0; i < arr.length; i++) {
            if ((x & (1 << i)) !== 0) {
                result.push(arr[i]);
            }
        }

        if (result.length === len) {
            resultSet.push(result);
        }
    }

    return resultSet;
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
    clearPossibleValue(val, nestLevel) {
        if (this.possibles.has(val)) {
            let level = nestLevel || 0;
            let leading = Array(level).fill(" ").join("");
            console.log(leading + `removing possible ${val} from ${this.pos()}`, this.possibles);
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
    
    pos() {
        return `(${this.row}, ${this.col})`;
    }
    
    setValue(val) {
        this.value = val;
        this.possibles.clear();
        this.dirty = true;
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
        
        function error(cell, msg) {
            conflicts.add(cell);
            console.log(`checkBoard() error ${msg}, ${cell.pos()}`);
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
                    if (cell.possibles.size === 1) {
                        error(cell, `cells has a single possible and no value`);
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
            console.log("Board is valid");
        }
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
    getOpenCellsBuddies(r, c, rs) {
        let row = r, col = c, returnSet = rs, cell = r;
        if (r instanceof Cell) {
            // args must have been (cell, returnSet)
            returnSet = c;
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
        console.log(leading + `setValue: ${cell.pos()} to ${val}`);
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
        let pMap = new Map();
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
    
    // get all possibles for a given cell by eliminating all values
    // already set in the row/col/tile
    getPossibles(row, col) {
        let homeCell = this.getCell(row, col);
        
        // start out with all possible values
        let possibles = new SpecialSet(allValues);
        
        this.iterateAffectedCells(row, col, [homeCell], cell => {
            possibles.delete(cell.value);
        });
        
        // console.log(`possibles ${homeCell.pos()}: `, possibles);
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
                cell.setValue(possibles.getFirst());
                console.log(`Found (${row}, ${col}) has only one possible value of ${cell.value}`);
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
        console.log("Processing naked and hidden singles");
        // Check each possible in row/col/tile to see if it is the only cell that could have that value
        // If so, set its value and clear possibles in all directions for that new value
        function run() {
            let valuesSet = 0;
            
            this.iterateOpenCells((cell, row, col) => {
                // This callback is called for each open cell
                
                // If only one possible value set it (naked single)
                if (cell.possibles.size === 1) {
                    console.log(`Found cell ${cell.pos()} with only one possible, setting value of ${cell.possibles.getFirst()}`);
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
                            throw new Error(`Got bad union for possibles on cell ${cell.pos()}`);
                        }
                        // now figure out which value is missing
                        let missing = allValuesSet.difference(union);
                        let val = missing.getFirst();
                        console.log(`Found ${cell.pos()} is only cell that can have ${val}`);
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
    // FIXME: We should process naked triples and quads
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
                        console.log(`found matching pair: ${cell2.pos()}, ${cell.pos()}`, cell.possibles)
                        
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
    
    // If there are only two cells or three cells in a tile that can contain a particular possible value and those cells
    // share a row or column, then that possible can be cleared from the rest of that row or column
    processPointingPairsTriples() {
        console.log("Processing  Pointing Pairs/Triples");
        let possiblesCleared = 0;

        // for each possible value that is present in the tile, build a set of which cells it can be in
        // we then look at which possible values are present in only 2 or 3 cells and then
        // see which of those are only one row number and/or column number
        for (let tileNum = 0; tileNum < boardSize; tileNum++) {
            let cells = this.getOpenCellsTile(tileNum);
            let pMap = this.getPossibleMap(cells);
            // at this point, we know which cells each possible is present in
            // let's find the ones that are in two or three cells and look at them further
            pMap.forEach((set, p) => {
                if (set.size === 2 || set.size === 3) {
                    // need to figure out of these cells are in same row or col
                    ["row", "col"].forEach(dir => {
                        let union = new SpecialSet();
                        for (let cell of set) {
                            union.add(cell[dir]);
                        }
                        // if the union of all the row or col numbers has only one value, they must all have the same value
                        if (union.size === 1) {
                            // all the matched cells must all be in the same row/col here
                            // can clear other possibles from this row/col
                            console.log(`found pointing ${set.size === 2 ? "pair" : "triple"} for possible ${p} consisting of ${sc(set)}`);
                            // now clear things - get the open cells in this row or col
                            let clearCells = new SpecialSet(this.getOpenCellsX(dir, union.getFirst()));
                            // remove any from this tile
                            clearCells.remove(cells);
                            possiblesCleared += this.clearListOfPossibles(clearCells, [p]);
                        }
                    });
                }
            });
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
    //    Get a pMap that tells you which cells each possible is in in the unit
    //    For each possible in the unit, see if it is present in 2 to 4 cells 
    //    If so, create a matchValues set and put this possible in it
    //    For all the other possibles on the first cell that has this possible
    //        Get it's list of cells from the pMap
    //        See if that list of cells is the same as our original match
    //        If so, add it to the matchValues
    //        If we've found enough matches, then we have a hidden (or naked pair)
    //        Clear excess possibles from the matched cells
    processHiddenSubset() {
        console.log("Processing  Hidden Subset");
        let possiblesCleared = 0;
        // analyze all rows, columns and tiles
        this.iterateOpenCellsByStructureAll((cells, type, typeNum) => {
            // get map of possibles in this list of cells
            let pMap = this.getPossibleMap(cells);
            // iterate for each possible that exists in this row/col/tile
            let found = new SpecialSet();
            pMap.forEach((set, p) => {
                let n = set.size;
                // skip possible values that don't have the right number of cells
                // or have already been part of a hidden subset in this group of cells
                if (n >= 2 && n <= 4 && !found.has(p)) {
                    let matchValues = new SpecialSet([p]);
                    // now the goal is to go through each of the possibles on this cell and 
                    // see if they all exist only on the same other n cells
                    // we can start with any cell in the set because if this is a match, the possible have to be on all those cells
                    let c1 = set.getFirst();
                    for (let possible of c1.possibles) {
                        if (possible !== p) {
                            let testSet = pMap.get(possible);
                            // if this other possible is on the exact same set of cells, then count it
                            if (testSet && testSet.equals(set)) {
                                matchValues.add(possible);
                                // if we found enough matches, then we're done
                                if (matchValues.size === n) {
                                    // record that we've already processed these possibles so we don't find the other ends of the match
                                    found.add(matchValues);
                                    console.log(`found hidden ${utils.makeQtyStr(n)} {${matchValues.toNumberString()}} at ${sc(set)}`);
                                    // at this point, we can clear the other possibles from the matched cells 
                                    // that are not part of the hidden set
                                    for (let cell of set) {
                                        let removing = cell.possibles.difference(matchValues);
                                        if (removing.size) {
                                            ++possiblesCleared;
                                            console.log(` removing possibles {${removing.toNumberString()}} from ${cell.pos()}`)
                                            // can just modify possibles without checking for only one possible left
                                            // because by definition, this is a pair, triple or quad so always at least 2 possibles left
                                            cell.possibles.removeNonMatching(matchValues);
                                        }
                                    }
                                    // Interesting note: After you find a hidden subset and remove the other possibles on it, it 
                                    // becomes a naked subset so the naked subset code will get called to see if further possibles
                                    // can be cleared
                                    
                                    break;
                                }
                            }
                        }
                    }
                }
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
            
            // console.log("pMap", pMap);
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
                            let temp = rows;
                            rows = columns;
                            columns = temp;
                        }
                        console.log(`Found x-wing pattern by ${type}: value=${digit} ` +
                            `${this.getCell(rows[0], columns[0]).pos()}, ${this.getCell(rows[0], columns[1]).pos()}, ` + 
                            `${this.getCell(rows[1], columns[0]).pos()}, ${this.getCell(rows[1], columns[1]).pos()}`);
                            
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
                                        console.log(`Removing possible ${digit} from ${cell.pos()}`, cell.possibles);
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
            });
            // typeNum is row/col number, so this is assigning a pMap object for that row/col into the array
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
            console.log(`Output ${tag}:`);
            console.log(arr);
        });  
*/
        
        ["row", "column"].forEach(tag => {
            let arr = candidates[tag];
            
            // build an array of maps for each separate value so we have
            // all the candidate rows for a given cellValue and we can then
            // just look at all permutations of 3 of them at a time
            
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
                    // try all permutations of 3 rows to see if any qualify
                    let permutations = makePermutations(candidateRows, 3);
                    permutations.forEach(arr => {
                        let candidateCells = arr[0].cells.union(arr[1].cells, arr[2].cells);
                        if (candidateCells.size === 3) {
                            let rows = arr.map(item => item.rowNum);
                            console.log(`found swordfish for value ${cellValue}, ${tag === "row" ? "columns" : "rows"} [${candidateCells.toNumberString()}] and ${tag}s [${rows.join(",")}]`);
                            
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
                // The simplest way to do that is to try all permutations of two
                let permutations = makePermutations(candidates, 2);
                permutations.forEach(arr => {
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
                                console.log(`found triplet in same row: ${matches[0].pos()}, ${matches[1].pos()}, ${matches[2].pos()}`)
                            } else if (matches[0].col === matches[1].col && matches[0].col === matches[2].col) {
                                // all in same col
                                console.log(`found triplet in same col: ${matches[0].pos()}, ${matches[1].pos()}, ${matches[2].pos()}`)
                            } else if (matches[0].tileNum === matches[1].tileNum && matches[0].tileNum === matches[2].tileNum) {
                                // all in same tileNum
                                console.log(`found triplet in same tile: ${matches[0].pos()}, ${matches[1].pos()}, ${matches[2].pos()}`)
                            } 
                            // must actually be XYWing pattern
                            console.log(`found XYWing: cells ${cell.pos()}, ${arr[0].pos()}, ${arr[1].pos()}`);

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
        console.log(`XYWing returning ${possiblesCleared} as number of possibles cleared`);
        return possiblesCleared;
        
    }
    
    // type is "row", "column" or "tile"
    // num is the row number, column number or tile number
    // val is the possible value to clear
    // exceptions is a set of indexes or cells not to touch
    clearPossibles(type, num, val, exceptions) {
        let cnt = 0;
        
        // build iteration function name
        let iterateFn = "iterate" + leadingCap(type) + "OpenCells";
        this[iterateFn](num, (cell, index) => {
            // if neither cell or index is in the exceptions list, then we can clear the possible
            if (!exceptions || (!exceptions.has(cell) && !exceptions.has(index))) {
                if (cell.possibles.delete(val)) {
                    console.log(`clearPossibles: cell:${cell.pos()}, val:${val}`);
                    if (cell.possibles.size === 0) {
                        console.log('error: clearPossibles left no possibles'); 
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
            //console.log("Open (" + row + ", " + col + ")", cell.possibles);
            ++cnt;
        });
        return cnt;
    }
    
    outputBoard() {
        let all = [];
        for (let i = 0; i < boardSize; i++) {
            let row = [];
            b.iterateRow(i, (cell, index) => {
                row.push(cell.value);
            });
            all.push(row.join(""));
        }
        console.log(all.join(""));
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
            console.log(row.join(""));
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
//let b = new Board(xywing2);
//let b = new Board(nakedPair1);
//let b = new Board(hiddenTriplet);
//let b = new Board(mypuzzleorg01022017veryhard);
//let b = new Board(hiddenQuad);
let b = new Board(mypuzzleorg01032017veryhard);    

// keep setting possibles while we still find more values to set
// this could be made faster by only revisiting impacted cells
b.outputPossibles(true);
while(b.setAllPossibles()) {}

let processMethods = [
    "processNakedPairs",
    "processPointingPairsTriples",
    "processHiddenSubset",
    "processXwing",
    "processSwordfish",
    "processXYWing"
];

let more = 0;
do {
    console.log(`Still ${b.countOpen()} open cells`);
    b.outputPossibles();
    b.processSingles();
    b.outputPossibles();
    let method;
    for (let pIndex = 0; pIndex < processMethods.length; ++pIndex) {
        // Call all process methods until one returns that it changed something
        // then start back at the beginning to reproces the simpler look at possibles
        // If we get through all of them with nothing changing, then we're done
        b.processSingles();
        b.outputPossibles();
        method = processMethods[pIndex];
        more = b[method]();
        if (more) break;
    }
} while (more);
console.log(`Still ${b.countOpen()} open cells`);
b.checkBoard();
b.outputPossibles();
console.log("Final Board");
b.outputBoard();

