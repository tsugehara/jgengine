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
    class ReplayGame extends jgengine.StaticGame {
        public sceneIndex: number;
        public changeScene(scene: jg.Scene, effect?: any, endOldScene?: boolean): void;
        public endScene(effect?: any): void;
        public main(): void;
    }
}
declare module jgengine {
    interface EventSerializer {
        serializer: Serializer;
        serialize(buffer: ArrayBuffer, offset: number, event: SerializableEvent): number;
        size(event: SerializableEvent): number;
    }
    interface EventDeserializer {
        serializer: Serializer;
        deserialize(buffer: ArrayBuffer, offset: number, out: UpdateLog): number;
    }
    interface SerializableEvent {
        type: number;
        action: number;
    }
    interface UpdateLog {
        type: number;
        t: number;
        events: SerializableEvent[];
    }
    interface DeserializedData {
        seek: number;
        data: UpdateLog[];
    }
    class Serializer {
        public event_serializers: {
            [key: number]: EventSerializer;
        };
        public event_deserializers: {
            [key: number]: EventDeserializer;
        };
        constructor();
        public serialize(log: UpdateLog): any;
        public deserialize(data: any): UpdateLog;
        public serializeAll(logs: UpdateLog[]): ArrayBuffer;
        public deserializeAll(data: ArrayBuffer): DeserializedData;
    }
}
declare module jgengine {
    class BinaryKeyEventSerializer implements jgengine.EventSerializer, jgengine.EventDeserializer {
        public serializer: BinarySerializer;
        public keymap: {
            [key: number]: jg.Keytype;
        };
        constructor(serializer: BinarySerializer);
        public size(event: jgengine.SerializableEvent): number;
        public serialize(buffer: ArrayBuffer, offset: number, event: jgengine.SerializableEvent): number;
        public deserialize(buffer: ArrayBuffer, offset: number, out: jgengine.UpdateLog): number;
    }
    class BinaryPointEventSerializer implements jgengine.EventSerializer, jgengine.EventDeserializer {
        public serializer: BinarySerializer;
        constructor(serializer: BinarySerializer);
        public size(event: jgengine.SerializableEvent): number;
        public serialize(buffer: ArrayBuffer, offset: number, event: jgengine.SerializableEvent): number;
        public deserialize(buffer: ArrayBuffer, offset: number, out: jgengine.UpdateLog): number;
    }
    class BinarySerializer extends jgengine.Serializer {
        public actionMap: any;
        public actionMapReverse: any;
        constructor();
        public writeDouble(buffer: ArrayBuffer, offset: number, val: number): void;
        public readDouble(buffer: ArrayBuffer, offset: number): number;
        public serializeAll(logs: jgengine.UpdateLog[]): ArrayBuffer;
        public serialize(log: jgengine.UpdateLog): ArrayBuffer;
        public deserializeAll(data: ArrayBuffer): jgengine.DeserializedData;
        public deserialize(data: ArrayBuffer): jgengine.UpdateLog;
    }
}
