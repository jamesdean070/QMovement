//-----------------------------------------------------------------------------
// ColliderManager

function ColliderManager() {
  throw new Error('This is a static class');
}

(function() {
  ColliderManager._colliders = [];
  ColliderManager._colliderGrid = [];
  ColliderManager._characterGrid = [];
  ColliderManager._sectorSize = 48;
  ColliderManager._needsRefresh = false;
  ColliderManager.container = new Sprite();
  ColliderManager.container.alpha = 0.3;
  ColliderManager.visible = QMovement.showColliders;

  ColliderManager.clear = function() {
    this._colliders = [];
    this._colliderGrid = new Array($gameMap.width());
    for (var x = 0; x < this._colliderGrid.length; x++) {
      this._colliderGrid[x] = [];
      for (var y = 0; y < $gameMap.height(); y++) {
        this._colliderGrid[x].push([]);
      }
    }
    this._characterGrid = new Array($gameMap.width());
    for (var x = 0; x < this._characterGrid.length; x++) {
      this._characterGrid[x] = [];
      for (var y = 0; y < $gameMap.height(); y++) {
        this._characterGrid[x].push([]);
      }
    }
    this.container.removeChildren();
    ColliderManager._needsRefresh = true;
  };

  ColliderManager.refresh = function() {
    // refresh is done inside Game_Map
    this._needsRefresh = true;
  };

  ColliderManager.addCollider = function(collider, duration, ignoreGrid) {
    if (!$dataMap) return;
    var i = this._colliders.indexOf(collider);
    if (i === -1) {
      this._colliders.push(collider);
      if (duration > 0 || duration === -1) {
        this.draw(collider, duration);
      }
    }
    if (!ignoreGrid) {
      this.updateGrid(collider);
    }
  };

  ColliderManager.addCharacter = function(character, duration) {
    if (!$dataMap) return;
    var i = this._colliders.indexOf(character);
    if (i === -1) {
      this._colliders.push(character);
      if (duration > 0 || duration === -1) {
        this.draw(character.collider('bounds'), duration);
      }
    }
    this.updateGrid(character);
  };

  ColliderManager.remove = function(collider) {
    var i = this._colliders.indexOf(collider);
    if (i < 0) return;
    this.removeFromGrid(collider);
    collider.kill = true;
    this._colliders.splice(i, 1);
  };

  ColliderManager.removeSprite = function(sprite) {
    if (sprite) {
      this.container.removeChild(sprite);
    }
  };

  ColliderManager.updateGrid = function(collider, prevGrid) {
    var maxWidth  = this.sectorCols();
    var maxHeight = this.sectorRows();
    var currGrid;
    var grid;
    if (collider._colliders) {
      grid = this._characterGrid;
      currGrid = collider.collider('bounds').sectorEdge();
    } else {
      grid = this._colliderGrid;
      currGrid = collider.sectorEdge();
    }
    var x, y;
    if (prevGrid) {
      if (currGrid.x1 == prevGrid.x1 && currGrid.y1 === prevGrid.y1 &&
          currGrid.x2 == prevGrid.x2 && currGrid.y2 === prevGrid.y2) {
        return;
      }
      for (x = prevGrid.x1; x <= prevGrid.x2; x++) {
        for (y = prevGrid.y1; y <= prevGrid.y2; y++) {
          if ((x < 0 || x >= maxWidth) || (y < 0 || y >= maxHeight) ) {
            continue;
          }
          var i = grid[x][y].indexOf(collider);
          if (i !== -1) {
            grid[x][y].splice(i, 1);
          }
        }
      }
    }
    for (x = currGrid.x1; x <= currGrid.x2; x++) {
      for (y = currGrid.y1; y <= currGrid.y2; y++) {
        if (x < 0 || x >= maxWidth) {
          continue;
        } else if (y < 0 || y >= maxHeight) {
          continue;
        }
        grid[x][y].push(collider);
      }
    }
  };

  ColliderManager.removeFromGrid = function(collider) {
    var edge;
    var grid;
    if (collider._colliders) {
      grid = this._characterGrid;
      currGrid = collider.collider('bounds').sectorEdge();
    } else {
      grid = this._colliderGrid;
      currGrid = collider.sectorEdge();
    }
    for (x = grid.x1; x <= grid.x2; x++) {
      for (y = grid.y1; y <= grid.y2; y++) {
        var i = grid[x][y].indexOf(collider);
        if (i !== -1) {
          grid[x][y].splice(i, 1);
        }
      }
    }
  };

  ColliderManager.getCharactersNear = function(collider, only) {
    var grid = collider.sectorEdge();
    var arr = [];
    var isBreaking = false;
    var x, y, i;
    for (x = grid.x1; x <= grid.x2; x++) {
      for (y = grid.y1; y <= grid.y2; y++) {
        if (x < 0 || x >= this.sectorCols()) continue;
        if (y < 0 || y >= this.sectorRows()) continue;
        var charas = this._characterGrid[x][y];
        for (i = 0; i < charas.length; i++) {
          if (only) {
            if (only(charas[i]) === 'break') {
              isBreaking = true;
              break;
            }
            if (!only(charas[i])) continue;
          }
          if (!arr.contains(charas[i])) {
            arr.push(charas[i]);
          }
        }
        if (isBreaking) break;
      }
      if (isBreaking) break;
    }
    only = null;
    return arr;
  };

  ColliderManager.getCollidersNear = function(collider, only) {
    only = only || function() { return true; };
    var grid = collider.sectorEdge();
    var arr = [];
    var isBreaking = false;
    var x, y, i;
    for (x = grid.x1; x <= grid.x2; x++) {
      for (y = grid.y1; y <= grid.y2; y++) {
        if (x < 0 || x >= this.sectorCols()) continue;
        if (y < 0 || y >= this.sectorRows()) continue;
        var colliders = this._colliderGrid[x][y];
        for (i = 0; i < colliders.length; i++) {
          if (only) {
            if (only(colliders[i]) === 'break') {
              isBreaking = true;
              break;
            }
            if (!only(colliders[i])) continue;
          }
          if (!arr.contains(colliders[i])) {
            arr.push(colliders[i]);
          }
        }
        if (isBreaking) break;
      }
      if (isBreaking) break;
    }
    only = null;
    return arr;
  };

  ColliderManager.sectorCols = function() {
    return Math.floor($gameMap.width() * QMovement.tileSize / this._sectorSize);
  };

  ColliderManager.sectorRows = function() {
    return Math.floor($gameMap.height() * QMovement.tileSize / this._sectorSize);
  };

  ColliderManager.draw = function(collider, duration) {
    if ($gameTemp.isPlaytest()) {
      var sprite = new Sprite_Collider(collider, duration || -1);
      this.container.addChild(sprite);
    }
  };

  ColliderManager.update = function() {
    if (this.visible) {
      this.show();
    } else {
      this.hide();
    }
  };

  ColliderManager.toggle = function() {
    this.visible = !this.visible;
  };

  ColliderManager.show = function() {
    this.container.alpha = 0.3;
  };

  ColliderManager.hide = function() {
    this.container.alpha = 0;
  };

  ColliderManager.convertToCollider = function(arr) {
    var type = arr[0];
    var w = arr[1] || 0;
    var h = arr[2] || 0;
    var ox = arr[3] || 0;
    var oy = arr[4] || 0;
    if (type === 'box') {
      var collider = new Box_Collider(w, h, ox, oy);
    } else if (type === 'circle') {
      var collider = new Circle_Collider(w, h, ox, oy);
    }
    return collider;
  };
})();