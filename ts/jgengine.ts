module jgengine {
	export class FrameGame extends Game {
		_fps:number;

		constructor(width:number, height:number, fps:number) {
			super(width, height);
			this._fps = fps;
			this.targetFps = Math.floor(1000 / this._fps);
			Timeline.prototype.isFrameBased = true;
		}

		main() {
			var fps_stack = new number[];
			var _main = (t:number) => {
				if (t === undefined)
					t = Date.now ? Date.now() : new Date().getTime();

				if (this.tick > (t+10000) || (this.tick+10000) < t) {
					//this.tick > (t+10000): 前回更新分が10秒以上未来の時間の場合。多分タイマーバグっとるのでリセット
					//(this.tick+10000) < t: 10秒以上更新されてない。多分タイマーバグっとる。バグっとるよね？
					this.tick = t - 1;
					this.renderTick = t - this.targetFps;
					this.refresh();
				}

				var time = t - this.tick;
				for (var i=0; i<this.timers.length; i++)
					this.timers[i].tryFire(time);

				if ((this.renderTick+this.targetFps) <= t) {
					if (this.fps) {
						fps_stack.push(t);
						if (fps_stack.length == 20) {
							this.fps.innerHTML = Math.round(20000 / (t-fps_stack[0])).toString();
							fps_stack = [];
						}
					}

					this.raiseInputEvent();
					this.update.fire(t - this.tick);
					this.tick = t;
					if (this.render)
						this.render.fire();
					this.renderer.render();
					this.renderTick = t;
				}

				if (! this._exit)
					window.requestAnimationFrame(_main);
			}

			this.tick = 0;
			this.renderTick = 0;
			window.requestAnimationFrame(_main);
		}
	}


	export class TwinLoopGame extends Game {
		wait:number = 0;
		main() {
			var fps_stack = new number[];
			var _main = () => {
				var t = Date.now ? Date.now() : new Date().getTime();
				if (this.tick > (t+10000) || (this.tick+10000) < t) {
					//this.tick > (t+10000): 前回更新分が10秒以上未来の時間の場合。多分タイマーバグっとるのでリセット
					//(this.tick+10000) < t: 10秒以上更新されてない。多分タイマーバグっとる。バグっとるよね？
					this.tick = t - 1;
					this.renderTick = t - this.targetFps;
					this.refresh();
				}

				var time = t - this.tick;
				if (this.tick < t) {
					this.raiseInputEvent();
					this.update.fire(time);
					this.tick = t;
				}

				for (var i=0; i<this.timers.length; i++)
					this.timers[i].tryFire(time);

				if (! this._exit)
					window.setTimeout(_main, this.wait);
			}

			var _render = (t:number) => {
				if (t === undefined)
					t = Date.now ? Date.now() : new Date().getTime();

				if (this.targetFps == 0 || this.renderTick <= t) {
					if (this.render)
						this.render.fire();

					this.renderer.render();
					if (this.targetFps)
						this.renderTick = t+this.targetFps;
					if (this.fps) {
						if (fps_stack.length == 19) {
							this.fps.innerHTML = Math.round(20000 / (t-fps_stack[0])).toString();
							fps_stack = [];
						} else {
							fps_stack.push(t);
						}
					}
				}

				if (! this._exit)
					window.requestAnimationFrame(_render);
			}

			this.tick = 0;
			this.renderTick = 0;
			window.setTimeout(_main, 0);
			window.requestAnimationFrame(_render);
		}
	}


	export class StaticGame extends Game {
		manualRender() {
			if (this.render)
				this.render.fire();

			this.renderer.render();
		}

		manualUpdate(t?:number) {
			this.tick += t;

			this.raiseInputEvent();
			this.update.fire(t);

			for (var i=0; i<this.timers.length; i++)
				this.timers[i].tryFire(t);
		}

		main() {
			this.tick = 0;
		}
	}

	export class ManualGame extends StaticGame {
		//Staticのマニュアル更新機能に加え、デフォルトのキー操作やマウス操作は無効化するゲーム
		//すべてのデータのセットは外部から行う必要あり
		//キャラクタなんとか機のようにキー操作などを必要としない(DOM側でやる)ゲーム・アプリケーションにも応用可
		keyboardHandler() {
		}
		pointHandler() {
		}
	}

	export interface UpdateLog {
		type:number;
		t:number;
		events:InputEvent[];
	}

	//再生前提のゲーム
	export class ReplayGame extends ManualGame {
		sceneIndex:number;
		keyboardHandler() {
		}
		pointHandler() {
		}
		changeScene(scene:Scene, effect?:any, endOldScene?:bool) {
			this.sceneIndex++;
			super.changeScene(scene, effect, endOldScene);
		}
		endScene(effect?:any) {
			this.sceneIndex++;
			super.endScene(effect);
		}
		main() {
			this.sceneIndex = 1;
			super.main();
		}
	}

	export class LoggingGame extends Game {
		log:Trigger;
		sceneIndex:number;

		changeScene(scene:Scene, effect?:any, endOldScene?:bool) {
			this.sceneIndex++;
			this.log.fastFire({
				type: endOldScene ? 3 : 1,
				t: this.sceneIndex,
				events: []
			});
			super.changeScene(scene, effect, endOldScene);
		}

		endScene(effect?:any) {
			this.sceneIndex++;
			this.log.fastFire({
				type: 2,
				t: this.sceneIndex,
				events: []
			});
			super.endScene(effect);
		}

		main() {
			this.log = new Trigger();
			var fps_stack = new number[];
			this.sceneIndex = 1;
			var _main = (t:number) => {
				if (t === undefined)
					t = Date.now ? Date.now() : new Date().getTime();
				if (this.tick > (t+10000) || (this.tick+10000) < t) {
					this.tick = t - 1;
					this.renderTick = t - this.targetFps;
					this.refresh();
				}

				var time = t - this.tick;
				if (this.tick < t) {
					this.log.fastFire({
						type: 0,
						t: time,
						events: this.eventQueue
					});
					this.raiseInputEvent();
					this.update.fire(time);
					this.tick = t;
				}

				for (var i=0; i<this.timers.length; i++)
					this.timers[i].tryFire(time);

				if (this.targetFps == 0 || this.renderTick <= t) {
					if (this.render)
						this.render.fire();

					this.renderer.render();
					if (this.targetFps)
						this.renderTick = t+this.targetFps;
					if (this.fps) {
						if (fps_stack.length == 19) {
							this.fps.innerHTML = Math.round(20000 / (t-fps_stack[0])).toString();
							fps_stack = [];
						} else {
							fps_stack.push(t);
						}
					}
				}

				if (! this._exit)
					window.requestAnimationFrame(_main);
			}

			this.tick = 0;
			this.renderTick = 0;
			window.requestAnimationFrame(_main);
		}
	}

	//base serializer
	export class Serializer {
		game:Game;
		constructor(game:Game) {
			this.game = game;
		}

		serialize(log:UpdateLog):any {
			throw "not implemented";
		}

		deserialize(data:any):UpdateLog {
			throw "not implemented";
		}
	}

	//binary serializer
	export class BinarySerializer extends Serializer {
		actionMap:any;
		actionMapReverse:any;
		constructor(game:Game) {
			super(game);
			this.actionMap = {};
			this.actionMap[InputEventAction.Down] = 4;
			this.actionMap[InputEventAction.Move] = 8;
			this.actionMap[InputEventAction.Up] = 16;
			this.actionMapReverse = {}
			this.actionMapReverse[4] = InputEventAction.Down;
			this.actionMapReverse[8] = InputEventAction.Move;
			this.actionMapReverse[16] = InputEventAction.Up;
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
						size += (log.events[j].type == InputEventType.Keyboard) ? 8 : 20;
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
					sub_size += (log.events[j].type == InputEventType.Keyboard) ? 8 : 20;

				s = new Uint16Array(ret, offset, 1);
				s[0] = sub_size;
				meta = new Uint8Array(ret, offset+2, 2);
				meta[0] = log.type;
				this.writeDouble(ret, offset+4, log.t);
				offset+=12;
				for (var j=0; j<log.events.length; j++) {
					var e = log.events[j];
					var et = new Uint32Array(ret, offset, 1);
					if (e.type == InputEventType.Keyboard) {
						et[0] = 1 | this.actionMap[e.action];
						var key = new Uint32Array(ret, offset+4, 1);
						key[0] = e.param.keyCode;
						offset += 8;
					} else {
						et[0] = 2 | this.actionMap[e.action];
						this.writeDouble(ret, offset+4, (<InputPointEvent>e).point.x);
						this.writeDouble(ret, offset+12, (<InputPointEvent>e).point.y);
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
				size += (log.events[i].type == InputEventType.Keyboard) ? 8 : 20;

			ret = new ArrayBuffer(size);
			s = new Uint16Array(ret, 0 , 1);
			s[0] = size;
			this.writeDouble(ret, 4, log.t);
			var offset = 12;
			for (var i=0; i<log.events.length; i++) {
				var e = log.events[i];
				var et = new Uint32Array(ret, offset, 1);
				if (e.type == InputEventType.Keyboard) {
					et[0] = 1 | this.actionMap[e.action];
					var key = new Uint32Array(ret, offset+4, 1);
					key[0] = e.param.keyCode;
					offset += 8;
				} else {
					et[0] = 2 | this.actionMap[e.action];
					this.writeDouble(ret, offset+4, (<InputPointEvent>e).point.x);
					this.writeDouble(ret, offset+12, (<InputPointEvent>e).point.y);
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
						e = new InputKeyboardEvent(
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
						e = new InputPointEvent(
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
					e = new InputKeyboardEvent(
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
					e = new InputPointEvent(
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