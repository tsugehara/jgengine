module jgengine {
    class FrameGame extends jg.Game {
        public _fps: number;
        constructor(width: number, height: number, fps: number);
        public main(): void;
    }
}
module jgengine {
    class TwinLoopGame extends jg.Game {
        public wait: number;
        public main(): void;
    }
}
module jgengine {
    class StaticGame extends jg.Game {
        public manualRender(): void;
        public manualUpdate(t?: number): void;
        public main(): void;
    }
}
module jgengine {
    class ManualGame extends StaticGame {
        public keyboardHandler(): void;
        public pointHandler(): void;
    }
}
module jgengine {
    class LoggingGame extends jg.Game {
        public log: jg.Trigger;
        public sceneIndex: number;
        public changeScene(scene: jg.Scene, effect?: any, endOldScene?: bool): void;
        public endScene(effect?: any): void;
        public main(): void;
    }
}
module jgengine {
    class ReplayGame extends ManualGame {
        public sceneIndex: number;
        public keyboardHandler(): void;
        public pointHandler(): void;
        public changeScene(scene: jg.Scene, effect?: any, endOldScene?: bool): void;
        public endScene(effect?: any): void;
        public main(): void;
    }
}
module jgengine {
    interface UpdateLog {
        type: number;
        t: number;
        events: jg.InputEvent[];
    }
    class Serializer {
        public game: jg.Game;
        constructor(game: jg.Game);
        public serialize(log: UpdateLog): any;
        public deserialize(data: any): UpdateLog;
    }
}
module jgengine {
    class BinarySerializer extends Serializer {
        public actionMap: any;
        public actionMapReverse: any;
        constructor(game: jg.Game);
        public writeDouble(buffer: ArrayBuffer, offset: number, val: number): void;
        public readDouble(buffer: ArrayBuffer, offset: number): number;
        public serializeAll(logs: UpdateLog[]): ArrayBuffer;
        public serialize(log: UpdateLog): ArrayBuffer;
        public deserializeAll(data: ArrayBuffer): any;
        public deserialize(data: ArrayBuffer): UpdateLog;
    }
}
