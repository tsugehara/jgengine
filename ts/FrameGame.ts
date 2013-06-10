module jgengine {
	export class FrameGame extends jg.Game {
		_fps:number;

		constructor(width:number, height:number, fps:number) {
			super(width, height);
			this._fps = fps;
			this.targetFps = Math.floor(1000 / this._fps);
			jg.Timeline.prototype.isFrameBased = true;
		}

		main() {
			var fps_stack:number[] = [];
			var _main = (t:number) => {
				if (this._exit)
					return;
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

				window.requestAnimationFrame(_main);
			}

			this.tick = 0;
			this.renderTick = 0;
			window.requestAnimationFrame(_main);
		}
	}
}