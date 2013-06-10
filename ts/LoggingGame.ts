module jgengine {
	export class LoggingGame extends jg.Game {
		log:jg.Trigger;
		sceneIndex:number;

		changeScene(scene:jg.Scene, effect?:any, endOldScene?:bool) {
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

		_main() {
			var fps_stack:number[] = [];
			var _main = (t:number) => {
				if (this._exit)
					return;
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
				window.requestAnimationFrame(_main);
			}
			window.requestAnimationFrame(_main);
		}

		main(noStart?:bool) {
			this.log = new jg.Trigger();
			this.sceneIndex = 1;

			this.tick = 0;
			this.renderTick = 0;
			if (!noStart)
				this._main();
		}
	}
}