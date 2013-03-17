var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jgengine;
(function (jgengine) {
    var FrameGame = (function (_super) {
        __extends(FrameGame, _super);
        function FrameGame(width, height, fps) {
                _super.call(this, width, height);
            this._fps = fps;
            this.targetFps = Math.floor(1000 / this._fps);
            Timeline.prototype.isFrameBased = true;
        }
        FrameGame.prototype.main = function () {
            var _this = this;
            var fps_stack = new Array();
            var _main = function (t) {
                if(t === undefined) {
                    t = Date.now ? Date.now() : new Date().getTime();
                }
                if(_this.tick > (t + 10000) || (_this.tick + 10000) < t) {
                    _this.tick = t - 1;
                    _this.renderTick = t - _this.targetFps;
                    _this.refresh();
                }
                for(var i = 0; i < _this.timers.length; i++) {
                    _this.timers[i].tryFire(t);
                }
                if((_this.renderTick + _this.targetFps) <= t) {
                    if(_this.fps) {
                        fps_stack.push(t);
                        if(fps_stack.length == 20) {
                            _this.fps.innerHTML = Math.round(20000 / (t - fps_stack[0])).toString();
                            fps_stack = [];
                        }
                    }
                    if(_this.enterFrame) {
                        _this.enterFrame.fire();
                    }
                    _this.update.fire(t - _this.tick);
                    _this.tick = t;
                    if(_this.render) {
                        _this.render.fire();
                    }
                    _this.renderer.render();
                    _this.renderTick = t;
                }
                if(!_this._exit) {
                    window.requestAnimationFrame(_main);
                }
            };
            this.tick = 0;
            this.renderTick = 0;
            window.requestAnimationFrame(_main);
        };
        return FrameGame;
    })(Game);
    jgengine.FrameGame = FrameGame;    
    var TwinLoopGame = (function (_super) {
        __extends(TwinLoopGame, _super);
        function TwinLoopGame() {
            _super.apply(this, arguments);

            this.wait = 0;
        }
        TwinLoopGame.prototype.main = function () {
            var _this = this;
            var fps_stack = new Array();
            var _main = function () {
                var t = Date.now ? Date.now() : new Date().getTime();
                if(_this.tick > (t + 10000) || (_this.tick + 10000) < t) {
                    _this.tick = t - 1;
                    _this.renderTick = t - _this.targetFps;
                    if(_this.enterFrame) {
                        _this.enterFrameTick = t - 1;
                    }
                    _this.refresh();
                }
                if(_this.tick < t) {
                    _this.update.fire(t - _this.tick);
                    _this.tick = t;
                }
                for(var i = 0; i < _this.timers.length; i++) {
                    _this.timers[i].tryFire(t);
                }
                if(!_this._exit) {
                    window.setTimeout(_main, _this.wait);
                }
            };
            var _render = function (t) {
                if(t === undefined) {
                    t = Date.now ? Date.now() : new Date().getTime();
                }
                if(_this.enterFrame) {
                    if(!_this.enterFrameTick) {
                        _this.enterFrameTick = t - 1;
                    }
                    while((_this.enterFrameTick + 16) < t) {
                        _this.enterFrameTick += 16;
                        _this.enterFrame.fire();
                    }
                }
                if(_this.targetFps == 0 || _this.renderTick <= t) {
                    if(_this.render) {
                        _this.render.fire();
                    }
                    _this.renderer.render();
                    if(_this.targetFps) {
                        _this.renderTick = t + _this.targetFps;
                    }
                    if(_this.fps) {
                        if(fps_stack.length == 19) {
                            _this.fps.innerHTML = Math.round(20000 / (t - fps_stack[0])).toString();
                            fps_stack = [];
                        } else {
                            fps_stack.push(t);
                        }
                    }
                }
                if(!_this._exit) {
                    window.requestAnimationFrame(_render);
                }
            };
            this.tick = 0;
            this.renderTick = 0;
            window.setTimeout(_main, 0);
            window.requestAnimationFrame(_render);
        };
        return TwinLoopGame;
    })(Game);
    jgengine.TwinLoopGame = TwinLoopGame;    
})(jgengine || (jgengine = {}));
