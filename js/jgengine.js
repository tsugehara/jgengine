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
            jg.Timeline.prototype.isFrameBased = true;
        }
        FrameGame.prototype.main = function () {
            var _this = this;
            var fps_stack = new Array();
            var _main = function (t) {
                if(_this._exit) {
                    return;
                }
                if(t === undefined) {
                    t = Date.now ? Date.now() : new Date().getTime();
                }
                if(_this.tick > (t + 10000) || (_this.tick + 10000) < t) {
                    _this.tick = t - 1;
                    _this.renderTick = t - _this.targetFps;
                    _this.refresh();
                }
                var time = t - _this.tick;
                for(var i = 0; i < _this.timers.length; i++) {
                    _this.timers[i].tryFire(time);
                }
                if((_this.renderTick + _this.targetFps) <= t) {
                    if(_this.fps) {
                        fps_stack.push(t);
                        if(fps_stack.length == 20) {
                            _this.fps.innerHTML = Math.round(20000 / (t - fps_stack[0])).toString();
                            fps_stack = [];
                        }
                    }
                    _this.raiseInputEvent();
                    _this.update.fire(t - _this.tick);
                    _this.tick = t;
                    if(_this.render) {
                        _this.render.fire();
                    }
                    _this.renderer.render();
                    _this.renderTick = t;
                }
                window.requestAnimationFrame(_main);
            };
            this.tick = 0;
            this.renderTick = 0;
            window.requestAnimationFrame(_main);
        };
        return FrameGame;
    })(jg.Game);
    jgengine.FrameGame = FrameGame;    
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
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
                if(_this._exit) {
                    return;
                }
                var t = Date.now ? Date.now() : new Date().getTime();
                if(_this.tick > (t + 10000) || (_this.tick + 10000) < t) {
                    _this.tick = t - 1;
                    _this.renderTick = t - _this.targetFps;
                    _this.refresh();
                }
                var time = t - _this.tick;
                if(_this.tick < t) {
                    _this.raiseInputEvent();
                    _this.update.fire(time);
                    _this.tick = t;
                }
                for(var i = 0; i < _this.timers.length; i++) {
                    _this.timers[i].tryFire(time);
                }
                window.setTimeout(_main, _this.wait);
            };
            var _render = function (t) {
                if(_this._exit) {
                    return;
                }
                if(t === undefined) {
                    t = Date.now ? Date.now() : new Date().getTime();
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
                window.requestAnimationFrame(_render);
            };
            this.tick = 0;
            this.renderTick = 0;
            window.setTimeout(_main, 0);
            window.requestAnimationFrame(_render);
        };
        return TwinLoopGame;
    })(jg.Game);
    jgengine.TwinLoopGame = TwinLoopGame;    
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var StaticGame = (function (_super) {
        __extends(StaticGame, _super);
        function StaticGame() {
            _super.apply(this, arguments);

        }
        StaticGame.prototype.manualRender = function () {
            if(this.render) {
                this.render.fire();
            }
            this.renderer.render();
        };
        StaticGame.prototype.manualUpdate = function (t) {
            this.tick += t;
            this.raiseInputEvent();
            this.update.fire(t);
            for(var i = 0; i < this.timers.length; i++) {
                this.timers[i].tryFire(t);
            }
        };
        StaticGame.prototype.main = function () {
            this.tick = 0;
        };
        return StaticGame;
    })(jg.Game);
    jgengine.StaticGame = StaticGame;    
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var ManualGame = (function (_super) {
        __extends(ManualGame, _super);
        function ManualGame() {
            _super.apply(this, arguments);

        }
        ManualGame.prototype.keyboardHandler = function () {
        };
        ManualGame.prototype.pointHandler = function () {
        };
        return ManualGame;
    })(jgengine.StaticGame);
    jgengine.ManualGame = ManualGame;    
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var LoggingGame = (function (_super) {
        __extends(LoggingGame, _super);
        function LoggingGame() {
            _super.apply(this, arguments);

        }
        LoggingGame.prototype.changeScene = function (scene, effect, endOldScene) {
            this.sceneIndex++;
            this.log.fastFire({
                type: endOldScene ? 3 : 1,
                t: this.sceneIndex,
                events: []
            });
            _super.prototype.changeScene.call(this, scene, effect, endOldScene);
        };
        LoggingGame.prototype.endScene = function (effect) {
            this.sceneIndex++;
            this.log.fastFire({
                type: 2,
                t: this.sceneIndex,
                events: []
            });
            _super.prototype.endScene.call(this, effect);
        };
        LoggingGame.prototype._main = function () {
            var _this = this;
            var fps_stack = new Array();
            var _main = function (t) {
                if(_this._exit) {
                    return;
                }
                if(t === undefined) {
                    t = Date.now ? Date.now() : new Date().getTime();
                }
                if(_this.tick > (t + 10000) || (_this.tick + 10000) < t) {
                    _this.tick = t - 1;
                    _this.renderTick = t - _this.targetFps;
                    _this.refresh();
                }
                var time = t - _this.tick;
                if(_this.tick < t) {
                    _this.log.fastFire({
                        type: 0,
                        t: time,
                        events: _this.eventQueue
                    });
                    _this.raiseInputEvent();
                    _this.update.fire(time);
                    _this.tick = t;
                }
                for(var i = 0; i < _this.timers.length; i++) {
                    _this.timers[i].tryFire(time);
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
                window.requestAnimationFrame(_main);
            };
            window.requestAnimationFrame(_main);
        };
        LoggingGame.prototype.main = function (noStart) {
            this.log = new jg.Trigger();
            this.sceneIndex = 1;
            this.tick = 0;
            this.renderTick = 0;
            if(!noStart) {
                this._main();
            }
        };
        return LoggingGame;
    })(jg.Game);
    jgengine.LoggingGame = LoggingGame;    
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var ReplayGame = (function (_super) {
        __extends(ReplayGame, _super);
        function ReplayGame() {
            _super.apply(this, arguments);

        }
        ReplayGame.prototype.keyboardHandler = function () {
        };
        ReplayGame.prototype.pointHandler = function () {
        };
        ReplayGame.prototype.changeScene = function (scene, effect, endOldScene) {
            this.sceneIndex++;
            _super.prototype.changeScene.call(this, scene, effect, endOldScene);
        };
        ReplayGame.prototype.endScene = function (effect) {
            this.sceneIndex++;
            _super.prototype.endScene.call(this, effect);
        };
        ReplayGame.prototype.main = function () {
            this.sceneIndex = 1;
            _super.prototype.main.call(this);
        };
        return ReplayGame;
    })(jgengine.ManualGame);
    jgengine.ReplayGame = ReplayGame;    
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var Serializer = (function () {
        function Serializer(game) {
            this.game = game;
        }
        Serializer.prototype.serialize = function (log) {
            throw "not implemented";
        };
        Serializer.prototype.deserialize = function (data) {
            throw "not implemented";
        };
        return Serializer;
    })();
    jgengine.Serializer = Serializer;    
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var BinarySerializer = (function (_super) {
        __extends(BinarySerializer, _super);
        function BinarySerializer(game) {
                _super.call(this, game);
            this.actionMap = {
            };
            this.actionMap[jg.InputEventAction.Down] = 4;
            this.actionMap[jg.InputEventAction.Move] = 8;
            this.actionMap[jg.InputEventAction.Up] = 16;
            this.actionMapReverse = {
            };
            this.actionMapReverse[4] = jg.InputEventAction.Down;
            this.actionMapReverse[8] = jg.InputEventAction.Move;
            this.actionMapReverse[16] = jg.InputEventAction.Up;
        }
        BinarySerializer.prototype.writeDouble = function (buffer, offset, val) {
            var view = new Uint8Array(buffer, offset, 8);
            var sign = val < 0;
            sign && (val *= -1);
            var exp = ((Math.log(val) / Math.LN2) + 1023) | 0;
            var frac = val * Math.pow(2, 52 + 1023 - exp);
            var low = frac & 4294967295;
            sign && (exp |= 2048);
            var high = ((frac / 4294967296) & 1048575) | (exp << 20);
            view.set([
                high >> 24, 
                high >> 16, 
                high >> 8, 
                high, 
                low >> 24, 
                low >> 16, 
                low >> 8, 
                low
            ]);
        };
        BinarySerializer.prototype.readDouble = function (buffer, offset) {
            var view = new Uint8Array(buffer, offset, 8);
            var num = view[0] * 16777216 + (view[1] << 16) + (view[2] << 8) + view[3];
            var sign = num > 2147483647;
            var exp = (num >> 20) & 2047;
            var frac = num & 1048575;
            if(!num || num === 2147483648) {
                return 0;
            }
            if(exp === 2047) {
                return frac ? NaN : Infinity;
            }
            var num = view[4] * 16777216 + (view[5] << 16) + (view[6] << 8) + view[7];
            return (sign ? -1 : 1) * ((frac | 1048576) * Math.pow(2, exp - 1023 - 20) + num * Math.pow(2, exp - 1023 - 52));
        };
        BinarySerializer.prototype.serializeAll = function (logs) {
            var len = logs.length;
            var size = 0;
            var b = false;
            var log;
            for(var i = 0; i < len; i++) {
                log = logs[i];
                if(!log.events.length) {
                    if(b) {
                        logs[i - 1].t += log.t;
                    } else {
                        b = true;
                        size += 12;
                    }
                } else {
                    b = false;
                    size += 12;
                    for(var j = 0; j < log.events.length; j++) {
                        size += (log.events[j].type == jg.InputEventType.Keyboard) ? 8 : 20;
                    }
                }
            }
            var ret = new ArrayBuffer(size);
            var offset = 0;
            b = false;
            for(var i = 0; i < len; i++) {
                var s;
                var meta;
                log = logs[i];
                if(!log.events.length) {
                    if(b) {
                        continue;
                    }
                    b = true;
                } else {
                    b = false;
                }
                var sub_size = 12;
                for(var j = 0; j < log.events.length; j++) {
                    sub_size += (log.events[j].type == jg.InputEventType.Keyboard) ? 8 : 20;
                }
                s = new Uint16Array(ret, offset, 1);
                s[0] = sub_size;
                meta = new Uint8Array(ret, offset + 2, 2);
                meta[0] = log.type;
                this.writeDouble(ret, offset + 4, log.t);
                offset += 12;
                for(var j = 0; j < log.events.length; j++) {
                    var e = log.events[j];
                    var et = new Uint32Array(ret, offset, 1);
                    if(e.type == jg.InputEventType.Keyboard) {
                        et[0] = 1 | this.actionMap[e.action];
                        var key = new Uint32Array(ret, offset + 4, 1);
                        key[0] = e.param.keyCode;
                        offset += 8;
                    } else {
                        et[0] = 2 | this.actionMap[e.action];
                        this.writeDouble(ret, offset + 4, (e).point.x);
                        this.writeDouble(ret, offset + 12, (e).point.y);
                        offset += 20;
                    }
                }
            }
            return ret;
        };
        BinarySerializer.prototype.serialize = function (log) {
            var ret;
            var s;
            var meta;
            if(!log.events.length) {
                ret = new ArrayBuffer(12);
                s = new Uint16Array(ret, 0, 1);
                s[0] = 12;
                meta = new Uint8Array(ret, 2, 2);
                meta[0] = log.type;
                this.writeDouble(ret, 4, log.t);
                return ret;
            }
            var size = 12;
            for(var i = 0; i < log.events.length; i++) {
                size += (log.events[i].type == jg.InputEventType.Keyboard) ? 8 : 20;
            }
            ret = new ArrayBuffer(size);
            s = new Uint16Array(ret, 0, 1);
            s[0] = size;
            this.writeDouble(ret, 4, log.t);
            var offset = 12;
            for(var i = 0; i < log.events.length; i++) {
                var e = log.events[i];
                var et = new Uint32Array(ret, offset, 1);
                if(e.type == jg.InputEventType.Keyboard) {
                    et[0] = 1 | this.actionMap[e.action];
                    var key = new Uint32Array(ret, offset + 4, 1);
                    key[0] = e.param.keyCode;
                    offset += 8;
                } else {
                    et[0] = 2 | this.actionMap[e.action];
                    this.writeDouble(ret, offset + 4, (e).point.x);
                    this.writeDouble(ret, offset + 12, (e).point.y);
                    offset += 20;
                }
            }
            return ret;
        };
        BinarySerializer.prototype.deserializeAll = function (data) {
            var len1 = data.byteLength;
            var ary = [];
            var game = this.game;
            var offset = 0;
            while(offset < len1) {
                var lens = new Uint16Array(data, offset, 1);
                var len = offset + lens[0];
                if(lens[0] < 12 || len > len1) {
                    break;
                }
                var meta = new Uint8Array(data, offset + 2, 2);
                var t = this.readDouble(data, offset + 4);
                offset += 12;
                var row = {
                    type: meta[0],
                    t: t,
                    events: []
                };
                while(offset < len) {
                    var e;
                    var et = new Uint32Array(data, offset, 1);
                    if((et[0] & 1) == 1) {
                        var k = new Uint32Array(data, offset + 4, 1);
                        var ek = {
                            keyCode: k[0]
                        };
                        e = new jg.InputKeyboardEvent(this.actionMapReverse[et[0] - 1], game.keymap[k[0]], ek);
                        offset += 8;
                    } else {
                        var pos = {
                            x: this.readDouble(data, offset + 4),
                            y: this.readDouble(data, offset + 12)
                        };
                        e = new jg.InputPointEvent(this.actionMapReverse[et[0] - 2], null, pos);
                        offset += 20;
                    }
                    row.events.push(e);
                }
                ary.push(row);
            }
            var ret = {
                data: ary,
                seek: offset
            };
            return ret;
        };
        BinarySerializer.prototype.deserialize = function (data) {
            var len = data.byteLength;
            var offset = 12;
            var meta = new Uint8Array(data, 2, 2);
            var t = this.readDouble(data, 4);
            var ret = {
                type: meta[0],
                t: t,
                events: []
            };
            var game = this.game;
            while(offset < len) {
                var e;
                var et = new Uint32Array(data, offset, 1);
                if((et[0] & 1) == 1) {
                    var k = new Uint32Array(data, offset + 4, 1);
                    var ek = {
                        keyCode: k[0]
                    };
                    e = new jg.InputKeyboardEvent(this.actionMapReverse[et[0] - 1], game.keymap[k[0]], ek);
                    offset += 8;
                } else {
                    var pos = {
                        x: this.readDouble(data, offset + 4),
                        y: this.readDouble(data, offset + 12)
                    };
                    e = new jg.InputPointEvent(this.actionMapReverse[et[0] - 2], null, pos);
                    offset += 20;
                }
                ret.events.push(e);
            }
            return ret;
        };
        return BinarySerializer;
    })(jgengine.Serializer);
    jgengine.BinarySerializer = BinarySerializer;    
})(jgengine || (jgengine = {}));
