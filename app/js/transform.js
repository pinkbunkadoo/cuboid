var lib = require('./lib');
var Vector = require('./vector');

function Transform() {
  this.rotation = new Vector(); // Radians
  this.position = new Vector();
  this.scale = new Vector(1, 1, 1);
  this.q;
}

Transform.prototype.rotateAround = function(target, axis, angle) {
  // var theta = angle * RAD;
  // var p = this.position;
  // var r = Matrix.rotationY(theta);
  // p = r.multiplyPoint(p);
  // this.position.x = p.x;
  // this.position.y = p.y;
  // this.position.z = p.z;
}


// target - ???
// axis - Rotation axis
// angle - rotation amount in degrees

Transform.prototype.rotateAroundQuaternion = function(target, axis, angle) {
  // var theta = angle * RAD;
  // var p = this.position;
  // var r = Matrix.rotationY(theta);
  // p = r.multiplyPoint(p);
  // this.position.x = p.x;
  // this.position.y = p.y;
  // this.position.z = p.z;

  // Quaternion rotation method
  // http://answers.unity3d.com/questions/372371/multiply-quaternion-by-vector3-how-is-done.html

  var t = (angle * lib.RAD) / 2;
  var sin = Math.sin(t);
  var w = Math.cos(t);
  var x = (axis.x) * sin;
  var y = (axis.y) * sin;
  var z = (axis.z) * sin;

  var mag = (w * w + x * x + y * y + z * z);
  if (mag != 1) {
    w = w / mag;
    x = x / mag;
    y = y / mag;
    z = z / mag;
  }

  var num = x * 2;
  var num2 = y * 2;
  var num3 = z * 2;
  var num4 = x * num;
  var num5 = y * num2;
  var num6 = z * num3;
  var num7 = x * num2;
  var num8 = x * num3;
  var num9 = y * num3;
  var num10 = w * num;
  var num11 = w * num2;
  var num12 = w * num3;

  var px = this.position.x;
  var py = this.position.y;
  var pz = this.position.z;

  this.position.x = (1 - (num5 + num6)) * px + (num7 - num12) * py + (num8 + num11) * pz;
  this.position.y = (num7 + num12) * px + (1 - (num4 + num6)) * py + (num9 - num10) * pz;
  this.position.z = (num8 - num11) * px + (num9 + num10) * py + (1 - (num4 + num5)) * pz;

}

module.exports = Transform;
