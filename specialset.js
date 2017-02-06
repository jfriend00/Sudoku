class SpecialSet extends Set {
    constructor(arg) {
        super(arg);
    }
    // static methods
    
    // return new SpecialSet that is the union of all the property values from the iterable
    // can be used to collect all the properties from an iterable of objects
    static unionFromProp(prop, ...iterables) {
        let newSet = new SpecialSet();
        for (let iterable of iterables) {
            newSet.addToFromProp(prop, iterable);
        }
        return newSet;
    }
   
// methods that modify this set all start with "addXX" or "removeXX"

    // iterate through the pass iterable and all all those items to this set
    // it's like .union(), but modifies the current set
    addTo(iterable) {
        for (let item of iterable) {
            this.add(item);
        }
        return this;
    }
    
    // iterate through the iterable and add the value for that property name to the set
    addToFromProp(prop, iterable) {
        for (let item of iterable) {
            this.add(item[prop]);
        }
    }
    
    // remove items in this set that are in the otherIterable
    // returns a count of number of items removed
    // This is overloaded and can be called as:
    // remove(otherIterable)
    // remove(fn);
    // If you pass a function, it works like .filter() on an array except
    // it removes items from the current set rather than create a new set
    remove(arg) {
        let cnt = 0;
        if (typeof arg === "function") {
            // remove(fn)
            for (let item of this) {
                if (arg(item) === false) {
                    this.delete(item);
                    cnt++;
                }
            }
        } else {
            // remove(otherIterable);
            // remove all the items from otherIterable that are in this set
            for (let item of arg) {
                if (this.delete(item)) {
                    ++cnt;
                }
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
    
    
// all other methods, return some value and do not modify the underlying set

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
    
    // Get first value.  
    // Since sets are unordered, this is useful only for getting the ONLY value in the set
    //     when you know that set.size === 1 or when you just want any item in the set
    getFirst() {
        return this.values().next().value;
    }
    
    toArray() {
        return Array.from(this);
    }

    // returns a numerically sorted array of the members of the set
    toSortedArrayNumber() {
        return this.toArray().sort((a,b) => a - b);
    }
    
    // returns a string representatino of the numerically sorted array of the members of the set
    // such as "1,2,3"
    toNumberString() {
        return this.toSortedArrayNumber().join(",");
    }
    
    // returns a representation of the set like: "{1,2,3}" - sorted numerically
    toBracketString() {
        return "{" + this.toNumberString() + "}";
    }
    
    // works like .map() on an array except it only passes the set item to the callback
    // returns an array
    map(fn) {
        let result = [];
        for (let item of this) {
            result.push(fn(item));
        }
        return result;
    }
    
    
    // This is meant to work similarly to [1,2,3].filter(...)
    // Returns a new set with the non-filtered elements in it
    // The callback fn returns true to keep an element
    // The callback function is passed the element to be tested
    filter(fn) {
        let newSet = new SpecialSet();
        // copy over elements that pass the filter
        for (let item of this) {
            if (fn(item) === true) {
                newSet.add(item);
            }
        }
        return newSet;
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
    // otherSet can be any iterable
    difference(otherSet) {
        if (!(otherSet instanceof Set)) {
            otherSet = new SpecialSet(otherSet);
        }
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

class MapOfArrays extends Map {
    constructor(arg) {
        super(arg);
    }
    
    add(key, val) {
        let item = this.get(key);
        if (!item) {
            item = [];
            this.set(key, item);
        }
        item.push(val);
    }
}

// initialize a Map of Sets
// can also pre-initialize sets if desired
class MapOfSets extends SpecialMap {
    constructor(num, baseKey) {
        super();
        if (arguments.length > 0) {
            let base = baseKey || 0;
            let end = base + num;
            for (var i = base; i < end; i++) {
                this.set(i, new SpecialSet());
            }
        }
    }
    add(key, val) {
        let item = this.get(key);
        if (!item) {
            item = new SpecialSet();
            this.set(key, item);
        }
        item.add(val);
    }
    // removes val from the set
    // if set becomes empty, it removes the key
    remove(key, val, clearEmpty = true) {
        let set = this.get(key);
        set.delete(val);
        if (clearEmpty && set.size === 0) {
            this.delete(key);
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



module.exports = {SpecialSet, SpecialMap, MapOfArrays, MapOfSets, MapOfMaps, ArrayOfSets};