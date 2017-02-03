const {SpecialSet, SpecialMap, MapOfArrays, MapOfSets, MapOfMaps, ArrayOfSets} = require('./specialset.js');    
const {cellsToStr, makeCombinations} = require('./utils.js');
const boardSize = 9;


// array of AltChain objects
class AltChainList extends Array {
    constructor(...args) {
        super(...args);
    }
    
    list(board) {
        for (let item of this) {
            item.list(board);
        }
    }
    splitCircular() {
        let circularChains = new AltChainList();
        let nonCircularChains = new AltChainList();
        for (let altChain of this) {
            if (altChain.isCircular()) {
                circularChains.push(altChain);
            } else {
                nonCircularChains.push(altChain);
            }
        }
        return {circularChains, nonCircularChains};
    }
}

// array of sequence objects
// makes a shallow copy of the items in sequenceChain that are passed to constructor
class AltChain extends Array {
    constructor(...args) {
        super(...args);
    }
    
    init(sequenceChain) {
        for (let item of sequenceChain) {
            this.push(Object.assign({}, item));
        }
        return this;
    }
    
    cellsToStr() {
        let cells = super.map(item => item.cell);
        return cellsToStr(cells);
    }
    
    list(board) {
        board.log(' ' + this.cellsToStr());
    }
    
    last() {
        return this.length ? this[this.length - 1] : undefined;
    }
    
    isCircular() {
        if (this.length < 2) return false;
        return this[0].cell.index === this.last().cell.index;
    }
    
    findCell(cell) {
        for (let [index, obj] of this.entries()) {
            if (obj.cell === cell) {
                return index;
            }
        }
        return -1;
    }
    
    getWeakLinks() {
        let weaks = [];
        for (let [i, obj] of this.entries()) {
            if (i > 0 && obj.priorLinkType < 0) {
                weaks.push([this[i-1].cell, obj.cell]);
            }
        }
        return weaks;
    }
    
    getStrongEndCells() {
        // assumption is that ends are always strong
        if (!this.length || this.isCircular()) {
            return null;
        }
        return [this[0].cell, this.last().cell];
    }
    
    getAdjacentStrongLinksCircular() {
        // assumption that there is not more than one set of adjacent strongs in the loop
        if (!this.isCircular()) {
            return null;
        }
        for (let [i, obj] of this.entries()) {
            if (i > 1 && obj.priorLinkType > 0) {
                if (this[i-1].priorLinkType > 0) {
                    return [this[i-2].cell, this[i-1].cell, this[i].cell];
                }
            }
        }
        return null;        
    }
    
}


// this takes an array of cells
class AltChainSet extends SpecialSet {
    constructor(altChain) {
        super();
        if (altChain) {
            this.add(altChain);
        }
    }
    
    static makeStr(altChain) {
        let indexValues = altChain.map(item => item.cell.index);
        if (altChain.isCircular()) {
            // remove trailing circular duplicate so all loops no matter
            // where they start have the same makeStr() signature
            indexValues.pop();
        }
        return indexValues.sort((a, b) => a - b).join(":");
    }
    
    add(altChain) {
        super.add(AltChainSet.makeStr(altChain));
    }
    
    has(altChain) {
        return super.has(AltChainSet.makeStr(altChain));
    }
    
}

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


// pass in a LinkData structure
// create a LinkDataArray structure where keys and lists of cells are
// ordered in arrays so we can more easily sequence through them by index
class LinkDataArray extends MapOfArrays {
    constructor(linkData) {
        super();
        
        this.keys = Array.from(linkData.keys());
        
        for (let [cell, set] of linkData) {
            this.set(cell, Array.from(set));
        }
    }
    
    // get the key cell by index
    getKey(index) {
        return this.keys[index];
    }
    
    // get the next place anchorCell links to by index
    getLinkFrom(anchorCell, index) {
        let cellArray = this.get(anchorCell);
        return cellArray ? cellArray[index] : null;
    }
    
    // return boolean whether this has a link from c1 to c2
    hasLink(c1, c2) {
        let s = this.get(c1);
        if (!s) return false;
        return s.indexOf(c2) !== -1;
    }
}



// ChainSegment is an array of cells
class ChainSegment extends Array {
    constructor(cell) {
        super();
        if (cell) {
            this.push(cell);
        }
    }
}

