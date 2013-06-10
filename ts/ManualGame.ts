module jgengine {
	export class ManualGame extends StaticGame {
		//Staticのマニュアル更新機能に加え、デフォルトのキー操作やマウス操作は無効化するゲーム
		//すべてのデータのセットは外部から行う必要あり
		//キャラクタなんとか機のようにキー操作などを必要としない(DOM側でやる)ゲーム・アプリケーションにも応用可
		keyboardHandler() {
		}
		pointHandler() {
		}
	}
}