module jgengine {
	export class TwinLoopGame extends jg.Game {
		wait:number = 0;
		main() {
			var fps_stack = new number[];
			var _main = () => {
				if (this._exit)
					return;

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

				window.setTimeout(_main, this.wait);
			}

			var _render = (t:number) => {
				if (this._exit)
					return;

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

				window.requestAnimationFrame(_render);
			}

			this.tick = 0;
			this.renderTick = 0;
			window.setTimeout(_main, 0);
			window.requestAnimationFrame(_render);
		}
	}
}