const {SpecialSet, SpecialMap, MapOfArrays, MapOfSets, MapOfMaps, ArrayOfSets} = require('./specialset.js');    
const {cellsToStr, makeCombinations} = require('./utils.js');
const boardSize = 9;

// Used for keeping track of which links we've already used.  
// Forms a unique string representation of the cells in the set using
// the cell indexes.  Then, adds that string to a Set
class LinkSet extends SpecialSet {
    constructor(iterable) {
        super();
        if (iterable) {
            this.addTo(iterable);
        }
    }
    
    static makeStr(set) {
        return set.map(cell => cell.index).sort((a, b) => b - a).join(":");
    }
    
    add(set) {
        // create a string representation of the cells in the set
        // that consists of their indexes separate by colons
        // to make it canonical, we do a numeric sort
        super.add(LinkSet.makeStr(set));
        return this;
    }
    
    addTo(iterable) {
        for (let set of iterable) {
            this.add(set);
        }
        return thisl;
    }
    
    has(set) {
        return super.has(LinkSet.makeStr(set));
    }
}

// map:
//   data indexed by cell
//   value is a set of other cells that have a strong link with cell
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

// Collect strong links for each possible
// And get all cells for each possible
class AllLinkData {
    constructor(board) {
        this.build(board);
    }
    
    build(board) {
        this.board = board;
        this.data = [];
        let data = this.data;
        
        for (let i = 1; i <= boardSize; i++) {
            // LinkData is MapOfSets where the index is a cell, data is a set of cells that link to it
            data[i] = {
                strongLinkData: new LinkData(),
                weakLinkData: new LinkData(),
                allCells: new SpecialSet()
            };
        }
        board.iterateCellsByStructureAll((cells, tag, num) => {
            let pMap = board.getPossibleMap(cells);
            for (let [p, set] of pMap) {
                // only need to collect allCells once in one orientation
                if (tag === "row") {
                    data[p].allCells.addTo(set);
                }
                if (set.size === 2) {
                    let strongLinkData = data[p].strongLinkData;
                    let arr = set.toArray();
                    // each cell is a strong link to each other
                    strongLinkData.add(arr[0], arr[1]);
                    strongLinkData.add(arr[1], arr[0]);
                } else if (set.size > 2) {
                    let weakLinkData = data[p].weakLinkData;
                    // we need to generate all combinations of the cells in this set as weak links
                    let combos = makeCombinations(set, 2);
                    for (let combo of combos) {
                        // add both directions of weak links
                        weakLinkData.add(combo[0], combo[1]);
                        weakLinkData.add(combo[1], combo[0]);
                    }
                }
            }
        });
    }
    
    // type = "strong" or "mixed"
    makeStrongChains(type) {
    }
    
    list() {
        for (let p = 1; p <= boardSize; p++) {
            for (let [cell, set] of this.data[p].strongLinkData) {
                this.board.log(`Strong links with ${p} from ${cell.xy()} to: ${cellsToStr(set)}`)
            }
            for (let [cell, set] of this.data[p].weakLinkData) {
                this.board.log(`Weak links with ${p} from ${cell.xy()} to: ${cellsToStr(set)}`)
            }
        }
    }
    
    getLinkDataObj(p) {
        return this.data[p];
    }
}

module.exports = {LinkData, AllLinkData};