function makeQtyStr(val) {
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

function cellsToStr(collection) {
    let results = [];
    for (let cell of collection) {
        results.push(cell.xy());
    }
    return results.join(" ");
}


// capitalize the first letter of the passed in string
function leadingCap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// return an array of arrays with all combinations of num length of the original
// array cells where order does not matter
// got this code online: http://www.w3resource.com/javascript-exercises/javascript-function-exercise-21.php
// This code is a little brute force in that it's making all possible permutations and 
// then just returning the ones of desired length, but for smallish arrays, it is easy
// The incoming array argument can be either an array or a Set
function makeCombinations(array, len) {
    let arr = array;
    if (arr instanceof Set) {
        arr = Array.from(array);
    }
    let resultSet = [], result, x, i;
    
    // shortcut special cases
    if (arr.length < len) return [];
    if (arr.length === len) return [arr.slice(0)];    // return array of a single array (one combination)
    if (len === 1) {
        for (i = 0; i < arr.length; i++) {
            resultSet.push([arr[i]]);
        }
        return resultSet;
    }        

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




module.exports = {makeQtyStr, makeCombinations, leadingCap, cellsToStr};

