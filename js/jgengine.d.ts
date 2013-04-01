module jgengine {
    class FrameGame extends Game {
        public _fps: number;
        constructor(width: number, height: number, fps: number);
        public main(): void;
    }
    class TwinLoopGame extends Game {
        public wait: number;
        public main(): void;
    }
    class StaticGame extends Game {
        public manualRender(): void;
        public manualUpdate(t?: number): void;
        public main(): void;
    }
    class ManualGame extends StaticGame {
        public keyboardHandler(): void;
        public pointHandler(): void;
    }
    interface UpdateLog {
        type: number;
        t: number;
        events: InputEvent[];
    }
    class ReplayGame extends ManualGame {
        public sceneIndex: number;
        public keyboardHandler(): void;
        public pointHandler(): void;
        public changeScene(scene: Scene, effect?: any, endOldScene?: bool): void;
        public endScene(effect?: any): void;
        public main(): void;
    }
    class LoggingGame extends Game {
        public log: Trigger;
        public sceneIndex: number;
        public changeScene(scene: Scene, effect?: any, endOldScene?: bool): void;
        public endScene(effect?: any): void;
        public main(): void;
    }
    class Serializer {
        public game: Game;
        constructor(game: Game);
        public serialize(log: UpdateLog): any;
        public deserialize(data: any): UpdateLog;
    }
    class BinarySerializer extends Serializer {
        public actionMap: any;
        public actionMapReverse: any;
        constructor(game: Game);
        public writeDouble(buffer: ArrayBuffer, offset: number, val: number): void;
        public readDouble(buffer: ArrayBuffer, offset: number): number;
        public serialize(log: UpdateLog): ArrayBuffer;
        public deserialize(data: ArrayBuffer): UpdateLog;
    }
}
