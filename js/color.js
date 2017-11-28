
function Color(r, g, b, a) {
  this.r = (r !== undefined ? r : 255);
  this.g = (g !== undefined ? g : 255);
  this.b = (b !== undefined ? b : 255);
  this.a = (a !== undefined ? a : 255);
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
  if (this.r == color.r && this.g == color.g && this.b == color.b) return true;
  return false;
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

function Colorf(r, g, b, a) {
  this.r = (r !== undefined ? r : 1);
  this.g = (g !== undefined ? g : 1);
  this.b = (b !== undefined ? b : 1);
  this.a = (a !== undefined ? a : 1);
}

Colorf.fromColor = function(color) {
  return new Colorf(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
}

Colorf.WHITE = Colorf.fromColor(Color.WHITE);
Colorf.MAGENTA = Colorf.fromColor(Color.MAGENTA);
