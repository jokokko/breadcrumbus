module.exports = {
	 "env": {
        "es6": true,
		"browser": true
    },	
	"parserOptions": {
        "ecmaVersion": 8        
    },
    "extends": "eslint:recommended",
    "rules":{
        "no-console":0
    },
	"globals": {
        "browser": false,
		"angular": false,
        "contracts": false,
		"addinSettings": false,
        "psl": false
    }
};