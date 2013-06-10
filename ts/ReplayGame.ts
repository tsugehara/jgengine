module jgengine {
	//再生前提のゲーム
	export class ReplayGame extends ManualGame {
		sceneIndex:number;
		keyboardHandler() {
		}
		pointHandler() {
		}
		changeScene(scene:jg.Scene, effect?:any, endOldScene?:bool) {
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
}