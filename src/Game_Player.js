//-----------------------------------------------------------------------------
// Game_Player

(function() {
  var Alias_Game_Player_initMembers = Game_Player.prototype.initMembers;
  Game_Player.prototype.initMembers = function() {
    Alias_Game_Player_initMembers.call(this);
    this._requestMouseMove = false;
    this._movingWithMouse = false;
  };

  Game_Player.prototype.smartMove = function() {
    return QMovement.smartMove;
  };

  Game_Player.prototype.requestMouseMove = function() {
    this._requestMouseMove = true;
  };

  Game_Player.prototype.moveByMouse = function(x, y) {
    $gameTemp.setPixelDestination(x, y);
    this._requestMouseMove = false;
    this._movingWithMouse = true;
    // alias with pathfinding addon
  };

  Game_Player.prototype.clearMouseMove = function() {
    this._requestMouseMove = false;
    this._movingWithMouse = false;
    $gameTemp.clearDestination();
  };

  Game_Player.prototype.moveByInput = function() {
    if (!this.startedMoving() && this.canMove()) {
      if (this.triggerAction()) return;
      var direction = QMovement.diagonal ? Input.dir8 : Input.dir4;
      if (direction > 0) {
        this.clearMouseMove();
      } else if ($gameTemp.isDestinationValid() && this._requestMouseMove) {
        if (!QMovement.moveOnClick) {
          $gameTemp.clearDestination();
          return;
        }
        var x = $gameTemp.destinationPX();
        var y = $gameTemp.destinationPY();
        return this.moveByMouse(x, y);
      }
      if (Imported.QInput && Input.preferGamepad() && QMovement.offGrid) {
        this.moveWithAnalog();
      } else {
        if ([4, 6].contains(direction)) {
          this.moveInputHorizontal(direction);
        } else if ([2, 8].contains(direction)) {
          this.moveInputVertical(direction);
        } else if ([1, 3, 7, 9].contains(direction) && QMovement.diagonal) {
          this.moveInputDiagonal(direction);
        }
      }
    }
  };

  Game_Player.prototype.moveInputHorizontal = function(dir) {
    this.moveStraight(dir);
  };

  Game_Player.prototype.moveInputVertical = function(dir) {
    this.moveStraight(dir);
  };

  Game_Player.prototype.moveInputDiagonal = function(dir) {
    var diag = {
      1: [4, 2],   3: [6, 2],
      7: [4, 8],   9: [6, 8]
    };
    this.moveDiagonally(diag[dir][0], diag[dir][1]);
  };

  Game_Player.prototype.moveWithAnalog = function() {
    var horz = Input._dirAxesA.x;
    var vert = -Input._dirAxesA.y;
    if (horz === 0 && vert === 0) return;
    var radian = Math.atan2(vert, horz);
    radian += radian < 0 ? Math.PI * 2 : 0;
    this.moveRadian(radian);
  };

  Game_Player.prototype.update = function(sceneActive) {
    var lastScrolledX = this.scrolledX();
    var lastScrolledY = this.scrolledY();
    var wasMoving = this.isMoving();
    this.updateDashing();
    if (sceneActive) {
      this.moveByInput();
    }
    Game_Character.prototype.update.call(this);
    this.updateScroll(lastScrolledX, lastScrolledY);
    this.updateVehicle();
    if (!this.startedMoving()) this.updateNonmoving(wasMoving);
    this._followers.update();
  };

  Game_Player.prototype.updateNonmoving = function(wasMoving) {
    if (!$gameMap.isEventRunning()) {
      if (wasMoving) {
        if (this._freqCount >= this.freqThreshold()) {
          $gameParty.onPlayerWalk();
        }
        this.checkEventTriggerHere([1,2]);
        if ($gameMap.setupStartingEvent()) return;
      }
      if (this.triggerAction()) return;
      if (wasMoving) {
        if (this._freqCount >= this.freqThreshold()) {
          this.updateEncounterCount();
          this._freqCount = 0;
        }
      } else if (!this.isMoving() && !this._movingWithMouse) {
        $gameTemp.clearDestination();
      }
    }
  };

  Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
    if (!$gameMap.isEventRunning()) {
      var collider = this.collider('interaction');
      var x1 = this._px;
      var y1 = this._py;
      collider.moveTo(x, y);
      var events = ColliderManager.getCharactersNear(collider, (function(chara) {
        if (chara.constructor === Game_Event && !chara._erased) {
          return chara.collider('interaction').intersects(collider);
        }
        return false;
      }).bind(this));
      collider.moveTo(x1, y1);
      if (events.length === 0) {
        events = null;
        return;
      }
      var cx = this.cx();
      var cy = this.cy();
      events.sort(function(a, b) {
        return a.pixelDistanceFrom(cx, cy) - b.pixelDistanceFrom(cx, cy);
      });
      var event = events.shift();
      if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
        while (true) {
          event.start();
          if (events.length === 0 || $gameMap.isAnyEventStarting()) {
            break;
          }
          event = events.shift();
        }
      }
      events = null;
    }
  };

  Game_Player.prototype.checkEventTriggerHere = function(triggers) {
    if (this.canStartLocalEvents()) {
      this.startMapEvent(this.collider('interaction').x, this.collider('interaction').y, triggers, false);
    }
  };

  Game_Player.prototype.checkEventTriggerThere = function(triggers, x2, y2) {
    if (this.canStartLocalEvents()) {
      var direction = this.direction();
      var x1 = this.collider('interaction').x;
      var y1 = this.collider('interaction').y;
      x2 = x2 || $gameMap.roundPXWithDirection(x1, direction, this.moveTiles());
      y2 = y2 || $gameMap.roundPYWithDirection(y1, direction, this.moveTiles());
      this.startMapEvent(x2, y2, triggers, true);
      if (!$gameMap.isAnyEventStarting()) {
        return this.checkCounter(triggers);
      }
    }
  };

  Game_Player.prototype.checkCounter = function(triggers, x2, y2) {
    var direction = this.direction();
    var x1 = this._px;
    var y1 = this._py;
    x2 = x2 || $gameMap.roundPXWithDirection(x1, direction, this.moveTiles());
    y2 = y2 || $gameMap.roundPYWithDirection(y1, direction, this.moveTiles());
    var collider = this.collider('interaction');
    collider.moveTo(x2, y2);
    var counter;
    ColliderManager.getCollidersNear(collider, function(tile) {
      if (!tile.isTile) return false;
      if (tile.isCounter && tile.intersects(collider)) {
        counter = tile;
        return 'break';
      }
      return false;
    });
    collider.moveTo(x1, y1);
    if (counter) {
      if ([4, 6].contains(direction)) {
        var dist = Math.abs(counter.center.x - collider.center.x);
        dist += collider.width;
      }  else if ([8, 2].contains(direction)) {
        var dist = Math.abs(counter.center.y - collider.center.y);
        dist += collider.height;
      }
      var x3 = $gameMap.roundPXWithDirection(x1, direction, dist);
      var y3 = $gameMap.roundPYWithDirection(y1, direction, dist);
      return this.startMapEvent(x3, y3, triggers, true);
    }
    return false;
  };

  Game_Player.prototype.moveStraight = function(d, dist) {
    Game_Character.prototype.moveStraight.call(this, d, dist);
  };

  Game_Player.prototype.moveDiagonally = function(horz, vert) {
    Game_Character.prototype.moveDiagonally.call(this, horz, vert);
  };
})();