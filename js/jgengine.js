var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
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
            var fps_stack = [];
            var _main = function (t) {
                if (_this._exit)
                    return;

                if (t === undefined)
                    t = Date.now ? Date.now() : new Date().getTime();
                if ((_this.tick + 500) < t || _this.tick > t) {
                    if ((_this.tick + 10000) < t || (_this.tick > t + 500))
                        _this.refresh();
                    _this.tick = t - 1000 / 60;
                    _this.renderTick = t;
                }

                var time = t - _this.tick;
                for (var i = 0; i < _this.timers.length; i++)
                    _this.timers[i].tryFire(time);

                if (_this.renderTick <= t) {
                    _this.raiseInputEvent();
                    _this.update.fire(time);
                    _this.tick = t;
                    if (_this.render)
                        _this.render.fire();
                    _this.renderer.render();
                    _this.renderTick = t + _this.targetFps;

                    if (_this.fps) {
                        if (fps_stack.length == 19) {
                            _this.fps.innerHTML = Math.round(20000 / (t - fps_stack[0])).toString();
                            fps_stack = [];
                        } else {
                            fps_stack.push(t);
                        }
                    }
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
            var fps_stack = [];
            var f = (function () {
                if (Date.now)
                    return Date.now;

                return function () {
                    return new Date().getTime();
                };
            })();
            var _main = function () {
                if (_this._exit)
                    return;

                var t = f();
                var time = t - _this.tick;
                if (_this.tick < t) {
                    _this.raiseInputEvent();
                    _this.update.fire(time);
                    _this.tick = t;
                }

                for (var i = 0; i < _this.timers.length; i++)
                    _this.timers[i].tryFire(time);

                window.setTimeout(_main, _this.wait);
            };

            var _render = function (t) {
                if (_this._exit)
                    return;

                if (t === undefined)
                    t = Date.now ? Date.now() : new Date().getTime();

                if ((_this.renderTick + 500) < t || _this.renderTick > t) {
                    if ((_this.renderTick + 10000) < t || (_this.renderTick > t + 500))
                        _this.refresh();
                    _this.tick = f() - _this.wait;
                    _this.renderTick = t;
                }

                if (_this.renderTick <= t) {
                    if (_this.render)
                        _this.render.fire();

                    _this.renderer.render();
                    _this.renderTick = t + _this.targetFps;

                    if (_this.fps) {
                        if (fps_stack.length == 19) {
                            _this.fps.innerHTML = Math.round(20000 / (t - fps_stack[0])).toString();
                            fps_stack = [];
                        } else {
                            fps_stack.push(t);
                        }
                    }
                }

                window.requestAnimationFrame(_render);
            };

            this.tick = f();
            this.renderTick = 0;
            window.setTimeout(_main, this.wait);
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
            if (this.render)
                this.render.fire();

            this.renderer.render();
        };

        StaticGame.prototype.manualUpdate = function (t) {
            this.tick += t;

            this.raiseInputEvent();
            this.update.fire(t);

            for (var i = 0; i < this.timers.length; i++)
                this.timers[i].tryFire(t);
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
            var fps_stack = [];
            var _main = function (t) {
                if (_this._exit)
                    return;
                if (t === undefined)
                    t = Date.now ? Date.now() : new Date().getTime();
                if (_this.tick > (t + 10000) || (_this.tick + 10000) < t) {
                    _this.tick = t - 1;
                    _this.renderTick = t - _this.targetFps;
                    _this.refresh();
                }

                var time = t - _this.tick;
                if (_this.tick < t) {
                    _this.log.fastFire({
                        type: 0,
                        t: time,
                        events: _this.eventQueue
                    });
                    _this.raiseInputEvent();
                    _this.update.fire(time);
                    _this.tick = t;
                }

                for (var i = 0; i < _this.timers.length; i++)
                    _this.timers[i].tryFire(time);

                if (_this.targetFps == 0 || _this.renderTick <= t) {
                    if (_this.render)
                        _this.render.fire();

                    _this.renderer.render();
                    if (_this.targetFps)
                        _this.renderTick = t + _this.targetFps;
                    if (_this.fps) {
                        if (fps_stack.length == 19) {
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
            if (!noStart)
                this._main();
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
    })(jgengine.StaticGame);
    jgengine.ReplayGame = ReplayGame;
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var Serializer = (function () {
        function Serializer() {
            this.event_serializers = {};
            this.event_deserializers = {};
        }
        Serializer.prototype.serialize = function (log) {
            throw "not implemented";
        };

        Serializer.prototype.deserialize = function (data) {
            throw "not implemented";
        };

        Serializer.prototype.serializeAll = function (logs) {
            throw "not implemented";
        };

        Serializer.prototype.deserializeAll = function (data) {
            throw "not implemented";
        };
        return Serializer;
    })();
    jgengine.Serializer = Serializer;
})(jgengine || (jgengine = {}));
var jgengine;
(function (jgengine) {
    var BinaryKeyEventSerializer = (function () {
        function BinaryKeyEventSerializer(serializer) {
            this.serializer = serializer;
            this.keymap = {
                13: jg.Keytype.Enter,
                27: jg.Keytype.Esc,
                37: jg.Keytype.Left,
                38: jg.Keytype.Up,
                39: jg.Keytype.Right,
                40: jg.Keytype.Down
            };
        }
        BinaryKeyEventSerializer.prototype.size = function (event) {
            return 8;
        };

        BinaryKeyEventSerializer.prototype.serialize = function (buffer, offset, event) {
            var writer = new Uint32Array(buffer, offset, 2);
            writer[0] = 1 | this.serializer.actionMap[event.action];
            writer[1] = (event).param.keyCode;
            return 8;
        };

        BinaryKeyEventSerializer.prototype.deserialize = function (buffer, offset, out) {
            var k = new Uint32Array(buffer, offset, 2);
            out.events.push(new jg.InputKeyboardEvent(this.serializer.actionMapReverse[k[0] - 1], this.keymap[k[1]], { keyCode: k[1] }));
            return 8;
        };
        return BinaryKeyEventSerializer;
    })();
    jgengine.BinaryKeyEventSerializer = BinaryKeyEventSerializer;
    var BinaryPointEventSerializer = (function () {
        function BinaryPointEventSerializer(serializer) {
            this.serializer = serializer;
        }
        BinaryPointEventSerializer.prototype.size = function (event) {
            return 20;
        };

        BinaryPointEventSerializer.prototype.serialize = function (buffer, offset, event) {
            var et = new Uint32Array(buffer, offset, 1);
            et[0] = 2 | this.serializer.actionMap[event.action];
            this.serializer.writeDouble(buffer, offset + 4, (event).point.x);
            this.serializer.writeDouble(buffer, offset + 12, (event).point.y);
            return 20;
        };

        BinaryPointEventSerializer.prototype.deserialize = function (buffer, offset, out) {
            var et = new Uint32Array(buffer, offset, 1);
            var pos = {
                x: this.serializer.readDouble(buffer, offset + 4),
                y: this.serializer.readDouble(buffer, offset + 12)
            };
            out.events.push(new jg.InputPointEvent(this.serializer.actionMapReverse[et[0] - 2], null, pos));
            return 20;
        };
        return BinaryPointEventSerializer;
    })();
    jgengine.BinaryPointEventSerializer = BinaryPointEventSerializer;

    var BinarySerializer = (function (_super) {
        __extends(BinarySerializer, _super);
        function BinarySerializer() {
            _super.call(this);
            this.actionMap = {};
            this.actionMap[jg.InputEventAction.Down] = 4;
            this.actionMap[jg.InputEventAction.Move] = 8;
            this.actionMap[jg.InputEventAction.Up] = 16;
            this.actionMapReverse = {};
            this.actionMapReverse[4] = jg.InputEventAction.Down;
            this.actionMapReverse[8] = jg.InputEventAction.Move;
            this.actionMapReverse[16] = jg.InputEventAction.Up;

            var keyboardSerializer = new BinaryKeyEventSerializer(this);
            var pointSerializer = new BinaryPointEventSerializer(this);
            this.event_serializers[jg.InputEventType.Keyboard] = keyboardSerializer;
            this.event_deserializers[1] = keyboardSerializer;

            this.event_serializers[jg.InputEventType.Point] = pointSerializer;
            this.event_deserializers[2] = pointSerializer;
        }
        BinarySerializer.prototype.writeDouble = function (buffer, offset, val) {
            var view = new Uint8Array(buffer, offset, 8);
            var sign = val < 0;
            sign && (val *= -1);

            var exp = ((Math.log(val) / Math.LN2) + 1023) | 0;

            var frac = val * Math.pow(2, 52 + 1023 - exp);

            var low = frac & 0xffffffff;
            sign && (exp |= 0x800);
            var high = ((frac / 0x100000000) & 0xfffff) | (exp << 20);

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
            var num = view[0] * 0x1000000 + (view[1] << 16) + (view[2] << 8) + view[3];
            var sign = num > 0x7fffffff;
            var exp = (num >> 20) & 0x7ff;
            var frac = num & 0xfffff;
            if (!num || num === 0x80000000) {
                return 0;
            }
            if (exp === 0x7ff) {
                return frac ? NaN : Infinity;
            }
            var num = view[4] * 0x1000000 + (view[5] << 16) + (view[6] << 8) + view[7];
            return (sign ? -1 : 1) * ((frac | 0x100000) * Math.pow(2, exp - 1023 - 20) + num * Math.pow(2, exp - 1023 - 52));
        };

        BinarySerializer.prototype.serializeAll = function (logs) {
            var len = logs.length;
            var size = 0;
            var b = false;
            var log;
            for (var i = 0; i < len; i++) {
                log = logs[i];
                if (!log.events.length) {
                    if (b) {
                        logs[i - 1].t += log.t;
                    } else {
                        b = true;
                        size += 12;
                    }
                } else {
                    b = false;
                    size += 12;
                    for (var j = 0; j < log.events.length; j++)
                        size += (log.events[j].type == jg.InputEventType.Keyboard) ? 8 : 20;
                }
            }

            var ret = new ArrayBuffer(size);
            var offset = 0;
            b = false;
            for (var i = 0; i < len; i++) {
                var s;
                var meta;
                log = logs[i];
                if (!log.events.length) {
                    if (b)
                        continue;

                    b = true;
                } else {
                    b = false;
                }

                var sub_size = 12;
                var e;
                for (var j = 0; j < log.events.length; j++) {
                    e = log.events[j];
                    sub_size += this.event_serializers[e.type].size(e);
                }

                s = new Uint16Array(ret, offset, 1);
                s[0] = sub_size;
                meta = new Uint8Array(ret, offset + 2, 2);
                meta[0] = log.type;
                this.writeDouble(ret, offset + 4, log.t);
                offset += 12;
                for (var j = 0; j < log.events.length; j++) {
                    e = log.events[j];
                    offset += this.event_serializers[e.type].serialize(ret, offset, e);
                }
            }

            return ret;
        };

        BinarySerializer.prototype.serialize = function (log) {
            var ret;
            var s;
            var meta;
            if (!log.events.length) {
                ret = new ArrayBuffer(12);
                s = new Uint16Array(ret, 0, 1);
                s[0] = 12;
                meta = new Uint8Array(ret, 2, 2);
                meta[0] = log.type;
                this.writeDouble(ret, 4, log.t);
                return ret;
            }

            var size = 12;
            var e;
            for (var i = 0; i < log.events.length; i++) {
                e = log.events[i];
                size += this.event_serializers[e.type].size(e);
            }

            ret = new ArrayBuffer(size);
            s = new Uint16Array(ret, 0, 1);
            s[0] = size;
            this.writeDouble(ret, 4, log.t);
            var offset = 12;
            for (var i = 0; i < log.events.length; i++) {
                e = log.events[i];
                offset += this.event_serializers[e.type].serialize(ret, offset, e);
            }

            return ret;
        };

        BinarySerializer.prototype.deserializeAll = function (data) {
            var len1 = data.byteLength;
            var ary = [];
            var offset = 0;

            while (offset < len1) {
                var lens = new Uint16Array(data, offset, 1);
                var len = offset + lens[0];
                if (lens[0] < 12 || len > len1)
                    break;

                var meta = new Uint8Array(data, offset + 2, 2);
                var t = this.readDouble(data, offset + 4);
                offset += 12;
                var row = {
                    type: meta[0],
                    t: t,
                    events: []
                };
                while (offset < len) {
                    var et = new Uint32Array(data, offset, 1);
                    offset += this.event_deserializers[et[0] & 0xFFFFFFE3].deserialize(data, offset, row);
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
            while (offset < len) {
                var et = new Uint32Array(data, offset, 1);
                offset += this.event_deserializers[et[0] & 0xFFFFFFE3].deserialize(data, offset, ret);
            }

            return ret;
        };
        return BinarySerializer;
    })(jgengine.Serializer);
    jgengine.BinarySerializer = BinarySerializer;
})(jgengine || (jgengine = {}));
