
function Entity(x, y, z) {
  this.transform = new Transform();
  this.transform.position.x = (x !== undefined ? x : 0);
  this.transform.position.y = (y !== undefined ? y : 0);
  this.transform.position.z = (z !== undefined ? z : 0);
  this.tm = new Matrix();
  this.visible = true;
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
  // if (this.tm != null) return this.tm;
  var t = this.getTranslationMatrix();
  var s = this.getScaleMatrix();
  var r = this.getRotationMatrix();
  return Matrix.multiply(s, r).multiply(t);
  // return t;
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


// Entity.prototype.getTransformInverse = function() {
//
//   if (this.transformInverse == null) {
//     var transform = this.getTransform();
//     this.transformInverse = Matrix.inverse(transform);
//   }
//
//   return this.transformInverse;
// }


// Entity.prototype.translate = function(x, y, z) {
//   this.position.x += x;
//   this.position.y += y;
//   this.position.z += z;
//
//   this.transform = null;
//   this.transformInverse = null;
// }
//
// Entity.prototype.setRotX = function(x) {
//   this.rotation.x = x;
//   this.rx.identity();
//   var cos = Math.cos(this.rotation.x * RAD);
//   var sin = Math.sin(this.rotation.x * RAD);
//   this.rx.a[5] = cos;
//   this.rx.a[6] = sin;
//   this.rx.a[9] = -sin;
//   this.rx.a[10] = cos;
//
//   this.transform = null;
//   this.transformInverse = null;
//   this.r = null;
// }
//
//
// Entity.prototype.setRotY = function(y) {
//   this.rotation.y = y;
//   this.ry.identity();
//   var cos = Math.cos(this.rotation.y * RAD);
//   var sin = Math.sin(this.rotation.y * RAD);
//   this.ry.a[0] = cos;
//   this.ry.a[2] = -sin;
//   this.ry.a[8] = sin;
//   this.ry.a[10] = cos;
//
//   this.transform = null;
//   this.transformInverse = null;
//   this.r = null;
// }
//
//
// Entity.prototype.setRotZ = function(z) {
//   this.rotation.z = z;
//   this.rz.identity();
//   var cos = Math.cos(this.rotation.z * RAD);
//   var sin = Math.sin(this.rotation.z * RAD);
//   this.rz.a[0] = cos;
//   this.rz.a[1] = sin;
//   this.rz.a[4] = -sin;
//   this.rz.a[5] = cos;
//
//   this.transform = null;
//   this.transformInverse = null;
//   this.r = null;
// }
//
//
// Entity.prototype.setRotation = function(x, y, z) {
//   this.rotation.x = x;
//   this.rotation.y = y;
//   this.rotation.z = z;
//
//   this.setRotX(this.rotation.x);
//   this.setRotY(this.rotation.y);
//   this.setRotZ(this.rotation.z);
//
//   // this.r = this.rx.multiply(this.ry).multiply(this.rz);
// }


// Entity.prototype.rotate = function(x, y, z) {
//   this.rotation.x += x;
//   this.rotation.y += y;
//   this.rotation.z += z;
//
//   if (x != 0) this.setRotX(this.rotation.x);
//   if (y != 0) this.setRotY(this.rotation.y);
//   if (z != 0) this.setRotZ(this.rotation.z);
//   // this.setRotation(this.rotation.x, this.rotation.y, this.rotation.z);
// }
