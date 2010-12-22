# dht-bencode

[bencode](http://bittorrent.org/beps/bep_0003.html#the-connectivity-is-as-follows "bencode reference") with Buffer()s from nodejs (as it is binary data, javascript string are not a good idea to handle it)

## install

	npm install dht-bencode

## usage

	var bencode = require('dht-bencode');

	bencode.bencode({ t: 'ab' }).toString(); // should result in "d1:t2:abe"
	bencode.bdecode("d1:t2:abe"); // should result in { t: <Buffer 61 62> }
