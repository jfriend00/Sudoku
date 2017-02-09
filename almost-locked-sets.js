const {SpecialSet} = require('./specialset.js');
const {cellsToStr} = require('./utils.js');
const {LinkSet, getPossibleMap, canSeeEachOther} = require('./links.js');

class AlmostLockedSets {
    constructor(board) {
        this.board = board;
        this.multiData = [];
        this.singleData = [];
        this.linkSet = new LinkSet();
        
        this.build();

    }
    
    add(set) {
        function collectPossibles(s) {
            let allPossibles = new SpecialSet();
            for (let cell of s) {
                allPossibles.addTo(cell.possibles);
            }
            return allPossibles;
        }
        
        // only add a set of cells once, no matter how we found them
        if (!this.linkSet.has(set)) {
            this.linkSet.add(set);
            if (set.size === 1) {
                this.singleData.push(set);
            } else {
                this.multiData.push(set);
                // pre-compute pMap
                set.pMap = getPossibleMap(set);
            }
            
            // now pre-compute some data on this set that we will need later
            set.allPossibles = collectPossibles(set);
        }
    }
    
    build() {
        let board = this.board;
        board.iterateOpenCellsByStructureAll((cells, tag, num) => {
            let pMap = getPossibleMap(cells);
            
            // first add all single cells with only two possibles as an ALS
            //   because these are an ALS all by themselves
            for (let cell of cells) {
                if (cell.possibles.size === 2) {
                    this.add(new SpecialSet([cell]));
                }
            }
            
            // now find all ALS where every member has one particular possible in it
            for (let [p, set] of pMap) {
                // for the cells that have the possible p, 
                //   lets see how many other possibles are in those cells
                // This only finds ALS that have at least one candidate in all the cells
                let union = new SpecialSet();
                for (let cell of set) {
                    union.addTo(cell.possibles);
                }
                if (union.size === set.size + 1) {
                    board.log(`found almost locked set on ${union.toBracketString()} with cells ${cellsToStr(set)}`);
                    this.add(set);
                }
            }
            
            // still need to find ALS that don't have one possible present in every cell of the ALS
            // will probably have to make combinations for that
        });
    }
    
    diagnose() {
        let board = this.board;
        
        // let's first compare each single cell ALS to all the other ALS
        
        // Conditions
        // 1) The two ALS must not share cells
        // 2) The two ALS must have at least one common possible
        // 3) The two ALS can each see at least some of the other ALS
        // 4) At least one common possible from one ALS must be able to see all the occurrences of that
        //    possible in the other ALS.  This is a restricted possible, referred to as the X candidate.
        // 5) Non-restricted possibles (referred to as the Z candidate) are those that exist in both ALS sets, 
        //    but are not restricted.  So, for clarity here, we have three types of possibles, restricted, 
        //    non-restricted and non-common where non-common are those that are not shared between the two sets.
        // 6) 
        for (let single of this.singleData) {
            let singleCell = single.getFirst();
            let singleBuddies = board.getOpenCellsBuddies(singleCell, true);
            for (let multi of this.multiData) {
                // two ALS sets must not share cells
                if (single.intersection(multi).size !== 0) continue;
                let commonPossibles = singleCell.possibles.intersection(multi.allPossibles);
                // there must be at least one common possible
                if (commonPossibles.size === 0) continue;
                
                // must be able to see each other
                if (!canSeeEachOther(multi, single)) continue;
                
                board.log(`examining ALS unit ${singleCell.xy()} vs. ${cellsToStr(multi)}`);

                // let's start building a set of candidates that we can use for removal
                // start with the common possibles (and then remove restricted ones)
                let removalCandidates = commonPossibles.clone();
                
                // now find any restricted candidates
                let foundRestricted = false;
                for (let p of commonPossibles) {
                    // if any common possible shares visibility with all the other ones
                    // then, it is a restricted candidate and cannot be used for removal
                    if (board.doTheyShareVisibilitySet(singleCell, multi.pMap.get(p))) {
                        foundRestricted = true;
                        removalCandidates.delete(p);
                    }
                }
                // FIXME: I think the various rules are saying that there has to be at least one restricted candidate
                // so we put that in here
                if (foundRestricted) {
                    // the ones that are left here in removalCandidates are
                    //    common between the two sets
                    //    not restricted
                    // therefore, it can exist in both sets at the same time
                    // and can be used for removal consideration
                    
                    // for each removal candidate, we need to collect all cells that have that candidate 
                    // from both sets and then any cells that can see all of those cannot contain that candidate
                    for (let p of removalCandidates) {
                        let removalCells = singleBuddies;
                        let keyCells = multi.pMap.get(p);
                        for (let cell of keyCells) {
                            removalCells = removalCells.intersection(board.getOpenCellsBuddies(cell, true)); 
                        }
                        // here removalCells is the intersection of cells that can see all the cells in 
                        //   both ALS units that have possible p
                        // Those are the cells we can remove possible p from
                        for (let cell of removalCells) {
                            if (cell.possibles.has(p)) {
                                board.log(` found removal of ${p} in ${cell.xy()}`);
                            }
                        }
                    }
                }
            }
        }
    }
}

module.exports = {AlmostLockedSets};