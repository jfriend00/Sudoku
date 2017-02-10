"use strict";

const {SpecialSet} = require('./specialset.js');
const {cellsToStr, makeCombinations} = require('./utils.js');
const {LinkSet, getPossibleMap, canSeeEachOther} = require('./links.js');

class AlmostLockedSets {
    constructor(board) {
        this.board = board;
        this.multiData = [];
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
            this.multiData.push(set);
            // pre-compute pMap
            set.pMap = getPossibleMap(set);
            
            // now pre-compute some data on this set that we will need later
            set.allPossibles = collectPossibles(set);
        }
    }
    
    build() {
        let board = this.board;
        board.iterateOpenCellsByStructureAll((cells, tag, num) => {
            let bound = Math.min(5, cells.length);
            for (let i = 2; i < bound; i++) {
                let combos = makeCombinations(cells, i);
                // examine each combo to see if it is an ALS
                for (let sequence of combos) {
                    let union = new SpecialSet();
                    for (let cell of sequence) {
                        union.addTo(cell.possibles);
                    }
                    if (union.size === sequence.length + 1) {
                        this.add(new SpecialSet(sequence));
                    }
                }
                
            }
            
            // then add all single cells with only two possibles as an ALS
            //   because these are an ALS all by themselves
            for (let cell of cells) {
                if (cell.possibles.size === 2) {
                    this.add(new SpecialSet([cell]));
                }
            }
        });
    }
    
    run(queue) {
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
        for (let base of this.multiData) {
            for (let target of this.multiData) {
                
                // skip comparison to self
                if (base === target) continue;
                
                // two ALS sets must not share cells
                if (base.intersection(target).size !== 0) continue;
                
                // there must be at least one common possible
                let commonPossibles = base.allPossibles.intersection(target.allPossibles);
                if (commonPossibles.size === 0) continue;
                
                // must be able to see each other (share some row, col or tile)
                if (!canSeeEachOther(base, target)) continue;
                
                //board.log(`examining ALS unit ${cellsToStr(base)} vs. ${cellsToStr(target)}`);

                // let's start building a set of candidates that we can use for removal
                // start with the common possibles (and then remove restricted ones)
                let removalCandidates = commonPossibles.clone();
                
                // now find any restricted candidates
                let foundRestricted = false;
                for (let p of commonPossibles) {
                    // if any common possible shares visibility with all the other ones
                    // then, it is a restricted candidate and cannot be used for removal
                    
                    // Get all the cells in the base that have this possible
                    // Then see if each one can see all the other cells with this
                    // possible in the target.  If so, this is restricted and cannot occur in both.
                    let baseSet = base.pMap.get(p);
                    let allVisible = true;
                    for (let cell of baseSet) {
                        if (!board.doTheyShareVisibilitySet(cell, target.pMap.get(p))) {
                            allVisible = false;
                            break;
                        }
                    }
                    if (allVisible) {
                        foundRestricted = true;
                        removalCandidates.delete(p);
                    }
                }
                if (foundRestricted) {
                    // the ones that are left here in removalCandidates are
                    //    common between the two sets
                    //    not restricted
                    // therefore, it can exist in both sets at the same time
                    // and can be used for removal consideration
                    
                    // for each removal candidate, we need to collect all cells that have that candidate 
                    // from both sets and then any cells that can see all of those cannot contain that candidate
                    for (let p of removalCandidates) {
                        let removalCells = board.getCommonBuddies(base.pMap.get(p), target.pMap.get(p));
                        // here removalCells is the intersection of cells that can see all the cells in 
                        //   both ALS units that have possible p
                        // Those are the cells we can remove possible p from
                        for (let cell of removalCells) {
                            if (cell.possibles.has(p)) {
                                let msg = ` found ALS removal of ${p} in ${cell.xy()} via ALS unit ${cellsToStr(base)} vs. ${cellsToStr(target)}`;
                                board.log(msg);
                                queue.clearPossibles([cell], [p], msg, 1);
                            }
                        }
                    }
                }
            }
        }
    }
}

module.exports = {AlmostLockedSets};