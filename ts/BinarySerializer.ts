module jgengine {
	//binary serializer
	export class BinarySerializer extends Serializer {
		actionMap:any;
		actionMapReverse:any;
		constructor(game:jg.Game) {
			super(game);
			this.actionMap = {};
			this.actionMap[jg.InputEventAction.Down] = 4;
			this.actionMap[jg.InputEventAction.Move] = 8;
			this.actionMap[jg.InputEventAction.Up] = 16;
			this.actionMapReverse = {}
			this.actionMapReverse[4] = jg.InputEventAction.Down;
			this.actionMapReverse[8] = jg.InputEventAction.Move;
			this.actionMapReverse[16] = jg.InputEventAction.Up;
		}

		//reference by https://gist.github.com/uupaa/4106426
		writeDouble(buffer:ArrayBuffer, offset:number, val:number):void {
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

		readDouble(buffer:ArrayBuffer, offset:number):number {
			var view = new Uint8Array(buffer, offset, 8);
			var num  = view[0] * 0x1000000 + (view[1] << 16) +
			                                  (view[2] <<  8) + view[3];
			var sign =  num > 0x7fffffff;    //  1bit
			var exp  = (num >> 20) & 0x7ff;  // 11bits
			var frac =  num & 0xfffff;       // 52bits - 32bits (high word)
			if (!num || num === 0x80000000) { // 0.0 or -0.0
			    return 0;
			}
			if (exp === 0x7ff) { // NaN or Infinity
			    return frac ? NaN : Infinity;
			}
			var num =  view[4] * 0x1000000 + (view[5] << 16) +
			                                  (view[6] <<  8) + view[7];
			return (sign ? -1 : 1) *
			            ((frac | 0x100000) * Math.pow(2, exp - 1023 - 20) // 1023: bias
			             + num * Math.pow(2, exp - 1023 - 52));
		}

		serializeAll(logs:UpdateLog[]):ArrayBuffer {
			var len = logs.length;
			var size = 0;
			var b = false;
			var log;
			for (var i=0; i<len; i++)  {
				log = logs[i];
				if (! log.events.length) {
					if (b) {
						logs[i-1].t += log.t;
					} else {
						b = true;
						size += 12;
					}
				} else {
					b = false;
					size += 12;
					for (var j=0; j<log.events.length; j++)
						size += (log.events[j].type == jg.InputEventType.Keyboard) ? 8 : 20;
				}
			}

			var ret = new ArrayBuffer(size);
			var offset = 0;
			b = false;
			for (var i=0; i<len; i++)  {
				var s:Uint16Array;
				var meta:Uint8Array;
				log = logs[i];
				if (! log.events.length) {
					if (b)
						continue;

					b = true;
				} else {
					b = false;
				}

				var sub_size = 12;
				for (var j=0; j<log.events.length; j++)
					sub_size += (log.events[j].type == jg.InputEventType.Keyboard) ? 8 : 20;

				s = new Uint16Array(ret, offset, 1);
				s[0] = sub_size;
				meta = new Uint8Array(ret, offset+2, 2);
				meta[0] = log.type;
				this.writeDouble(ret, offset+4, log.t);
				offset+=12;
				for (var j=0; j<log.events.length; j++) {
					var e = log.events[j];
					var et = new Uint32Array(ret, offset, 1);
					if (e.type == jg.InputEventType.Keyboard) {
						et[0] = 1 | this.actionMap[e.action];
						var key = new Uint32Array(ret, offset+4, 1);
						key[0] = e.param.keyCode;
						offset += 8;
					} else {
						et[0] = 2 | this.actionMap[e.action];
						this.writeDouble(ret, offset+4, (<jg.InputPointEvent>e).point.x);
						this.writeDouble(ret, offset+12, (<jg.InputPointEvent>e).point.y);
						offset += 20;
					}
				}
			}

			return ret;
		}

		serialize(log:UpdateLog):ArrayBuffer {
			var ret:ArrayBuffer;
			var s:Uint16Array;
			var meta:Uint8Array;
			if (! log.events.length) {
				ret = new ArrayBuffer(12);
				s = new Uint16Array(ret, 0, 1);
				s[0] = 12;
				meta = new Uint8Array(ret, 2, 2);
				meta[0] = log.type;
				this.writeDouble(ret, 4, log.t);
				return ret;
			}

			var size = 12;
			for (var i=0; i<log.events.length; i++)
				size += (log.events[i].type == jg.InputEventType.Keyboard) ? 8 : 20;

			ret = new ArrayBuffer(size);
			s = new Uint16Array(ret, 0 , 1);
			s[0] = size;
			this.writeDouble(ret, 4, log.t);
			var offset = 12;
			for (var i=0; i<log.events.length; i++) {
				var e = log.events[i];
				var et = new Uint32Array(ret, offset, 1);
				if (e.type == jg.InputEventType.Keyboard) {
					et[0] = 1 | this.actionMap[e.action];
					var key = new Uint32Array(ret, offset+4, 1);
					key[0] = e.param.keyCode;
					offset += 8;
				} else {
					et[0] = 2 | this.actionMap[e.action];
					this.writeDouble(ret, offset+4, (<jg.InputPointEvent>e).point.x);
					this.writeDouble(ret, offset+12, (<jg.InputPointEvent>e).point.y);
					offset += 20;
				}
			}
			return ret;
		}

		deserializeAll(data:ArrayBuffer):any {
			var len1 = data.byteLength;
			var ary = [];
			var game = this.game;
			var offset = 0;

			while (offset < len1) {
				var lens = new Uint16Array(data, offset, 1);
				var len = offset+lens[0];
				if (lens[0] < 12 || len > len1)
					break;
				var meta = new Uint8Array(data, offset+2, 2);
				var t = this.readDouble(data, offset+4);
				offset += 12;
				var row = {
					type: meta[0],
					t: t,
					events: []
				}
				while (offset < len) {
					var e;
					var et = new Uint32Array(data, offset, 1);
					if ((et[0] & 1) == 1) {
						var k = new Uint32Array(data, offset+4, 1);
						var ek = {
							keyCode: k[0]
						}
						e = new jg.InputKeyboardEvent(
							this.actionMapReverse[et[0]-1],
							game.keymap[k[0]],
							ek
						);
						offset += 8;
					} else {
						var pos = {
							x: this.readDouble(data, offset+4),
							y: this.readDouble(data, offset+12)
						}
						e = new jg.InputPointEvent(
							this.actionMapReverse[et[0]-2],
							null,
							pos
						);
						offset += 20;
					}
					row.events.push(e);
				}
				ary.push(row);
			}
			var ret = {
				data: ary,
				seek: offset
			}
			return ret;
		}

		deserialize(data:ArrayBuffer):UpdateLog {
			var len = data.byteLength;
			var offset = 12;
			var meta = new Uint8Array(data, 2, 2);
			var t = this.readDouble(data, 4);
			var ret = {
				type: meta[0],
				t: t,
				events: []
			}
			var game = this.game;
			while (offset < len) {
				var e;
				var et = new Uint32Array(data, offset, 1);
				if ((et[0] & 1) == 1) {
					var k = new Uint32Array(data, offset+4, 1);
					var ek = {
						keyCode: k[0]
					}
					e = new jg.InputKeyboardEvent(
						this.actionMapReverse[et[0]-1],
						game.keymap[k[0]],
						ek
					);
					offset += 8;
				} else {
					var pos = {
						x: this.readDouble(data, offset+4),
						y: this.readDouble(data, offset+12)
					}
					e = new jg.InputPointEvent(
						this.actionMapReverse[et[0]-2],
						null,
						pos
					);
					offset += 20;
				}
				ret.events.push(e);
			}
			return ret;
		}
	}
}