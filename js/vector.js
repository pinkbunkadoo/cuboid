
function Vector(x, y, z) {
  this.x = (x === undefined ? 0 : x);
  this.y = (y === undefined ? 0 : y);
  this.z = (z === undefined ? 0 : z);
}


Vector.prototype.toString = function() {
  return "{" + this.x + "," + this.y + "," + this.z + "}";
}


Vector.copy = function(vector) {
    return new Vector(vector.x, vector.y, vector.z);
}


Vector.prototype.add = function(vector) {
  this.x = this.x + vector.x;
  this.y = this.y + vector.y;
  this.z = this.z + vector.z;
  return this;
  // return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
}


Vector.prototype.divide = function(vector) {
  this.x = this.x / vector.x;
  this.y = this.y / vector.y;
  this.z = this.z / vector.z;
  return this;
  // return new Vector(this.x / vector.x, this.y / vector.y, this.z / vector.z);
}


Vector.prototype.equals = function(vector) {
  return this.x === vector.x && this.y === vector.y && this.z === vector.z;
}


Vector.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
}


Vector.prototype.limit = function(max) {
  if (this.length() > max) {
    this.normalize();
    this.scale(max);
  }
}


Vector.prototype.multiply = function(vector) {
  this.x = this.x * vector.x;
  this.y = this.y * vector.y;
  this.z = this.z * vector.z;
  return this;
  // return new Vector(this.x * vector.x, this.y * vector.y, this.z * vector.z);
}


Vector.prototype.normalize = function() {
  var dot = this.x * this.x + this.y * this.y + this.z * this.z;
  if (dot > 0 && dot != 1) {
    var inverseLength = 1 / Math.sqrt(dot);
    this.x = this.x * inverseLength;
    this.y = this.y * inverseLength;
    this.z = this.z * inverseLength;
  }
  return this;
  // var len = this.length();
  // if (len != 0) {
  //   this.x = this.x / len;
  //   this.y = this.y / len;
  //   this.z = this.z / len;
  // }
}


Vector.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  this.z = Math.round(this.z);
  return this;
}


Vector.prototype.floor = function() {
  this.x = this.x >> 0;
  this.y = this.y >> 0;
  this.z = this.z >> 0;
  return this;
}



Vector.prototype.scale = function(scalar) {
  this.x = this.x * scalar;
  this.y = this.y * scalar;
  this.z = this.z * scalar;
  return this;
  // return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
}


Vector.prototype.subtract = function(vector) {
  this.x = this.x - vector.x;
  this.y = this.y - vector.y;
  this.z = this.z - vector.z;
  return this;
  // return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
}


Vector.add = function(a, b) {
  return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
}


Vector.cross = function(a, b) {
  return new Vector(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}


Vector.divide = function(a, b) {
  return new Vector(a.x / b.x, a.y / b.y, a.z / b.z);
}


Vector.dot = function(a, b) {
  return (a.x * b.x + a.y * b.y + a.z * b.z);
}


Vector.multiply = function(a, b) {
  return new Vector(a.x * b.x, a.y * b.y, a.z * b.z);
}


Vector.normalize = function(vector) {
  var out = new Vector();
  var dot = vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
  if (dot > 0) {
    var inverseLength = 1 / Math.sqrt(dot);
    out.x = vector.x * inverseLength;
    out.y = vector.y * inverseLength;
    out.z = vector.z * inverseLength;
  }
  return out;
}


Vector.scale = function(vector, scalar) {
  return new Vector(vector.x * scalar, vector.y * scalar, vector.z * scalar);
}


Vector.subtract = function(a, b) {
  return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
}
