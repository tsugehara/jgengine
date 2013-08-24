module jgengine {
	export class BinaryKeyEventSerializer implements EventSerializer, EventDeserializer {
		serializer: BinarySerializer;
		keymap: {[key:number]: jg.Keytype;};
		constructor(serializer: BinarySerializer) {
			this.serializer = serializer;
			this.keymap = {
				13: jg.Keytype.Enter,
				27: jg.Keytype.Esc,
				37: jg.Keytype.Left,
				38: jg.Keytype.Up,
				39: jg.Keytype.Right,
				40: jg.Keytype.Down
			}
		}

		size(event:SerializableEvent):number {
			return 8;
		}

		serialize(buffer: ArrayBuffer, offset: number, event:SerializableEvent):number {
			var writer = new Uint32Array(buffer, offset, 2);
			writer[0] = 1 | this.serializer.actionMap[event.action];
			writer[1] = (<jg.InputKeyboardEvent>event).param.keyCode;
			return 8;
		}

		deserialize(buffer: ArrayBuffer, offset:number, out:UpdateLog):number {
			var k = new Uint32Array(buffer, offset, 2);
			out.events.push(new jg.InputKeyboardEvent(
				this.serializer.actionMapReverse[k[0]-1],
				this.keymap[k[1]],
				{keyCode: k[1] }
			));
			return 8;
		}
	}
	export class BinaryPointEventSerializer implements EventSerializer, EventDeserializer {
		serializer: BinarySerializer;
		constructor(serializer: BinarySerializer) {
			this.serializer = serializer;
		}
		size(event:SerializableEvent):number {
			return 20;
		}

		serialize(buffer: ArrayBuffer, offset: number, event:SerializableEvent):number {
			var et = new Uint32Array(buffer, offset, 1);
			et[0] = 2 | this.serializer.actionMap[event.action];
			this.serializer.writeDouble(buffer, offset+4, (<jg.InputPointEvent>event).point.x);
			this.serializer.writeDouble(buffer, offset+12, (<jg.InputPointEvent>event).point.y);
			return 20;
		}

		deserialize(buffer: ArrayBuffer, offset:number, out:UpdateLog):number {
			var et = new Uint32Array(buffer, offset, 1);
			var pos = {
				x: this.serializer.readDouble(buffer, offset+4),
				y: this.serializer.readDouble(buffer, offset+12)
			}
			out.events.push(new jg.InputPointEvent(
				this.serializer.actionMapReverse[et[0]-2],
				null,
				pos
			));
			return 20;
		}
	}

	//binary serializer
	export class BinarySerializer extends Serializer {
		actionMap:any;
		actionMapReverse:any;

		constructor() {
			super();
			this.actionMap = {};
			this.actionMap[jg.InputEventAction.Down] = 4;
			this.actionMap[jg.InputEventAction.Move] = 8;
			this.actionMap[jg.InputEventAction.Up] = 16;
			this.actionMapReverse = {}
			this.actionMapReverse[4] = jg.InputEventAction.Down;
			this.actionMapReverse[8] = jg.InputEventAction.Move;
			this.actionMapReverse[16] = jg.InputEventAction.Up;

			var keyboardSerializer = new BinaryKeyEventSerializer(this);
			var pointSerializer = new BinaryPointEventSerializer(this);
			this.event_serializers[jg.InputEventType.Keyboard] = keyboardSerializer;
			this.event_deserializers[1] = keyboardSerializer;

			this.event_serializers[jg.InputEventType.Point] = pointSerializer;
			this.event_deserializers[2] = pointSerializer;
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
				var e:SerializableEvent;
				for (var j=0; j<log.events.length; j++) {
					e = log.events[j];
					sub_size += this.event_serializers[e.type].size(e);
				}

				s = new Uint16Array(ret, offset, 1);
				s[0] = sub_size;
				meta = new Uint8Array(ret, offset+2, 2);
				meta[0] = log.type;
				this.writeDouble(ret, offset+4, log.t);
				offset+=12;
				for (var j=0; j<log.events.length; j++) {
					e = log.events[j];
					offset += this.event_serializers[e.type].serialize(
						ret,
						offset,
						e
					);
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
			var e:SerializableEvent;
			for (var i=0; i<log.events.length; i++) {
				e = log.events[i];
				size += this.event_serializers[e.type].size(e);
			}

			ret = new ArrayBuffer(size);
			s = new Uint16Array(ret, 0 , 1);
			s[0] = size;
			this.writeDouble(ret, 4, log.t);
			var offset = 12;
			for (var i=0; i<log.events.length; i++) {
				e = log.events[i];
				offset += this.event_serializers[e.type].serialize(
					ret,
					offset,
					e
				);
			}

			return ret;
		}

		deserializeAll(data:ArrayBuffer):DeserializedData {
			var len1 = data.byteLength;
			var ary:UpdateLog[] = [];
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
					var et = new Uint32Array(data, offset, 1);
					offset += this.event_deserializers[et[0] & 0xFFFFFFE3].deserialize(
						data,
						offset,
						row
					);
				}

				ary.push(row);
			}
			var ret:DeserializedData = {
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
			while (offset < len) {
				var et = new Uint32Array(data, offset, 1);
				offset += this.event_deserializers[et[0] & 0xFFFFFFE3].deserialize(
					data,
					offset,
					ret
				);
			}

			return ret;
		}
	}
}