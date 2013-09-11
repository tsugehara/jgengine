module jgengine {
	export class TwinLoopGame extends jg.Game {
		wait:number = 0;

		main() {
			var fps_stack:number[] = [];
			var f = (() => {
				if (Date.now)
					return Date.now;

				return () => new Date().getTime();
			})();
			var _main = () => {
				if (this._exit)
					return;

				var t = f();
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

				if ((this.renderTick+500) < t || this.renderTick > t) {
					//this.tick > t自体はタブ切り替え程度でも結構頻発する
					if ((this.renderTick+10000) < t || (this.renderTick > t+500))
						this.refresh();
					this.tick = f() - this.wait;
					this.renderTick = t;
				}

				if (this.renderTick <= t) {
					if (this.render)
						this.render.fire();

					this.renderer.render();
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

			this.tick = f();
			this.renderTick = 0;
			window.setTimeout(_main, this.wait);
			window.requestAnimationFrame(_render);
		}
	}
}