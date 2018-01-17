var lib = require('./lib');

// console.log(lib.clamp(5, 0, 255) );
// console.log(lib.clamp);

function Color(r, g, b, a) {
  this.r = (r !== undefined ? r : 255);
  this.g = (g !== undefined ? g : 255);
  this.b = (b !== undefined ? b : 255);
  this.a = (a !== undefined ? a : 255);

  // console.log(this.r);
  this.r = lib.clamp(this.r, 0, 255);
  this.g = lib.clamp(this.g, 0, 255);
  this.b = lib.clamp(this.b, 0, 255);
  this.a = lib.clamp(this.a, 0, 255);
  // console.log(this.r);
}

Color.RED = new Color(255, 0, 0, 255);
Color.GREEN = new Color(0, 255, 0, 255);
Color.BLUE = new Color(0, 0, 255, 255);
Color.CYAN = new Color(0, 255, 255, 255);
Color.YELLOW = new Color(255, 255, 0, 255);
Color.ORANGE = new Color(255, 128, 0, 255);
Color.MAGENTA = new Color(255, 0, 255, 255);
Color.ORANGE = new Color(255, 128, 0, 255);
Color.WHITE = new Color(255, 255, 255, 255);
Color.BLACK = new Color(0, 0, 0, 255);
Color.GREY = new Color(128, 128, 128, 255);


Color.prototype.equals = function(color) {
  return (this.r == color.r && this.g == color.g && this.b == color.b);
}


Color.copy = function(color) {
  return new Color(color.r, color.g, color.b, color.a);
}


Color.equals = function(color1, color2) {
  return color1.equals(color2);
}


Color.fromColorf = function(colorf) {
  return new Color((colorf.r * 255) >> 0, (colorf.g * 255) >> 0, (colorf.b * 255) >> 0, (colorf.a * 255) >> 0);
}


module.exports = Color;
