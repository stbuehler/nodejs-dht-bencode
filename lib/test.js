var assert = require('assert');
var bencode = require('./bencode');


assert.equal("d3:abci0e6:lengthi5ee", bencode.bencode({ "length": 5, "abc": 0 }));
assert.equal("l4:abcd4:fghie", bencode.bencode(["abcd", "fghi"]));
