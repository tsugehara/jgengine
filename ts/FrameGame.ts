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
				if ((this.tick+500) < t || this.tick > t) {
					//this.tick > t自体はタブ切り替え程度でも結構頻発する
					if ((this.tick+10000) < t || (this.tick > t+500))
						this.refresh();
					this.tick = t - 1000 / 60;
					this.renderTick = t;
				}

				var time = t - this.tick;
				for (var i=0; i<this.timers.length; i++)
					this.timers[i].tryFire(time);

				if (this.renderTick <= t) {
					this.raiseInputEvent();
					this.update.fire(time);
					this.tick = t;
					if (this.render)
						this.render.fire();
					this.renderer.render();
					this.renderTick = t + this.targetFps;

					if (this.fps) {
						if (fps_stack.length == 19) {
							this.fps.innerHTML = Math.round(20000 / (t-fps_stack[0])).toString();
							fps_stack = [];
						} else {
							fps_stack.push(t);
						}
					}
				}

				window.requestAnimationFrame(_main);
			}

			this.tick = 0;
			this.renderTick = 0;
			window.requestAnimationFrame(_main);
		}
	}
}