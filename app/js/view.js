
function View(x, y, width, height, camera) {
  this.x = (x === undefined ? 0 : x);
  this.y = (y === undefined ? 0 : y);
  this.width = (width === undefined ? 0 : width);
  this.height = (height === undefined ? 0 : height);
  this.camera = camera;
}