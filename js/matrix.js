
function Matrix() {
  this.a = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}


Matrix.IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];


Matrix.prototype.toString = function() {
  var s = "";
  s += this.a[0] + "," + this.a[1] + "," + this.a[2] + "," + this.a[3] + "\n";
  s += this.a[4] + "," + this.a[5] + "," + this.a[6] + "," + this.a[7] + "\n";
  s += this.a[8] + "," + this.a[9] + "," + this.a[10] + "," + this.a[11] + "\n";
  s += this.a[12] + "," + this.a[13] + "," + this.a[14] + "," + this.a[15] + "\n";
  return s;
}


Matrix.prototype.identity = function() {
  for (var i = 0; i < this.a.length; i++) this.a[i] = Matrix.IDENTITY[i];
}


Matrix.prototype.multiply = function(matrix) {
  var output = new Matrix(), a = this.a;

  output.a[0] = a[0] * matrix.a[0] + a[1] * matrix.a[4] + a[2] * matrix.a[8] + a[3] * matrix.a[12];
  output.a[1] = a[0] * matrix.a[1] + a[1] * matrix.a[5] + a[2] * matrix.a[9] + a[3] * matrix.a[13];
  output.a[2] = a[0] * matrix.a[2] + a[1] * matrix.a[6] + a[2] * matrix.a[10] + a[3] * matrix.a[14];
  output.a[3] = a[0] * matrix.a[3] + a[1] * matrix.a[7] + a[2] * matrix.a[11] + a[3] * matrix.a[15];
  output.a[4] = a[4] * matrix.a[0] + a[5] * matrix.a[4] + a[6] * matrix.a[8] + a[7] * matrix.a[12];
  output.a[5] = a[4] * matrix.a[1] + a[5] * matrix.a[5] + a[6] * matrix.a[9] + a[7] * matrix.a[13];
  output.a[6] = a[4] * matrix.a[2] + a[5] * matrix.a[6] + a[6] * matrix.a[10] + a[7] * matrix.a[14];
  output.a[7] = a[4] * matrix.a[3] + a[5] * matrix.a[7] + a[6] * matrix.a[11] + a[7] * matrix.a[15];
  output.a[8] = a[8] * matrix.a[0] + a[9] * matrix.a[4] + a[10] * matrix.a[8] + a[11] * matrix.a[12];
  output.a[9] = a[8] * matrix.a[1] + a[9] * matrix.a[5] + a[10] * matrix.a[9] + a[11] * matrix.a[13];
  output.a[10] = a[8] * matrix.a[2] + a[9] * matrix.a[6] + a[10] * matrix.a[10] + a[11] * matrix.a[14];
  output.a[11] = a[8] * matrix.a[3] + a[9] * matrix.a[7] + a[10] * matrix.a[11] + a[11] * matrix.a[15];
  output.a[12] = a[12] * matrix.a[0] + a[13] * matrix.a[4] + a[14] * matrix.a[8] + a[15] * matrix.a[12];
  output.a[13] = a[12] * matrix.a[1] + a[13] * matrix.a[5] + a[14] * matrix.a[9] + a[15] * matrix.a[13];
  output.a[14] = a[12] * matrix.a[2] + a[13] * matrix.a[6] + a[14] * matrix.a[10] + a[15] * matrix.a[14];
  output.a[15] = a[12] * matrix.a[3] + a[13] * matrix.a[7] + a[14] * matrix.a[11] + a[15] * matrix.a[15];

  return output;
}


Matrix.prototype.multiplyPoint = function(p) {
  var out = new Vector();
  var w;

  out.x = p.x * this.a[0] + p.y * this.a[4] + p.z * this.a[8] + 1 * this.a[12];
  out.y = p.x * this.a[1] + p.y * this.a[5] + p.z * this.a[9] + 1 * this.a[13];
  out.z = p.x * this.a[2] + p.y * this.a[6] + p.z * this.a[10] + 1 * this.a[14];
  w = p.x * this.a[3] + p.y * this.a[7] + p.z * this.a[11] + 1 * this.a[15];

  if (w != 1) {
    out.x /= w;
    out.y /= w;
    out.z /= w;
  }

  return out;
}


Matrix.prototype.transpose = function() {
  var output = new Matrix();

  output.a[0] = this.a[0];
  output.a[1] = this.a[4];
  output.a[2] = this.a[8];
  output.a[3] = this.a[12];

  output.a[4] = this.a[1];
  output.a[5] = this.a[5];
  output.a[6] = this.a[9];
  output.a[7] = this.a[13];

  output.a[8] = this.a[2];
  output.a[9] = this.a[6];
  output.a[10] = this.a[10];
  output.a[11] = this.a[14];

  output.a[12] = this.a[3];
  output.a[13] = this.a[7];
  output.a[14] = this.a[11];
  output.a[15] = this.a[15];

  return output;
}


Matrix.prototype.inverse = function() {
  return Matrix.inverse(this);
}


Matrix.multiply = function(a, b) {
  return a.multiply(b);
}


// bool gluInvertMatrix(const double m[16], double invOut[16])

