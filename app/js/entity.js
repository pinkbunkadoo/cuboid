var Transform = require('./transform');
var Matrix = require('./matrix');

function Entity(params) {
  this.transform = new Transform();
  this.transform.position.x = (params.x !== undefined ? params.x : 0);
  this.transform.position.y = (params.y !== undefined ? params.y : 0);
  this.transform.position.z = (params.z !== undefined ? params.z : 0);
  this.tm = new Matrix();
  this.visible = true;
  this.name = params.name;
  this.bright = false;
}

// Entity.prototype.toLocal = function(p) {
//   var t = this.getTransformMatrix();
//   return (t.inverse()).multiplyPoint(p);
//   // return Vector.copy(p);
// }
//
//
// Entity.prototype.toWorld = function(p) {
//   var t = this.getTransformMatrix();
//   return t.multiplyPoint(p);
// }


Entity.prototype.getTransformMatrix = function() {
  var t = this.getTranslationMatrix();
  var s = this.getScaleMatrix();
  var r = this.getRotationMatrix();
  return Matrix.multiply(s, r).multiply(t);
}

Entity.prototype.getTranslationMatrix = function() {
  return Matrix.translation(this.transform.position.x, this.transform.position.y, this.transform.position.z);
}

Entity.prototype.getScaleMatrix = function() {
  return Matrix.scale(this.transform.scale.x, this.transform.scale.y, this.transform.scale.z);
}

Entity.prototype.getRotationMatrix = function() {
  var x = Matrix.rotationX(this.transform.rotation.x);
  var y = Matrix.rotationY(this.transform.rotation.y);
  var z = Matrix.rotationZ(this.transform.rotation.z);
  return Matrix.multiply(Matrix.multiply(z, y), x);
}

Entity.prototype.toString = function() {
  return "{" + this.position + "}";
}

module.exports = Entity;
