//-----------------------------------------------------------------------------
// Spriteset_Map

(function() {
  var Alias_Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
  Spriteset_Map.prototype.createLowerLayer = function() {
    Alias_Spriteset_Map_createLowerLayer.call(this);
    if ($gameTemp.isPlaytest()) {
      this.createColliders();
    }
  };

  Spriteset_Map.prototype.createColliders = function() {
    this.addChild(ColliderManager.container);
    // also get collision map here
  };
})();
