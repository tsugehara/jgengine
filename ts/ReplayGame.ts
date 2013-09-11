module jgengine {
	//再生前提のゲーム
	export class ReplayGame extends StaticGame {
		sceneIndex:number;
		changeScene(scene:jg.Scene, effect?:any, endOldScene?:boolean) {
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