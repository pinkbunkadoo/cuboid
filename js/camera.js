
function Camera(type, fov, near, far) {
  Entity.call(this, 0, 0, 0);

  this.fov = (fov !== undefined ? fov : 90);
  this.near = (near !== undefined ? near : 1);
  this.far = (far !== undefined ? far : 100);
  this.type = (type !== undefined ? type : Camera.PERSPECTIVE);
  this.orthoScale = 1.0;
  this.orientation = new Matrix();

  this.view = new Rectangle(0, 0, 1.0, 1.0);
  // this.rect = new Rectangle(
  //   this.view.x * Renderer.surface.width,
  //   this.view.y * Renderer.surface.height,
  //   this.view.width * Renderer.surface.width,
  //   this.view.height * Renderer.surface.height
  // );
}

Camera.prototype = Object.create(Entity.prototype);
Camera.prototype.constructor = Camera;

Camera.ORTHOGRAPHIC = 'orthographic';
Camera.PERSPECTIVE = 'perspective';


Camera.prototype.setRect = function(width, height) {
  this.rect = new Rectangle(
    this.view.x * width,
    this.view.y * height,
    this.view.width * width,
    this.view.height * height
  );
}


Camera.prototype.toLocal = function() {
  var transformInverse = this.getTransformMatrix().inverse();
  return Matrix.multiply(transformInverse, this.orientation);
}


Camera.prototype.toWorld = function() {
  var transform = this.getTransformMatrix();
  return Matrix.multiply(transform, this.orientation);
}


Camera.prototype.lookAt = function(target, up) {
  var m = new Matrix();

  var eye = this.transform.position;

  zaxis = Vector.subtract(eye, target).normalize();
  xaxis = Vector.cross(up, zaxis).normalize();
  yaxis = Vector.cross(zaxis, xaxis).normalize();

  m.a[0] = xaxis.x, m.a[1] = yaxis.x, m.a[2] = zaxis.x;
  m.a[4] = xaxis.y, m.a[5] = yaxis.y, m.a[6] = zaxis.y;
  m.a[8] = xaxis.z, m.a[9] = yaxis.z, m.a[10] = zaxis.z;

  this.orientation = m;
  // m.a[12] = -Vector.dot(xaxis, eye);
  // m.a[13] = -Vector.dot(yaxis, eye);
  // m.a[14] = -Vector.dot(zaxis, eye);

  // this.xaxis = xaxis;
  // this.yaxis = yaxis;
  // this.zaxis = zaxis;

  return m;
}

// console.log(1 / Math.tan(30 * 0.5 * RAD));

Camera.perspectiveFOV = function(fov, aspect, near, far) {
  var w = 1 / Math.tan(fov * 0.5 * RAD);
  var h = w * aspect;
  var q = far / (near - far);

  var m = new Matrix();
  m.a[0] = w;
  m.a[5] = h;
  m.a[10] = q;
  m.a[11] = -1;
  m.a[14] = near * q;
  // m.a[15] = 0;
  return m;
}


Camera.perspective = function(width, height, near, far) {
  var m = new Matrix();
  m.a[0] = 2 * near / width;
  m.a[5] = 2 * near / height;
  m.a[10] = far / (near - far);
  m.a[11] = -1;
  m.a[14] = near * far / (near - far);
  m.a[15] = 0;
  return m;
}


Camera.orthographic = function(width, height, near, far) {
  var m = new Matrix();
  m.a[0] = (2 / width);
  m.a[5] = (2 / height);
  m.a[10] = -2 / (far - near);
  m.a[14] = -(far + near) / (far - near);
  m.a[15] = 1;
  return m;
}


Camera.prototype.screenToWorld = function(pScreen, viewMatrix, projectionMatrix) {
  // var p = new Vector(
  //   2 * ((pScreen.x) / this.rect.width) - 1,
  //   1 - 2 * ((pScreen.y) / this.rect.height),
  //   this.near
  // );

  var pNDC = this.screenToNDC(pScreen);
  var viewProjectionInverse = Matrix.multiply(viewMatrix, projectionMatrix).inverse();
  var pWorld = viewProjectionInverse.multiplyPoint(pNDC);

  return pWorld;
}


Camera.prototype.worldToScreen = function(pWorld, viewMatrix, projectionMatrix) {
  // var pCamera = viewMatrix.multiplyPoint(pWorld);
  // var pNDC = projectionMatrix.multiplyPoint(pCamera);
  // pNDC.z = -pCamera.z;
  var pNDC = this.worldToNDC(pWorld, viewMatrix, projectionMatrix);
  var pScreen = this.NDCToScreen(pNDC);
  // pScreen.x = ((pScreen.x + 1) * 0.5) * (Renderer.surface.width);
  // pScreen.y = ((1 - pScreen.y) * 0.5) * (Renderer.surface.height);

  return pScreen;
}


Camera.prototype.worldToNDC = function(pWorld, viewMatrix, projectionMatrix) {
  var pCamera = viewMatrix.multiplyPoint(pWorld);
  var pNDC = projectionMatrix.multiplyPoint(pCamera);
  pNDC.z = -pCamera.z;

  return pNDC;
}


Camera.prototype.screenToNDC = function(pScreen) {
  var pNDC = new Vector(
    2 * ((pScreen.x - this.rect.x) / (this.rect.width)) - 1,
    1 - 2 * ((pScreen.y - this.rect.y) / (this.rect.height)),
    this.near
  );
  // pNDC.x -= this.rect.x;
  // pNDC.y -= this.rect.y;
  return pNDC;
}


Camera.prototype.NDCToScreen = function(pNDC) {
  var pScreen = new Vector();
  pScreen.x = ((pNDC.x + 1) * 0.5) * (this.rect.width) + this.rect.x;
  pScreen.y = ((1 - pNDC.y) * 0.5) * (this.rect.height) + this.rect.y;
  pScreen.z = pNDC.z;
  return pScreen;
}

// Camera.lookAt = function(eye, target, up) {
//   var m = new Matrix();
//
//   zaxis = Vector.subtract(eye, target).normalize();
//   xaxis = Vector.cross(up, zaxis).normalize();
//   yaxis = Vector.cross(zaxis, xaxis).normalize();
//
//   m.a[0] = xaxis.x, m.a[1] = yaxis.x, m.a[2] = zaxis.x;
//   m.a[4] = xaxis.y, m.a[5] = yaxis.y, m.a[6] = zaxis.y;
//   m.a[8] = xaxis.z, m.a[9] = yaxis.z, m.a[10] = zaxis.z;
//   // m.a[12] = -Vector.dot(xaxis, eye);
//   // m.a[13] = -Vector.dot(yaxis, eye);
//   // m.a[14] = -Vector.dot(zaxis, eye);
//
//   // console.log('hi', m.toString());
//
//   return m;
// }