// A chain is an array of segments that are all connected
// A segment is an array of cells
// A segment may branch off another segment
// If you had just one continuous chain with no branches, you would
//   just have one segment
// If you had one spur off your main chain, you would have two segments
class Chain {
    constructor(segment) {
        this.segments = [];
        if (segment) {
            this.segments.push(segment);
        }
    }
    
    addSegment(segment) {
        this.segments.push(segment);
    }
    
    remove(segment) {
        let index = this.segments.indexOf(segment);
        if (index !== -1) {
            this.segments.splice(index, 1);
        }
    }
    list(board) {
        for (let [index, segment] of this.segments.entries()) {
            board.log(`  segment ${index + 1} of ${this.segments.length} ${cellsToStr(segment)}`);
        }
    }
    
    clone() {
        let newChain = new Chain();
        // copy over all segments
        for (let segment of this.segments) {
            this.segments.push(segment.slice());
        }
    }
}

// this is a list of Chain objects
// the chainMap tells us what chain is associated with a given cell
// it helps us find intesecting chain segments and combine them into the
// same chain
class ChainList {
    constructor() {
        this.chains = [];
        this.chainMap = new SpecialMap();
    }
    
    remove(chain) {
        let index = this.chains.indexOf(chain);
        if (index !== -1) {
            this.chains.splice(index, 1);
        }
    }
    
    list(board, msg = "") {
        board.log(`Listing chains ${msg}`);
        for (let [index, chain] of this.chains.entries()) {
            board.log(` chain ${index + 1} of ${this.chains.length}`);
            chain.list(board);
        }
    }
    
    add(chain) {
        this.chains.push(chain);
    }
    
