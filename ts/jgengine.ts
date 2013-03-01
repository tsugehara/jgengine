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
			var _main = () => {
				var t:number = window.getTime();
				if (this.tick > (t+10000) || (this.tick+10000) < t) {
					//this.tick > (t+10000): 前回更新分が10秒以上未来の時間の場合。多分タイマーバグっとるのでリセット
					//(this.tick+10000) < t: 10秒以上更新されてない。多分タイマーバグっとる。バグっとるよね？
					this.tick = t - 1;
					this.renderTick = t - this.targetFps;
					this.refresh();
				}

				for (var i=0; i<this.timers.length; i++)
					this.timers[i].tryFire(t);

				if ((this.renderTick+this.targetFps) <= t) {
					if (this.fps) {
						fps_stack.push(t);
						if (fps_stack.length == 20) {
							this.fps.innerHTML = Math.round(20000 / (t-fps_stack[0])).toString();
							fps_stack = [];
						}
					}
					if (this.enterFrame)
						this.enterFrame.fire();

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

			this.tick = window.getTime();
			this.renderTick = this.tick - this.targetFps;
			window.requestAnimationFrame(_main);
		}
	}


	export class TwinLoopGame extends Game {
		wait:number = 0;
		main() {
			var fps_stack = new number[];
			var _main = () => {
				var t:number = window.getTime();
				if (this.tick > (t+10000) || (this.tick+10000) < t) {
					//this.tick > (t+10000): 前回更新分が10秒以上未来の時間の場合。多分タイマーバグっとるのでリセット
					//(this.tick+10000) < t: 10秒以上更新されてない。多分タイマーバグっとる。バグっとるよね？
					this.tick = t - 1;
					this.renderTick = t - this.targetFps;
					if (this.enterFrame)
						this.enterFrameTick = t - 1;
					this.refresh();
				}

				if (this.tick < t) {
					this.update.fire(t - this.tick);
					this.tick = t;
				}

				for (var i=0; i<this.timers.length; i++)
					this.timers[i].tryFire(t);

				if (! this._exit)
					window.setTimeout(_main, this.wait);
			}

			var _render = () => {
				var t:number = window.getTime();

				if (this.enterFrame) {
					if (! this.enterFrameTick)
						this.enterFrameTick = t -1;

					while ((this.enterFrameTick+16) < t) {
						this.enterFrameTick += 16;
						this.enterFrame.fire();
					}
				}

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

			this.tick = window.getTime();
			this.renderTick = this.tick - this.targetFps;
			window.setTimeout(_main, 0);
			window.requestAnimationFrame(_render);
		}
	}
}