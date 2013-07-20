declare module jgengine {
    class FrameGame extends jg.Game {
        public _fps: number;
        constructor(width: number, height: number, fps: number);
        public main(): void;
    }
}
declare module jgengine {
    class TwinLoopGame extends jg.Game {
        public wait: number;
        public main(): void;
    }
}
declare module jgengine {
    class StaticGame extends jg.Game {
        public manualRender(): void;
        public manualUpdate(t?: number): void;
        public main(): void;
    }
}
declare module jgengine {
    class ManualGame extends jgengine.StaticGame {
        public keyboardHandler(): void;
        public pointHandler(): void;
    }
}
declare module jgengine {
    class LoggingGame extends jg.Game {
        public log: jg.Trigger;
        public sceneIndex: number;
        public changeScene(scene: jg.Scene, effect?: any, endOldScene?: boolean): void;
        public endScene(effect?: any): void;
        public _main(): void;
        public main(noStart?: boolean): void;
    }
}
declare module jgengine {
    class ReplayGame extends jgengine.ManualGame {
        public sceneIndex: number;
        public keyboardHandler(): void;
        public pointHandler(): void;
        public changeScene(scene: jg.Scene, effect?: any, endOldScene?: boolean): void;
        public endScene(effect?: any): void;
        public main(): void;
    }
}
declare module jgengine {
    interface UpdateLog {
        type: number;
        t: number;
        events: jg.InputEvent[];
    }
    class Serializer {
        constructor();
        public serialize(log: UpdateLog): any;
        public deserialize(data: any): UpdateLog;
    }
}
declare module jgengine {
    class BinarySerializer extends jgengine.Serializer {
        public actionMap: any;
        public actionMapReverse: any;
        public keymap: any;
        constructor();
        public writeDouble(buffer: ArrayBuffer, offset: number, val: number): void;
        public readDouble(buffer: ArrayBuffer, offset: number): number;
        public serializeAll(logs: jgengine.UpdateLog[]): ArrayBuffer;
        public serialize(log: jgengine.UpdateLog): ArrayBuffer;
        public deserializeAll(data: ArrayBuffer): any;
        public deserialize(data: ArrayBuffer): jgengine.UpdateLog;
    }
}
