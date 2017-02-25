//-----------------------------------------------------------------------------
// Scene_Map

(function() {
  Input.keyMapper[121] = 'f10';

  var Alias_Scene_Map_updateMain = Scene_Map.prototype.updateMain;
  Scene_Map.prototype.updateMain = function() {
    Alias_Scene_Map_updateMain.call(this);
    var key = Imported.QInput ? '#f10' : 'f10';
    if ($gameTemp.isPlaytest() && Input.isTriggered(key)) {
      ColliderManager.toggle();
    }
    ColliderManager.update();
  };

  Scene_Map.prototype.processMapTouch = function() {
    if ((TouchInput.isTriggered() || TouchInput.isPressed()) && $gamePlayer.canClick()) {
      if (this._touchCount % 10 === 0) {
        var x = $gameMap.canvasToMapPX(TouchInput.x);
        var y = $gameMap.canvasToMapPY(TouchInput.y);
        if (!QMovement.offGrid) {
          var ox  = x % QMovement.tileSize;
          var oy  = y % QMovement.tileSize;
          x += QMovement.tileSize / 2 - ox;
          y += QMovement.tileSize / 2 - oy;
        }
        $gameTemp.setPixelDestination(x, y);
        $gamePlayer.requestMouseMove();
      }
      this._touchCount++;
    } else {
      this._touchCount = 0;
    }
  };
})();