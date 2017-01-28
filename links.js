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

// A chain is an array of segments that are all connected
// A segment is an array of cells
// A segment may branch off another segment
// If you had just one continuous chain with no branches, you would
//   just have one segment
// If you had one spur off your main chain, you would have two segments
class ChainObject {
    constructor(beginningCell) {
        this.chains = [[beginningCell]];
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
    
    // Return strong chain list
    // array of chains for each possible value
    // allChains[p] === {chains: [chain1, chain2]}
    // so for possible value 3
    //     allChains[3] == array of chain objects 
    //     A chain object is one of these: {chains: [cell1, cell2, cell3]}
    makeStrongChains() {
        let board = this.board;
        
        let allChains = [];
        // loop for each possible value
        for (let p = 1; p <= boardSize; p++) {
            board.log(`Building x chains for possible ${p}`);
            let pChains = [];
            allChains[p] = pChains;
            let {strongLinkData, weakLinkData, allCells} = this.getLinkDataObj(p);

            // variables used in processing a chain segment
            let chain, curLink, nextLink, currentChainObj;
            
            // the chainMap tells us what chainObj is associated with a given cell
            // it helps us find intesecting chain segments and combine them into the
            // same chainObj
            let chainMap = new SpecialMap();
            
            while (true) {
                if (!curLink) {
                    curLink = strongLinkData.getStartingPoint();
                    if (!curLink) {
                        break;
                    }
                    board.log(` Chain start: ${curLink.xy()}`);
                    // create a new chain object here which consists of an array of chains 
                    //    and a set of all cells in all the chain segments
                    chain = [curLink];                         // array of cells in this chain segment in chain order
                    
                    // if we find this cell in the chainMap, then rather than start a new chainObj, we
                    // should add this chain segment to that other chainObj
                    let foundChainObj = chainMap.get(curLink);
                    if (foundChainObj) {
                        // add this chain to the other chain obj
                        foundChainObj.chains.push(chain);
                        board.log(` New chain at ${curLink.xy()} is part of prior chain`);
                    } else {
                        // create a new chain obj
                        currentChainObj = {chains: [chain]};
                        pChains.push(currentChainObj);
                        chainMap.set(curLink, currentChainObj);
                    }
                }
                nextLink = strongLinkData.getNextLink(curLink);
                if (nextLink) {
                    board.log(` Link to: ${nextLink.xy()}`);
                    strongLinkData.removeLink(curLink, nextLink);
                    let foundChainObj = chainMap.get(nextLink);
                    if (foundChainObj && foundChainObj !== currentChainObj) {
                        // need to move this chain to the chainObj we found
                        board.log(` Chain in progress ${cellsToStr(chain)} found to be part of prior chain at ${nextLink.xy()}`);
                        foundChainObj.chains.push(chain);
                        currentChainObj = foundChainObj;
                        // remove the chainObj we were using
                        pChains.pop();
                        
                        // now reset chainMap for every cell in the chain so far to the new chainObj
                        for (let cell of chain) {
                            chainMap.set(cell, currentChainObj);
                        }
                        
                    } 
                    chain.push(nextLink);
                    chainMap.set(nextLink, currentChainObj);
                }
                curLink = nextLink;
            }
        }
        return allChains;
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
    
    getAllCells(p) {
        return this.data[p].allCells;
    }
}
module.exports = {LinkData, AllLinkData};