const {SpecialSet, SpecialMap, MapOfArrays, MapOfSets, MapOfMaps, ArrayOfSets} = require('./specialset.js');    
const cellsToStr = require('./utils.js').cellsToStr;
const boardSize = 9;

// map:
// data indexed by cell
// value is a set of other cells that have a strong link with cell
class LinkData extends MapOfSets {
    constructor() {
        super();
    }
    
    // get any cell that still has links to it
    getStartingPoint() {
        let keyCells = Array.from(this.keys());
        return keyCells.length ? keyCells[0] : null;
    }
    
    getNextLink(cell) {
        let s = this.get(cell);
        return s ? s.getFirst() : null;
    }
    
    // remove a link and it's back link from the map
    removeLink(c1, c2) {
        this.remove(c1, c2);
        this.remove(c2, c1);
    }
}

class StrongLinkData {
    constructor(board) {
        this.build(board);
    }
    
    build(board) {
        this.board = board;
        this.data = [];
        let data = this.data;
        
        for (let i = 1; i <= boardSize; i++) {
            data[i] = new LinkData();
        }
        board.iterateCellsByStructureAll((cells, tag, num) => {
            let pMap = board.getPossibleMap(cells);
            for (let [p, set] of pMap) {
                if (set.size === 2) {
                    let arr = set.toArray();
                    // each cell is a strong link to each other
                    data[p].add(arr[0], arr[1]);
                    data[p].add(arr[1], arr[0]);
                }
            }
        });
    }
    
    list() {
        for (let p = 1; p <= boardSize; p++) {
            let data = this.data[p];
            for (let [cell, set] of data) {
                this.board.log(`Strong links with ${p} from ${cell.xy()} to: ${cellsToStr(set)}`)
            }
        }
    }
    
    getLinkData(p) {
        return this.data[p];
    }
}

module.exports = {LinkData, StrongLinkData};