    // add a cell to a segment, returns segment and chain it was added to
    // if segment is passed, then chain must be the chain the segment is in
    // segment and chain may be null if starting a new segment
    addToSegment(cell, chain, segment) {
        if (!segment) {
            segment = new ChainSegment(cell);
        } else {
            segment.push(cell);
        }
        if (!chain) {
            chain = new Chain(segment);
            this.chains.push(chain);
        }
        
        let currentChain = chain;
        
        // if the cell is already in another chain, then move this segment to that chian
        let otherChain = this.chainMap.get(cell);
        if (otherChain && otherChain !== currentChain) {
            console.log(` found intersection with other chain, moving segment ${cellsToStr(segment)} to that chain`);
            currentChain = otherChain;

            // remove prior chain from the ChainList since it is no longer used
            // FIXME: may have to move all segments in this chain object to that other chain object
            this.remove(chain);
            
            otherChain.addSegment(segment);
            
            // now fix the chainMap entries for this segment to point to the new chain
            for (let cell of segment) {
                this.chainMap.set(cell, otherChain);
            }
        } else {
            this.chainMap.set(cell, currentChain);
        }
        
        return {currentChain, segment};
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
            let chainList = new ChainList();
            allChains[p] = chainList;
            let {strongLinkData} = this.getLinkDataObj(p);

            // variables used in processing a chain segment
            let segment, curLink, nextLink, currentChain;
            
            while (true) {
                if (!curLink) {
                    curLink = strongLinkData.getStartingPoint();
                    if (!curLink) {
                        break;
                    }
                    board.log(` Chain start: ${curLink.xy()}`);
                    ({currentChain, segment} = chainList.addToSegment(curLink));
                }
                nextLink = strongLinkData.getNextLink(curLink);
                if (nextLink) {
                    board.log(` Link to: ${nextLink.xy()}`);
                    // remove this link from the link data since it is now used
                    strongLinkData.removeLink(curLink, nextLink);
                    
                    // add this link to the current segment
                    ({currentChain, segment} = chainList.addToSegment(nextLink, currentChain, segment));
                }
                curLink = nextLink;
            }
            chainList.list(board);
        }
        return allChains;
    }
    
    
    makeAlternatingChains() {
        let board = this.board;
        let allChains = [];
        // loop for each possible value
        for (let p = 1; p <= boardSize; p++) {
            board.log(`Building x cycle chains for possible ${p}`);
            // list of chains we've formed that are worth keeping
            let chainList = new AltChainList();
            allChains[p] = chainList;
            
            let {strongLinkData, weakLinkData, allCells} = this.getLinkDataObj(p);
            
            let strongArrays = new LinkDataArray(strongLinkData);
            let weakArrays = new LinkDataArray(weakLinkData);
            
            
            // while in the process of creating the chain, we keep a data structure that is an array of this:
            // [{cell: cell, index: index, priorLinkType: 1}]
            // cell is the cell involved in this part of the chain
            // index is the index in the LinkDataArray for the previous cell in the chain
            // priorLinkType is 1 for a strong link, -1 for a weak link
            // The general idea here is that when we need to backtrack, we can 
            //    take the previous cell in the chain and this index
            //    increment the index and then try the next cell that
            //    the previous cell links to
            // This allows us to backtrack in what we've built so far to try other
            //     combinations of linked cells.  If we keep incrementing each index
            //     and try all legal values of each index, we will eventually build all
            //     possible chains
            
            // seed the chain with the first strong link we have
            // we set the prior link type to -1 so we'll get a strong link from here to start the chain
            let firstIndex = 0;
            let firstCell = strongArrays.getKey(firstIndex);
            if (!firstCell) continue;
            let linkSequence = [{cell: firstCell, index: 0, priorLinkType: -1}];
            let cellSet = new SpecialSet([firstCell]);
            board.log(`New chain start ${firstCell.xy()}`);
            let altChainSet = new AltChainSet();
            while (true) {
                // the purpose of this look is to get next link in the chain
                let lastPoint = linkSequence[linkSequence.length - 1];
                let linkType = lastPoint.priorLinkType * -1;
                
                // get the right type of data for the next link 
                let linkData = linkType < 0 ? weakArrays : strongArrays;
                
                let nextCell = linkData.getLinkFrom(lastPoint.cell, lastPoint.index);
                let closedChain = false;
                if (nextCell) {
                    closedChain = cellSet.has(nextCell);
                    if (closedChain) {
                        board.log(` link to ${nextCell.xy()} and loop found to end the chain`);
                    } else {
                        board.log(` link to ${nextCell.xy()}`);
                    }
                    cellSet.add(nextCell);
                    linkSequence.push({cell: nextCell, index: 0, priorLinkType: linkType});
                } else {
                    board.log(` did not find ${linkType > 0 ? "strong" : "weak"} link from ${lastPoint.cell.xy()}`);
                }
                // we terminate the chain if we've closed a loop or if we don't have another link in the chain
                if (!nextCell || closedChain) {
                    // Evaluate if the linkSequence we have so far is something we should save
                    // FIXME: this needs more code, but for now I will save anything that is at least 4 points and ends with a strong link
                    let altChain = new AltChain().init(linkSequence);
                    
                    // if it was a closed chain, then remove any tail from the altChain
                    if (closedChain) {
                        let foundIndex = altChain.findCell(nextCell);
                        if (foundIndex > 0) {
                            // check to see if making this circular here would make weak link ==> weak link
                            if (linkType < 0 && altChain[foundIndex + 1].priorLinkType < 0) {
                                board.log(`!!found weak ==> weak circular for possible ${p} at ${nextCell.xy()} ${altChain.cellsToStr()}`);
                            }
                            
                            // removing leading elements up to the point of circular connection
                            // so there are no spurious tails
                            altChain.splice(0, foundIndex);
                        }
                    }
                    if (linkSequence.length >= 4) {
                        // make a chain from this and save it
                        // if the chain ends in a weak link, remove it from the segment we are saving unless it's a closed Chain
                        // the last link can be weak if its circular
                        if (!closedChain && altChain.last().priorLinkType < 0) {
                            altChain.pop();
                        }
                        if (!altChainSet.has(altChain)) {
                            altChainSet.add(altChain);
                            board.log(`Add chain ${altChain.cellsToStr()}`);
                            chainList.push(altChain);
                        }
                    }
                    
                    
                    // backtrack and try other paths
                    // get rid of the last point we had because it had no more places to go
                    linkSequence.pop();
                    // if sequence is empty, use firstIndex to start a new one
                    if (linkSequence.length === 0) {
                        let nextStartCell = strongArrays.getKey(++firstIndex);
                        if (!nextStartCell) {
                            break;
                        }
                        board.log(`New chain start ${nextStartCell.xy()}`);
                        linkSequence.push({cell: nextStartCell, index: 0, priorLinkType: -1});
                    } else {
                        // increment the index here and loop again
                        lastPoint = linkSequence[linkSequence.length - 1];
                        board.log(`Backtracking and incrementing index from ${lastPoint.cell.xy()}`);
                        ++lastPoint.index;
                    }
                    
                    // re-initialize cellSet
                    cellSet.clear();
                    for (let point of linkSequence) {
                        cellSet.add(point.cell);
                    }
                }
                
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