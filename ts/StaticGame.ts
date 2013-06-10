module jgengine {
	export class StaticGame extends jg.Game {
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
}