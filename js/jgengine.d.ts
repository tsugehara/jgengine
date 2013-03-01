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
}
