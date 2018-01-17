var Rectangle = require('./rectangle');
var Vector = require('./vector');
var Color = require('./color');

function Mesh() {
  this.vertices = [];
  this.triangles = [];
  this.colors = [];
  this.normals = [];
  this.uvs = [];
}

Mesh.prototype.getBounds = function() {

  if (this.bounds === undefined) {
    var bbminx = Number.POSITIVE_INFINITY;
    var bbminy = Number.POSITIVE_INFINITY;
    var bbmaxx = Number.NEGATIVE_INFINITY;
    var bbmaxy = Number.NEGATIVE_INFINITY;

    for (var i = 0; i < this.vertices.length; i++) {
      var v = this.vertices[i];
      if (v.x < bbminx) bbminx = v.x;
      if (v.y < bbminy) bbminy = v.y;
      if (v.x > bbmaxx) bbmaxx = v.x;
      if (v.y > bbmaxy) bbmaxy = v.y;
    }

    this.bounds = new Rectangle(bbminx, bbminy, bbmaxx - bbminx + 1, bbmaxy - bbminy + 1);
  }

  return this.bounds;
}


Mesh.prototype.extractFaceParams = function(s, data) {
  var values = [];
  var f = s.split('/');

  for (var i = 0; i < f.length; i++) {
    if (isNaN(f[i])) {
      values[i] = null;
    } else {
      values[i] = parseInt(f[i]) - 1;
    }
  }

  if (values[0] !== undefined) data.vertices.push(values[0]);
  if (values[1] !== undefined) data.uvs.push(values[1]);
  if (values[2] !== undefined) data.normals.push(values[2]);
  if (values[3] !== undefined) data.colors.push(values[3]);

  // return values;
}


Mesh.normalizeUV = function(u, v) {
  // console.log("normalizeUV", u, v);
  // var uv = new Array(0.0, 0.0);
  // su = Math.abs(u) >> 0;
  // sv = Math.abs(v) >> 0;
  // uv[0] = (su > 1 ? u - su : u);
  // if (uv[0] < 0) uv[0] = uv[0] + 1;
  // uv[1] = (sv > 1 ? v - sv : v);
  // if (uv[1] < 0) uv[1] = uv[1] + 1;
  // if (uv[0] == -0) uv[0] = 0;
  // if (uv[1] == -0) uv[1] = 0;
  // return uv;
}

// console.log(Math.ceil(-2.5));

Mesh.fromOBJ = function(resource) {
  var mesh = new Mesh();
  var lines = resource.content.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    if (line[0] == '#') continue;

    var params = line.split(' ');
    var type = params[0];

    if (type == 'v') {
      mesh.vertices.push(new Vector(parseFloat(params[1]), parseFloat(params[2]), parseFloat(params[3])));
    } else if (type == 'vt') {
      var uv = new Array(parseFloat(params[1]), parseFloat(params[2]));
      if (uv[0] == -0) uv[0] = 0;
      if (uv[1] == -0) uv[1] = 0;
      mesh.uvs.push(uv);
    } else if (type == 'vn') {
      mesh.normals.push(new Vector(parseFloat(params[1]), parseFloat(params[2]), parseFloat(params[3])));
    } else if (type == 'vc') {
      var r = parseFloat(params[1]);
      var g = parseFloat(params[2]);
      var b = parseFloat(params[3]);
      var a = (params[4] !== undefined ? parseFloat(params[4]) : 1);
      // mesh.colors.push(new Color((r * 255) >> 0, (g * 255) >> 0, (b * 255) >> 0, (a * 255) >> 0));
      mesh.colors.push(new Color((r * 255) >> 0, (g * 255) >> 0, (b * 255) >> 0, 0));

    } else if (type == 'f') {
      var data = {};
      data.vertices = new Array();
      data.uvs = new Array();
      data.normals = new Array();
      data.colors = new Array();
      data.normal = null;

      mesh.extractFaceParams(params[1], data);
      mesh.extractFaceParams(params[2], data);
      mesh.extractFaceParams(params[3], data);

      var v0 = mesh.vertices[data.vertices[0]];
      var v1 = mesh.vertices[data.vertices[1]];
      var v2 = mesh.vertices[data.vertices[2]];
      var n = Vector.cross(Vector.subtract(v1, v0), Vector.subtract(v2, v0));

      n.normalize();
      data.normal = n;

      // data.id = -2;
      mesh.triangles.push(data);

    } else if (type == 'o') {
      mesh.vertices = [];
      mesh.triangles = [];
      mesh.colors = [];
      mesh.normals = [];
      mesh.uvs = [];
    }
  }

  return mesh;
}

module.exports = Mesh;
