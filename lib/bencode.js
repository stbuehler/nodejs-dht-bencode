/* http://natsuki.weeaboo.se:8080/~valderman/files/bencode.js */
/* Copyright (c) 2009 Anton Ekblad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software. */

/* modified by Stefan Buehler to use node.js Buffers (c) 2010 */

if (!Buffer.prototype.charAt) Buffer.prototype.charAt = function charAt(i) {
	return String.fromCharCode(this[i]);
};

// bencode an object
function bencode(obj) {
	switch(btypeof(obj)) {
		case "string":     return bstring(obj);
		case "number":     return bint(obj);
		case "list":       return blist(obj);
		case "dictionary": return bdict(obj);
		default:           throw new Error('cannot encode element ' + obj);
	}
}

exports.bencode = bencode;

// decode a bencoded string into a javascript object
function bdecode(str) {
	if (!(str instanceof Buffer)) {
		str = new Buffer(str);
	}
	var dec = bparse(str, 0);
	if(dec !== null && dec[1] === str.length)
		return dec[0];
	throw new Error("couldn't decode data");
}

exports.bdecode = bdecode;

// parse a bencoded string; bdecode is really just a wrapper for this one.
// all bparse* functions return an array in the form
// [parsed object, remaining string to parse]
function bparse(str, pos) {
	switch(str.charAt(pos)) {
		case "d": return bparseDict(str, pos+1);
		case "l": return bparseList(str, pos+1);
		case "i": return bparseInt(str, pos+1);
		default:  return bparseString(str, pos);
	}
}

function findchar(str, pos, c) {
	while (pos < str.length) {
		if (str.charAt(pos) === c) return pos;
		++pos;
	}
	return -1;
}

function copy(str, start, len) {
	return str.slice(start, start+len);
// 	var buf = new Buffer(len);
// 	str.copy(buf, 0, start, start+len);
// 	return buf;
}

// parse a bencoded string
function bparseString(str, pos) {
	var colon, str2, len;
	colon = findchar(str, pos, ':');
	if (-1 === colon) throw new Error("couldn't find colon");
	str2 = str.toString('ascii', pos, colon);
	if(isNum(str2)) {
		len = parseInt(str2);
		return [ copy(str, colon+1, len), colon+1+len ];
	}
	throw new Error("string length is not numeric");
}

// parse a bencoded integer
function bparseInt(str, pos) {
	var end = findchar(str, pos, 'e');
	if (-1 === end) throw new Error("couldn't find end of int");
	var str2 = str.toString('ascii', pos, end);
	if(!isNum(str2))
		throw new Error("number contains non-digits");
	return [Number(str2), end+1];
}

// parse a bencoded list
function bparseList(str, pos) {
	var p, list = [];
	while (pos < str.length && str.charAt(pos) !== "e") {
		p = bparse(str, pos);
		if (null === p) throw new Error("unexpected null element");
		list.push(p[0]);
		pos = p[1];
	}
	if (pos >= str.length) throw new Error("unexpected end of data");
	return [list, pos+1];
}

// parse a bencoded dictionary
function bparseDict(str, pos) {
	var key, val, dict = {};
	while (pos < str.length && str.charAt(pos) !== "e") {
		key = bparseString(str, pos);
		if (null === key) throw new Error("unexpected null element");
		pos = key[1];
		if (pos >= str.length) throw new Error("unexpected end of data");

		val = bparse(str, pos);
		if (null === val) throw new Error("unexpected null element");

		dict[key[0]] = val[0];
		pos = val[1];
	}
	if (pos >= str.length) throw new Error("unexpected end of data");
	return [dict, pos+1];
}

// is the given string numeric?
function isNum(str) {
	var i, c;
	str = str.toString();
	if(str.charAt(0) === '-') {
		i = 1;
	} else {
		i = 0;
	}

	for(; i < str.length; ++i) {
		c = str.charCodeAt(i);
		if (c < 48 || c > 57) {
			return false;
		}
	}
	return true;
}

// returns the bencoding type of the given object
function btypeof(obj) {
	var type = typeof obj;
	if (null === obj) return "null";
	if (type === "object") {
		if (obj instanceof Buffer) return "string";
		if (obj instanceof Array) return "list";
		return "dictionary";
	}
	return type;
}

// bencode a string
function bstring(str) {
	if (str instanceof Buffer) {
		var len = str.length;
		var slen = len.toString() + ":";
		var buf = new Buffer(slen.length + len);
		buf.write(slen, 0, 'utf8');
		str.copy(buf, slen.length, 0, len);
		return buf;
	} else {
		var len = Buffer.byteLength(str, 'utf8');
		var slen = len.toString() + ":";
		var buf = new Buffer(slen.length + len);
		buf.write(slen, 0, 'utf8');
		buf.write(str, slen.length, 'utf8');
		return buf;
	}
}

// bencode an integer
function bint(num) {
	return new Buffer("i" + num + "e", 'utf8');
}

// bencode a list
function blist(list) {
	var enclist, i, l, buflen, b, buf, pos;

	enclist = [];
	buflen = 2;

	for (i = 0, l = list.length; i < l; ++i) {
		b = bencode(list[i]);
		enclist.push(b);
		buflen += b.length;
	}

	buf = new Buffer(buflen);
	buf.write('l', 0, 'ascii');
	pos = 1;

	for (i = 0, l = enclist.length; i < l; ++i) {
		b = enclist[i];
		b.copy(buf, pos, 0, b.length);
		pos += b.length;
	}
	buf.write('e', pos, 'ascii');
	return buf;
}

// bencode a dictionary
function bdict(dict) {
	var enclist, i, l, buflen, b, buf, pos, key, keylist;

	enclist = [];
	buflen = 2;

	keylist = Object.keys(dict).sort();

	for (i = 0, l = keylist.length; i < l; ++i) {
		key = keylist[i];
		if (!dict.hasOwnProperty(key)) continue;

		b = bstring(key);
		enclist.push(b);
		buflen += b.length;

		b = bencode(dict[key]);
		enclist.push(b);
		buflen += b.length;
	}

	buf = new Buffer(buflen);
	buf.write('d', 0, 'ascii');
	pos = 1;

	for (i = 0, l = enclist.length; i < l; ++i) {
		b = enclist[i];
		b.copy(buf, pos, 0, b.length);
		pos += b.length;
	}
	buf.write('e', pos, 'ascii');
	return buf;
}
