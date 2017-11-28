
function Surface(width, height, buffer) {
  this.width = width;
  this.height = height;

  this.buffer = buffer;
  this.buf = this.buffer.data.buffer; //;new ArrayBuffer(buffer.data.length);
  this.buf8 = new Uint8ClampedArray(this.buf);
  this.buf32 = new Uint32Array(this.buf);
  // this.buffer = buffer;
  // this.buf32 = new Uint32Array(this.buffer.data);
  // this.context = Engine.offscreenContext;
}


Surface.prototype.clear = function() {
  for (var i = 0; i < this.buf32.length; i++) this.buf32[i] = 0x00000000;
}


Surface.prototype.fill = function(r, g, b, a) {
  // for (var i = 0; i < this.buffer.data.length; i = i + 4) {
  //   this.buffer[i + 0] = r;
  //   this.buffer[i + 1] = g;
  //   this.buffer[i + 2] = b;
  //   this.buffer[i + 3] = a;
  // }
  var c = ((a & 0xff) << 24) | ((b & 0xff) << 16) | ((g & 0xff) << 8) | (r & 0xff);
  // console.log(((a) << 24).toString(16));

  for (var i = 0; i < this.buf32.length; i++) this.buf32[i] = c;
}


Surface.prototype.fillRect = function(x, y, width, height, color) {
  // for (var row = y; row < y + height; row++) {
  //   for (var col = x; col < x + width; col++) {
  //     var index = (row * this.width + col) * 4;
  //     this.buffer[index + 0] = color.r;
  //     this.buffer[index + 1] = color.g;
  //     this.buffer[index + 2] = color.b;
  //     this.buffer[index + 3] = color.a;
  //   }
  // }
}


// https://github.com/ssloy/tinyrenderer/wiki/Lesson-1:-Bresenham%E2%80%99s-Line-Drawing-Algorithm
// a = b + (b=a, 0)

// Surface.prototype.line = function(x0, y0, x1, y1, color) {
//   var steep = false;
//   if (Math.abs(x0 - x1) < Math.abs(y0 - y1)) {
//     x0 = y0 + (y0 = x0, 0);
//     x1 = y1 + (y1 = x1, 0);
//     steep = true;
//   }
//   if (x0 > x1) {
//     x0 = x1 + (x1 = x0, 0);
//     y0 = y1 + (y1 = y0, 0);
//   }
//
//   for (var x = x0; x <= x1; x++) {
//     var t = (x - x0) / (x1 - x0);
//     var y = (y0 * (1. - t) + y1 * t) >> 0;
//     if (steep) {
//       this.setPixel(y, x, color);
//     } else {
//       this.setPixel(x, y, color);
//     }
//   }
// }


