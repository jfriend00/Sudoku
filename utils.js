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


module.exports = {makeQtyStr};

