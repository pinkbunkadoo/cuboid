module.exports = {
  RAD: Math.PI / 180,
  DEG: 180 / Math.PI,

  pointInRect: function(x, y, x1, y1, width, height) {
    return (x > x1 && x < x1 + width && y > y1 && y < y1 + height);
  },

  pointInCircle: function(px, py, cx, cy, radius) {
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy)) < radius;
  },

  distance: function(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  },

  map: function(value, a1, a2, b1, b2) {
    return ((value - a1) / (a2 - a1)) * (b2 - b1) + b1;
  },

  lerp: function(first, last, value) {
    return value * (last - first) + first;
  },

  clamp: function(value, min, max) {
    var out = value;
    if (value < min)
      out = min;
    else if (value > max)
      out = max;
    return out;
  }
}
