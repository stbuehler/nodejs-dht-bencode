var assert = require('assert');
var bencode = require('./bencode');

// deepEqual is needed to compare Buffer with Buffer, but can't compare strings with Buffers
// equal can compare strings with strings and strings with Buffers, but not Buffers with Buffers
// not documented ofc.

function checkEqual(enc, obj) {
	assert.equal(enc, bencode.bencode(obj));
	assert.equal(enc, bencode.bencode(bencode.bdecode(enc)));
	assert.deepEqual(obj, bencode.bdecode(enc));
}

function checkDecodeThrows(enc, errclass, errmessage, msg) {
	assert.throws(function() { bencode.bdecode(enc)}, function(e) {
		return ((e instanceof errclass) && (errmessage == e.message))
	}, msg);
}

checkEqual("d3:abci0e6:lengthi5ee", { "length": 5, "abc": 0 });

checkEqual("l4:abcd4:fghie", [new Buffer("abcd"), new Buffer("fghi")]);
checkEqual("13:umlaut:äöü", new Buffer("umlaut:äöü"));

checkDecodeThrows("7:contentpadding", bencode.PaddingError, "bencoded string contained too much data");
assert.deepEqual(new Buffer("content"), bencode.bdecode("7:contentpadding", true));

checkDecodeThrows("test", Error, "couldn't find colon");
checkDecodeThrows("0", Error, "couldn't find colon");
checkDecodeThrows("4x:test", Error, "string length is not numeric");
checkDecodeThrows("5:test", Error, "unexpected end of data");

checkDecodeThrows("i-42", Error, "couldn't find end of int");
checkDecodeThrows("i0x2ae", Error, "number contains non-digits");

checkDecodeThrows("d3:key", Error, "unexpected end of data");
checkDecodeThrows("d3:key5:value", Error, "unexpected end of data");

checkDecodeThrows("l", Error, "unexpected end of data");
checkDecodeThrows("l7:element", Error, "unexpected end of data");

checkDecodeThrows("d3:kez0:3:key0:e", Error, "wrong key order in dictionary");
checkDecodeThrows("d3:key0:3:key0:e", Error, "duplicate key in dictionary");
