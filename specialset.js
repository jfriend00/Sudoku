class SpecialSet extends Set {
    constructor(arg) {
        super(arg);
    }
   
    addTo(iterable) {
        for (let item of iterable) {
            this.add(item);
        }
    }
    
    equals(otherSet) {
        if (otherSet.size !== this.size) return false;
        let equals = true;
        for (let item of otherSet) {
            if (!this.has(item)) {
                equals = false;
            }
        }
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
        for (let item of otherIterable) {
            if (this.delete(item)) {
                ++cnt;
            }
        }
        return cnt;
    }
    
    // remove the items from this set that are not in the other iterable
    // return the  number of items removed
    removeNonMatching(iterable) {
        let cnt = 0;
        // if iterable has a "has" property, then we can just use it directly
        let other = iterable.hasOwnProperty("has") ? iterable : new SpecialSet(iterable);
        for (let item of this) {
            if (!other.has(item)) {
                this.delete(item);
                ++cnt;
            }
        }
        return cnt;
    }
    
    // pass callback function that returns true to keep, false to remove
    // The callback function is passed the element to be tested
    removeCustom(fn) {
        let cnt = 0;
        for (let item of this) {
            if (fn(item) === false) {
                this.delete(item);
                cnt++;
            }
        }
        return cnt;
    }
    
    // returns boolean whether every element in this set is in otherSet
    isSubsetOf(otherSet) {
        for (let key of this) {
            if (!otherSet.has(key)) {
                return false;
            }
        }
        return true;
    }
    
    // returns a new set of keys that are in this set, but not in otherSet
    difference(otherSet) {
        let newSet = new SpecialSet();
        for (let key of this) {
            if (!otherSet.has(key)) {
                newSet.add(key);
            }
        }
        return newSet;
    }
    
    // return union of two or more sets
    union(...otherSets) {
        let newSet = new SpecialSet(this);
        for (let s of otherSets) {
            for (let key of s) {
                newSet.add(key);
            }
        }
        return newSet;
    }
    
    // returns a new set that contains keys that are in both sets
    intersection(iterable) {
        let newSet = new SpecialSet();
        for (let key of iterable) {
            if (this.has(key)) {
                newSet.add(key);
            }
        }
        return newSet;
    }    
    
    // return a copy of the current set
    clone() {
        return new SpecialSet(this);
    }
}    


module.exports = SpecialSet;