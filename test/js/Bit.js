(function() {
	var tests = [
		{src: 17, ret: 1},
		{src: 1 | 4 | 8 | 16, ret: 1},
		{src: 18, ret: 2},
		{src: 48, ret: 32},
		//これがどうしてもテスト通らない。"4"の方式は可能だが遅そうだし。
		{src: new Uint32Array([0x80000000 | 4 | 8 | 16])[0], ret: new Uint32Array([0x80000000])[0]},
	];
	test("1", function() {
		tests.forEach(function(t) { deepEqual(t.ret, (t.src | 28) ^ 28);});
	});
	test("2", function() {
		tests.forEach(function(t) { deepEqual(t.ret, t.src & (-1 ^ 28));});
	});
	test("3", function() {
		tests.forEach(function(t) { deepEqual(t.ret, t.src & 0xFFFFFFE3);});
	});
	test("4", function() {
		tests.forEach(function(t) { deepEqual(t.ret, new Uint32Array([(t.src | 28) ^ 28])[0]);});
	});
	test("5", function() {
		tests.forEach(function(t) { deepEqual(t.ret, (t.src >>> 5 << 5) + (t.src & 3));});
	});
})();