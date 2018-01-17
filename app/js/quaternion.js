
function Quaternion(x, y, z, w) {
  this.w = w !== undefined ? w : 0;
  this.x = x !== undefined ? x : 0;
  this.y = y !== undefined ? y : 0;
  this.z = z !== undefined ? z : 0;
}


Quaternion.angleAxis = function(angle, axis) {
  var theta = (angle * RAD) / 2;
  var sin = Math.sin(theta);
  var w = Math.cos(theta);
  var x = axis.x * sin;
  var y = axis.y * sin;
  var z = axis.z * sin;
  return new Quaternion(x, y, z, w);
}