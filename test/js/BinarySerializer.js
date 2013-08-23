//[BinarySerializerのデータ構造]
//<基本>
// 00-01: size (このフレームデータのバイト量。何もイベントが無ければ12)
// 02-03: type (0: 時間経過, 1: シーン追加, 2: シーン終了, 3: シーン置換, 4: 入力クリア)
//      : 厳密には02がtype, 03は未使用で、それぞれ1バイトずつ
// 04-11: time (経過時間。double。)
//      : 例外的にシーン経過の場合、ここにシーンのIDが割り当てられる
// 12-: 入力イベント（あれば）
//<入力イベントのデータ構造>
// 00-03: イベント種別
//      : TypeとActionのOR演算
//      : [Type] Keyboard: 1, Poiont: 2
//      : [Action] Down: 4, Move: 8, Up: 16
//      : [ex] KeyDown = 1 | 4 = 5, PointMove = 2 | 8 = 10
//<キーイベントのデータ構造>
// 04-07: キーコード
// (合計サイズ: 8)
//<ポイントイベントのデータ構造>
// 04-11: X座標(double)
// 12-19: Y座標(double)
// (合計サイズ: 20)
(function() {
	function writeDouble(buffer, offset, val) {
		// THX!! @edvakf
		// http://javascript.g.hatena.ne.jp/edvakf/20101128/1291000731
		var view = new Uint8Array(buffer, offset, 8);
		var sign = val < 0;
		sign && (val *= -1);

		// add offset 1023 to ensure positive
		var exp  = ((Math.log(val) / Math.LN2) + 1023) | 0;

		// shift 52 - (exp - 1023) bits to make integer part exactly 53 bits,
		// then throw away trash less than decimal point
		var frac = val * Math.pow(2, 52 + 1023 - exp);

		//  S+-Exp(11)--++-----------------Fraction(52bits)-----------------------+
		//  ||          ||                                                        |
		//  v+----------++--------------------------------------------------------+
		//  00000000|00000000|00000000|00000000|00000000|00000000|00000000|00000000
		//  6      5    55  4        4        3        2        1        8        0
		//  3      6    21  8        0        2        4        6
		//
		//  +----------high(32bits)-----------+ +----------low(32bits)------------+
		//  |                                 | |                                 |
		//  +---------------------------------+ +---------------------------------+
		//  3      2    21  1        8        0
		//  1      4    09  6
		var low  = frac & 0xffffffff;
		sign && (exp |= 0x800);
		var high = ((frac / 0x100000000) & 0xfffff) | (exp << 20);

		view.set([high >> 24, high >> 16, high >>  8, high,
		          low  >> 24, low  >> 16, low  >>  8, low]);
	}

	var serializer = new jgengine.BinarySerializer();
	test("Serialize", function() {
		var log = {
			type: 0,
			t: 1,
			events: []
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
	});
	test("Serialize-KeyDown", function() {
		var keyEvent = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			key_code: new Uint32Array(serialized, 16, 1)[0],
		}
		deepEqual(20, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type);
		deepEqual(keyEvent.param.keyCode, deserialized.key_code);
	});
	test("Serialize-KeyUp", function() {
		var keyEvent = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			key_code: new Uint32Array(serialized, 16, 1)[0],
		}
		deepEqual(20, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 16, deserialized.event_type);
		deepEqual(keyEvent.param.keyCode, deserialized.key_code);
	});
	test("Serialize-KeyDownUp", function() {
		var keyEvent1 = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent1.param = {keyCode: 1}
		var keyEvent2 = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent2.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent1, keyEvent2]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			key_code1: new Uint32Array(serialized, 16, 1)[0],
			event_type2: new Uint32Array(serialized, 20, 1)[0],
			key_code2: new Uint32Array(serialized, 24, 1)[0],
		}
		deepEqual(28, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type1);
		deepEqual(keyEvent1.param.keyCode, deserialized.key_code1);
		deepEqual(1 | 16, deserialized.event_type2);
		deepEqual(keyEvent2.param.keyCode, deserialized.key_code2);
	});
	test("Serialize-KeyDownDown", function() {
		var keyEvent1 = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent1.param = {keyCode: 1}
		var keyEvent2 = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent2.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent1, keyEvent2]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			key_code1: new Uint32Array(serialized, 16, 1)[0],
			event_type2: new Uint32Array(serialized, 20, 1)[0],
			key_code2: new Uint32Array(serialized, 24, 1)[0],
		}
		deepEqual(28, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type1);
		deepEqual(keyEvent1.param.keyCode, deserialized.key_code1);
		deepEqual(1 | 4, deserialized.event_type2);
		deepEqual(keyEvent2.param.keyCode, deserialized.key_code2);
	});
	test("Serialize-KeyUpUp", function() {
		var keyEvent1 = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent1.param = {keyCode: 1}
		var keyEvent2 = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent2.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent1, keyEvent2]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			key_code1: new Uint32Array(serialized, 16, 1)[0],
			event_type2: new Uint32Array(serialized, 20, 1)[0],
			key_code2: new Uint32Array(serialized, 24, 1)[0],
		}
		deepEqual(28, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 16, deserialized.event_type1);
		deepEqual(keyEvent1.param.keyCode, deserialized.key_code1);
		deepEqual(1 | 16, deserialized.event_type2);
		deepEqual(keyEvent2.param.keyCode, deserialized.key_code2);
	});
	test("Serialize-PointDown", function() {
		var pointEvent = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			x: serializer.readDouble(serialized, 16),
			y: serializer.readDouble(serialized, 24),
		}
		deepEqual(32, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type);
		deepEqual(pointEvent.point.x, deserialized.x);
		deepEqual(pointEvent.point.y, deserialized.y);
	});
	test("Serialize-PointMove", function() {
		var pointEvent = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			x: serializer.readDouble(serialized, 16),
			y: serializer.readDouble(serialized, 24),
		}
		deepEqual(32, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 8, deserialized.event_type);
		deepEqual(pointEvent.point.x, deserialized.x);
		deepEqual(pointEvent.point.y, deserialized.y);
	});
	test("Serialize-PointUp", function() {
		var pointEvent = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			x: serializer.readDouble(serialized, 16),
			y: serializer.readDouble(serialized, 24),
		}
		deepEqual(32, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 16, deserialized.event_type);
		deepEqual(pointEvent.point.x, deserialized.x);
		deepEqual(pointEvent.point.y, deserialized.y);
	});
	test("Serialize-PointDownMove", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
		}
		deepEqual(52, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 8, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
	});
	test("Serialize-PointDownUp", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
		}
		deepEqual(52, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 16, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
	});
	test("Serialize-PointMoveUp", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
		}
		deepEqual(52, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 8, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 16, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
	});
	test("Serialize-PointDownMoveUp", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var pointEvent3 = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2, pointEvent3]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
			event_type3: new Uint32Array(serialized, 52, 1)[0],
			x3: serializer.readDouble(serialized, 56),
			y3: serializer.readDouble(serialized, 64),
		}
		deepEqual(72, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 8, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
		deepEqual(2 | 16, deserialized.event_type3);
		deepEqual(pointEvent3.point.x, deserialized.x3);
		deepEqual(pointEvent3.point.y, deserialized.y3);
	});
	test("Serialize-ChangeScene", function() {
		var log = {
			type: 1,
			t: 2,
			events: []
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(1, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(2, deserialized.time);
	});
	test("Serialize-EndScene", function() {
		var log = {
			type: 2,
			t: 3,
			events: []
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(2, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(3, deserialized.time);
	});
	test("Serialize-ReplaceScene", function() {
		var log = {
			type: 3,
			t: 4,
			events: []
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(3, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(4, deserialized.time);
	});
	test("Serialize-ClearInputEvent", function() {
		var log = {
			type: 4,
			t: 0,
			events: []
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(4, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(0, deserialized.time);
	});

	test("SerializeAll", function() {
		var log = {
			type: 0,
			t: 1,
			events: []
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
	});
	test("SerializeAll-KeyDown", function() {
		var keyEvent = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			key_code: new Uint32Array(serialized, 16, 1)[0],
		}
		deepEqual(20, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type);
		deepEqual(keyEvent.param.keyCode, deserialized.key_code);
	});
	test("SerializeAll-KeyUp", function() {
		var keyEvent = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			key_code: new Uint32Array(serialized, 16, 1)[0],
		}
		deepEqual(20, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 16, deserialized.event_type);
		deepEqual(keyEvent.param.keyCode, deserialized.key_code);
	});
	test("SerializeAll-KeyDownUp", function() {
		var keyEvent1 = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent1.param = {keyCode: 1}
		var keyEvent2 = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent2.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent1, keyEvent2]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			key_code1: new Uint32Array(serialized, 16, 1)[0],
			event_type2: new Uint32Array(serialized, 20, 1)[0],
			key_code2: new Uint32Array(serialized, 24, 1)[0],
		}
		deepEqual(28, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type1);
		deepEqual(keyEvent1.param.keyCode, deserialized.key_code1);
		deepEqual(1 | 16, deserialized.event_type2);
		deepEqual(keyEvent2.param.keyCode, deserialized.key_code2);
	});
	test("SerializeAll-KeyDownDown", function() {
		var keyEvent1 = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent1.param = {keyCode: 1}
		var keyEvent2 = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent2.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent1, keyEvent2]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			key_code1: new Uint32Array(serialized, 16, 1)[0],
			event_type2: new Uint32Array(serialized, 20, 1)[0],
			key_code2: new Uint32Array(serialized, 24, 1)[0],
		}
		deepEqual(28, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type1);
		deepEqual(keyEvent1.param.keyCode, deserialized.key_code1);
		deepEqual(1 | 4, deserialized.event_type2);
		deepEqual(keyEvent2.param.keyCode, deserialized.key_code2);
	});
	test("SerializeAll-KeyUpUp", function() {
		var keyEvent1 = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent1.param = {keyCode: 1}
		var keyEvent2 = new jg.InputKeyboardEvent(jg.InputEventAction.Up, null, null);
		keyEvent2.param = {keyCode: 1}
		var log = {
			type: 0,
			t: 1,
			events: [keyEvent1, keyEvent2]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			key_code1: new Uint32Array(serialized, 16, 1)[0],
			event_type2: new Uint32Array(serialized, 20, 1)[0],
			key_code2: new Uint32Array(serialized, 24, 1)[0],
		}
		deepEqual(28, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 16, deserialized.event_type1);
		deepEqual(keyEvent1.param.keyCode, deserialized.key_code1);
		deepEqual(1 | 16, deserialized.event_type2);
		deepEqual(keyEvent2.param.keyCode, deserialized.key_code2);
	});
	test("SerializeAll-PointDown", function() {
		var pointEvent = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			x: serializer.readDouble(serialized, 16),
			y: serializer.readDouble(serialized, 24),
		}
		deepEqual(32, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type);
		deepEqual(pointEvent.point.x, deserialized.x);
		deepEqual(pointEvent.point.y, deserialized.y);
	});
	test("SerializeAll-PointMove", function() {
		var pointEvent = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			x: serializer.readDouble(serialized, 16),
			y: serializer.readDouble(serialized, 24),
		}
		deepEqual(32, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 8, deserialized.event_type);
		deepEqual(pointEvent.point.x, deserialized.x);
		deepEqual(pointEvent.point.y, deserialized.y);
	});
	test("SerializeAll-PointUp", function() {
		var pointEvent = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			x: serializer.readDouble(serialized, 16),
			y: serializer.readDouble(serialized, 24),
		}
		deepEqual(32, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 16, deserialized.event_type);
		deepEqual(pointEvent.point.x, deserialized.x);
		deepEqual(pointEvent.point.y, deserialized.y);
	});
	test("SerializeAll-PointDownMove", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
		}
		deepEqual(52, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 8, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
	});
	test("SerializeAll-PointDownUp", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
		}
		deepEqual(52, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 16, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
	});
	test("SerializeAll-PointMoveUp", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
		}
		deepEqual(52, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 8, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 16, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
	});
	test("SerializeAll-PointDownMoveUp", function() {
		var pointEvent1 = new jg.InputPointEvent(jg.InputEventAction.Down, null, {x: 1.1, y: 2.02});
		var pointEvent2 = new jg.InputPointEvent(jg.InputEventAction.Move, null, {x: 1.1, y: 2.02});
		var pointEvent3 = new jg.InputPointEvent(jg.InputEventAction.Up, null, {x: 1.1, y: 2.02});
		var log = {
			type: 0,
			t: 1,
			events: [pointEvent1, pointEvent2, pointEvent3]
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type1: new Uint32Array(serialized, 12, 1)[0],
			x1: serializer.readDouble(serialized, 16),
			y1: serializer.readDouble(serialized, 24),
			event_type2: new Uint32Array(serialized, 32, 1)[0],
			x2: serializer.readDouble(serialized, 36),
			y2: serializer.readDouble(serialized, 44),
			event_type3: new Uint32Array(serialized, 52, 1)[0],
			x3: serializer.readDouble(serialized, 56),
			y3: serializer.readDouble(serialized, 64),
		}
		deepEqual(72, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(2 | 4, deserialized.event_type1);
		deepEqual(pointEvent1.point.x, deserialized.x1);
		deepEqual(pointEvent1.point.y, deserialized.y1);
		deepEqual(2 | 8, deserialized.event_type2);
		deepEqual(pointEvent2.point.x, deserialized.x2);
		deepEqual(pointEvent2.point.y, deserialized.y2);
		deepEqual(2 | 16, deserialized.event_type3);
		deepEqual(pointEvent3.point.x, deserialized.x3);
		deepEqual(pointEvent3.point.y, deserialized.y3);
	});
	test("SerializeAll-ChangeScene", function() {
		var log = {
			type: 1,
			t: 2,
			events: []
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(1, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(2, deserialized.time);
	});
	test("SerializeAll-EndScene", function() {
		var log = {
			type: 2,
			t: 3,
			events: []
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(2, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(3, deserialized.time);
	});
	test("SerializeAll-ReplaceScene", function() {
		var log = {
			type: 3,
			t: 4,
			events: []
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(3, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(4, deserialized.time);
	});
	test("SerializeAll-ClearInputEvent", function() {
		var log = {
			type: 4,
			t: 0,
			events: []
		}
		var serialized = serializer.serializeAll([log]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4)
		}
		deepEqual(12, deserialized.size);
		deepEqual(4, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(0, deserialized.time);
	});
	test("SerializeAll-Complex", function() {
		var keyEvent = new jg.InputKeyboardEvent(jg.InputEventAction.Down, null, null);
		keyEvent.param = {keyCode: 1}
		var log1 = {
			type: 0,
			t: 1,
			events: [keyEvent]
		}
		var log2 = {
			type: 0,
			t: 2,
			events: [keyEvent]
		}
		var serialized = serializer.serializeAll([log1, log2]);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			key_code: new Uint32Array(serialized, 16, 1)[0],
		}
		deepEqual(20, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type);
		deepEqual(keyEvent.param.keyCode, deserialized.key_code);
		var deserialized = {
			size: new Uint16Array(serialized, 20+0, 1)[0],
			meta1: new Uint8Array(serialized, 20+2, 2)[0],
			meta2: new Uint8Array(serialized, 20+2, 2)[1],
			time: serializer.readDouble(serialized, 20+4),
			event_type: new Uint32Array(serialized, 20+12, 1)[0],
			key_code: new Uint32Array(serialized, 20+16, 1)[0],
		}
		deepEqual(20, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(2, deserialized.time);
		deepEqual(1 | 4, deserialized.event_type);
		deepEqual(keyEvent.param.keyCode, deserialized.key_code);
	});

	test("Deserialize", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 1);
		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(0, deserialized.type);
	});
	test("Deserialize-KeyDown", function() {
		var log = new ArrayBuffer(20);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 12, 2))[1] = 27;

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(1, deserialized.events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[0].action);
		deepEqual(27, deserialized.events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[0].key);
	});
	test("Deserialize-KeyUp", function() {
		var log = new ArrayBuffer(20);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 16;
		(new Uint32Array(log, 12, 2))[1] = 27;

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(1, deserialized.events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[0].action);
		deepEqual(27, deserialized.events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[0].key);
	});
	test("Deserialize-KeyDownUp", function() {
		var log = new ArrayBuffer(28);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 12, 2))[1] = 27;
		(new Uint32Array(log, 20, 2))[0] = 1 | 16;
		(new Uint32Array(log, 20, 2))[1] = 27;

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(2, deserialized.events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[0].action);
		deepEqual(27, deserialized.events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[0].key);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[1].action);
		deepEqual(27, deserialized.events[1].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[1].key);
	});
	test("Deserialize-KeyDownDown", function() {
		var log = new ArrayBuffer(28);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 12, 2))[1] = 27;
		(new Uint32Array(log, 20, 2))[0] = 1 | 4;
		(new Uint32Array(log, 20, 2))[1] = 27;

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(2, deserialized.events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[0].action);
		deepEqual(27, deserialized.events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[0].key);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[1].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[1].action);
		deepEqual(27, deserialized.events[1].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[1].key);
	});
	test("Deserialize-KeyUpUp", function() {
		var log = new ArrayBuffer(28);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 16;
		(new Uint32Array(log, 12, 2))[1] = 27;
		(new Uint32Array(log, 20, 2))[0] = 1 | 16;
		(new Uint32Array(log, 20, 2))[1] = 27;

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(2, deserialized.events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[0].action);
		deepEqual(27, deserialized.events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[0].key);
		deepEqual(jg.InputEventType.Keyboard, deserialized.events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[1].action);
		deepEqual(27, deserialized.events[1].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.events[1].key);
	});
	test("Deserialize-PointDown", function() {
		var log = new ArrayBuffer(32);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(1, deserialized.events.length);
		deepEqual(jg.InputEventType.Point, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[0].action);
		deepEqual(1.1, deserialized.events[0].point.x);
		deepEqual(1.2, deserialized.events[0].point.y);
	});
	test("Deserialize-PointMove", function() {
		var log = new ArrayBuffer(32);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 8;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(1, deserialized.events.length);
		deepEqual(jg.InputEventType.Point, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Move, deserialized.events[0].action);
		deepEqual(1.1, deserialized.events[0].point.x);
		deepEqual(1.2, deserialized.events[0].point.y);
	});
	test("Deserialize-PointUp", function() {
		var log = new ArrayBuffer(32);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 16;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(1, deserialized.events.length);
		deepEqual(jg.InputEventType.Point, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[0].action);
		deepEqual(1.1, deserialized.events[0].point.x);
		deepEqual(1.2, deserialized.events[0].point.y);
	});
	test("Deserialize-PointDownMove", function() {
		var log = new ArrayBuffer(52);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 8;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(2, deserialized.events.length);
		deepEqual(jg.InputEventType.Point, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[0].action);
		deepEqual(1.1, deserialized.events[0].point.x);
		deepEqual(1.2, deserialized.events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.events[1].type);
		deepEqual(jg.InputEventAction.Move, deserialized.events[1].action);
		deepEqual(1.3, deserialized.events[1].point.x);
		deepEqual(1.4, deserialized.events[1].point.y);
	});
	test("Deserialize-PointDownUp", function() {
		var log = new ArrayBuffer(52);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 16;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(2, deserialized.events.length);
		deepEqual(jg.InputEventType.Point, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[0].action);
		deepEqual(1.1, deserialized.events[0].point.x);
		deepEqual(1.2, deserialized.events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[1].action);
		deepEqual(1.3, deserialized.events[1].point.x);
		deepEqual(1.4, deserialized.events[1].point.y);
	});
	test("Deserialize-PointMoveUp", function() {
		var log = new ArrayBuffer(52);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 8;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 16;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(2, deserialized.events.length);
		deepEqual(jg.InputEventType.Point, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Move, deserialized.events[0].action);
		deepEqual(1.1, deserialized.events[0].point.x);
		deepEqual(1.2, deserialized.events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[1].action);
		deepEqual(1.3, deserialized.events[1].point.x);
		deepEqual(1.4, deserialized.events[1].point.y);
	});
	test("Deserialize-PointDownMoveUp", function() {
		var log = new ArrayBuffer(72);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 8;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);
		(new Uint32Array(log, 52, 1))[0] = 2 | 16;
		writeDouble(log, 56, 1.5);
		writeDouble(log, 64, 1.6);

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(3, deserialized.events.length);
		deepEqual(jg.InputEventType.Point, deserialized.events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.events[0].action);
		deepEqual(1.1, deserialized.events[0].point.x);
		deepEqual(1.2, deserialized.events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.events[1].type);
		deepEqual(jg.InputEventAction.Move, deserialized.events[1].action);
		deepEqual(1.3, deserialized.events[1].point.x);
		deepEqual(1.4, deserialized.events[1].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.events[2].type);
		deepEqual(jg.InputEventAction.Up, deserialized.events[2].action);
		deepEqual(1.5, deserialized.events[2].point.x);
		deepEqual(1.6, deserialized.events[2].point.y);
	});
	test("Deserialize-ChangeScene", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 1;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserialize(log);
		deepEqual(0, deserialized.t);
		deepEqual(1, deserialized.type);
	});
	test("Deserialize-EndScene", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 2;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserialize(log);
		deepEqual(0, deserialized.t);
		deepEqual(2, deserialized.type);
	});
	test("Deserialize-ReplaceScene", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 3;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserialize(log);
		deepEqual(0, deserialized.t);
		deepEqual(3, deserialized.type);
	});
	test("Deserialize-ClearInputEvent", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 4;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserialize(log);
		deepEqual(0, deserialized.t);
		deepEqual(4, deserialized.type);
	});

	test("DeserializeAll", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 1);
		var deserialized = serializer.deserializeAll(log);
		deepEqual(12, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(0, deserialized.data[0].type);
	});
	test("DeserializeAll-KeyDown", function() {
		var log = new ArrayBuffer(20);
		(new Uint16Array(log, 0, 1))[0] = 20;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 12, 2))[1] = 27;

		var deserialized = serializer.deserializeAll(log);
		deepEqual(20, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(1, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(27, deserialized.data[0].events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[0].key);
	});
	test("DeserializeAll-KeyUp", function() {
		var log = new ArrayBuffer(20);
		(new Uint16Array(log, 0, 1))[0] = 20;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 16;
		(new Uint32Array(log, 12, 2))[1] = 27;

		var deserialized = serializer.deserializeAll(log);
		deepEqual(20, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(1, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[0].action);
		deepEqual(27, deserialized.data[0].events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[0].key);
	});
	test("DeserializeAll-KeyDownUp", function() {
		var log = new ArrayBuffer(28);
		(new Uint16Array(log, 0, 1))[0] = 28;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 12, 2))[1] = 27;
		(new Uint32Array(log, 20, 2))[0] = 1 | 16;
		(new Uint32Array(log, 20, 2))[1] = 27;

		var deserialized = serializer.deserializeAll(log);
		deepEqual(28, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(2, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(27, deserialized.data[0].events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[0].key);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[1].action);
		deepEqual(27, deserialized.data[0].events[1].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[1].key);
	});
	test("DeserializeAll-KeyDownDown", function() {
		var log = new ArrayBuffer(28);
		(new Uint16Array(log, 0, 1))[0] = 28;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 12, 2))[1] = 27;
		(new Uint32Array(log, 20, 2))[0] = 1 | 4;
		(new Uint32Array(log, 20, 2))[1] = 27;

		var deserialized = serializer.deserializeAll(log);
		deepEqual(28, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(2, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(27, deserialized.data[0].events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[0].key);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[1].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[1].action);
		deepEqual(27, deserialized.data[0].events[1].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[1].key);
	});
	test("DeserializeAll-KeyUpUp", function() {
		var log = new ArrayBuffer(28);
		(new Uint16Array(log, 0, 1))[0] = 28;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 16;
		(new Uint32Array(log, 12, 2))[1] = 27;
		(new Uint32Array(log, 20, 2))[0] = 1 | 16;
		(new Uint32Array(log, 20, 2))[1] = 27;

		var deserialized = serializer.deserializeAll(log);
		deepEqual(28, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(2, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[0].action);
		deepEqual(27, deserialized.data[0].events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[0].key);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[1].action);
		deepEqual(27, deserialized.data[0].events[1].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[1].key);
	});
	test("DeserializeAll-PointDown", function() {
		var log = new ArrayBuffer(32);
		(new Uint16Array(log, 0, 1))[0] = 32;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);

		var deserialized = serializer.deserializeAll(log);
		deepEqual(32, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(1, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(1.1, deserialized.data[0].events[0].point.x);
		deepEqual(1.2, deserialized.data[0].events[0].point.y);
	});
	test("DeserializeAll-PointMove", function() {
		var log = new ArrayBuffer(32);
		(new Uint16Array(log, 0, 1))[0] = 32;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 8;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);

		var deserialized = serializer.deserializeAll(log);
		deepEqual(32, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(1, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Move, deserialized.data[0].events[0].action);
		deepEqual(1.1, deserialized.data[0].events[0].point.x);
		deepEqual(1.2, deserialized.data[0].events[0].point.y);
	});
	test("DeserializeAll-PointUp", function() {
		var log = new ArrayBuffer(32);
		(new Uint16Array(log, 0, 1))[0] = 32;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 16;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);

		var deserialized = serializer.deserializeAll(log);
		deepEqual(32, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(1, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[0].action);
		deepEqual(1.1, deserialized.data[0].events[0].point.x);
		deepEqual(1.2, deserialized.data[0].events[0].point.y);
	});
	test("DeserializeAll-PointDownMove", function() {
		var log = new ArrayBuffer(52);
		(new Uint16Array(log, 0, 1))[0] = 52;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 8;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);

		var deserialized = serializer.deserializeAll(log);
		deepEqual(52, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(2, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(1.1, deserialized.data[0].events[0].point.x);
		deepEqual(1.2, deserialized.data[0].events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[1].type);
		deepEqual(jg.InputEventAction.Move, deserialized.data[0].events[1].action);
		deepEqual(1.3, deserialized.data[0].events[1].point.x);
		deepEqual(1.4, deserialized.data[0].events[1].point.y);
	});
	test("DeserializeAll-PointDownUp", function() {
		var log = new ArrayBuffer(52);
		(new Uint16Array(log, 0, 1))[0] = 52;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 16;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);

		var deserialized = serializer.deserializeAll(log);
		deepEqual(52, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(2, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(1.1, deserialized.data[0].events[0].point.x);
		deepEqual(1.2, deserialized.data[0].events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[1].action);
		deepEqual(1.3, deserialized.data[0].events[1].point.x);
		deepEqual(1.4, deserialized.data[0].events[1].point.y);
	});
	test("DeserializeAll-PointMoveUp", function() {
		var log = new ArrayBuffer(52);
		(new Uint16Array(log, 0, 1))[0] = 52;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 8;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 16;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);

		var deserialized = serializer.deserializeAll(log);
		deepEqual(52, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(2, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Move, deserialized.data[0].events[0].action);
		deepEqual(1.1, deserialized.data[0].events[0].point.x);
		deepEqual(1.2, deserialized.data[0].events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[1].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[1].action);
		deepEqual(1.3, deserialized.data[0].events[1].point.x);
		deepEqual(1.4, deserialized.data[0].events[1].point.y);
	});
	test("DeserializeAll-PointDownMoveUp", function() {
		var log = new ArrayBuffer(72);
		(new Uint16Array(log, 0, 1))[0] = 72;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 1))[0] = 2 | 4;
		writeDouble(log, 16, 1.1);
		writeDouble(log, 24, 1.2);
		(new Uint32Array(log, 32, 1))[0] = 2 | 8;
		writeDouble(log, 36, 1.3);
		writeDouble(log, 44, 1.4);
		(new Uint32Array(log, 52, 1))[0] = 2 | 16;
		writeDouble(log, 56, 1.5);
		writeDouble(log, 64, 1.6);

		var deserialized = serializer.deserializeAll(log);
		deepEqual(72, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(3, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(1.1, deserialized.data[0].events[0].point.x);
		deepEqual(1.2, deserialized.data[0].events[0].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[1].type);
		deepEqual(jg.InputEventAction.Move, deserialized.data[0].events[1].action);
		deepEqual(1.3, deserialized.data[0].events[1].point.x);
		deepEqual(1.4, deserialized.data[0].events[1].point.y);
		deepEqual(jg.InputEventType.Point, deserialized.data[0].events[2].type);
		deepEqual(jg.InputEventAction.Up, deserialized.data[0].events[2].action);
		deepEqual(1.5, deserialized.data[0].events[2].point.x);
		deepEqual(1.6, deserialized.data[0].events[2].point.y);
	});
	test("DeserializeAll-ChangeScene", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 1;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserializeAll(log);
		deepEqual(12, deserialized.seek);
		deepEqual(0, deserialized.data[0].t);
		deepEqual(1, deserialized.data[0].type);
	});
	test("DeserializeAll-EndScene", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 2;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserializeAll(log);
		deepEqual(0, deserialized.data[0].t);
		deepEqual(2, deserialized.data[0].type);
	});
	test("DeserializeAll-ReplaceScene", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 3;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserializeAll(log);
		deepEqual(12, deserialized.seek);
		deepEqual(0, deserialized.data[0].t);
		deepEqual(3, deserialized.data[0].type);
	});
	test("DeserializeAll-ClearInputEvent", function() {
		var log = new ArrayBuffer(12);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 4;
		(new Uint8Array(log, 2, 2)[1]) = 0;
		writeDouble(log, 4, 0);
		var deserialized = serializer.deserializeAll(log);
		deepEqual(12, deserialized.seek);
		deepEqual(0, deserialized.data[0].t);
		deepEqual(4, deserialized.data[0].type);
	});
	test("DeserializeAll-Complex", function() {
		var log = new ArrayBuffer(40);
		(new Uint16Array(log, 0, 1))[0] = 20;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 12, 2))[1] = 27;
		(new Uint16Array(log, 20+0, 1))[0] = 20;
		(new Uint8Array(log, 20+2, 2))[0] = 0;
		(new Uint8Array(log, 20+2, 2))[1] = 0;
		writeDouble(log, 20+4, 1);
		(new Uint32Array(log, 20+12, 2))[0] = 1 | 4;
		(new Uint32Array(log, 20+12, 2))[1] = 27;

		var deserialized = serializer.deserializeAll(log);
		deepEqual(40, deserialized.seek);
		deepEqual(1, deserialized.data[0].t);
		deepEqual(1, deserialized.data[0].events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[0].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[0].events[0].action);
		deepEqual(27, deserialized.data[0].events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[0].events[0].key);

		deepEqual(1, deserialized.data[1].t);
		deepEqual(1, deserialized.data[1].events.length);
		deepEqual(jg.InputEventType.Keyboard, deserialized.data[1].events[0].type);
		deepEqual(jg.InputEventAction.Down, deserialized.data[1].events[0].action);
		deepEqual(27, deserialized.data[1].events[0].param.keyCode);
		deepEqual(jg.Keytype.Esc, deserialized.data[1].events[0].key);
	});
	function UserSerializer(serializer) {
		this.serializer = serializer;
	}
	UserSerializer.prototype.size = function (event) {
		return 8;
	};
	UserSerializer.prototype.serialize = function (buffer, offset, event) {
		var et = new Uint32Array(buffer, offset, 2);
		et[0] = 5;
		et[1] = event.seed;
		return 8;
	};
	UserSerializer.prototype.deserialize = function (buffer, offset, out) {
		var et = new Uint32Array(buffer, offset, 2);
		out.events.push(
			new SetSeedEvent(et[1])
		);
		return 20;
	};
    var SetSeedEvent = (function (_super) {
        __extends(SetSeedEvent, _super);
        function SetSeedEvent(seed) {
            _super.call(this, 5, null, null);
            this.seed = seed;
        }
        return SetSeedEvent;
    })(jg.InputEvent);

	test("Serialize-UserDefine", function() {
		var serializer = new jgengine.BinarySerializer();
		serializer.event_serializers[5] = new UserSerializer(serializer);
		var user = new SetSeedEvent(100);
		var log = {
			type: 0,
			t: 1,
			events: [user]
		}
		var serialized = serializer.serialize(log);
		var deserialized = {
			size: new Uint16Array(serialized, 0, 1)[0],
			meta1: new Uint8Array(serialized, 2, 2)[0],
			meta2: new Uint8Array(serialized, 2, 2)[1],
			time: serializer.readDouble(serialized, 4),
			event_type: new Uint32Array(serialized, 12, 1)[0],
			seed: new Uint32Array(serialized, 16, 1)[0],
		}
		deepEqual(20, deserialized.size);
		deepEqual(0, deserialized.meta1);
		deepEqual(0, deserialized.meta2);
		deepEqual(1, deserialized.time);
		deepEqual(5, deserialized.event_type);
		deepEqual(100, deserialized.seed);
	});

	test("Deserialize-UserDefine", function() {
		var serializer = new jgengine.BinarySerializer();
		serializer.event_deserializers[5] = new UserSerializer(serializer);
		var log = new ArrayBuffer(20);
		(new Uint16Array(log, 0, 1))[0] = 12;
		(new Uint8Array(log, 2, 2))[0] = 0;
		(new Uint8Array(log, 2, 2))[1] = 0;
		writeDouble(log, 4, 1);
		(new Uint32Array(log, 12, 2))[0] = 5;
		(new Uint32Array(log, 12, 2))[1] = 100;

		var deserialized = serializer.deserialize(log);
		deepEqual(1, deserialized.t);
		deepEqual(1, deserialized.events.length);
		deepEqual(5, deserialized.events[0].type);
		deepEqual(null, deserialized.events[0].action);
		deepEqual(100, deserialized.events[0].seed);
	});

})();