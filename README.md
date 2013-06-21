# dht-bencode

[bencode](http://bittorrent.org/beps/bep_0003.html#the-connectivity-is-as-follows "bencode reference") with Buffer()s from nodejs (as it is binary data javascript strings are not a good way to handle it)

## install

	npm install dht-bencode

## usage

	var bencode = require('dht-bencode');

	bencode.bencode({ t: 'ab' }).toString(); // should result in "d1:t2:abe"
	bencode.bdecode("d1:t2:abe"); // should result in { t: <Buffer 61 62> }

	// you can also tell bdecode to ignore padding after the object
	bencode.bdecode("7:contentpadding", true); // should result in { <Buffer("content")> }
	// if you don't allow it, it will raise a bencode.PaddingError object (which has the
	// parsed object in the .object property)
