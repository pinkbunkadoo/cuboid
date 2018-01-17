var Vector = require('./vector');
var Color = require('./color');
var Entity = require('./entity');

function Light(x, y, z, color) {
  Entity.call(this, x, y, z);
  this.direction = new Vector();
  this.color = (color !== undefined ? Color.copy(color) : new Color(255, 255, 255, 255));
}

Light.prototype = Object.create(Entity.prototype);
Light.prototype.constructor = Light;

Light.prototype.setDirection = function(x, y, z) {
  this.direction = new Vector(x, y, z);
  this.direction.normalize();
}

module.exports = Light;
