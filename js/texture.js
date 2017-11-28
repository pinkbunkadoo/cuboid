
function Texture(width, height) {
  this.width = width;
  this.height = height;
  this.canvas = document.createElement('canvas');
  this.canvas.width = width;
  this.canvas.height = height;
  this.context = this.canvas.getContext('2d');
  this.initialize();
}


Texture.prototype.initialize = function() {
  this.imageData = this.context.getImageData(0, 0, this.width, this.height);
  this.data = this.imageData.data;
  // this.buf = new ArrayBuffer(this.imageData.data);
  // this.data = new Uint8ClampedArray(this.buf);
  // this.buf32 = new Uint32Array(this.buf);
}


Texture.prototype.uvLookup = function(u, v) {
  var x = u;
  var y = v;

  if (v < 0) {
    v = v + Math.ceil(v * -1);
  } else if (v > 1) {
    v = v - (v >> 0);
  }
  v = 1 - v;

  if (u < 0) {
    u = u + Math.ceil(u * -1);
  } else if (u > 1) {
    u = u - (u >> 0);
  }

  x = Math.round((u * (this.width-1)));
  y = Math.round((v * (this.height-1)));

  var index = (y * this.width + x) * 4;
  var r = this.data[index];
  var g = this.data[index + 1];
  var b = this.data[index + 2];

  return ((255 << 24) | (b << 16) | (g << 8) | r);
  // return this.buf32[y * this.width + x];
}


Texture.fromImage = function(image) {
  var texture = new Texture(image.width, image.height);
  texture.context.drawImage(image, 0, 0);
  texture.initialize();
  return texture;
}
