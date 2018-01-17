var lib = require('./lib');
var Color = require('./Color');

function Colorf(r, g, b, a) {
  this.r = (r !== undefined ? r : 1);
  this.g = (g !== undefined ? g : 1);
  this.b = (b !== undefined ? b : 1);
  this.a = (a !== undefined ? a : 1);

  this.r = lib.clamp(this.r, 0, 1);
  this.g = lib.clamp(this.g, 0, 1);
  this.b = lib.clamp(this.b, 0, 1);
  this.a = lib.clamp(this.a, 0, 1);
}

Colorf.fromColor = function(color) {
  return new Colorf(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
}

Colorf.WHITE = Colorf.fromColor(Color.WHITE);
Colorf.MAGENTA = Colorf.fromColor(Color.MAGENTA);

module.exports = Colorf;
