var game;
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy() {
        _super.call(this, 32, 32, game.r("eye"));
        this.frame = [
            20
        ];
        if(game.random(0, 9) < 1) {
            this.homingShot = true;
        }
        if(game.random(0, 9) < 2) {
            this.shotSize = game.random(5, 55);
        }
        if(game.random(0, 9) < 2) {
            this.shotSpeed = game.random(80, 200);
        }
        this.shotPer = game.random(1, 10000);
    }
    Enemy.prototype.fire = function () {
        var s = new Shot(this, this.shotSize);
        s.homingShot = this.homingShot;
        if(this.shotSpeed) {
            s.speed = this.shotSpeed;
        }
        return s;
    };
    return Enemy;
})(Sprite);
var Shot = (function (_super) {
    __extends(Shot, _super);
    function Shot(owner, size, color) {
        if(!size) {
            size = 7;
        }
        _super.call(this, 16, size, ShapeStyle.Fill, color ? color : "orange");
        this.owner = owner;
        this.speed = 80;
        this.moveTo(owner.x, owner.y + owner.height / 2 - size / 2);
    }
    return Shot;
})(Shape);
var ShootingScene = (function (_super) {
    __extends(ShootingScene, _super);
    function ShootingScene(game) {
        _super.call(this, game);
        this.enemies = new Array();
        this.shots = new Array();
        this.speed = 120;
        this.scrollSpeed = 80;
        this.directions = {
        };
        this.limit = new Rectangle(0, 0, 0, game.height - 32);
        this.score = 0;
    }
    ShootingScene.prototype.start = function () {
        game = this.game;
        this.game.changeScene(this);
        game.keyDown.handle(this, this.keydown);
        game.keyUp.handle(this, this.keyup);
        game.update.handle(this, this.time);
        this.root.enablePointingEvent();
        this.root.pointDown.handle(this, this.touchdown);
        this.root.pointMove.handle(this, this.touchdown);
        this.root.pointUp.handle(this, this.touchup);
        this.game.addTimer(500, this, this.timer);
        this.game.addTimer(200, this, this.timer2);
        this.game.setBgColor(0, 0, 0, 255);
        this.my = new Sprite(32, 32, game.r("eye"));
        this.my.frame = [
            10
        ];
        this.my.moveTo(0, 240);
        this.append(this.my);
        this.power = 0;
    };
    ShootingScene.prototype.touchdown = function (e) {
        this.move = JGUtil.getMovePoint(e, this.my, 4, this.speed);
    };
    ShootingScene.prototype.touchup = function (e) {
        delete this.move;
    };
    ShootingScene.prototype.keydown = function (e) {
        if(e.key == Keytype.Left || e.key == Keytype.Right || e.key == Keytype.Up || e.key == Keytype.Down) {
            this.directions[e.key] = true;
        } else {
            this.directions[Keytype.Enter] = true;
        }
    };
    ShootingScene.prototype.keyup = function (e) {
        if(e.key == Keytype.Left || e.key == Keytype.Right || e.key == Keytype.Up || e.key == Keytype.Down) {
            delete this.directions[e.key];
        } else {
            delete this.directions[Keytype.Enter];
        }
    };
    ShootingScene.prototype.scrollBy = function (x, y, layerName) {
        _super.prototype.scrollBy.call(this, x, y, layerName);
        this.my.moveBy(-x, y);
    };
    ShootingScene.prototype.timer = function () {
        var new_shots = new Array();
        for(var i = 0; i < this.enemies.length; i++) {
            if(this.enemies[i].pause) {
                continue;
            }
            if(game.random(1, 10000) < this.enemies[i].shotPer) {
                new_shots.push(this.enemies[i].fire());
            }
        }
        for(var i = 0; i < new_shots.length; i++) {
            this.shots.push(new_shots[i]);
            this.append(new_shots[i]);
        }
        if(game.random(0, 19) == 0) {
            var eCount = game.random(0, 19);
            for(var i = 0; i < eCount; i++) {
                this.addEnemy();
            }
        } else {
            if(game.random(0, 2) < 2) {
                this.addEnemy();
            }
        }
    };
    ShootingScene.prototype.updateScore = function () {
        $("#score").html((-Math.round(this.root.scroll.x * 0.1) + this.score).toString());
    };
    ShootingScene.prototype.timer2 = function () {
        if(this.directions[Keytype.Enter]) {
            this.power += 2;
            return;
        }
        var my_shot = new Shot(this.my, 7 + this.power, "red");
        this.power = 0;
        this.shots.push(my_shot);
        this.append(my_shot);
    };
    ShootingScene.prototype.getEnemyByShot = function (s) {
        for(var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if(e.pause) {
                continue;
            }
            var d = s.getDistance({
                x: e.x,
                y: e.y + 2,
                width: e.width,
                height: e.height
            });
            if(d.x < s.width && d.y < (s.height + 4)) {
                return e;
            }
        }
        return null;
    };
    ShootingScene.prototype.time = function (t) {
        var a = t / 1000;
        this.scrollBy(-this.scrollSpeed * a, 0);
        if(this.move) {
            this.my.moveBy(this.move.x * a, this.move.y * a);
        } else {
            if(this.directions[Keytype.Up]) {
                this.my.moveBy(0, -this.speed * a);
            }
            if(this.directions[Keytype.Down]) {
                this.my.moveBy(0, this.speed * a);
            }
            if(this.directions[Keytype.Left]) {
                this.my.moveBy(-this.speed * a, 0);
            }
            if(this.directions[Keytype.Right]) {
                this.my.moveBy(this.speed * a, 0);
            }
        }
        var b = (-this.root.scroll.x);
        this.limit.left = b;
        this.limit.right = b + this.game.width - 32;
        this.limit.fit(this.my);
        for(var i = 0; i < this.shots.length; i++) {
            var s = this.shots[i];
            if(s.owner == this.my) {
                var enemy = this.getEnemyByShot(s);
                if(enemy) {
                    this.score += 50;
                    this.killEnemy(enemy);
                    s.height -= 4;
                    s.y += 2;
                    if(s.height < 6) {
                        this.shots.splice(i--, 1);
                        s.remove();
                        continue;
                    }
                }
                if(s.x > (b + this.game.width)) {
                    this.removeEntity(s);
                    this.shots.splice(i, 1);
                    i--;
                } else {
                    s.x += (s.speed + this.speed) * a;
                }
            } else {
                var d = s.getDistance({
                    x: this.my.x,
                    y: this.my.y + 2,
                    width: this.my.width,
                    height: this.my.height
                });
                if(d.x < s.width / 2 && d.y < s.height / 2) {
                    this.gameover();
                }
                if(s.x < b) {
                    this.removeEntity(s);
                    this.shots.splice(i, 1);
                    i--;
                } else {
                    s.x -= s.speed * a;
                    if(s.homingShot) {
                        JGUtil.homingY(s, this.my, 30 / 800, t);
                    }
                }
            }
        }
        for(var i = 0; i < this.enemies.length; i++) {
            if(this.enemies[i].pause) {
                continue;
            }
            var d = this.enemies[i].getDistance({
                x: this.my.x,
                y: this.my.y + 2,
                width: this.my.width,
                height: this.my.height
            });
            if(d.x < this.enemies[i].width / 2 && d.y < this.enemies[i].height / 2) {
                this.gameover();
            }
        }
        this.updateScore();
    };
    ShootingScene.prototype.killEnemy = function (e) {
        var _this = this;
        e.pause = true;
        e.tl().clear().fadeOut(500).then(function () {
            for(var i = 0; i < _this.enemies.length; i++) {
                if(e == _this.enemies[i]) {
                    _this.enemies.splice(i, 1);
                    break;
                }
            }
            e.remove();
        });
    };
    ShootingScene.prototype.gameover = function () {
        var _this = this;
        if(this.my._tl) {
            return;
        }
        this.my.tl().scaleTo(20, 1000).and().fadeOut(1000).then(function () {
            var label = new Label("GAME OVER", 32, "red");
            label.setTextAlign("center");
            label.setTextBaseline("middle");
            label.moveTo((-_this.root.scroll.x) + _this.game.width / 2, _this.game.height / 2);
            _this.append(label);
            _this.updateScore();
            var label = new Label("ブラウザの更新ボタンで再度遊べます", 12, "red");
            label.setTextAlign("center");
            label.setTextBaseline("middle");
            label.moveTo((-_this.root.scroll.x) + _this.game.width / 2, _this.game.height / 2 + 32);
            _this.append(label);
            _this.game.end();
        });
    };
    ShootingScene.prototype.addEnemy = function () {
        var _this = this;
        var enemy = new Enemy();
        enemy.moveTo(-this.root.scroll.x + this.game.width, game.random(0, this.game.height - enemy.height));
        var new_enemies = new Array();
        for(var i = 0; i < this.enemies.length; i++) {
            if((!this.enemies[i].pause) && this.enemies[i].x < (-this.root.scroll.x)) {
                this.removeEntity(this.enemies[i]);
            } else {
                new_enemies.push(this.enemies[i]);
            }
        }
        new_enemies.push(enemy);
        var r = this.game.random(0, 9999);
        if(r < 800) {
            var t = this.game.random(200, 1000);
            enemy.tl().waitUntil(function (e) {
                JGUtil.homing(enemy, _this.my, 30 / t, e.elapsed);
            });
        } else if(r < 4000) {
            var margin = Math.min(this.game.height - enemy.y, enemy.y);
            var t = this.game.random(400, 1200);
            var x = this.game.random(-150, 150);
            var m = this.game.random(-margin, margin);
            var easing = Easing.RANDOM(this.game);
            var r2 = this.game.random(0, 99);
            if(r2 < 70) {
                enemy.tl().moveBy(0, m, t, easing).moveBy(0, -m, t, easing).loop();
            } else if(r2 < 80) {
                enemy.tl().moveBy(x, 0, t, easing).moveBy(-x, 0, t, easing).loop();
            } else {
                enemy.tl().moveBy(x, m, t, easing).moveBy(-x, -m, t, easing).loop();
            }
        }
        this.enemies = new_enemies;
        this.append(enemy);
    };
    return ShootingScene;
})(Scene);
var VEnemy = (function (_super) {
    __extends(VEnemy, _super);
    function VEnemy() {
        _super.call(this, 32, 32, game.r("eye"));
        this.frame = [
            16
        ];
        if(game.random(0, 9) < 1) {
            this.homingShot = true;
        }
        if(game.random(0, 9) < 2) {
            this.shotSize = game.random(5, 55);
        }
        if(game.random(0, 9) < 2) {
            this.shotSpeed = game.random(80, 200);
        }
        this.shotPer = game.random(1, 10000);
    }
    VEnemy.prototype.fire = function () {
        var s = new VShot(this, this.shotSize);
        s.homingShot = this.homingShot;
        if(this.shotSpeed) {
            s.speed = this.shotSpeed;
        }
        s.y += this.height / 2;
        return s;
    };
    return VEnemy;
})(Sprite);
var VShot = (function (_super) {
    __extends(VShot, _super);
    function VShot(owner, size, color) {
        if(!size) {
            size = 7;
        }
        _super.call(this, size, 16, ShapeStyle.Fill, color ? color : "orange");
        this.owner = owner;
        this.speed = 80;
        this.moveTo(owner.x + owner.width / 2 - size / 2, owner.y);
    }
    return VShot;
})(Shape);
var VShootingScene = (function (_super) {
    __extends(VShootingScene, _super);
    function VShootingScene(game) {
        _super.call(this, game);
        this.enemies = new Array();
        this.shots = new Array();
        this.speed = 120;
        this.scrollSpeed = 80;
        this.directions = {
        };
        this.limit = new Rectangle(0, 0, game.width - 32, 0);
        this.score = 0;
    }
    VShootingScene.prototype.start = function () {
        game = this.game;
        this.game.changeScene(this);
        game.keyDown.handle(this, this.keydown);
        game.keyUp.handle(this, this.keyup);
        game.update.handle(this, this.time);
        this.root.enablePointingEvent();
        this.root.pointDown.handle(this, this.touchdown);
        this.root.pointMove.handle(this, this.touchdown);
        this.root.pointUp.handle(this, this.touchup);
        this.game.addTimer(500, this, this.timer);
        this.game.addTimer(200, this, this.timer2);
        this.game.setBgColor(0, 0, 0, 255);
        this.my = new Sprite(32, 32, game.r("eye"));
        this.my.frame = [
            14
        ];
        this.my.moveTo(game.width / 2, game.height);
        this.append(this.my);
        this.power = 0;
    };
    VShootingScene.prototype.touchdown = function (e) {
        this.move = JGUtil.getMovePoint(e, this.my, 4, this.speed);
    };
    VShootingScene.prototype.touchup = function (e) {
        delete this.move;
    };
    VShootingScene.prototype.keydown = function (e) {
        if(e.key == Keytype.Left || e.key == Keytype.Right || e.key == Keytype.Up || e.key == Keytype.Down) {
            this.directions[e.key] = true;
        } else {
            this.directions[Keytype.Enter] = true;
        }
    };
    VShootingScene.prototype.keyup = function (e) {
        if(e.key == Keytype.Left || e.key == Keytype.Right || e.key == Keytype.Up || e.key == Keytype.Down) {
            delete this.directions[e.key];
        } else {
            delete this.directions[Keytype.Enter];
        }
    };
    VShootingScene.prototype.scrollBy = function (x, y, layerName) {
        _super.prototype.scrollBy.call(this, x, y, layerName);
        this.my.moveBy(x, -y);
    };
    VShootingScene.prototype.timer = function () {
        var new_shots = new Array();
        for(var i = 0; i < this.enemies.length; i++) {
            if(this.enemies[i].pause) {
                continue;
            }
            if(game.random(1, 10000) < this.enemies[i].shotPer) {
                new_shots.push(this.enemies[i].fire());
            }
        }
        for(var i = 0; i < new_shots.length; i++) {
            this.shots.push(new_shots[i]);
            this.append(new_shots[i]);
        }
        if(game.random(0, 19) == 0) {
            var eCount = game.random(0, 19);
            for(var i = 0; i < eCount; i++) {
                this.addEnemy();
            }
        } else {
            if(game.random(0, 2) < 2) {
                this.addEnemy();
            }
        }
    };
    VShootingScene.prototype.updateScore = function () {
        $("#score").html((Math.round(this.root.scroll.y * 0.1) + this.score).toString());
    };
    VShootingScene.prototype.timer2 = function () {
        if(this.directions[Keytype.Enter]) {
            this.power += 2;
            return;
        }
        var my_shot = new VShot(this.my, 7 + this.power, "red");
        this.power = 0;
        this.shots.push(my_shot);
        this.append(my_shot);
    };
    VShootingScene.prototype.getEnemyByShot = function (s) {
        for(var i = 0; i < this.enemies.length; i++) {
            var e = this.enemies[i];
            if(e.pause) {
                continue;
            }
            var d = s.getDistance({
                x: e.x,
                y: e.y,
                width: e.width,
                height: e.height
            });
            if(d.x < (s.width + 4) && d.y < s.height) {
                return e;
            }
        }
        return null;
    };
    VShootingScene.prototype.time = function (t) {
        var a = t / 1000;
        this.scrollBy(0, this.scrollSpeed * a);
        if(this.move) {
            this.my.moveBy(this.move.x * a, this.move.y * a);
        } else {
            if(this.directions[Keytype.Up]) {
                this.my.moveBy(0, -this.speed * a);
            }
            if(this.directions[Keytype.Down]) {
                this.my.moveBy(0, this.speed * a);
            }
            if(this.directions[Keytype.Left]) {
                this.my.moveBy(-this.speed * a, 0);
            }
            if(this.directions[Keytype.Right]) {
                this.my.moveBy(this.speed * a, 0);
            }
        }
        var b = this.root.scroll.y;
        this.limit.top = -b;
        this.limit.bottom = -b + game.height - 32;
        this.limit.fit(this.my);
        this.limit.bottom += 16;
        for(var i = 0; i < this.shots.length; i++) {
            var s = this.shots[i];
            if(s.owner == this.my) {
                var enemy = this.getEnemyByShot(s);
                if(enemy) {
                    this.score += 50;
                    this.killEnemy(enemy);
                    s.width -= 2;
                    s.x += 1;
                    if(s.width < 6) {
                        this.shots.splice(i--, 1);
                        s.remove();
                        continue;
                    }
                }
                if(s.y < this.limit.top) {
                    this.removeEntity(s);
                    this.shots.splice(i, 1);
                    i--;
                } else {
                    s.y -= (s.speed + this.speed) * a;
                }
            } else {
                var d = s.getDistance({
                    x: this.my.x,
                    y: this.my.y + 2,
                    width: this.my.width,
                    height: this.my.height
                });
                if(d.x < s.width / 2 && d.y < s.height / 2) {
                    this.gameover();
                }
                if(s.y > this.limit.bottom) {
                    this.removeEntity(s);
                    this.shots.splice(i, 1);
                    i--;
                } else {
                    s.y += s.speed * a;
                    if(s.homingShot) {
                        JGUtil.homingX(s, this.my, 30 / 800, t);
                    }
                }
            }
        }
        for(var i = 0; i < this.enemies.length; i++) {
            if(this.enemies[i].pause) {
                continue;
            }
            var d = this.enemies[i].getDistance({
                x: this.my.x,
                y: this.my.y + 2,
                width: this.my.width,
                height: this.my.height
            });
            if(d.x < this.enemies[i].width / 2 && d.y < this.enemies[i].height / 2) {
                this.gameover();
            }
        }
        this.updateScore();
    };
    VShootingScene.prototype.killEnemy = function (e) {
        var _this = this;
        e.pause = true;
        e.tl().clear().fadeOut(500).then(function () {
            for(var i = 0; i < _this.enemies.length; i++) {
                if(e == _this.enemies[i]) {
                    _this.enemies.splice(i, 1);
                    break;
                }
            }
            e.remove();
        });
    };
    VShootingScene.prototype.gameover = function () {
        var _this = this;
        if(this.my._tl) {
            return;
        }
        this.my.tl().scaleTo(20, 1000).and().fadeOut(1000).then(function () {
            var label = new Label("GAME OVER", 32, "red");
            label.setTextAlign("center");
            label.setTextBaseline("middle");
            label.moveTo(_this.game.width / 2, _this.game.height / 2 + (-_this.root.scroll.y));
            _this.append(label);
            _this.updateScore();
            var label = new Label("ブラウザの更新ボタンで再度遊べます", 12, "red");
            label.setTextAlign("center");
            label.setTextBaseline("middle");
            label.moveTo(_this.game.width / 2, _this.game.height / 2 + 32 + (-_this.root.scroll.y));
            _this.append(label);
            _this.game.end();
        });
    };
    VShootingScene.prototype.addEnemy = function () {
        var _this = this;
        var enemy = new VEnemy();
        enemy.moveTo(game.random(0, this.game.width - enemy.width), this.limit.top - 32);
        var new_enemies = new Array();
        for(var i = 0; i < this.enemies.length; i++) {
            if((!this.enemies[i].pause) && this.enemies[i].y > this.limit.bottom) {
                this.removeEntity(this.enemies[i]);
            } else {
                new_enemies.push(this.enemies[i]);
            }
        }
        new_enemies.push(enemy);
        var r = this.game.random(0, 9999);
        if(r < 800) {
            var t = this.game.random(200, 1000);
            enemy.tl().waitUntil(function (e) {
                JGUtil.homing(enemy, _this.my, 30 / t, e.elapsed);
            });
        } else if(r < 4000) {
            var margin = Math.min(this.game.width - enemy.x, enemy.x);
            var m = this.game.random(-margin, margin);
            var t = this.game.random(400, 1200);
            var y = this.game.random(-150, 150);
            var easing = Easing.RANDOM(this.game);
            var r2 = this.game.random(0, 99);
            if(r2 < 70) {
                enemy.tl().moveBy(m, 0, t, easing).moveBy(-m, 0, t, easing).loop();
            } else if(r2 < 80) {
                enemy.tl().moveBy(0, y, t, easing).moveBy(0, -y, t, easing).loop();
            } else {
                enemy.tl().moveBy(m, y, t, easing).moveBy(-m, -y, t, easing).loop();
            }
        }
        this.enemies = new_enemies;
        this.append(enemy);
    };
    return VShootingScene;
})(Scene);
var GameOverScene = (function (_super) {
    __extends(GameOverScene, _super);
    function GameOverScene(game, score) {
        _super.call(this, game);
        this.score = score;
        this.started.handle(this, this.startHandle);
    }
    GameOverScene.prototype.startHandle = function () {
        var caption1 = new Label("GAME", 72, "red");
        var caption2 = new Label("OVER", 72, "red");
        var score = new Label("score: ", 24, "green", "middle");
        var score2 = new Label(this.score.toString(), 32, "yellow", "middle");
        var guide = new Label("※ブラウザの更新ボタンで再度遊べます※", 14, "white");
        caption1.setTextAlign("center");
        caption2.setTextAlign("center");
        guide.setTextAlign("center");
        caption1.moveTo(this.game.width / 2, this.game.height / 4);
        caption2.moveTo(this.game.width / 2, this.game.height / 4 + 72);
        score.moveTo(this.game.width / 2 - score.width / 2 - score2.width / 2, this.game.height / 4 * 3);
        score2.moveTo(this.game.width / 2 + score.width / 2 - score2.width / 2, this.game.height / 4 * 3);
        guide.moveTo(this.game.width / 2, this.game.height / 4 * 3 + 32 + 14);
        this.append(caption1);
        this.append(caption2);
        this.append(score);
        this.append(score2);
        this.append(guide);
    };
    return GameOverScene;
})(Scene);
var PhysActionScene = (function (_super) {
    __extends(PhysActionScene, _super);
    function PhysActionScene(game) {
        _super.call(this, game);
        this.started.handle(this, this.start);
        this.score = 0;
        this.scrollTo(0, 0);
    }
    PhysActionScene.prototype.showDebug = function () {
        var canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 400;
        var container = document.createElement("div");
        container.appendChild(canvas);
        document.body.appendChild(container);
        this.world.enableDebug(canvas.getContext("2d"));
    };
    PhysActionScene.prototype.convertKey = function () {
    };
    PhysActionScene.prototype.keydown = function (e) {
        var ek = e;
        if(ek.key == null) {
            switch(ek.param.keyCode) {
                case 90:
                    switch(this.gravityDirection) {
                        case Angle.Down:
                            this.gravityDirection = Angle.Right;
                            this.world.setGravity({
                                x: 10,
                                y: 0
                            });
                            break;
                        case Angle.Right:
                            this.gravityDirection = Angle.Up;
                            this.world.setGravity({
                                x: 0,
                                y: -10
                            });
                            break;
                        case Angle.Up:
                            this.gravityDirection = Angle.Left;
                            this.world.setGravity({
                                x: -10,
                                y: 0
                            });
                            break;
                        case Angle.Left:
                            this.gravityDirection = Angle.Down;
                            this.world.setGravity({
                                x: 0,
                                y: 10
                            });
                            break;
                    }
                    break;
            }
        } else {
            this.key = ek.key;
        }
    };
    PhysActionScene.prototype.createScoreLayer = function () {
        var layer = this.createLayer("score");
        var label = new Label("SCORE:", 13, "red");
        var label2 = new Label("TIME:", 13, "red");
        this.timeLabel = new Label((this.time / 1000).toString() + ".00", 13, "red");
        this.timeLabel.setTextAlign("right");
        this.timeLabel.moveTo(this.game.width - 20, 0);
        this.scoreLabel = new Label(this.score.toString(), 13, "red");
        this.scoreLabel.moveTo(label.width + 6, 0);
        label.moveTo(0, 0);
        label2.moveTo(this.game.width - label2.width - 60, 0);
        layer.append(label);
        layer.append(label2);
        layer.append(this.timeLabel);
        layer.append(this.scoreLabel);
    };
    PhysActionScene.prototype.updateScore = function () {
        var s = (Math.round(this.time * 100 / 1000) / 100).toString();
        if(this.time < 1000) {
            s = "0" + s;
        }
        if(s.length == 2) {
            s += ".00";
        } else if(s.length == 4) {
            s += "0";
        }
        this.timeLabel.setText(s);
        this.scoreLabel.setText(this.score.toString());
    };
    PhysActionScene.prototype.addEnemy = function () {
        var _this = this;
        var r = this.game.random(0, 99);
        var shapeType = ShapeType.Rect;
        var color;
        if(r < 3) {
            this.world.attachOption.density = 4.5;
            color = "#ff0000";
        } else if(r < 70) {
            shapeType = ShapeType.Arc;
            this.world.attachOption.density = 1;
            color = "#3399ff";
        } else {
            shapeType = ShapeType.Arc;
            this.world.attachOption.density = 3.5;
            color = "#ff8800";
        }
        this.world.attachOption.friction = 0.5;
        this.world.attachOption.shapeType = shapeType;
        var s = new Shape(32, 32, ShapeStyle.Fill, color, shapeType);
        s.moveTo(this.game.random(this.ground_rect.left, this.ground_rect.right), this.game.random(this.ground_rect.top, this.ground_rect.bottom));
        this.append(s);
        s.setDrawOption("globalAlpha", 0);
        var opt = this.world.attachOption.clone();
        s.tl().fadeIn(1000).then(function () {
            _this.world.attach(s, opt);
        });
    };
    PhysActionScene.prototype.enemyTimer = function () {
        this.addEnemy();
    };
    PhysActionScene.prototype.start = function () {
        this.deleteEntity = new Array();
        game = this.game;
        game.setBgColor(0, 0, 0, 255);
        this.time = 30000;
        this.score = 0;
        this.game.addTimer(300, this, this.enemyTimer);
        this.createScoreLayer();
        this.world = new jgb2.World(game);
        var world = this.world;
        this.gravityDirection = Angle.Down;
        this.ground_size = {
            width: 600,
            height: 600
        };
        this.ground_rect = new Rectangle(20, 20, this.ground_size.width - 20 * 2, this.ground_size.height - 20 * 2);
        var ground = new Shape(this.ground_size.width - 20, 20, ShapeStyle.Fill, "silver");
        var ground2 = new Shape(this.ground_size.width - 20, 20, ShapeStyle.Fill, "silver");
        var ground3 = new Shape(20, this.ground_size.height - 20, ShapeStyle.Fill, "silver");
        var ground4 = new Shape(20, this.ground_size.height - 20, ShapeStyle.Fill, "silver");
        ground.moveTo(20, this.ground_size.width - 20);
        ground2.moveTo(20, 20);
        ground3.moveTo(20, 20);
        ground4.moveTo(this.ground_size.width - 20, 20);
        this.append(ground);
        this.append(ground2);
        this.append(ground3);
        this.append(ground4);
        var chara = new Character(32, 32, game.r("c16"));
        chara.charaCol = 10;
        chara.charaSeq = 18;
        chara.angleSeq = {
        };
        chara.angleSeq[Angle.Up] = 0;
        chara.angleSeq[Angle.Right] = 1;
        chara.angleSeq[Angle.Down] = 2;
        chara.angleSeq[Angle.Left] = 3;
        chara.angle(Angle.Right);
        chara.moveTo(100, this.ground_rect.bottom - 20);
        this.append(chara);
        this.chara = chara;
        world.attachOption.friction = 0.5;
        world.attachStatic(ground);
        world.attachStatic(ground2);
        world.attachStatic(ground3);
        world.attachStatic(ground4);
        world.attachOption.density = 2.5;
        this.charaP = world.attach(chara);
        game.keyDown.handle(this, this.keydown);
        for(var i = 0; i < 30; i++) {
            this.addEnemy();
        }
        world.start(true);
        this.game.update.handle(this, this.update);
        this.center = {
            x: game.width / 2 - this.chara.width / 2,
            y: game.height / 2 - this.chara.height / 2
        };
        world.enableContactEvent();
        world.preSolve = new Trigger();
        world.preSolve.handle(this, this.preSolve);
    };
    PhysActionScene.prototype.beginContact = function (e) {
    };
    PhysActionScene.prototype.endContact = function (e) {
        console.log("endContact");
    };
    PhysActionScene.prototype.postSolve = function (e) {
        console.log("postSolve");
    };
    PhysActionScene.prototype.getImpact = function (bodyA, bodyB, contact) {
        var worldManifold = new Box2D.Collision.b2WorldManifold();
        contact.GetWorldManifold(worldManifold);
        var point = worldManifold.m_points[0];
        var vA = bodyA.GetLinearVelocityFromWorldPoint(point);
        var vB = bodyB.GetLinearVelocityFromWorldPoint(point);
        vB.Subtract(vA);
        var approachVelocity = Box2D.Common.Math.b2Math.Dot(vB, worldManifold.m_normal);
        return Math.abs(approachVelocity);
    };
    PhysActionScene.prototype.preSolve = function (e) {
        var _this = this;
        var bodyA = e.contact.GetFixtureA().GetBody();
        var bodyB = e.contact.GetFixtureB().GetBody();
        if(bodyA.GetType() != Box2D.Dynamics.b2Body.b2_dynamicBody || bodyB.GetType() != Box2D.Dynamics.b2Body.b2_dynamicBody) {
            return;
        }
        var entityA = bodyA.GetUserData();
        var entityB = bodyB.GetUserData();
        if(entityA.entity == this.chara) {
            var impact = this.getImpact(bodyA, bodyB, e.contact);
            var targetP = entityB.getMass() * this.world.scale * 0.2;
            if(impact > targetP) {
                this.score += Math.round(targetP * 10);
                entityB.entity.tl().scaleTo(5, 300).and().fadeOut(300).removeFromScene();
                this.deleteEntity.push(entityB.entity);
                e.contact.SetEnabled(false);
            }
        } else if(entityB.entity == this.chara) {
            var impact = this.getImpact(bodyA, bodyB, e.contact);
            targetP = 10;
            if(impact > targetP) {
                entityB.entity.tl().scaleTo(20, 1000).and().fadeOut(1000).and().rotateBy(360, 1000).then(function () {
                    _this.gameover();
                }).removeFromScene();
                this.deleteEntity.push(entityB.entity);
            }
        }
    };
    PhysActionScene.prototype.gameover = function (anime) {
        var _this = this;
        this.world.stop();
        for(var i = 0; i < this.root.entities.length; i++) {
            this.root.entities[i].removeDrawOption("globalAlpha");
        }
        if(anime) {
            this.root.tl().fadeOut(1000).then(function () {
                _this.game.endScene();
                _this.game.changeScene(new GameOverScene(_this.game, _this.score));
            });
        } else {
            this.game.endScene();
            this.game.changeScene(new GameOverScene(this.game, this.score));
        }
    };
    PhysActionScene.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.world.disableDebug();
        this.world.stop();
        this.game.removeTimer(300, this, this.enemyTimer);
        this.game.update.remove(this, this.update);
        this.game.keyDown.remove(this, this.keydown);
    };
    PhysActionScene.prototype.update = function (t) {
        if(this.deleteEntity.length) {
            var de;
            while(de = this.deleteEntity.pop()) {
                this.world.detach(de);
            }
        }
        var v = this.charaP.getVelocity();
        var angle = Math.abs(this.charaP.getAngle() * this.world.radian % 360);
        var contacts = this.world.getContacts(this.charaP);
        var charaBottom = this.chara.y + this.chara.height;
        var hasBottom = true;
        for(var i = 0; i < contacts.length; i++) {
            if((contacts[i].entity.y - charaBottom) < 8) {
                hasBottom = true;
                break;
            }
        }
        if(angle > 180) {
            angle = 360 - angle;
        }
        if(this.key != undefined) {
            switch(this.key) {
                case Keytype.Up:
                    this.chara.angle(Angle.Up);
                    if(v.y > -30) {
                        this.charaP.addVelocity({
                            x: 0,
                            y: -1
                        });
                    }
                    break;
                case Keytype.Down:
                    this.chara.angle(Angle.Down);
                    if(v.y < 30) {
                        this.charaP.addVelocity({
                            x: 0,
                            y: 1
                        });
                    }
                    break;
                case Keytype.Left:
                    this.chara.angle(Angle.Left);
                    if(v.x > -30) {
                        this.charaP.addVelocity({
                            x: -1,
                            y: 0
                        });
                    }
                    break;
                case Keytype.Right:
                    this.chara.angle(Angle.Right);
                    if(v.x < 30) {
                        this.charaP.addVelocity({
                            x: 1,
                            y: 0
                        });
                    }
                    break;
            }
        }
        if(v.y < 0.1 && v.y > -0.1) {
            this.chara.animation = true;
        } else {
            this.chara.animation = false;
        }
        this.updateFocus();
        this.time -= t;
        if(this.time < 0) {
            this.time = 0;
            this.gameover(true);
        }
        this.updateScore();
    };
    PhysActionScene.prototype.updateFocus = function () {
        var xp = this.root.scroll.x + this.chara.x;
        var xf = true, yf = true;
        if(xp < this.center.x) {
            xp += Math.min(32, Math.ceil((this.center.x - xp) * 0.1));
            if(xp > this.center.x) {
                xp = this.center.x;
            }
            xf = false;
        } else if(xp > this.center.x) {
            xp -= Math.min(32, Math.ceil((xp - this.center.x) * 0.1));
            if(xp < this.center.x) {
                xp = this.center.x;
            }
            xf = false;
        }
        var yp = this.root.scroll.y + this.chara.y;
        if(yp < this.center.y) {
            yp += Math.min(32, Math.ceil((this.center.y - yp) * 0.1));
            if(yp > this.center.y) {
                yp = this.center.y;
            }
            yf = false;
        } else if(yp > this.center.y) {
            yp -= Math.min(32, Math.ceil((yp - this.center.y) * 0.1));
            if(yp < this.center.y) {
                yp = this.center.y;
            }
            yf = false;
        }
        this.scrollTo(Math.round(xp - this.chara.x), Math.round(yp - this.chara.y));
        return xf && yf;
    };
    return PhysActionScene;
})(Scene);
var AdventureScene = (function (_super) {
    __extends(AdventureScene, _super);
    function AdventureScene(game) {
        _super.call(this, game);
        this.texts = new Array();
        this.texts.push("アドベンチャーゲームサンプルにようこそ。\n※Enterキーか画面をタッチしてください。");
        this.texts.push("jgame.js 2.0では、アドベンチャーゲームなどテキスト主体のゲームを構成するための最低限の要素として、複数行のテキスト表示をサポートします。");
        this.texts.push("アドベンチャーゲームサンプルと銘打っていますが、アドベンチャーゲームで必要なコマンド選択機能などは、jgame.js本体の機能として開発する予定がありません。\nこのため、アドベンチャーゲーム開発のための機能としてはやや非力です。\n不足している機能群は、別途アドベンチャーゲーム用モジュールの登場を待つか、自分で開発する必要があります。");
        this.texts.push("とはいえ、RPGなどのメッセージ表示などに使う分には十分でしょう。");
        this.texts.push("MessageWindowクラスはメッセージの表示、アニメーションなどを処理してくれますが、このサンプルのように一連のメッセージを管理したり、Ctrlキーで早送りしたりする部分は自作する必要があります。\nこの辺りの機能の作成ガイドがほしい場合、本サンプルのTypeScriptファイル\"adventure.ts\"が参考になるかもしれません。\n画面下にもリンクつけておきました。");
        this.texts.push("また、キャラクタの表示などを通常通りSprite等を利用して、#page MessageWindowに顔を表示するなどの演出はMessageWindowのentitiesを操作するなどして、#page それぞれ独自に実行していく必要があります。");
        this.texts.push("ちなみに、今改ページのスクリプトを使いました。\nデフォルトでは＃pageというスクリプトで改ページがサポートされているだけですが、MultilineScriptAnalyzerを継承したクラスを作り、それをmessageWindow.getTextArea().scriptAnalyzer = それ;と指定することで、スクリプトの実行も可能になる、かもしれません。");
        this.texts.push("以上です。\n最初に戻ります。");
        this.textIndex = -1;
        var game = this.game;
        this.bg = new Sprite(480, 480, game.r("hankagai"));
        this.append(this.bg);
        var textLayer = this.createLayer("text");
        var textWindow = new MessageWindow({
            width: game.width - 20,
            height: 110
        });
        textWindow.moveTo((game.width - textWindow.width) / 2, (game.height - textWindow.height) - 10);
        textLayer.append(textWindow);
        this.textWindow = textWindow;
        this.enablePointingEvent();
        this.pointDown.handle(this, this.onpointdown);
        this.keyDown = new Trigger();
        this.keyDown.handle(this, this.onkeydown);
        this.keyUp = new Trigger();
        this.keyUp.handle(this, this.onkeyup);
        textWindow.hide();
        this.started.handle(this, this.start);
    }
    AdventureScene.prototype.start = function () {
        this.nextText();
    };
    AdventureScene.prototype.onkeydown = function (e) {
        if(e.param.keyCode == 17) {
            this.textWindow.fastMode();
        } else if(e.key == Keytype.Enter) {
            if(this.textWindow.isReaded) {
                this.nextText();
            }
        }
    };
    AdventureScene.prototype.onpointdown = function () {
        if(this.textWindow.isReaded) {
            this.nextText();
        }
    };
    AdventureScene.prototype.nextText = function () {
        var _this = this;
        var textWindow = this.textWindow;
        if(this.textOffset >= 0) {
            textWindow.oldWipeOut();
            this.textOffset = textWindow.setScript(this.texts[this.textIndex], this.textOffset);
            textWindow.showText();
            return;
        }
        this.textIndex++;
        if(this.textIndex == this.texts.length) {
            this.textIndex = 0;
        }
        textWindow.tl().fadeOut(200).then(function () {
            _this.textOffset = textWindow.setScript(_this.texts[_this.textIndex]);
            textWindow.show(true);
            textWindow.showText();
        });
    };
    AdventureScene.prototype.onkeyup = function (e) {
        if(e.param.keyCode == 17) {
            this.textWindow.normalMode();
        }
    };
    return AdventureScene;
})(Scene);
var CustomLoadingScene = (function (_super) {
    __extends(CustomLoadingScene, _super);
    function CustomLoadingScene() {
        _super.apply(this, arguments);

    }
    CustomLoadingScene.prototype.init = function () {
        this.gridSize = {
            width: this.game.width / 10,
            height: this.game.height / 10
        };
        this.shapes = new Array();
        for(var x = 0; x < 10; x++) {
            this.shapes[x] = new Array();
            for(var y = 0; y < 10; y++) {
                var shape = new Shape(this.gridSize.width, this.gridSize.height, ShapeStyle.Fill, "#000");
                this.shapes[x][y] = shape;
                shape.tl().fadeTo(0.5, 500).fadeIn(500).loop();
                shape.moveTo(x * this.gridSize.width, y * this.gridSize.height);
                this.append(shape);
            }
        }
    };
    CustomLoadingScene.prototype.animate = function (per) {
        var cnt = 10 * 10;
        var t = cnt * per;
        var i = 0;
        for(var x = 0; x < 10; x++) {
            for(var y = 0; y < 10; y++) {
                if(t > i++) {
                    var shape = this.shapes[x][y];
                    if(shape._tl) {
                        shape.tl()._deactivateTimeline();
                        delete shape._tl;
                        shape.tl().fadeOut(500).then(function () {
                            delete this._tl;
                        });
                    }
                }
            }
        }
    };
    return CustomLoadingScene;
})(LoadingScene);