Matrix.inverse = function(matrix)
{
  var det, i;
  var m = matrix.a;
  var inv = new Matrix();

  inv.a[0] = m[5]  * m[10] * m[15] -
             m[5]  * m[11] * m[14] -
             m[9]  * m[6]  * m[15] +
             m[9]  * m[7]  * m[14] +
             m[13] * m[6]  * m[11] -
             m[13] * m[7]  * m[10];

  inv.a[4] = -m[4]  * m[10] * m[15] +
              m[4]  * m[11] * m[14] +
              m[8]  * m[6]  * m[15] -
              m[8]  * m[7]  * m[14] -
              m[12] * m[6]  * m[11] +
              m[12] * m[7]  * m[10];

  inv.a[8] = m[4]  * m[9] * m[15] -
             m[4]  * m[11] * m[13] -
             m[8]  * m[5] * m[15] +
             m[8]  * m[7] * m[13] +
             m[12] * m[5] * m[11] -
             m[12] * m[7] * m[9];

  inv.a[12] = -m[4]  * m[9] * m[14] +
               m[4]  * m[10] * m[13] +
               m[8]  * m[5] * m[14] -
               m[8]  * m[6] * m[13] -
               m[12] * m[5] * m[10] +
               m[12] * m[6] * m[9];

  inv.a[1] = -m[1]  * m[10] * m[15] +
              m[1]  * m[11] * m[14] +
              m[9]  * m[2] * m[15] -
              m[9]  * m[3] * m[14] -
              m[13] * m[2] * m[11] +
              m[13] * m[3] * m[10];

  inv.a[5] = m[0]  * m[10] * m[15] -
             m[0]  * m[11] * m[14] -
             m[8]  * m[2] * m[15] +
             m[8]  * m[3] * m[14] +
             m[12] * m[2] * m[11] -
             m[12] * m[3] * m[10];

  inv.a[9] = -m[0]  * m[9] * m[15] +
              m[0]  * m[11] * m[13] +
              m[8]  * m[1] * m[15] -
              m[8]  * m[3] * m[13] -
              m[12] * m[1] * m[11] +
              m[12] * m[3] * m[9];

  inv.a[13] = m[0]  * m[9] * m[14] -
              m[0]  * m[10] * m[13] -
              m[8]  * m[1] * m[14] +
              m[8]  * m[2] * m[13] +
              m[12] * m[1] * m[10] -
              m[12] * m[2] * m[9];

  inv.a[2] = m[1]  * m[6] * m[15] -
             m[1]  * m[7] * m[14] -
             m[5]  * m[2] * m[15] +
             m[5]  * m[3] * m[14] +
             m[13] * m[2] * m[7] -
             m[13] * m[3] * m[6];

  inv.a[6] = -m[0]  * m[6] * m[15] +
              m[0]  * m[7] * m[14] +
              m[4]  * m[2] * m[15] -
              m[4]  * m[3] * m[14] -
              m[12] * m[2] * m[7] +
              m[12] * m[3] * m[6];

  inv.a[10] = m[0]  * m[5] * m[15] -
              m[0]  * m[7] * m[13] -
              m[4]  * m[1] * m[15] +
              m[4]  * m[3] * m[13] +
              m[12] * m[1] * m[7] -
              m[12] * m[3] * m[5];

  inv.a[14] = -m[0]  * m[5] * m[14] +
               m[0]  * m[6] * m[13] +
               m[4]  * m[1] * m[14] -
               m[4]  * m[2] * m[13] -
               m[12] * m[1] * m[6] +
               m[12] * m[2] * m[5];

  inv.a[3] = -m[1] * m[6] * m[11] +
              m[1] * m[7] * m[10] +
              m[5] * m[2] * m[11] -
              m[5] * m[3] * m[10] -
              m[9] * m[2] * m[7] +
              m[9] * m[3] * m[6];

  inv.a[7] = m[0] * m[6] * m[11] -
             m[0] * m[7] * m[10] -
             m[4] * m[2] * m[11] +
             m[4] * m[3] * m[10] +
             m[8] * m[2] * m[7] -
             m[8] * m[3] * m[6];

  inv.a[11] = -m[0] * m[5] * m[11] +
               m[0] * m[7] * m[9] +
               m[4] * m[1] * m[11] -
               m[4] * m[3] * m[9] -
               m[8] * m[1] * m[7] +
               m[8] * m[3] * m[5];

  inv.a[15] = m[0] * m[5] * m[10] -
              m[0] * m[6] * m[9] -
              m[4] * m[1] * m[10] +
              m[4] * m[2] * m[9] +
              m[8] * m[1] * m[6] -
              m[8] * m[2] * m[5];

  det = m[0] * inv.a[0] + m[1] * inv.a[4] + m[2] * inv.a[8] + m[3] * inv.a[12];

  if (det == 0)
    return null;

  det = 1.0 / det;

  for (i = 0; i < 16; i++)
    inv.a[i] = inv.a[i] * det;

  return inv;
}


Matrix.translation = function(x, y, z) {
  var m = new Matrix();
  m.a[12] = x;
  m.a[13] = y;
  m.a[14] = z;
  return m;
}


Matrix.scale = function(x, y, z) {
  var m = new Matrix();
  m.a[0] = x;
  m.a[5] = y;
  m.a[10] = z;
  return m;
}


// angle: The angle of rotation in radians
Matrix.rotationX = function(angle) {
  var m = new Matrix();

  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  m.a[5] = cos;
  m.a[6] = sin;
  m.a[9] = -sin;
  m.a[10] = cos;

  return m;
}


Matrix.rotationY = function(angle) {
  var m = new Matrix();

  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  m.a[0] = cos;
  m.a[2] = -sin;
  m.a[8] = sin;
  m.a[10] = cos;

  return m;
}


Matrix.rotationZ = function(angle) {
  var m = new Matrix();

  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  m.a[0] = cos;
  m.a[1] = sin;
  m.a[4] = -sin;
  m.a[5] = cos;

  return m;
}


Matrix.rotation = function(x, y, z) {
  var rx = Matrix.rotationX(x);
  var ry = Matrix.rotationY(y);
  var rz = Matrix.rotationZ(z);
  return Matrix.multiply(Matrix.multiply(rz, ry), rx);
}

