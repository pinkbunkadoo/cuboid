(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var lib = require('./lib');

// console.log(lib.clamp(5, 0, 255) );
// console.log(lib.clamp);

function Color(r, g, b, a) {
  this.r = (r !== undefined ? r : 255);
  this.g = (g !== undefined ? g : 255);
  this.b = (b !== undefined ? b : 255);
  this.a = (a !== undefined ? a : 255);

  // console.log(this.r);
  this.r = lib.clamp(this.r, 0, 255);
  this.g = lib.clamp(this.g, 0, 255);
  this.b = lib.clamp(this.b, 0, 255);
  this.a = lib.clamp(this.a, 0, 255);
  // console.log(this.r);
}

Color.RED = new Color(255, 0, 0, 255);
Color.GREEN = new Color(0, 255, 0, 255);
Color.BLUE = new Color(0, 0, 255, 255);
Color.CYAN = new Color(0, 255, 255, 255);
Color.YELLOW = new Color(255, 255, 0, 255);
Color.ORANGE = new Color(255, 128, 0, 255);
Color.MAGENTA = new Color(255, 0, 255, 255);
Color.ORANGE = new Color(255, 128, 0, 255);
Color.WHITE = new Color(255, 255, 255, 255);
Color.BLACK = new Color(0, 0, 0, 255);
Color.GREY = new Color(128, 128, 128, 255);


Color.prototype.equals = function(color) {
  return (this.r == color.r && this.g == color.g && this.b == color.b);
}


Color.copy = function(color) {
  return new Color(color.r, color.g, color.b, color.a);
}


Color.equals = function(color1, color2) {
  return color1.equals(color2);
}


Color.fromColorf = function(colorf) {
  return new Color((colorf.r * 255) >> 0, (colorf.g * 255) >> 0, (colorf.b * 255) >> 0, (colorf.a * 255) >> 0);
}


module.exports = Color;

},{"./lib":7}],2:[function(require,module,exports){
var lib = require('./lib');
var Entity = require('./entity');
var Matrix = require('./matrix');
var Rectangle = require('./rectangle');
var Vector = require('./vector');

function Camera(type, fov, near, far) {
  Entity.call(this, 0, 0, 0);

  this.fov = (fov !== undefined ? fov : 90);
  this.near = (near !== undefined ? near : 1);
  this.far = (far !== undefined ? far : 100);
  this.type = (type !== undefined ? type : Camera.PERSPECTIVE);
  this.orthoScale = 1.0;
  this.orientation = new Matrix();

  this.view = new Rectangle(0, 0, 1.0, 1.0);
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

Camera.perspectiveFOV = function(fov, aspect, near, far) {
  var w = 1 / Math.tan(fov * 0.5 * lib.RAD);
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


module.exports = Camera;

},{"./entity":6,"./lib":7,"./matrix":10,"./rectangle":12,"./vector":18}],3:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"./lib":7,"dup":1}],4:[function(require,module,exports){
var lib = require('./lib');
var Color = require('./Color');

function Colorf(r, g, b, a) {
  this.r = (r !== undefined ? r : 1);
  this.g = (g !== undefined ? g : 1);
  this.b = (b !== undefined ? b : 1);
  this.a = (a !== undefined ? a : 1);

  this.r = lib.clamp(this.r, 0, 1);
  this.g = lib.clamp(this.g, 0, 1);
  this.b = lib.clamp(this.b, 0, 1);
  this.a = lib.clamp(this.a, 0, 1);
}

Colorf.fromColor = function(color) {
  return new Colorf(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
}

Colorf.WHITE = Colorf.fromColor(Color.WHITE);
Colorf.MAGENTA = Colorf.fromColor(Color.MAGENTA);

module.exports = Colorf;

},{"./Color":1,"./lib":7}],5:[function(require,module,exports){
var lib = require('./lib');

var Color = require('./color');
var Colorf = require('./colorf');
var Vector = require('./vector');
var Line = require('./line');
var Resource = require('./resource');
var Mesh = require('./mesh');
var Surface = require('./surface');
var Camera = require('./camera');
var Renderer = require('./renderer');
var Light = require('./light');
var Entity = require('./entity');
var Transition = require('./transition');

var Engine = {};
var Time = {};

var version = 0.1;

var MESHES = [
  'level01.obj',
  'level02.obj',
  'level03.obj',
  'level04.obj',
  'cube.obj',
  'cone.obj',
  'ico.obj',
  'marker.obj',
  'pad.obj',
  'bridge.obj',
  'teleport.obj'
];

var GridType = {
  BRIDGE: Color.YELLOW,
  GROUND: Color.GREY,
  NEUTRAL: Color.WHITE,
  TELEPORT: Color.CYAN,
  SWITCH: Color.BLACK
};

var transitionId = 0;

var TEXTURES = [ ];

Engine.processLevelMesh = function(level, tint1, tint2) {
  var mesh = level.mesh;
  var grid = level.grid = new Array(Engine.gridSize * Engine.gridSize);
  var tt = 0;

  tint1 = tint1 ? tint1 : new Colorf(1, 1, 1);
  tint2 = tint2 ? tint2 : new Colorf(1, 1, 1);

  mesh.colors.push(new Color(200 * tint1.r, 200 * tint1.g, 200 * tint1.b, 255));
  mesh.colors.push(new Color(220 * tint2.r, 220 * tint2.g, 220 * tint2.b, 255));
  mesh.colors.push(new Color(64, 128, 255, 255));

  var color_1 = mesh.colors.length - 3;
  var color_2 = mesh.colors.length - 2;
  var color_3 = mesh.colors.length - 1;

  var light=0, dark=0;

  for (var i = 0; i < mesh.triangles.length; i++) {
    var triangle = mesh.triangles[i];
    var color = mesh.colors[triangle.colors[0]];

    var v0 = mesh.vertices[triangle.vertices[0]];
    var v1 = mesh.vertices[triangle.vertices[1]];
    var v2 = mesh.vertices[triangle.vertices[2]];

    var d0 = lib.distance(v0.x, v0.z, v1.x, v1.z);
    var d1 = lib.distance(v0.x, v0.z, v2.x, v2.z);
    var d2 = lib.distance(v1.x, v1.z, v2.x, v2.z);

    if (d0 != 0 && d1 != 0 && d2 != 0) {
      tt++;

      var max = Math.max(d0, d1, d2);
      var mp = new Vector();

      if (d0 == max) {
        mp.x = (v0.x + v1.x) / 2;
        mp.z = (v0.z + v1.z) / 2;
      } else if (d1 == max) {
        mp.x = (v0.x + v2.x) / 2;
        mp.z = (v0.z + v2.z) / 2;
      } else if (d2 == max) {
        mp.x = (v1.x + v2.x) / 2;
        mp.z = (v1.z + v2.z) / 2;
      }

      var gridx = mp.x - 0.5 + 8;
      var gridy = mp.z - 0.5 + 8;

      var id = (gridy * Engine.gridSize + gridx) + 1;
      var index = id - 1;

      if (!Color.equals(color, GridType.NEUTRAL)) {
        if (Color.equals(color, GridType.GROUND)) {
          if ((gridy % 2 == 0 && gridx % 2 == 0) || (gridy % 2 != 0 && gridx % 2 != 0)) {
            triangle.colors[0] = color_2;
            triangle.colors[1] = color_2;
            triangle.colors[2] = color_2;
          } else {
            triangle.colors[0] = color_1;
            triangle.colors[1] = color_1;
            triangle.colors[2] = color_1;
          }
          color = mesh.colors[triangle.colors[0]];

        } else if (Color.equals(color, GridType.TELEPORT)) {
          color.a = 255;
          color = mesh.colors[triangle.colors[0]];

          triangle.colors[0] = color_3;
          triangle.colors[1] = color_3;
          triangle.colors[2] = color_3;

        } else {
          color.a = 255;
        }
        grid[index] = { x: mp.x, z: mp.z, height: v0.y, color: color };
      }
    }
  }

  level.entities = [];

  for (var i = 0; i < grid.length; i++) {
    var square = grid[i];
    if (square) {
      if (Color.equals(square.color, GridType.SWITCH)) {
        var pad = new Entity({ x: square.x, y: square.height, z: square.z });
        pad.mesh = Engine.meshes['pad.obj'];
        level.entities.push(pad);
        square.entity = pad;
      } else if (Color.equals(square.color, GridType.BRIDGE)) {
        var bridge = new Entity({ x: square.x, y: square.height, z: square.z });
        bridge.mesh = Engine.meshes['bridge.obj'];
        bridge.visible = false;
        level.entities.push(bridge);
        square.entity = bridge;
        square.height = square.height - 1;
        square.active = false;
      }
      else if (Color.equals(square.color, GridType.TELEPORT)) {
        var teleport = new Entity({ x: square.x, y: square.height, z: square.z });
        teleport.mesh = Engine.meshes['teleport.obj'];
        teleport.visible = true;
        teleport.bright = true;
        level.entities.push(teleport);
        square.entity = teleport;
      }
    }
  }

}


Engine.goLevel = function(index, g) {
  Engine.level = Engine.levels[index];
  Engine.grid = Engine.level.grid;
  Engine.levelIndex = index;
  Engine.gridIndex = null;

  var camera = Renderer.camera;
  camera.transform.position.x = 35;
  camera.transform.position.y = 35;
  camera.transform.position.z = 35;
  // camera.transform.rotation.x = -90 * RAD;

  camera.lookAt(new Vector(), new Vector(0, 1, 0));
}


Engine.createWorld = function() {
  Engine.imageData = Engine.offscreenContext.getImageData(0, 0, Engine.offscreenWidth, Engine.offscreenHeight);
  var surface = new Surface(Engine.offscreenWidth, Engine.offscreenHeight, Engine.imageData);

  var camera = new Camera(Camera.PERSPECTIVE, 30, 1, 100);
  // camera.view = new Rectangle(0.25, 0.25, 0.5, 0.5);
  // var camera = new Camera(Camera.ORTHOGRAPHIC, 10, 1, 100);
  // camera.orthoScale = 10;

  Renderer.init(surface, camera);

  Engine.grid = new Array(Engine.gridSize * Engine.gridSize);

  Engine.light = new Light(0, 0, 0, new Color(255, 255, 255, 255));
  Engine.light.setDirection(-0.6, -1, -0.4);

  Engine.lightFill = new Light(0, 0, 0, new Color(128, 140, 160, 255));
  Engine.lightFill.setDirection(0.6, 0, 0.4);

  Engine.levels = [];

  var level = new Entity({ name: 'level01' });
  level.mesh = Engine.meshes['level01.obj'];

  Engine.processLevelMesh(level, new Colorf(0.94, 0.76, 0.7), new Colorf(0.9, 0.84, 0.74));

  level.default = 236;
  level.grid[32].exit = 1;
  level.grid[32].target = 207;

  level.grid[61].target = 162;
  level.grid[162].target = 61;

  level.grid[166].target = 80;
  level.grid[80].target = 166;

  Engine.levels.push(level);

  var level = new Entity({ name: 'level02' });
  level.mesh = Engine.meshes['level02.obj'];
  Engine.processLevelMesh(level, new Colorf(0.78, 0.80, 0.68), new Colorf(0.78, 0.84, 0.80));
  level.default = 100;

  level.grid[86].triggerList = [227, 228];

  level.grid[12].exit = 3;
  level.grid[12].target = 252;

  level.grid[207].exit = 0;
  level.grid[207].target = 32;

  level.grid[224].exit = 2;
  level.grid[224].target = 95;
  Engine.levels.push(level);

  var level = new Entity({ name: 'level03' });
  level.mesh = Engine.meshes['level03.obj'];
  Engine.processLevelMesh(level, new Colorf(0.8, 0.7, 0.8), new Colorf(0.8, 0.8, 0.9));
  level.default = 92;
  level.grid[95].exit = 1;
  level.grid[95].target = 224;

  level.grid[90].target = 65;
  level.grid[65].target = 90;

  Engine.levels.push(level);

  var level = new Entity({ name: 'level04' });
  level.mesh = Engine.meshes['level04.obj'];
  Engine.processLevelMesh(level, new Colorf(0.65, 0.75, 0.85), new Colorf(0.7, 0.85, 0.8));
  level.default = 128;
  level.grid[252].exit = 1;
  level.grid[252].target = 12;
  Engine.levels.push(level);

  var cube = new Entity({ x: 0.5, y: 0.5, z: 0.5 });
  cube.mesh = Engine.meshes['cube.obj'];
  cube.ambient = 0.4;
  cube.tint = new Colorf(1, 0.5, 1);
  Engine.cube = cube;

  var transition;
  Engine.addTransition(new Transition({ duration: 500, startValue: 0.5, endValue: 1, object: cube.tint, property: 'r', bounce: true, repeat: true }), true);

  var marker = new Entity({ x: 0.5, y: Engine.cube.transform.position.y + 1, z: 0.5 });
  marker.mesh = Engine.meshes['marker.obj'];
  marker.ambient = 0.8;
  Engine.marker = marker;

  transition = new Transition({ duration: 500, startValue: 1, endValue: 1.2, object: marker.transform.position, property: 'y', bounce: true, repeat: true });
  Engine.addTransition(transition, true);
  Engine.marker.transition = transition;

  Engine.gridId = 0;

  // Global axes
  // Engine.lines.push(new Line(new Vector(0, 0, 0), new Vector(2, 0, 0), Color.RED));
  // Engine.lines.push(new Line(new Vector(0, 0, 0), new Vector(0, 2, 0), Color.GREEN));
  // Engine.lines.push(new Line(new Vector(0, 0, 0), new Vector(0, 0, 2), Color.BLUE));

  Engine.hit = null;

  Engine.goLevel(0);
  Engine.moveTo(Engine.level.default);
}

Engine.addTransition = function(transition, start) {
  if (transition) {
    this.transitions.push(transition);
    if (start) {
      transition.start();
    }
  }
}

Engine.intersectPlane = function(origin, direction, plane, normal) {
  var num = Vector.dot(Vector.subtract(plane, origin), normal);
  var den = Vector.dot(direction, normal);
  var d = num / den;
  var p = Vector.add(Vector.scale(direction, d), origin);
  return p;
}

Engine.castRay = function(pScreen, plane) {
  var camera = Renderer.camera;
  var projectionMatrix = Renderer.getProjection();
  var viewMatrix = camera.toLocal();
  // var pWorld = Renderer.rasterToWorld(pScreen, viewMatrix, projectionMatrix);
  var pWorld = camera.screenToWorld(pScreen, viewMatrix, projectionMatrix);
  var cameraToWorld = camera.toWorld();

  var eye, dir;

  if (camera.type == Camera.PERSPECTIVE) {
    eye = camera.transform.position;
    dir = Vector.subtract(pWorld, eye).normalize();
  } else {
    dir = camera.transform.position;
    eye = pWorld;
  }

  var p = Engine.intersectPlane(eye, dir, plane, new Vector(0, 1, 0));
  return p;
}


Engine.isWalkable = function(square) {
  var position = Engine.cube.transform.position;

  if (square) {
    if (square.height != position.y - 0.5) {
      return false;
    }
    if (square.color.equals(Color.ORANGE)) {
      return false;
    }
  } else {
    return false;
  }
  return true;
}


Engine.isValidMove = function(g) {
  if (g == undefined || g == null) return false;

  var x = (g % Engine.gridSize);
  var y = Engine.grid[g].height;
  var z = ((g / Engine.gridSize) >> 0);

  var position = Engine.cube.transform.position;
  var cubex = position.x + 7.5, cubez = position.z + 7.5;

  if (x == cubex) {
    if (z >= cubez) {
      for (var i = cubez; i <= z; i++) if (!Engine.isWalkable(Engine.grid[i * Engine.gridSize + x])) return false;
      return true;
    } else {
      for (var i = cubez; i >= z; i--) if (!Engine.isWalkable(Engine.grid[i * Engine.gridSize + x])) return false;
      return true;
    }
  } else if (z == cubez) {
    if (x >= cubex) {
      for (var i = cubex; i <= x; i++) if (!Engine.isWalkable(Engine.grid[z * Engine.gridSize + i])) return false;
      return true;
    } else {
      for (var i = cubex; i >= x; i--) if (!Engine.isWalkable(Engine.grid[z * Engine.gridSize + i])) return false;
      return true;
    }
  }
  return false;
}

Engine.teleportTo = function(i) {


}

Engine.setTokenPosition = function(x, y, z) {
  var position = Engine.cube.transform.position;
  position.x = x - 0.5;
  position.z = z - 0.5;
  position.y = y + 0.5;
  Engine.marker.transition.stop();
  Engine.marker.transition.startValue = position.y + 1;
  Engine.marker.transition.endValue = position.y + 1.2;
  Engine.marker.transform.position.x = position.x;
  Engine.marker.transform.position.y = position.y + 1;
  Engine.marker.transform.position.z = position.z;
  Engine.marker.transition.start();
}

Engine.moveTo = function(g) {
  var square = Engine.grid[g];
  if (square == undefined) return;

  var x = (g % Engine.gridSize) - 7;
  var y = Engine.grid[g].height;
  var z = ((g / Engine.gridSize) >> 0) - 7;
  var position = Engine.cube.transform.position;

  var oldSquare = Engine.grid[Engine.cube.g];

  if (oldSquare) {
    if (Color.equals(oldSquare.color, GridType.SWITCH)) {
      if (oldSquare.entity) {
        oldSquare.entity.transform.position.y = oldSquare.height;
      }
    }
  }

  if (square.exit !== undefined) {
    Engine.goLevel(square.exit)
    x = (square.target % Engine.gridSize) - 7;
    y = Engine.grid[square.target].height;
    z = ((square.target / Engine.gridSize) >> 0) - 7;
    // Engine.gridIndex = square.target;
    Engine.gridIndex = null;
  }
  else {
    if (Color.equals(Engine.grid[g].color, GridType.TELEPORT)) {
      Engine.gridIndex = g;
      if (square.target !== undefined) {
        var i = square.target;
        if (Engine.grid[i]) {
          Engine.addTransition(new Transition({ duration: 250, startValue: 1, endValue: 0.25, object: Engine.cube.transform.scale, property: 'x' }), true);
          Engine.addTransition(new Transition({ duration: 250, startValue: 1, endValue: 0.25, object: Engine.cube.transform.scale, property: 'z' }), true);
          setTimeout(function() {
            x = (i % Engine.gridSize) - 7;
            y = Engine.grid[i].height;
            z = ((i / Engine.gridSize) >> 0) - 7;
            Engine.cube.g = i;
            Engine.setTokenPosition(x, y, z);
            Engine.addTransition(new Transition({ duration: 250, startValue: 0.25, endValue: 1, object: Engine.cube.transform.scale, property: 'x' }), true);
            Engine.addTransition(new Transition({ duration: 250, startValue: 0.25, endValue: 1, object: Engine.cube.transform.scale, property: 'z' }), true);
          }, 250);
          Engine.gridIndex = null;
        }
      }
    } else if (Color.equals(square.color, GridType.SWITCH)) {
      if (square.entity) {
        square.entity.transform.position.y = square.height - 0.1;
        if (square.triggerList instanceof Array) {
          for (var i = 0; i < square.triggerList.length; i++) {
            var targetSquare = Engine.grid[square.triggerList[i]];
            if (targetSquare.active == false) {
              targetSquare.active = true;
              if (Color.equals(targetSquare.color, GridType.BRIDGE)) {
                targetSquare.height = targetSquare.height + 1;
                targetSquare.entity.visible = true;
              }
            }
          }
        }
      }
    } else if (Color.equals(square.color, GridType.BRIDGE)) {
      if (!square.active) {
        return;
      }
    } else if (Color.equals(square.color, Color.ORANGE)) {
      return;
    }
  }

  Engine.cube.g = Engine.gridIndex;
  Engine.setTokenPosition(x, y, z);

  // Engine.marker.transform.position.x = position.x;
  // Engine.marker.transform.position.z = position.z;
  // Engine.transitions['marker'].stop();
  // Engine.transitions['marker'] = new Transition({ duration: 500, startValue: position.y + 1, endValue: position.y + 1.2, object: Engine.marker.transform.position, property: 'y', bounce: true, repeat: true });
  // Engine.transitions['marker'].start();
}


Engine.drawEntity = function(entity) {
  var camera = Renderer.camera;
  var cull = entity.cull;

  if (entity.mesh) {
    var mesh = entity.mesh;
    var texture = entity.texture;
    var ambient = (entity.ambient !== undefined ? entity.ambient : 0);
    var tint = (entity.tint !== undefined ? entity.tint : new Colorf(1, 1, 1));
    var ao = entity.ao;
    var viewMatrix = camera.toLocal();
    var projectionMatrix = Renderer.getProjection();
    var model = entity.getTransformMatrix();
    var rotationMatrix = entity.getRotationMatrix();
    var lightNormal = (Vector.scale(Engine.light.direction, -1));
    var lightFillNormal = (Vector.scale(Engine.lightFill.direction, -1));
    var lightColor = Colorf.fromColor(Engine.light.color);
    var lightFillColor = Colorf.fromColor(Engine.lightFill.color);
    // var cameraNormal = new Vector(camera.transform.x, camera.transform.y, camera.transform.z);
    // var projection = Camera.perspectiveFOV(camera.fov, Renderer.aspect, camera.near, camera.far);
    var triangle;
    var backface;
    var n, v0, v1, v2;
    var facingRatio0, facingRatio1;
    var illumination = new Color();
    var defaultColor = new Color(255, 255, 255, 0);
    var id;

    if (mesh.vert_calc === undefined) {
      mesh.vert_calc = new Array(mesh.vertices.length);
    }

    for (var i = 0; i < mesh.vertices.length; i++) {
      mesh.vert_calc[i] = model.multiplyPoint(mesh.vertices[i]);
    }

    for (var i = 0; i < mesh.triangles.length; i++) {
      triangle = mesh.triangles[i];
      id = (triangle.id !== undefined ? triangle.id : 0);

      v0 = mesh.vert_calc[triangle.vertices[0]];
      v1 = mesh.vert_calc[triangle.vertices[1]];
      v2 = mesh.vert_calc[triangle.vertices[2]];

      // v0 = Renderer.worldToScreen(v0, viewMatrix, projectionMatrix);
      // v1 = Renderer.worldToScreen(v1, viewMatrix, projectionMatrix);
      // v2 = Renderer.worldToScreen(v2, viewMatrix, projectionMatrix);
      v0 = camera.worldToNDC(v0, viewMatrix, projectionMatrix);
      v1 = camera.worldToNDC(v1, viewMatrix, projectionMatrix);
      v2 = camera.worldToNDC(v2, viewMatrix, projectionMatrix);

      // backface = Vector.dot(n, cameraNormal);
      backface = (v0.x * v1.y - v1.x * v0.y) + (v1.x * v2.y - v2.x * v1.y) + (v2.x * v0.y - v0.x * v2.y);

      if (backface > 0) {
        v0 = camera.NDCToScreen(v0);
        v1 = camera.NDCToScreen(v1);
        v2 = camera.NDCToScreen(v2);

        n = (rotationMatrix.multiplyPoint(triangle.normal)).normalize();

        facingRatio0 = Math.max(0, Vector.dot(n, lightNormal));
        facingRatio1 = Math.max(0, Vector.dot(n, lightFillNormal));

        v0.color = mesh.colors[triangle.colors[0]];
        v1.color = mesh.colors[triangle.colors[1]];
        v2.color = mesh.colors[triangle.colors[2]];

        if (v0.color == undefined) v0.color = defaultColor;
        if (v1.color == undefined) v1.color = defaultColor;
        if (v2.color == undefined) v2.color = defaultColor;

        if (entity.bright) {
          illumination.r = 1.0;
          illumination.g = 1.0;
          illumination.b = 1.0;
        } else {
          illumination.r = Math.min(1.0, facingRatio0 * lightColor.r + facingRatio1 * lightFillColor.r);
          illumination.g = Math.min(1.0, facingRatio0 * lightColor.g + facingRatio1 * lightFillColor.g);
          illumination.b = Math.min(1.0, facingRatio0 * lightColor.b + facingRatio1 * lightFillColor.b);

          illumination.r = Math.min(1.0, illumination.r + ambient);
          illumination.g = Math.min(1.0, illumination.g + ambient);
          illumination.b = Math.min(1.0, illumination.b + ambient);

          illumination.r = Math.max(0.2, illumination.r);
          illumination.g = Math.max(0.2, illumination.g);
          illumination.b = Math.max(0.2, illumination.b);

          illumination.r = Math.min(1.0, illumination.r + v0.color.a/255);
          illumination.g = Math.min(1.0, illumination.g + v0.color.a/255);
          illumination.b = Math.min(1.0, illumination.b + v0.color.a/255);
        }

        if (triangle.uvs.length > 0) {
          v0.uv = mesh.uvs[triangle.uvs[0]];
          v1.uv = mesh.uvs[triangle.uvs[1]];
          v2.uv = mesh.uvs[triangle.uvs[2]];
        }

        if ((v0.z > 0.1 && v1.z > 0.1 && v2.z > 0.1)) {
          Renderer.drawTriangle(v0, v1, v2, illumination, tint, texture, id);
        }
      }
    }
  }
}


// Engine.drawEntityAxes = function(entity) {
//   // var transformMatrix = entity.getTransformMatrix();
//   var xaxis, yaxis, zaxis, line;
//
//   zaxis = new Vector(0, 0, 2);
//   var a = entity.toWorld(zaxis);
//   line = new Line(entity.transform.position, a, Color.BLUE);
//   Renderer.drawLine(line);
//
//   yaxis = new Vector(0, 2, 0);
//   var b = entity.toWorld(yaxis);
//   line = new Line(entity.transform.position, b, Color.GREEN);
//   Renderer.drawLine(line);
//
//   xaxis = new Vector(2, 0, 0);
//   var c = entity.toWorld(xaxis);
//   line = new Line(entity.transform.position, c, Color.RED);
//   Renderer.drawLine(line);
//
// }


Engine.drawEntities = function() {
  if (Engine.level) {
    Engine.drawEntity(Engine.level);
  }

  if (Engine.cube) {
    Engine.drawEntity(Engine.cube);
  }

  // for (var i = 0; i < Engine.entities.length; i++) {
  //   Engine.drawEntity(Engine.entities[i], false);
  // }

  for (var i = 0; i < Engine.lines.length; i++) {
    Renderer.drawLine(Engine.lines[i]);
  }

  // Renderer.clearDepthBuffer();

  if (Engine.marker) {
    Engine.drawEntity(Engine.marker);
  }

  for (var i = 0; i < Engine.level.entities.length; i++) {
    var entity = Engine.level.entities[i];
    if (entity.visible) {
      Engine.drawEntity(entity);
    }
  }

  // for (var i = 0; i < Engine.entities.length; i++) {
  //   Engine.drawEntityAxes(Engine.entities[i]);
  // }

  if (Engine.gridIndex != undefined && Engine.gridIndex != null && !Engine.interact.drag) {
    var position = Engine.cube.transform.position;
    var g = Engine.gridIndex;
    var x = (g % Engine.gridSize) - 7;
    var y = Engine.grid[g].height;
    var z = ((g / Engine.gridSize) >> 0) - 7;
    var color;
    var valid = Engine.isValidMove(g);

    if (valid)
      color = Color.GREEN;
    else
      color = Color.RED;

    var line1 = new Line(new Vector(x - 1, y, z), new Vector(x, y, z), color);
    var line2 = new Line(new Vector(x - 1, y, z - 1), new Vector(x, y, z - 1), color);
    var line3 = new Line(new Vector(x - 1, y, z), new Vector(x - 1, y, z - 1), color);
    var line4 = new Line(new Vector(x, y, z), new Vector(x, y, z - 1), color);

    Renderer.drawLine(line1);
    Renderer.drawLine(line2);
    Renderer.drawLine(line3);
    Renderer.drawLine(line4);

    if (valid) {
      // if (position.y == Engine.grid[g] + 0.5) {
        var linepath = new Line(position, new Vector(x - 0.5, y, z - 0.5), Color.WHITE);
        Renderer.drawLine(linepath);
      // }
    }
  }

}


// Engine.drawTest = function() {
//   var shade = new Colorf();
//
//   // for (var i = 0; i < 100; i++) {
//   //   var r = Math.random();
//   //   var s = Math.random();
//   //   var t = (160 * r) + 10 >> 0;
//   //   var u = (100 * s) + 10 >> 0;
//   //   var w = 8;
//   //
//   //   var v0 = new Vector(t, u, 1+r);
//   //   var v1 = new Vector(t + w, u, 1+r);
//   //   var v2 = new Vector(t + w, u - w, 1+r);
//   //
//   //   v0.color = new Color((Math.random()*255), (Math.random()*255), (Math.random()*255));
//   //
//   //   Renderer.drawTriangle(v0, v1, v2, shade);
//   // }
//
//   var viewMatrix = Renderer.camera.toLocal();
//   var projectionMatrix = Renderer.getProjection();
//
//   var line = new Line(new Vector(-5, 0, -5), new Vector(-5, 0, 5), Color.WHITE);
//   var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
//   var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
//   Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);
//
//   var line = new Line(new Vector(-5, 0, 5), new Vector(5, 0, 5), Color.WHITE);
//   var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
//   var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
//   Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);
//
//   var line = new Line(new Vector(5, 0, 5), new Vector(5, 0, -5), Color.WHITE);
//   var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
//   var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
//   Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);
//
//   var line = new Line(new Vector(5, 0, -5), new Vector(-5, 0, -5), Color.WHITE);
//   var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
//   var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
//   Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);
//
//   // Renderer.setPixel(a.x, a.y, 255, 0, 0, 255);
// }


Engine.swapBuffer = function() {
  // Engine.imageData.data.set(Renderer.surface.buf8);
  // Engine.imageData.data.set(Renderer.surface.buf32);
  Engine.offscreenContext.putImageData(Engine.imageData, 0, 0);
  Engine.context.drawImage(Engine.offscreenCanvas, 0, 0, Engine.width * Engine.scale, Engine.height * Engine.scale);
  // Engine.context.putImageData(Engine.imageData, 0, 0);
}

Engine.drawOverlay = function() {
  var ctx = Engine.context;

  if (Engine.showStats) {
    var y = 40;

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText('fps: ' + Math.round(Engine.fps.average), 10, y);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText('tri/large: ' + Renderer.tricount + '/' + Renderer.largetri, 10, y + 20);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText('pixels: ' + Renderer.pixcount, 10, y + 40);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText('active transitions: ' + Engine.transitions.length, 10, y + 60);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText('index: ' + Engine.gridIndex, 10, y + 80);
  }

  var text = 'Cuboid v' + version;
  ctx.fillStyle = 'rgb(160, 160, 160)';
  ctx.font = '14px sans-serif';
  var tm = ctx.measureText(text);
  ctx.fillText(text, 8, 20);

  if (!Engine.active) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'black';
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillRect(0, 0, Engine.canvas.width, Engine.canvas.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    var x = 10, y = Engine.height * Engine.scale - 16;
    ctx.fillStyle ='white';
    ctx.fillRect(x, y, 2, 6);
    ctx.fillRect(x + 4, y, 2, 6);
  }

}


Engine.draw = function() {
  var ctx = Engine.context;

  Renderer.reset();
  Renderer.surface.fill(28, 28, 32, 255);

  Engine.drawEntities();

  // if (Engine.showid) {
  //   for (var y = 0; y < Renderer.surface.height; y++) {
  //     for (var x = 0; x < Renderer.surface.width; x++) {
  //       var id = Renderer.idBuffer[y * Renderer.surface.width + x];
  //       Renderer.setPixel(x, y, id, id, id, 255);
  //     }
  //   }
  // }
  //
  // if (Engine.showdepth) {
  //   for (var y = 0; y < Renderer.surface.height; y++) {
  //     for (var x = 0; x < Renderer.surface.width; x++) {
  //       var color = Renderer.depthBuffer[y * Renderer.surface.width + x];
  //       color = Math.min(255, color * (color * 0.05));
  //       Renderer.setPixel(x, y, color, color, color, 255);
  //     }
  //   }
  // }
  //
  // if (Engine.ray) {
  //   var line = new Line(new Vector(), Engine.ray, Color.BLUE);
  //   Renderer.drawLine(line);
  // }

  // Engine.drawTest();

  Engine.swapBuffer();
  Engine.drawOverlay();

}


Engine.onBlur = function(event) {
  Engine.stop();
}


Engine.onFocus = function(event) {
  Engine.resume();
}


Engine.keyTimeout  = function(key) {
}


Engine.onContextMenu = function(event) {
  event.preventDefault();
}


Engine.onScroll = function(event) {
  event.preventDefault();
}


Engine.onKeyDown = function(event) {
  Engine.keys[event.key] = true;
}


Engine.onKeyUp = function(event) {
  if (event.key == 'ArrowLeft') {

  } else if (event.key == 'ArrowRight') {

  } else if (event.key == '1') {
    Engine.goLevel(0);

  } else if (event.key == '2') {
    Engine.goLevel(1);

  } else if (event.key == '3') {
    Engine.goLevel(2);

  } else if (event.key == '4') {
    Engine.goLevel(3);

  } else if (event.key == 'i') {
    if (Engine.showid === undefined)
      Engine.showid = true;
    else
      Engine.showid = !Engine.showid;
  } else if (event.key == 'd') {
    if (Engine.showdepth === undefined)
      Engine.showdepth = true;
    else
      Engine.showdepth = !Engine.showdepth;
  } else if (event.key == 's') {
    if (Engine.showStats === undefined)
      Engine.showStats = true;
    else
      Engine.showStats = !Engine.showStats;
  } else if (event.key == '=') {
    if (Engine.levelIndex + 1 <= Engine.levels.length - 1) {
      Engine.goLevel(Engine.levelIndex + 1);
      Engine.moveTo(Engine.level.default);
    }
  } else if (event.key == '-') {
    if (Engine.levelIndex - 1 >= 0) {
      Engine.goLevel(Engine.levelIndex - 1);
      Engine.moveTo(Engine.level.default);
    }
  }

  delete(Engine.keys[event.key]);
}


Engine.beginInteraction = function() {
  var point = new Vector(Engine.interact.x, Engine.interact.y, 0);
}


Engine.updateInteraction = function() {
  var pScreen = new Vector((Engine.interact.x / Engine.scale), (Engine.interact.y / Engine.scale), 0);
  var distance = Math.abs(Engine.interact.startX - Engine.interact.x) + Math.abs(Engine.interact.startY - Engine.interact.y);

  if (Engine.interact.primary && distance > 3) {
    Engine.interact.drag = true;
  }

  var camera = Renderer.camera;

  if (Engine.interact.drag) {
    var center = new Vector();
    var axis = new Vector(0, 1, 0);
    var delta = Time.delta;
    var angle = -(Engine.interact.deltaX) * 0.2;
    camera.transform.rotateAroundQuaternion(center, axis, angle);
    camera.lookAt(center, axis);
  } else {
    var on = false;
    var height = Engine.cube.transform.position.y - 0.5;
    var plane = new Vector(0, height, 0)

    var p = Engine.castRay(pScreen, plane);

    for (var i = 0; i < Engine.grid.length; i++) {
      var square = Engine.grid[i];
      if (square) {
        if (square.height == height) {
          if (lib.pointInRect(p.x, p.z, square.x - 0.5, square.z - 0.5, 1.0, 1.0)) {
            on = true;
            Engine.gridIndex = i;
            break;
          }
        }
      }
    }

    Engine.hit = p;

    if (!on) {
      Engine.gridIndex = null;
    }
  }

  // Engine.gridId = id;
}


Engine.endInteraction = function() {
  var pRaster = new Vector(Engine.interact.x / Engine.scale, Engine.interact.y / Engine.scale, 0);

  if (!Engine.interact.drag) {
    if (Engine.isValidMove(Engine.gridIndex)) {
      Engine.moveTo(Engine.gridIndex);
    }
  }

  Engine.interact.primaryUp = true;
}


Engine.processMouseEvent = function(event) {
  Engine.interact.x = event.clientX - Engine.stage.offsetLeft;
  Engine.interact.y = event.clientY - Engine.stage.offsetTop;

  Engine.interact.button = event.button;
  Engine.interact.buttons = event.buttons;
}


Engine.onClick = function(event) {
}


Engine.onMouseDown = function(event) {
  Engine.processMouseEvent(event);
  Engine.interact.startX = Engine.interact.x;
  Engine.interact.startY = Engine.interact.y;
  Engine.interact.lastX = Engine.interact.x;
  Engine.interact.lastY = Engine.interact.y;
  Engine.interact.deltaX = 0;
  Engine.interact.deltaY = 0;
  Engine.interact.drag = false;

  if (Engine.interact.button == 0) {
    Engine.interact.primary = true;
    Engine.interact.primaryUp = false;
  }

  if (Engine.active) Engine.beginInteraction();

  Engine.interact.lastX = Engine.interact.x;
  Engine.interact.lastY = Engine.interact.y;
}


Engine.onMouseMove = function(event) {
  Engine.processMouseEvent(event);

  Engine.interact.deltaX = Engine.interact.x - Engine.interact.lastX;
  Engine.interact.deltaY = Engine.interact.y - Engine.interact.lastY;

  if (Engine.active) Engine.updateInteraction();

  Engine.interact.lastX = Engine.interact.x;
  Engine.interact.lastY = Engine.interact.y;

  // console.log(Engine.interact.deltaX);

}


Engine.onMouseUp = function(event) {
  Engine.processMouseEvent(event);
  if (Engine.active) Engine.endInteraction();

  // Engine.interact.lastX = Engine.interact.x;
  // Engine.interact.lastY = Engine.interact.y;

  Engine.interact.lastX = 0;
  Engine.interact.lastY = 0;
  Engine.interact.primary = false;
  Engine.interact.drag = false;
}


Engine.onMouseOut = function(event) {
}


Engine.onMouseOver = function(event) {
}


Engine.processTouchEvent = function(event) {
  Engine.interact.x = event.changedTouches[0].clientX - Engine.stage.offsetLeft;
  Engine.interact.y = event.changedTouches[0].clientY - Engine.stage.offsetTop;
  Engine.interact.primary = true;
}


Engine.onTouchStart = function(event) {
  event.preventDefault();

  Engine.processTouchEvent(event);
  Engine.interact.startX = Engine.interact.x;
  Engine.interact.startY = Engine.interact.y;
  Engine.interact.lastX = Engine.interact.x;
  Engine.interact.lastY = Engine.interact.y;
  Engine.interact.deltaX = Engine.interact.x - Engine.interact.lastX;
  Engine.interact.deltaY = Engine.interact.y - Engine.interact.lastY;

  Engine.beginInteraction();

}


Engine.onTouchMove = function(event) {
  event.preventDefault();
  Engine.processTouchEvent(event);

  Engine.interact.deltaX = Engine.interact.x - Engine.interact.lastX;
  Engine.interact.deltaY = Engine.interact.y - Engine.interact.lastY;

  if (Engine.active) Engine.updateInteraction();

  Engine.interact.lastX = Engine.interact.x;
  Engine.interact.lastY = Engine.interact.y;
}


Engine.onTouchEnd = function(event) {
  event.preventDefault();
  Engine.processTouchEvent(event);
  Engine.endInteraction();

  // Engine.interact.lastX = Engine.interact.x;
  // Engine.interact.lastY = Engine.interact.y;
  Engine.interact.lastX = 0;
  Engine.interact.lastY = 0;
  Engine.interact.primary = false;
}


Engine.initEventListeners = function() {
  window.addEventListener('blur', Engine.onBlur);
  window.addEventListener('focus', Engine.onFocus);
  window.addEventListener('keydown', Engine.onKeyDown);
  window.addEventListener('keyup', Engine.onKeyUp);


  Engine.canvas.addEventListener('mousedown', Engine.onMouseDown);
  window.addEventListener('mousemove', Engine.onMouseMove);
  window.addEventListener('mouseup', Engine.onMouseUp);
  window.addEventListener('mouseout', Engine.onMouseOut);
  window.addEventListener('mouseover', Engine.onMouseOver);

  Engine.canvas.addEventListener('contextmenu', Engine.onContextMenu);

  Engine.stage.addEventListener('touchstart', Engine.onTouchStart);
  Engine.stage.addEventListener('touchend', Engine.onTouchEnd);
  Engine.stage.addEventListener('touchmove', Engine.onTouchMove);

  // Engine.canvas.addEventListener('scroll', Engine.onScroll);
}


Engine.createElements = function() {
  Engine.stage = document.getElementById('stage');
  Engine.stage.style.width = (Engine.width * Engine.scale) + 'px';
  Engine.stage.style.height = (Engine.height * Engine.scale) + 'px';

  var about = document.getElementById('about');
  var aboutIcon = document.getElementById('about-icon');

  about.onclick = function (event) {
    if (about.style.visibility != 'hidden') {
      about.style.visibility = 'hidden';
    }
  }

  aboutIcon.onclick = function(event) {
    about.style.visibility = 'visible';
    event.preventDefault();
    event.stopPropagation();
  }

  Engine.canvas = document.createElement('canvas');
  Engine.canvas.style.backgroundColor = 'green';
  Engine.canvas.id = 'surface';
  Engine.canvas.width = Engine.width * Engine.scale;
  Engine.canvas.height = Engine.height * Engine.scale;
  Engine.canvas.style.userSelect = 'none';
  Engine.stage.appendChild(Engine.canvas);

  Engine.context = Engine.canvas.getContext('2d');

  Engine.offscreenCanvas = document.createElement('canvas');
  Engine.offscreenCanvas.width = Engine.offscreenWidth;
  Engine.offscreenCanvas.height = Engine.offscreenHeight;

  Engine.offscreenContext = Engine.offscreenCanvas.getContext('2d');

  if (Engine.context.imageSmoothingEnabled === undefined) {
    Engine.context.mozImageSmoothingEnabled = false;
    Engine.context.webkitImageSmoothingEnabled = false;
    Engine.context.msImageSmoothingEnabled = false;
  } else {
    Engine.context.imageSmoothingEnabled = false;
  }
}

Engine.onResourceLoad = function(filename) {
  var res = Resource.get(filename);
  if (res.type == 'obj') {
    Engine.meshes[filename] = Mesh.fromOBJ(res);
  } else if (res.type == 'png') {
    Engine.textures[filename] = Texture.fromImage(res.content);
  }
  if (Resource.done) {
    setTimeout(() => {
      Engine.bootup()
    }, 500);
  }
}

Engine.loadResources = function() {
  Resource.init(Engine.onResourceLoad);
  for (var i = 0; i < MESHES.length; i++) {
    Resource.load(MESHES[i]);
  }

  for (var i = 0; i < TEXTURES.length; i++) {
    Resource.load(TEXTURES[i]);
  }
}

Engine.bootup = function() {
  Engine.createWorld();
  Engine.initialised = true;
  Engine.first = true;
  Time.start = performance.now();
  Engine.resume();
}

Engine.updateTransitions = function() {
  for (var i = 0; i < Engine.transitions.length; i++) {
    Engine.transitions[i].update();
  }
  Engine.transitions = Engine.transitions.filter(function(element) {
    return !element.isCompleted();
  });
}

Engine.update = function()  {
  var camera = Renderer.camera;
  var center = new Vector();
  var axis = new Vector(0, 1, 0);
  var delta = Time.delta;

  if (Engine.grid) {
    for (var i = 0; i < Engine.grid.length; i++) {
      var square = Engine.grid[i];
      if (square) {
        if (Color.equals(square.color, GridType.TELEPORT)) {
          if (square.entity) {
            square.entity.transform.rotation.y += (0.2 * delta) * lib.RAD;
          }
        }
      }
    }
  }

  if (Engine.keys['ArrowLeft']) {
  }

  if (Engine.keys['ArrowRight']) {
  }

  if (Engine.keys['ArrowUp']) {
    camera.transform.position.y--;
    camera.lookAt(new Vector(), new Vector(0, 1, 0));
  }

  if (Engine.keys['ArrowDown']) {
    camera.transform.position.y++;
    camera.lookAt(new Vector(), new Vector(0, 1, 0));
  }

  if (Engine.keys['+']) {
    // Engine.entities[0].transform.position.z += 5 * delta;
  }

  if (Engine.keys['-']) {
    // Engine.entities[0].transform.position.z -= 5 * delta;
  }

}

Engine.frame = function(timestamp) {
  if (Engine.active && Resource.done) {
    // var interval = 1000 / Engine.fps.standard;
    Time.now = performance.now();
    // Time.now = timestamp;
    Time.delta = 1000 / (Time.now - Time.then);

    // if (Time.delta >= interval) {
      Engine.update();
      Engine.updateTransitions();
      Engine.draw();

      // Time.then = Time.now - (Time.delta % interval);
      Engine.fps.average = Engine.fps.average * 0.99 + Time.delta * 0.01;
    // }

    Time.count++;

    // if (Engine.fpsEl) {
    //   if (Time.count % Engine.fps.standard == 0) {
    //     Engine.fpsEl.innerHTML = Engine.fps.average.toFixed(1);
    //   }
    // }

    Time.then = Time.now;
    Engine.frameID = requestAnimationFrame(Engine.frame);

    Engine.first = false;
  }
  // Engine.keys = {};
  Engine.interact.primaryUp = false;
  Engine.interact.deltaX = 0;
  Engine.interact.deltaY = 0;
}

Engine.resume = function() {
  if (Engine.initialised) {
    Engine.active = true;
    Time.now = performance.now();
    Time.then = Time.now;
    Time.count = 0;
    Engine.fps.average = Engine.fps.standard;
    Engine.frameID = requestAnimationFrame(Engine.frame);

    for (var i = 0; i < Engine.transitions.length; i++) {
      Engine.transitions[i].start();
    }
  }
}

Engine.stop = function() {
  Engine.active = false;
  cancelAnimationFrame(Engine.frameID);
  Engine.draw();
}

Engine.init = function(width, height, scale) {
  console.log('init');

  Engine.fps = {};
  Engine.fps.standard = 60;

  Engine.interact = {};
  Engine.keys = {};
  Engine.entities = [];
  Engine.lines = [];
  Engine.transitions = [];

  Engine.scale = (scale !== undefined ? scale : 1);

  Engine.width = width;
  Engine.height = height;
  Engine.gridSize = 16;

  Engine.offscreenWidth = Engine.width;
  Engine.offscreenHeight = Engine.height;

  Engine.meshes = {};
  Engine.textures = {};

  Engine.createElements();
  Engine.initEventListeners();
  Engine.loadResources();

}

window.onload = function() {
  Engine.init(320, 200, 3);
}

window.Engine = Engine;
window.Time = Time;

},{"./camera":2,"./color":3,"./colorf":4,"./entity":6,"./lib":7,"./light":8,"./line":9,"./mesh":11,"./renderer":13,"./resource":14,"./surface":15,"./transition":17,"./vector":18}],6:[function(require,module,exports){
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

},{"./matrix":10,"./transform":16}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
var Vector = require('./vector');
var Color = require('./color');
var Entity = require('./entity');

function Light(x, y, z, color) {
  Entity.call(this, x, y, z);
  this.direction = new Vector();
  this.color = (color !== undefined ? Color.copy(color) : new Color(255, 255, 255, 255));
}

Light.prototype = Object.create(Entity.prototype);
Light.prototype.constructor = Light;

Light.prototype.setDirection = function(x, y, z) {
  this.direction = new Vector(x, y, z);
  this.direction.normalize();
}

module.exports = Light;

},{"./color":3,"./entity":6,"./vector":18}],9:[function(require,module,exports){

function Line(a, b, color) {
  this.a = a;
  this.b = b;
  this.color = color;
}

module.exports = Line;

},{}],10:[function(require,module,exports){
var Vector = require('./vector');

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

module.exports = Matrix;

},{"./vector":18}],11:[function(require,module,exports){
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

},{"./color":3,"./rectangle":12,"./vector":18}],12:[function(require,module,exports){

function Rectangle(x, y, w, h) {
  this.x = (x == undefined ? 0 : x);
  this.y = (y == undefined ? 0 : y);
  this.width = (w == undefined ? 0 : w);
  this.height = (h == undefined ? 0 : h);
}

module.exports = Rectangle;

},{}],13:[function(require,module,exports){
var Vector = require('./vector');
var Color = require('./color');
var Camera = require('./camera');

function Renderer() {
}

Renderer.init = function(surface, camera) {
  Renderer.surface = surface;
  Renderer.camera = camera;
  this.camera.setRect(this.surface.width, this.surface.height);

  // Renderer.depthArrayBuffer = new ArrayBuffer(Renderer.surface.width * Renderer.surface.height);
  // Renderer.idArrayBuffer = new ArrayBuffer(Renderer.surface.width * Renderer.surface.height);

  Renderer.depthBuffer = new Array(Renderer.surface.width * Renderer.surface.height);
  Renderer.idBuffer = new Array(Renderer.surface.width * Renderer.surface.height);

  Renderer.aspect = Renderer.surface.width / Renderer.surface.height;

  Renderer.clearDepthBuffer();
  Renderer.clearIdBuffer();

  Renderer.tricount = 0;
  Renderer.largetri = 0;
  Renderer.pixcount = 0;
  Renderer.zsort = true;
  Renderer.id = 0;
}

Renderer.clearIdBuffer = function() {
  for (var i = 0, len = Renderer.idBuffer.length; i < len; i++) Renderer.idBuffer[i] = 0;
}

Renderer.clearDepthBuffer = function() {
  for (var i = 0, len = Renderer.depthBuffer.length; i < len; i++) Renderer.depthBuffer[i] = Number.POSITIVE_INFINITY;
  // for (var i = 0, len = Renderer.depthBuffer.length; i < len; i++) Renderer.depthBuffer[i] = 0;
}

Renderer.reset = function() {
  Renderer.tricount = 0;
  Renderer.largetri = 0;
  Renderer.pixcount = 0;
  Renderer.clearDepthBuffer();
  Renderer.clearIdBuffer();
}

Renderer.getProjection = function() {
  var camera = Renderer.camera;
  var projection;

  var aspect = (Renderer.camera.view.width * Renderer.aspect) / Renderer.camera.view.height;

  if (camera.type == Camera.ORTHOGRAPHIC) {
    var height = camera.orthoScale * 2;
    var width = height * aspect;
    projection = Camera.orthographic(width, height, camera.near, camera.far);
    // projection = Camera.orthographic(aspect, 1, camera.near, camera.far, camera.orthoScale);
  } else {
    projection = Camera.perspectiveFOV(camera.fov, aspect, camera.near, camera.far);
  }

  return projection;
}

Renderer.screenToRaster = function(p) {
  var pRaster = new Vector();
  pRaster.x = ((p.x + 1) * 0.5) * (Renderer.surface.width);
  pRaster.y = ((1 - p.y) * 0.5) * (Renderer.surface.height);
  pRaster.z = (p.z !== undefined ? p.z : 0);
  return pRaster;
}

Renderer.rasterToScreen = function(pRaster) {
  // var pNDC = new Vector((p.x + 0.5) / Renderer.surface.width, (p.y + 0.5) / Renderer.surface.height, -1);
  var pNDC = new Vector(pRaster.x / Renderer.surface.width, pRaster.y / Renderer.surface.height, 0);
  // return new Vector(2 * pNDC.x - 1, 1 - 2 * pNDC.y, -Renderer.view.camera.near);
  // return new Vector(2 * pNDC.x - 1, 1 - 2 * pNDC.y, Renderer.view.camera.near);
  return new Vector(2 * pNDC.x - 1, 1 - 2 * pNDC.y, Renderer.camera.near);
}

Renderer.rasterToWorld = function(pRaster, viewMatrix, projectionMatrix) {
  var pScreen = Renderer.rasterToScreen(pRaster);
  // if (Renderer.camera.type == Camera.ORTHOGRAPHIC) {
  //   pScreen.z = 0;
  // }
  var pWorld = Renderer.screenToWorld(pScreen, viewMatrix, projectionMatrix);
  return pWorld;
}

Renderer.worldToRaster = function(pWorld, viewMatrix, projectionMatrix) {
  var pScreen = Renderer.worldToScreen(pWorld, viewMatrix, projectionMatrix);
  var pRaster = Renderer.screenToRaster(pScreen);
  return pRaster;
}

Renderer.screenToWorld = function(pScreen, viewMatrix, projectionMatrix) {
  var viewProjectionInverse = Matrix.multiply(viewMatrix, projectionMatrix).inverse();
  var pWorld = viewProjectionInverse.multiplyPoint(pScreen);
  return pWorld;
}

Renderer.worldToScreen = function(pWorld, viewMatrix, projectionMatrix) {
  var camera = Renderer.camera;

  var pCamera = viewMatrix.multiplyPoint(pWorld);
  var pScreen = projectionMatrix.multiplyPoint(pCamera);

  // pScreen.z = pCamera.z;
  pScreen.z = -pCamera.z;

  return pScreen;
}

Renderer.setPixel = function(x, y, r, g, b, a) {
  if (x >= 0 && y >= 0 && x < Renderer.surface.width && y < Renderer.surface.height) {
    // var index = (y * Renderer.surface.width + x) * 4;
    Renderer.surface.buf32[y * Renderer.surface.width + x] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
}

// Bresenham Line Algorithm
// http://www.edepot.com/linebresenham.html

Renderer.line = function(x1, y1, x2, y2, r, g, b, a) {
	var x = 0, y = 0;
	var dx = 0, dy = 0;
	var incx = 0, incy = 0;
	var balance = 0;

	if (x2 >= x1) {
		dx = x2 - x1;
		incx = 1;
	} else {
		dx = x1 - x2;
		incx = -1;
	}

	if (y2 >= y1) {
		dy = y2 - y1;
		incy = 1;
	} else {
		dy = y1 - y2;
		incy = -1;
	}

	x = x1;
	y = y1;

	if (dx >= dy) {
		dy <<= 1;
		balance = dy - dx;
		dx <<= 1;

		while (x != x2) {
			Renderer.setPixel(x, y, r, g, b, a);
			if (balance >= 0) {
				y += incy;
				balance -= dx;
			}
			balance += dy;
			x += incx;
		}
    Renderer.setPixel(x, y, r, g, b, a);
	} else {
		dx <<= 1;
		balance = dx - dy;
		dy <<= 1;

		while (y != y2) {
			Renderer.setPixel(x, y, r, g, b, a);
			if (balance >= 0) {
				x += incx;
				balance -= dy;
			}
			balance += dx;
			y += incy;
		}
    Renderer.setPixel(x, y, r, g, b, a);
	}
}

Renderer.drawLine = function(line) {
  var viewMatrix = Renderer.camera.toLocal();
  var projectionMatrix = Renderer.getProjection();
  var a = Renderer.camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
  var b = Renderer.camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
  Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);
}

Renderer.edgeFunction = function(a, b, c) {
  // clockwise vertex ordering
  // return ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x) >= 0);

  // counter-clockwise vertex ordering
  return (a.x - b.x) * (c.y - a.y) - (a.y - b.y) * (c.x - a.x);
}

Renderer.drawTriangle = function(v0, v1, v2, illumination, tint, texture, id) {
  var bbminx = Number.POSITIVE_INFINITY;
  var bbminy = Number.POSITIVE_INFINITY;
  var bbmaxx = Number.NEGATIVE_INFINITY;
  var bbmaxy = Number.NEGATIVE_INFINITY;

  if (v0.x < bbminx) bbminx = v0.x;
  if (v1.x < bbminx) bbminx = v1.x;
  if (v2.x < bbminx) bbminx = v2.x;

  if (v0.y < bbminy) bbminy = v0.y;
  if (v1.y < bbminy) bbminy = v1.y;
  if (v2.y < bbminy) bbminy = v2.y;

  if (v0.x > bbmaxx) bbmaxx = v0.x;
  if (v1.x > bbmaxx) bbmaxx = v1.x;
  if (v2.x > bbmaxx) bbmaxx = v2.x;

  if (v0.y > bbmaxy) bbmaxy = v0.y;
  if (v1.y > bbmaxy) bbmaxy = v1.y;
  if (v2.y > bbmaxy) bbmaxy = v2.y;

  // var vx = Renderer.camera.view.x * Renderer.surface.width;
  // var vy = Renderer.camera.view.y * Renderer.surface.height;
  // var vw = Renderer.camera.view.width * Renderer.surface.width;
  // var vh = Renderer.camera.view.height * Renderer.surface.height;

  if (bbminx < 0) bbminx = 0;
  if (bbminy < 0) bbminy = 0;

  if (bbmaxx > Renderer.surface.width - 1) bbmaxx = Renderer.surface.width - 1;
  if (bbmaxy > Renderer.surface.height - 1) bbmaxy = Renderer.surface.height - 1;

  bbminx = Math.round(bbminx);
  bbmaxx = Math.round(bbmaxx);
  bbminy = Math.round(bbminy);
  bbmaxy = Math.round(bbmaxy);

  if (bbmaxx - bbminx >= 8) {
    Renderer.largetri++;
  }

  var v0z = 1 / v0.z;
  var v1z = 1 / v1.z;
  var v2z = 1 / v2.z;

  var area = Renderer.edgeFunction(v0, v1, v2);

  var w0f, w1f, w2f;
  var w0, w1, w2;
  var w0_step, w1_step, w2_step;
  var oneOverZ, z;
  var cr, cg, cb;
  var p = new Vector();
  var computedColor = new Color();
  var u, v;
  var s, z;

  for (var y = bbminy; y <= bbmaxy; y++) {
    var out = true;
    p.x = bbminx;
    p.y = y;

    w0f = Renderer.edgeFunction(v1, v2, p);
    w1f = Renderer.edgeFunction(v2, v0, p);
    w2f = Renderer.edgeFunction(v0, v1, p);

    s = 0;

    for (var x = bbminx; x <= bbmaxx; x++, s++) {
      Renderer.pixcount++;
      p.x = x;

      w0 = w0f + -(v1.y - v2.y) * s;
      w1 = w1f + -(v2.y - v0.y) * s;
      w2 = w2f + -(v0.y - v1.y) * s;

      if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
        w0 = w0 / area;
        w1 = w1 / area;
        w2 = w2 / area;

        // Perspective correct
        oneOverZ = v0z * w0 + v1z * w1 + v2z * w2;
        z = 1 / oneOverZ;

        // No perspective correct
        // z = v0.z * w0 + v1.z * w1 + v2.z * w2;

        var index = y * Renderer.surface.width + x;

        if (z < Renderer.depthBuffer[index]) {
          Renderer.depthBuffer[index] = z;

          cr = 255;
          cg = 255;
          cb = 255;

          if (v0.color !== undefined) {
            cr = v0.color.r;
            cg = v0.color.g;
            cb = v0.color.b;
            if (tint) {
              cr = cr * tint.r >> 0;
              cg = cg * tint.g >> 0;
              cb = cb * tint.b >> 0;
            }
          }

          if (v0.uv) {
            // u = v0.uv[0] * w0 + v1.uv[0] * w1 + v2.uv[0] * w2;
            // v = v0.uv[1] * w0 + v1.uv[1] * w1 + v2.uv[1] * w2;
          }

          if (texture) {
            // var c32 = texture.uvLookup(u, v);
            // cr = c32 & 0xff;
            // cg = (c32 >> 8) & 0xff;
            // cb = (c32 >> 16) & 0xff;
          }

          // if (ao) {
            // var c32 = ao.uvLookup(u, v);
            // cr = cr * ((c32 & 0xff) / 255);
            // cg = cg * (((c32 >> 8) & 0xff) / 255);
            // cb = cb * (((c32 >> 16) & 0xff) / 255);
          // }

          if (illumination !== undefined) {
            cr = (cr * illumination.r) >> 0;
            cg = (cg * illumination.g) >> 0;
            cb = (cb * illumination.b) >> 0;
          }

          Renderer.setPixel(x, y, cr, cg, cb, 255);
        } else {
        }

        out = false;
      } else {
        if (out == false) {
          break;
        }
      }
    }
  }

  Renderer.tricount++;
}

module.exports = Renderer;

},{"./camera":2,"./color":3,"./vector":18}],14:[function(require,module,exports){
window.URL = window.URL || window.webkitURL;

var Resource = {};

Resource.PATH = './data/';

Resource.init = function(callback) {
  Resource.entries = {};
  Resource.loadCount = 0;
  Resource.callback = callback;
  Resource.done = true;
}

Resource.finished = function() {
  if (Resource.loadCount == 0)
    return true;
  else
    return false;
}

Resource.load = function(filename, callback) {
  // console.log('load', filename);
  Resource.done = false;

  var type = filename.substr(filename.lastIndexOf('.') + 1);
  Resource.entries[filename] = {
    filename: filename,
    type: type,
    loaded: false,
    content: null,
    callback: callback
  };

  Resource.loadCount++;

  var request = new XMLHttpRequest();
  if (request.overrideMimeType) request.overrideMimeType('text/plain; charset=x-user-defined');
  request.onreadystatechange = Resource.onReadyStateChange;
  request.open('GET', Resource.PATH + filename, true);
  if (type == 'png') {
    request.responseType = 'blob';
  }

  request.send();
}

Resource.textToBinary = function(text) {
  var bin = new Uint8Array();
  for (var i = 0; i < text.length; i++) {
    bin.push(text[i] & 0xff);
  }
  return bin;
}

Resource.loaded = function(filename) {
  Resource.entries[filename].loaded = true;
  Resource.loadCount--;
  if (Resource.loadCount == 0) Resource.done = true;
  if (Resource.callback) {
    Resource.callback(filename);
  }
}

Resource.onReadyStateChange = function(event) {
  if (this.readyState === XMLHttpRequest.DONE) {
    if (this.status === 200) {
      var filename = this.responseURL.substr(this.responseURL.lastIndexOf('/') + 1);

      if (Resource.entries[filename].type == 'obj') {
        Resource.entries[filename].content = this.responseText;
        Resource.loaded(filename);
      } else if (Resource.entries[filename].type == 'png') {
        var blob = new Blob([this.response], {type: 'image/png'});
        var img = document.createElement('img');
        img.onload = function(e) {
          window.URL.revokeObjectURL(img.src); // Clean up after yourself.
          Resource.entries[filename].content = img;
          Resource.loaded(filename);
        };
        img.src = window.URL.createObjectURL(blob);
      }
    } else {
      console.log('Resource missing:', this.responseURL);
    }
  }
}

Resource.get = function(filename) {
  return Resource.entries[filename];
}

module.exports = Resource;

},{}],15:[function(require,module,exports){

function Surface(width, height, buffer) {
  this.width = width;
  this.height = height;

  this.buffer = buffer;
  this.buf = this.buffer.data.buffer;
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

module.exports = Surface;

},{}],16:[function(require,module,exports){
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

},{"./lib":7,"./vector":18}],17:[function(require,module,exports){

function Transition(params) {
  this.duration = params.duration;
  this.object = params.object;
  this.property = params.property;
  this.startValue = params.startValue;
  this.endValue = params.endValue;
  this.bounce = params.bounce !== undefined ? params.bounce : false;
  this.repeat = params.repeat !== undefined ? params.repeat : false;
  this.callback = params.callback !== undefined ? params.callback : null;
  this.active = false;
  this.completed = false;
}

Transition.prototype.isCompleted = function() {
  return this.completed;
}

// Transition.prototype.reset = function() {
//
// }

Transition.prototype.start = function() {
  this.object[this.property] = this.startValue;
  this.startTime = Time.now;
  this.active = true;
}

Transition.prototype.update = function() {
  if (this.active) {
    var d = (Time.now - this.startTime) / this.duration;
    if (d < 1)
      this.object[this.property] = this.startValue + (this.endValue - this.startValue) * d;
    else {
      this.object[this.property] = this.endValue;
      if (this.bounce) {
        this.startValue = this.endValue + (this.endValue = this.startValue, 0);
        if (!this.repeat) this.bounce = false;
        this.start();
      } else {
        if (this.repeat) {
          this.start();
        } else {
          this.active = false;
          if (this.callback) {
            this.callback();
          }
          this.completed = true;
        }
      }
    }
  }
}

Transition.prototype.stop = function() {
  this.active = false;
}

module.exports = Transition;

},{}],18:[function(require,module,exports){

function Vector(x, y, z) {
  this.x = (x === undefined ? 0 : x);
  this.y = (y === undefined ? 0 : y);
  this.z = (z === undefined ? 0 : z);
}

Vector.prototype.toString = function() {
  return "{" + this.x + "," + this.y + "," + this.z + "}";
}

Vector.copy = function(vector) {
    return new Vector(vector.x, vector.y, vector.z);
}

Vector.prototype.add = function(vector) {
  this.x = this.x + vector.x;
  this.y = this.y + vector.y;
  this.z = this.z + vector.z;
  return this;
  // return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
}

Vector.prototype.divide = function(vector) {
  this.x = this.x / vector.x;
  this.y = this.y / vector.y;
  this.z = this.z / vector.z;
  return this;
  // return new Vector(this.x / vector.x, this.y / vector.y, this.z / vector.z);
}

Vector.prototype.equals = function(vector) {
  return this.x === vector.x && this.y === vector.y && this.z === vector.z;
}

Vector.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
}

Vector.prototype.limit = function(max) {
  if (this.length() > max) {
    this.normalize();
    this.scale(max);
  }
}

Vector.prototype.multiply = function(vector) {
  this.x = this.x * vector.x;
  this.y = this.y * vector.y;
  this.z = this.z * vector.z;
  return this;
  // return new Vector(this.x * vector.x, this.y * vector.y, this.z * vector.z);
}

Vector.prototype.normalize = function() {
  var dot = this.x * this.x + this.y * this.y + this.z * this.z;
  if (dot > 0 && dot != 1) {
    var inverseLength = 1 / Math.sqrt(dot);
    this.x = this.x * inverseLength;
    this.y = this.y * inverseLength;
    this.z = this.z * inverseLength;
  }
  return this;
  // var len = this.length();
  // if (len != 0) {
  //   this.x = this.x / len;
  //   this.y = this.y / len;
  //   this.z = this.z / len;
  // }
}

Vector.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  this.z = Math.round(this.z);
  return this;
}

Vector.prototype.floor = function() {
  this.x = this.x >> 0;
  this.y = this.y >> 0;
  this.z = this.z >> 0;
  return this;
}

Vector.prototype.scale = function(scalar) {
  this.x = this.x * scalar;
  this.y = this.y * scalar;
  this.z = this.z * scalar;
  return this;
  // return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
}

Vector.prototype.subtract = function(vector) {
  this.x = this.x - vector.x;
  this.y = this.y - vector.y;
  this.z = this.z - vector.z;
  return this;
  // return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
}

Vector.add = function(a, b) {
  return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
}

Vector.cross = function(a, b) {
  return new Vector(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

Vector.divide = function(a, b) {
  return new Vector(a.x / b.x, a.y / b.y, a.z / b.z);
}

Vector.dot = function(a, b) {
  return (a.x * b.x + a.y * b.y + a.z * b.z);
}

Vector.multiply = function(a, b) {
  return new Vector(a.x * b.x, a.y * b.y, a.z * b.z);
}

Vector.normalize = function(vector) {
  var out = new Vector();
  var dot = vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
  if (dot > 0) {
    var inverseLength = 1 / Math.sqrt(dot);
    out.x = vector.x * inverseLength;
    out.y = vector.y * inverseLength;
    out.z = vector.z * inverseLength;
  }
  return out;
}

Vector.scale = function(vector, scalar) {
  return new Vector(vector.x * scalar, vector.y * scalar, vector.z * scalar);
}

Vector.subtract = function(a, b) {
  return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
}

module.exports = Vector;

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvQ29sb3IuanMiLCJhcHAvanMvY2FtZXJhLmpzIiwiYXBwL2pzL2NvbG9yZi5qcyIsImFwcC9qcy9lbmdpbmUuanMiLCJhcHAvanMvZW50aXR5LmpzIiwiYXBwL2pzL2xpYi5qcyIsImFwcC9qcy9saWdodC5qcyIsImFwcC9qcy9saW5lLmpzIiwiYXBwL2pzL21hdHJpeC5qcyIsImFwcC9qcy9tZXNoLmpzIiwiYXBwL2pzL3JlY3RhbmdsZS5qcyIsImFwcC9qcy9yZW5kZXJlci5qcyIsImFwcC9qcy9yZXNvdXJjZS5qcyIsImFwcC9qcy9zdXJmYWNlLmpzIiwiYXBwL2pzL3RyYW5zZm9ybS5qcyIsImFwcC9qcy90cmFuc2l0aW9uLmpzIiwiYXBwL2pzL3ZlY3Rvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzN5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBsaWIgPSByZXF1aXJlKCcuL2xpYicpO1xyXG5cclxuLy8gY29uc29sZS5sb2cobGliLmNsYW1wKDUsIDAsIDI1NSkgKTtcclxuLy8gY29uc29sZS5sb2cobGliLmNsYW1wKTtcclxuXHJcbmZ1bmN0aW9uIENvbG9yKHIsIGcsIGIsIGEpIHtcclxuICB0aGlzLnIgPSAociAhPT0gdW5kZWZpbmVkID8gciA6IDI1NSk7XHJcbiAgdGhpcy5nID0gKGcgIT09IHVuZGVmaW5lZCA/IGcgOiAyNTUpO1xyXG4gIHRoaXMuYiA9IChiICE9PSB1bmRlZmluZWQgPyBiIDogMjU1KTtcclxuICB0aGlzLmEgPSAoYSAhPT0gdW5kZWZpbmVkID8gYSA6IDI1NSk7XHJcblxyXG4gIC8vIGNvbnNvbGUubG9nKHRoaXMucik7XHJcbiAgdGhpcy5yID0gbGliLmNsYW1wKHRoaXMuciwgMCwgMjU1KTtcclxuICB0aGlzLmcgPSBsaWIuY2xhbXAodGhpcy5nLCAwLCAyNTUpO1xyXG4gIHRoaXMuYiA9IGxpYi5jbGFtcCh0aGlzLmIsIDAsIDI1NSk7XHJcbiAgdGhpcy5hID0gbGliLmNsYW1wKHRoaXMuYSwgMCwgMjU1KTtcclxuICAvLyBjb25zb2xlLmxvZyh0aGlzLnIpO1xyXG59XHJcblxyXG5Db2xvci5SRUQgPSBuZXcgQ29sb3IoMjU1LCAwLCAwLCAyNTUpO1xyXG5Db2xvci5HUkVFTiA9IG5ldyBDb2xvcigwLCAyNTUsIDAsIDI1NSk7XHJcbkNvbG9yLkJMVUUgPSBuZXcgQ29sb3IoMCwgMCwgMjU1LCAyNTUpO1xyXG5Db2xvci5DWUFOID0gbmV3IENvbG9yKDAsIDI1NSwgMjU1LCAyNTUpO1xyXG5Db2xvci5ZRUxMT1cgPSBuZXcgQ29sb3IoMjU1LCAyNTUsIDAsIDI1NSk7XHJcbkNvbG9yLk9SQU5HRSA9IG5ldyBDb2xvcigyNTUsIDEyOCwgMCwgMjU1KTtcclxuQ29sb3IuTUFHRU5UQSA9IG5ldyBDb2xvcigyNTUsIDAsIDI1NSwgMjU1KTtcclxuQ29sb3IuT1JBTkdFID0gbmV3IENvbG9yKDI1NSwgMTI4LCAwLCAyNTUpO1xyXG5Db2xvci5XSElURSA9IG5ldyBDb2xvcigyNTUsIDI1NSwgMjU1LCAyNTUpO1xyXG5Db2xvci5CTEFDSyA9IG5ldyBDb2xvcigwLCAwLCAwLCAyNTUpO1xyXG5Db2xvci5HUkVZID0gbmV3IENvbG9yKDEyOCwgMTI4LCAxMjgsIDI1NSk7XHJcblxyXG5cclxuQ29sb3IucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKGNvbG9yKSB7XHJcbiAgcmV0dXJuICh0aGlzLnIgPT0gY29sb3IuciAmJiB0aGlzLmcgPT0gY29sb3IuZyAmJiB0aGlzLmIgPT0gY29sb3IuYik7XHJcbn1cclxuXHJcblxyXG5Db2xvci5jb3B5ID0gZnVuY3Rpb24oY29sb3IpIHtcclxuICByZXR1cm4gbmV3IENvbG9yKGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIGNvbG9yLmEpO1xyXG59XHJcblxyXG5cclxuQ29sb3IuZXF1YWxzID0gZnVuY3Rpb24oY29sb3IxLCBjb2xvcjIpIHtcclxuICByZXR1cm4gY29sb3IxLmVxdWFscyhjb2xvcjIpO1xyXG59XHJcblxyXG5cclxuQ29sb3IuZnJvbUNvbG9yZiA9IGZ1bmN0aW9uKGNvbG9yZikge1xyXG4gIHJldHVybiBuZXcgQ29sb3IoKGNvbG9yZi5yICogMjU1KSA+PiAwLCAoY29sb3JmLmcgKiAyNTUpID4+IDAsIChjb2xvcmYuYiAqIDI1NSkgPj4gMCwgKGNvbG9yZi5hICogMjU1KSA+PiAwKTtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7XHJcbiIsInZhciBsaWIgPSByZXF1aXJlKCcuL2xpYicpO1xyXG52YXIgRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdHknKTtcclxudmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4vbWF0cml4Jyk7XHJcbnZhciBSZWN0YW5nbGUgPSByZXF1aXJlKCcuL3JlY3RhbmdsZScpO1xyXG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcclxuXHJcbmZ1bmN0aW9uIENhbWVyYSh0eXBlLCBmb3YsIG5lYXIsIGZhcikge1xyXG4gIEVudGl0eS5jYWxsKHRoaXMsIDAsIDAsIDApO1xyXG5cclxuICB0aGlzLmZvdiA9IChmb3YgIT09IHVuZGVmaW5lZCA/IGZvdiA6IDkwKTtcclxuICB0aGlzLm5lYXIgPSAobmVhciAhPT0gdW5kZWZpbmVkID8gbmVhciA6IDEpO1xyXG4gIHRoaXMuZmFyID0gKGZhciAhPT0gdW5kZWZpbmVkID8gZmFyIDogMTAwKTtcclxuICB0aGlzLnR5cGUgPSAodHlwZSAhPT0gdW5kZWZpbmVkID8gdHlwZSA6IENhbWVyYS5QRVJTUEVDVElWRSk7XHJcbiAgdGhpcy5vcnRob1NjYWxlID0gMS4wO1xyXG4gIHRoaXMub3JpZW50YXRpb24gPSBuZXcgTWF0cml4KCk7XHJcblxyXG4gIHRoaXMudmlldyA9IG5ldyBSZWN0YW5nbGUoMCwgMCwgMS4wLCAxLjApO1xyXG59XHJcblxyXG5DYW1lcmEucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFbnRpdHkucHJvdG90eXBlKTtcclxuQ2FtZXJhLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENhbWVyYTtcclxuXHJcbkNhbWVyYS5PUlRIT0dSQVBISUMgPSAnb3J0aG9ncmFwaGljJztcclxuQ2FtZXJhLlBFUlNQRUNUSVZFID0gJ3BlcnNwZWN0aXZlJztcclxuXHJcbkNhbWVyYS5wcm90b3R5cGUuc2V0UmVjdCA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICB0aGlzLnJlY3QgPSBuZXcgUmVjdGFuZ2xlKFxyXG4gICAgdGhpcy52aWV3LnggKiB3aWR0aCxcclxuICAgIHRoaXMudmlldy55ICogaGVpZ2h0LFxyXG4gICAgdGhpcy52aWV3LndpZHRoICogd2lkdGgsXHJcbiAgICB0aGlzLnZpZXcuaGVpZ2h0ICogaGVpZ2h0XHJcbiAgKTtcclxufVxyXG5cclxuQ2FtZXJhLnByb3RvdHlwZS50b0xvY2FsID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHRyYW5zZm9ybUludmVyc2UgPSB0aGlzLmdldFRyYW5zZm9ybU1hdHJpeCgpLmludmVyc2UoKTtcclxuICByZXR1cm4gTWF0cml4Lm11bHRpcGx5KHRyYW5zZm9ybUludmVyc2UsIHRoaXMub3JpZW50YXRpb24pO1xyXG59XHJcblxyXG5cclxuQ2FtZXJhLnByb3RvdHlwZS50b1dvcmxkID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHRyYW5zZm9ybSA9IHRoaXMuZ2V0VHJhbnNmb3JtTWF0cml4KCk7XHJcbiAgcmV0dXJuIE1hdHJpeC5tdWx0aXBseSh0cmFuc2Zvcm0sIHRoaXMub3JpZW50YXRpb24pO1xyXG59XHJcblxyXG5DYW1lcmEucHJvdG90eXBlLmxvb2tBdCA9IGZ1bmN0aW9uKHRhcmdldCwgdXApIHtcclxuICB2YXIgbSA9IG5ldyBNYXRyaXgoKTtcclxuXHJcbiAgdmFyIGV5ZSA9IHRoaXMudHJhbnNmb3JtLnBvc2l0aW9uO1xyXG5cclxuICB6YXhpcyA9IFZlY3Rvci5zdWJ0cmFjdChleWUsIHRhcmdldCkubm9ybWFsaXplKCk7XHJcbiAgeGF4aXMgPSBWZWN0b3IuY3Jvc3ModXAsIHpheGlzKS5ub3JtYWxpemUoKTtcclxuICB5YXhpcyA9IFZlY3Rvci5jcm9zcyh6YXhpcywgeGF4aXMpLm5vcm1hbGl6ZSgpO1xyXG5cclxuICBtLmFbMF0gPSB4YXhpcy54LCBtLmFbMV0gPSB5YXhpcy54LCBtLmFbMl0gPSB6YXhpcy54O1xyXG4gIG0uYVs0XSA9IHhheGlzLnksIG0uYVs1XSA9IHlheGlzLnksIG0uYVs2XSA9IHpheGlzLnk7XHJcbiAgbS5hWzhdID0geGF4aXMueiwgbS5hWzldID0geWF4aXMueiwgbS5hWzEwXSA9IHpheGlzLno7XHJcblxyXG4gIHRoaXMub3JpZW50YXRpb24gPSBtO1xyXG4gIC8vIG0uYVsxMl0gPSAtVmVjdG9yLmRvdCh4YXhpcywgZXllKTtcclxuICAvLyBtLmFbMTNdID0gLVZlY3Rvci5kb3QoeWF4aXMsIGV5ZSk7XHJcbiAgLy8gbS5hWzE0XSA9IC1WZWN0b3IuZG90KHpheGlzLCBleWUpO1xyXG5cclxuICAvLyB0aGlzLnhheGlzID0geGF4aXM7XHJcbiAgLy8gdGhpcy55YXhpcyA9IHlheGlzO1xyXG4gIC8vIHRoaXMuemF4aXMgPSB6YXhpcztcclxuXHJcbiAgcmV0dXJuIG07XHJcbn1cclxuXHJcbkNhbWVyYS5wZXJzcGVjdGl2ZUZPViA9IGZ1bmN0aW9uKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcclxuICB2YXIgdyA9IDEgLyBNYXRoLnRhbihmb3YgKiAwLjUgKiBsaWIuUkFEKTtcclxuICB2YXIgaCA9IHcgKiBhc3BlY3Q7XHJcbiAgdmFyIHEgPSBmYXIgLyAobmVhciAtIGZhcik7XHJcblxyXG4gIHZhciBtID0gbmV3IE1hdHJpeCgpO1xyXG4gIG0uYVswXSA9IHc7XHJcbiAgbS5hWzVdID0gaDtcclxuICBtLmFbMTBdID0gcTtcclxuICBtLmFbMTFdID0gLTE7XHJcbiAgbS5hWzE0XSA9IG5lYXIgKiBxO1xyXG4gIC8vIG0uYVsxNV0gPSAwO1xyXG4gIHJldHVybiBtO1xyXG59XHJcblxyXG5DYW1lcmEucGVyc3BlY3RpdmUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBuZWFyLCBmYXIpIHtcclxuICB2YXIgbSA9IG5ldyBNYXRyaXgoKTtcclxuICBtLmFbMF0gPSAyICogbmVhciAvIHdpZHRoO1xyXG4gIG0uYVs1XSA9IDIgKiBuZWFyIC8gaGVpZ2h0O1xyXG4gIG0uYVsxMF0gPSBmYXIgLyAobmVhciAtIGZhcik7XHJcbiAgbS5hWzExXSA9IC0xO1xyXG4gIG0uYVsxNF0gPSBuZWFyICogZmFyIC8gKG5lYXIgLSBmYXIpO1xyXG4gIG0uYVsxNV0gPSAwO1xyXG4gIHJldHVybiBtO1xyXG59XHJcblxyXG5DYW1lcmEub3J0aG9ncmFwaGljID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgbmVhciwgZmFyKSB7XHJcbiAgdmFyIG0gPSBuZXcgTWF0cml4KCk7XHJcbiAgbS5hWzBdID0gKDIgLyB3aWR0aCk7XHJcbiAgbS5hWzVdID0gKDIgLyBoZWlnaHQpO1xyXG4gIG0uYVsxMF0gPSAtMiAvIChmYXIgLSBuZWFyKTtcclxuICBtLmFbMTRdID0gLShmYXIgKyBuZWFyKSAvIChmYXIgLSBuZWFyKTtcclxuICBtLmFbMTVdID0gMTtcclxuICByZXR1cm4gbTtcclxufVxyXG5cclxuQ2FtZXJhLnByb3RvdHlwZS5zY3JlZW5Ub1dvcmxkID0gZnVuY3Rpb24ocFNjcmVlbiwgdmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCkge1xyXG4gIC8vIHZhciBwID0gbmV3IFZlY3RvcihcclxuICAvLyAgIDIgKiAoKHBTY3JlZW4ueCkgLyB0aGlzLnJlY3Qud2lkdGgpIC0gMSxcclxuICAvLyAgIDEgLSAyICogKChwU2NyZWVuLnkpIC8gdGhpcy5yZWN0LmhlaWdodCksXHJcbiAgLy8gICB0aGlzLm5lYXJcclxuICAvLyApO1xyXG5cclxuICB2YXIgcE5EQyA9IHRoaXMuc2NyZWVuVG9OREMocFNjcmVlbik7XHJcbiAgdmFyIHZpZXdQcm9qZWN0aW9uSW52ZXJzZSA9IE1hdHJpeC5tdWx0aXBseSh2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KS5pbnZlcnNlKCk7XHJcbiAgdmFyIHBXb3JsZCA9IHZpZXdQcm9qZWN0aW9uSW52ZXJzZS5tdWx0aXBseVBvaW50KHBOREMpO1xyXG5cclxuICByZXR1cm4gcFdvcmxkO1xyXG59XHJcblxyXG5DYW1lcmEucHJvdG90eXBlLndvcmxkVG9TY3JlZW4gPSBmdW5jdGlvbihwV29ybGQsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpIHtcclxuICAvLyB2YXIgcENhbWVyYSA9IHZpZXdNYXRyaXgubXVsdGlwbHlQb2ludChwV29ybGQpO1xyXG4gIC8vIHZhciBwTkRDID0gcHJvamVjdGlvbk1hdHJpeC5tdWx0aXBseVBvaW50KHBDYW1lcmEpO1xyXG4gIC8vIHBOREMueiA9IC1wQ2FtZXJhLno7XHJcbiAgdmFyIHBOREMgPSB0aGlzLndvcmxkVG9OREMocFdvcmxkLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KTtcclxuICB2YXIgcFNjcmVlbiA9IHRoaXMuTkRDVG9TY3JlZW4ocE5EQyk7XHJcbiAgLy8gcFNjcmVlbi54ID0gKChwU2NyZWVuLnggKyAxKSAqIDAuNSkgKiAoUmVuZGVyZXIuc3VyZmFjZS53aWR0aCk7XHJcbiAgLy8gcFNjcmVlbi55ID0gKCgxIC0gcFNjcmVlbi55KSAqIDAuNSkgKiAoUmVuZGVyZXIuc3VyZmFjZS5oZWlnaHQpO1xyXG5cclxuICByZXR1cm4gcFNjcmVlbjtcclxufVxyXG5cclxuQ2FtZXJhLnByb3RvdHlwZS53b3JsZFRvTkRDID0gZnVuY3Rpb24ocFdvcmxkLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KSB7XHJcbiAgdmFyIHBDYW1lcmEgPSB2aWV3TWF0cml4Lm11bHRpcGx5UG9pbnQocFdvcmxkKTtcclxuICB2YXIgcE5EQyA9IHByb2plY3Rpb25NYXRyaXgubXVsdGlwbHlQb2ludChwQ2FtZXJhKTtcclxuICBwTkRDLnogPSAtcENhbWVyYS56O1xyXG5cclxuICByZXR1cm4gcE5EQztcclxufVxyXG5cclxuQ2FtZXJhLnByb3RvdHlwZS5zY3JlZW5Ub05EQyA9IGZ1bmN0aW9uKHBTY3JlZW4pIHtcclxuICB2YXIgcE5EQyA9IG5ldyBWZWN0b3IoXHJcbiAgICAyICogKChwU2NyZWVuLnggLSB0aGlzLnJlY3QueCkgLyAodGhpcy5yZWN0LndpZHRoKSkgLSAxLFxyXG4gICAgMSAtIDIgKiAoKHBTY3JlZW4ueSAtIHRoaXMucmVjdC55KSAvICh0aGlzLnJlY3QuaGVpZ2h0KSksXHJcbiAgICB0aGlzLm5lYXJcclxuICApO1xyXG4gIHJldHVybiBwTkRDO1xyXG59XHJcblxyXG5DYW1lcmEucHJvdG90eXBlLk5EQ1RvU2NyZWVuID0gZnVuY3Rpb24ocE5EQykge1xyXG4gIHZhciBwU2NyZWVuID0gbmV3IFZlY3RvcigpO1xyXG4gIHBTY3JlZW4ueCA9ICgocE5EQy54ICsgMSkgKiAwLjUpICogKHRoaXMucmVjdC53aWR0aCkgKyB0aGlzLnJlY3QueDtcclxuICBwU2NyZWVuLnkgPSAoKDEgLSBwTkRDLnkpICogMC41KSAqICh0aGlzLnJlY3QuaGVpZ2h0KSArIHRoaXMucmVjdC55O1xyXG4gIHBTY3JlZW4ueiA9IHBOREMuejtcclxuICByZXR1cm4gcFNjcmVlbjtcclxufVxyXG5cclxuLy8gQ2FtZXJhLmxvb2tBdCA9IGZ1bmN0aW9uKGV5ZSwgdGFyZ2V0LCB1cCkge1xyXG4vLyAgIHZhciBtID0gbmV3IE1hdHJpeCgpO1xyXG4vL1xyXG4vLyAgIHpheGlzID0gVmVjdG9yLnN1YnRyYWN0KGV5ZSwgdGFyZ2V0KS5ub3JtYWxpemUoKTtcclxuLy8gICB4YXhpcyA9IFZlY3Rvci5jcm9zcyh1cCwgemF4aXMpLm5vcm1hbGl6ZSgpO1xyXG4vLyAgIHlheGlzID0gVmVjdG9yLmNyb3NzKHpheGlzLCB4YXhpcykubm9ybWFsaXplKCk7XHJcbi8vXHJcbi8vICAgbS5hWzBdID0geGF4aXMueCwgbS5hWzFdID0geWF4aXMueCwgbS5hWzJdID0gemF4aXMueDtcclxuLy8gICBtLmFbNF0gPSB4YXhpcy55LCBtLmFbNV0gPSB5YXhpcy55LCBtLmFbNl0gPSB6YXhpcy55O1xyXG4vLyAgIG0uYVs4XSA9IHhheGlzLnosIG0uYVs5XSA9IHlheGlzLnosIG0uYVsxMF0gPSB6YXhpcy56O1xyXG4vLyAgIC8vIG0uYVsxMl0gPSAtVmVjdG9yLmRvdCh4YXhpcywgZXllKTtcclxuLy8gICAvLyBtLmFbMTNdID0gLVZlY3Rvci5kb3QoeWF4aXMsIGV5ZSk7XHJcbi8vICAgLy8gbS5hWzE0XSA9IC1WZWN0b3IuZG90KHpheGlzLCBleWUpO1xyXG4vL1xyXG4vLyAgIC8vIGNvbnNvbGUubG9nKCdoaScsIG0udG9TdHJpbmcoKSk7XHJcbi8vXHJcbi8vICAgcmV0dXJuIG07XHJcbi8vIH1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcclxuIiwidmFyIGxpYiA9IHJlcXVpcmUoJy4vbGliJyk7XHJcbnZhciBDb2xvciA9IHJlcXVpcmUoJy4vQ29sb3InKTtcclxuXHJcbmZ1bmN0aW9uIENvbG9yZihyLCBnLCBiLCBhKSB7XHJcbiAgdGhpcy5yID0gKHIgIT09IHVuZGVmaW5lZCA/IHIgOiAxKTtcclxuICB0aGlzLmcgPSAoZyAhPT0gdW5kZWZpbmVkID8gZyA6IDEpO1xyXG4gIHRoaXMuYiA9IChiICE9PSB1bmRlZmluZWQgPyBiIDogMSk7XHJcbiAgdGhpcy5hID0gKGEgIT09IHVuZGVmaW5lZCA/IGEgOiAxKTtcclxuXHJcbiAgdGhpcy5yID0gbGliLmNsYW1wKHRoaXMuciwgMCwgMSk7XHJcbiAgdGhpcy5nID0gbGliLmNsYW1wKHRoaXMuZywgMCwgMSk7XHJcbiAgdGhpcy5iID0gbGliLmNsYW1wKHRoaXMuYiwgMCwgMSk7XHJcbiAgdGhpcy5hID0gbGliLmNsYW1wKHRoaXMuYSwgMCwgMSk7XHJcbn1cclxuXHJcbkNvbG9yZi5mcm9tQ29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xyXG4gIHJldHVybiBuZXcgQ29sb3JmKGNvbG9yLnIgLyAyNTUsIGNvbG9yLmcgLyAyNTUsIGNvbG9yLmIgLyAyNTUsIGNvbG9yLmEgLyAyNTUpO1xyXG59XHJcblxyXG5Db2xvcmYuV0hJVEUgPSBDb2xvcmYuZnJvbUNvbG9yKENvbG9yLldISVRFKTtcclxuQ29sb3JmLk1BR0VOVEEgPSBDb2xvcmYuZnJvbUNvbG9yKENvbG9yLk1BR0VOVEEpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcmY7XHJcbiIsInZhciBsaWIgPSByZXF1aXJlKCcuL2xpYicpO1xyXG5cclxudmFyIENvbG9yID0gcmVxdWlyZSgnLi9jb2xvcicpO1xyXG52YXIgQ29sb3JmID0gcmVxdWlyZSgnLi9jb2xvcmYnKTtcclxudmFyIFZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJyk7XHJcbnZhciBMaW5lID0gcmVxdWlyZSgnLi9saW5lJyk7XHJcbnZhciBSZXNvdXJjZSA9IHJlcXVpcmUoJy4vcmVzb3VyY2UnKTtcclxudmFyIE1lc2ggPSByZXF1aXJlKCcuL21lc2gnKTtcclxudmFyIFN1cmZhY2UgPSByZXF1aXJlKCcuL3N1cmZhY2UnKTtcclxudmFyIENhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyk7XHJcbnZhciBSZW5kZXJlciA9IHJlcXVpcmUoJy4vcmVuZGVyZXInKTtcclxudmFyIExpZ2h0ID0gcmVxdWlyZSgnLi9saWdodCcpO1xyXG52YXIgRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdHknKTtcclxudmFyIFRyYW5zaXRpb24gPSByZXF1aXJlKCcuL3RyYW5zaXRpb24nKTtcclxuXHJcbnZhciBFbmdpbmUgPSB7fTtcclxudmFyIFRpbWUgPSB7fTtcclxuXHJcbnZhciB2ZXJzaW9uID0gMC4xO1xyXG5cclxudmFyIE1FU0hFUyA9IFtcclxuICAnbGV2ZWwwMS5vYmonLFxyXG4gICdsZXZlbDAyLm9iaicsXHJcbiAgJ2xldmVsMDMub2JqJyxcclxuICAnbGV2ZWwwNC5vYmonLFxyXG4gICdjdWJlLm9iaicsXHJcbiAgJ2NvbmUub2JqJyxcclxuICAnaWNvLm9iaicsXHJcbiAgJ21hcmtlci5vYmonLFxyXG4gICdwYWQub2JqJyxcclxuICAnYnJpZGdlLm9iaicsXHJcbiAgJ3RlbGVwb3J0Lm9iaidcclxuXTtcclxuXHJcbnZhciBHcmlkVHlwZSA9IHtcclxuICBCUklER0U6IENvbG9yLllFTExPVyxcclxuICBHUk9VTkQ6IENvbG9yLkdSRVksXHJcbiAgTkVVVFJBTDogQ29sb3IuV0hJVEUsXHJcbiAgVEVMRVBPUlQ6IENvbG9yLkNZQU4sXHJcbiAgU1dJVENIOiBDb2xvci5CTEFDS1xyXG59O1xyXG5cclxudmFyIHRyYW5zaXRpb25JZCA9IDA7XHJcblxyXG52YXIgVEVYVFVSRVMgPSBbIF07XHJcblxyXG5FbmdpbmUucHJvY2Vzc0xldmVsTWVzaCA9IGZ1bmN0aW9uKGxldmVsLCB0aW50MSwgdGludDIpIHtcclxuICB2YXIgbWVzaCA9IGxldmVsLm1lc2g7XHJcbiAgdmFyIGdyaWQgPSBsZXZlbC5ncmlkID0gbmV3IEFycmF5KEVuZ2luZS5ncmlkU2l6ZSAqIEVuZ2luZS5ncmlkU2l6ZSk7XHJcbiAgdmFyIHR0ID0gMDtcclxuXHJcbiAgdGludDEgPSB0aW50MSA/IHRpbnQxIDogbmV3IENvbG9yZigxLCAxLCAxKTtcclxuICB0aW50MiA9IHRpbnQyID8gdGludDIgOiBuZXcgQ29sb3JmKDEsIDEsIDEpO1xyXG5cclxuICBtZXNoLmNvbG9ycy5wdXNoKG5ldyBDb2xvcigyMDAgKiB0aW50MS5yLCAyMDAgKiB0aW50MS5nLCAyMDAgKiB0aW50MS5iLCAyNTUpKTtcclxuICBtZXNoLmNvbG9ycy5wdXNoKG5ldyBDb2xvcigyMjAgKiB0aW50Mi5yLCAyMjAgKiB0aW50Mi5nLCAyMjAgKiB0aW50Mi5iLCAyNTUpKTtcclxuICBtZXNoLmNvbG9ycy5wdXNoKG5ldyBDb2xvcig2NCwgMTI4LCAyNTUsIDI1NSkpO1xyXG5cclxuICB2YXIgY29sb3JfMSA9IG1lc2guY29sb3JzLmxlbmd0aCAtIDM7XHJcbiAgdmFyIGNvbG9yXzIgPSBtZXNoLmNvbG9ycy5sZW5ndGggLSAyO1xyXG4gIHZhciBjb2xvcl8zID0gbWVzaC5jb2xvcnMubGVuZ3RoIC0gMTtcclxuXHJcbiAgdmFyIGxpZ2h0PTAsIGRhcms9MDtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNoLnRyaWFuZ2xlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIHRyaWFuZ2xlID0gbWVzaC50cmlhbmdsZXNbaV07XHJcbiAgICB2YXIgY29sb3IgPSBtZXNoLmNvbG9yc1t0cmlhbmdsZS5jb2xvcnNbMF1dO1xyXG5cclxuICAgIHZhciB2MCA9IG1lc2gudmVydGljZXNbdHJpYW5nbGUudmVydGljZXNbMF1dO1xyXG4gICAgdmFyIHYxID0gbWVzaC52ZXJ0aWNlc1t0cmlhbmdsZS52ZXJ0aWNlc1sxXV07XHJcbiAgICB2YXIgdjIgPSBtZXNoLnZlcnRpY2VzW3RyaWFuZ2xlLnZlcnRpY2VzWzJdXTtcclxuXHJcbiAgICB2YXIgZDAgPSBsaWIuZGlzdGFuY2UodjAueCwgdjAueiwgdjEueCwgdjEueik7XHJcbiAgICB2YXIgZDEgPSBsaWIuZGlzdGFuY2UodjAueCwgdjAueiwgdjIueCwgdjIueik7XHJcbiAgICB2YXIgZDIgPSBsaWIuZGlzdGFuY2UodjEueCwgdjEueiwgdjIueCwgdjIueik7XHJcblxyXG4gICAgaWYgKGQwICE9IDAgJiYgZDEgIT0gMCAmJiBkMiAhPSAwKSB7XHJcbiAgICAgIHR0Kys7XHJcblxyXG4gICAgICB2YXIgbWF4ID0gTWF0aC5tYXgoZDAsIGQxLCBkMik7XHJcbiAgICAgIHZhciBtcCA9IG5ldyBWZWN0b3IoKTtcclxuXHJcbiAgICAgIGlmIChkMCA9PSBtYXgpIHtcclxuICAgICAgICBtcC54ID0gKHYwLnggKyB2MS54KSAvIDI7XHJcbiAgICAgICAgbXAueiA9ICh2MC56ICsgdjEueikgLyAyO1xyXG4gICAgICB9IGVsc2UgaWYgKGQxID09IG1heCkge1xyXG4gICAgICAgIG1wLnggPSAodjAueCArIHYyLngpIC8gMjtcclxuICAgICAgICBtcC56ID0gKHYwLnogKyB2Mi56KSAvIDI7XHJcbiAgICAgIH0gZWxzZSBpZiAoZDIgPT0gbWF4KSB7XHJcbiAgICAgICAgbXAueCA9ICh2MS54ICsgdjIueCkgLyAyO1xyXG4gICAgICAgIG1wLnogPSAodjEueiArIHYyLnopIC8gMjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGdyaWR4ID0gbXAueCAtIDAuNSArIDg7XHJcbiAgICAgIHZhciBncmlkeSA9IG1wLnogLSAwLjUgKyA4O1xyXG5cclxuICAgICAgdmFyIGlkID0gKGdyaWR5ICogRW5naW5lLmdyaWRTaXplICsgZ3JpZHgpICsgMTtcclxuICAgICAgdmFyIGluZGV4ID0gaWQgLSAxO1xyXG5cclxuICAgICAgaWYgKCFDb2xvci5lcXVhbHMoY29sb3IsIEdyaWRUeXBlLk5FVVRSQUwpKSB7XHJcbiAgICAgICAgaWYgKENvbG9yLmVxdWFscyhjb2xvciwgR3JpZFR5cGUuR1JPVU5EKSkge1xyXG4gICAgICAgICAgaWYgKChncmlkeSAlIDIgPT0gMCAmJiBncmlkeCAlIDIgPT0gMCkgfHwgKGdyaWR5ICUgMiAhPSAwICYmIGdyaWR4ICUgMiAhPSAwKSkge1xyXG4gICAgICAgICAgICB0cmlhbmdsZS5jb2xvcnNbMF0gPSBjb2xvcl8yO1xyXG4gICAgICAgICAgICB0cmlhbmdsZS5jb2xvcnNbMV0gPSBjb2xvcl8yO1xyXG4gICAgICAgICAgICB0cmlhbmdsZS5jb2xvcnNbMl0gPSBjb2xvcl8yO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdHJpYW5nbGUuY29sb3JzWzBdID0gY29sb3JfMTtcclxuICAgICAgICAgICAgdHJpYW5nbGUuY29sb3JzWzFdID0gY29sb3JfMTtcclxuICAgICAgICAgICAgdHJpYW5nbGUuY29sb3JzWzJdID0gY29sb3JfMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNvbG9yID0gbWVzaC5jb2xvcnNbdHJpYW5nbGUuY29sb3JzWzBdXTtcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChDb2xvci5lcXVhbHMoY29sb3IsIEdyaWRUeXBlLlRFTEVQT1JUKSkge1xyXG4gICAgICAgICAgY29sb3IuYSA9IDI1NTtcclxuICAgICAgICAgIGNvbG9yID0gbWVzaC5jb2xvcnNbdHJpYW5nbGUuY29sb3JzWzBdXTtcclxuXHJcbiAgICAgICAgICB0cmlhbmdsZS5jb2xvcnNbMF0gPSBjb2xvcl8zO1xyXG4gICAgICAgICAgdHJpYW5nbGUuY29sb3JzWzFdID0gY29sb3JfMztcclxuICAgICAgICAgIHRyaWFuZ2xlLmNvbG9yc1syXSA9IGNvbG9yXzM7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb2xvci5hID0gMjU1O1xyXG4gICAgICAgIH1cclxuICAgICAgICBncmlkW2luZGV4XSA9IHsgeDogbXAueCwgejogbXAueiwgaGVpZ2h0OiB2MC55LCBjb2xvcjogY29sb3IgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV2ZWwuZW50aXRpZXMgPSBbXTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBncmlkLmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YXIgc3F1YXJlID0gZ3JpZFtpXTtcclxuICAgIGlmIChzcXVhcmUpIHtcclxuICAgICAgaWYgKENvbG9yLmVxdWFscyhzcXVhcmUuY29sb3IsIEdyaWRUeXBlLlNXSVRDSCkpIHtcclxuICAgICAgICB2YXIgcGFkID0gbmV3IEVudGl0eSh7IHg6IHNxdWFyZS54LCB5OiBzcXVhcmUuaGVpZ2h0LCB6OiBzcXVhcmUueiB9KTtcclxuICAgICAgICBwYWQubWVzaCA9IEVuZ2luZS5tZXNoZXNbJ3BhZC5vYmonXTtcclxuICAgICAgICBsZXZlbC5lbnRpdGllcy5wdXNoKHBhZCk7XHJcbiAgICAgICAgc3F1YXJlLmVudGl0eSA9IHBhZDtcclxuICAgICAgfSBlbHNlIGlmIChDb2xvci5lcXVhbHMoc3F1YXJlLmNvbG9yLCBHcmlkVHlwZS5CUklER0UpKSB7XHJcbiAgICAgICAgdmFyIGJyaWRnZSA9IG5ldyBFbnRpdHkoeyB4OiBzcXVhcmUueCwgeTogc3F1YXJlLmhlaWdodCwgejogc3F1YXJlLnogfSk7XHJcbiAgICAgICAgYnJpZGdlLm1lc2ggPSBFbmdpbmUubWVzaGVzWydicmlkZ2Uub2JqJ107XHJcbiAgICAgICAgYnJpZGdlLnZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICBsZXZlbC5lbnRpdGllcy5wdXNoKGJyaWRnZSk7XHJcbiAgICAgICAgc3F1YXJlLmVudGl0eSA9IGJyaWRnZTtcclxuICAgICAgICBzcXVhcmUuaGVpZ2h0ID0gc3F1YXJlLmhlaWdodCAtIDE7XHJcbiAgICAgICAgc3F1YXJlLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKENvbG9yLmVxdWFscyhzcXVhcmUuY29sb3IsIEdyaWRUeXBlLlRFTEVQT1JUKSkge1xyXG4gICAgICAgIHZhciB0ZWxlcG9ydCA9IG5ldyBFbnRpdHkoeyB4OiBzcXVhcmUueCwgeTogc3F1YXJlLmhlaWdodCwgejogc3F1YXJlLnogfSk7XHJcbiAgICAgICAgdGVsZXBvcnQubWVzaCA9IEVuZ2luZS5tZXNoZXNbJ3RlbGVwb3J0Lm9iaiddO1xyXG4gICAgICAgIHRlbGVwb3J0LnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIHRlbGVwb3J0LmJyaWdodCA9IHRydWU7XHJcbiAgICAgICAgbGV2ZWwuZW50aXRpZXMucHVzaCh0ZWxlcG9ydCk7XHJcbiAgICAgICAgc3F1YXJlLmVudGl0eSA9IHRlbGVwb3J0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxufVxyXG5cclxuXHJcbkVuZ2luZS5nb0xldmVsID0gZnVuY3Rpb24oaW5kZXgsIGcpIHtcclxuICBFbmdpbmUubGV2ZWwgPSBFbmdpbmUubGV2ZWxzW2luZGV4XTtcclxuICBFbmdpbmUuZ3JpZCA9IEVuZ2luZS5sZXZlbC5ncmlkO1xyXG4gIEVuZ2luZS5sZXZlbEluZGV4ID0gaW5kZXg7XHJcbiAgRW5naW5lLmdyaWRJbmRleCA9IG51bGw7XHJcblxyXG4gIHZhciBjYW1lcmEgPSBSZW5kZXJlci5jYW1lcmE7XHJcbiAgY2FtZXJhLnRyYW5zZm9ybS5wb3NpdGlvbi54ID0gMzU7XHJcbiAgY2FtZXJhLnRyYW5zZm9ybS5wb3NpdGlvbi55ID0gMzU7XHJcbiAgY2FtZXJhLnRyYW5zZm9ybS5wb3NpdGlvbi56ID0gMzU7XHJcbiAgLy8gY2FtZXJhLnRyYW5zZm9ybS5yb3RhdGlvbi54ID0gLTkwICogUkFEO1xyXG5cclxuICBjYW1lcmEubG9va0F0KG5ldyBWZWN0b3IoKSwgbmV3IFZlY3RvcigwLCAxLCAwKSk7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUuY3JlYXRlV29ybGQgPSBmdW5jdGlvbigpIHtcclxuICBFbmdpbmUuaW1hZ2VEYXRhID0gRW5naW5lLm9mZnNjcmVlbkNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIEVuZ2luZS5vZmZzY3JlZW5XaWR0aCwgRW5naW5lLm9mZnNjcmVlbkhlaWdodCk7XHJcbiAgdmFyIHN1cmZhY2UgPSBuZXcgU3VyZmFjZShFbmdpbmUub2Zmc2NyZWVuV2lkdGgsIEVuZ2luZS5vZmZzY3JlZW5IZWlnaHQsIEVuZ2luZS5pbWFnZURhdGEpO1xyXG5cclxuICB2YXIgY2FtZXJhID0gbmV3IENhbWVyYShDYW1lcmEuUEVSU1BFQ1RJVkUsIDMwLCAxLCAxMDApO1xyXG4gIC8vIGNhbWVyYS52aWV3ID0gbmV3IFJlY3RhbmdsZSgwLjI1LCAwLjI1LCAwLjUsIDAuNSk7XHJcbiAgLy8gdmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEoQ2FtZXJhLk9SVEhPR1JBUEhJQywgMTAsIDEsIDEwMCk7XHJcbiAgLy8gY2FtZXJhLm9ydGhvU2NhbGUgPSAxMDtcclxuXHJcbiAgUmVuZGVyZXIuaW5pdChzdXJmYWNlLCBjYW1lcmEpO1xyXG5cclxuICBFbmdpbmUuZ3JpZCA9IG5ldyBBcnJheShFbmdpbmUuZ3JpZFNpemUgKiBFbmdpbmUuZ3JpZFNpemUpO1xyXG5cclxuICBFbmdpbmUubGlnaHQgPSBuZXcgTGlnaHQoMCwgMCwgMCwgbmV3IENvbG9yKDI1NSwgMjU1LCAyNTUsIDI1NSkpO1xyXG4gIEVuZ2luZS5saWdodC5zZXREaXJlY3Rpb24oLTAuNiwgLTEsIC0wLjQpO1xyXG5cclxuICBFbmdpbmUubGlnaHRGaWxsID0gbmV3IExpZ2h0KDAsIDAsIDAsIG5ldyBDb2xvcigxMjgsIDE0MCwgMTYwLCAyNTUpKTtcclxuICBFbmdpbmUubGlnaHRGaWxsLnNldERpcmVjdGlvbigwLjYsIDAsIDAuNCk7XHJcblxyXG4gIEVuZ2luZS5sZXZlbHMgPSBbXTtcclxuXHJcbiAgdmFyIGxldmVsID0gbmV3IEVudGl0eSh7IG5hbWU6ICdsZXZlbDAxJyB9KTtcclxuICBsZXZlbC5tZXNoID0gRW5naW5lLm1lc2hlc1snbGV2ZWwwMS5vYmonXTtcclxuXHJcbiAgRW5naW5lLnByb2Nlc3NMZXZlbE1lc2gobGV2ZWwsIG5ldyBDb2xvcmYoMC45NCwgMC43NiwgMC43KSwgbmV3IENvbG9yZigwLjksIDAuODQsIDAuNzQpKTtcclxuXHJcbiAgbGV2ZWwuZGVmYXVsdCA9IDIzNjtcclxuICBsZXZlbC5ncmlkWzMyXS5leGl0ID0gMTtcclxuICBsZXZlbC5ncmlkWzMyXS50YXJnZXQgPSAyMDc7XHJcblxyXG4gIGxldmVsLmdyaWRbNjFdLnRhcmdldCA9IDE2MjtcclxuICBsZXZlbC5ncmlkWzE2Ml0udGFyZ2V0ID0gNjE7XHJcblxyXG4gIGxldmVsLmdyaWRbMTY2XS50YXJnZXQgPSA4MDtcclxuICBsZXZlbC5ncmlkWzgwXS50YXJnZXQgPSAxNjY7XHJcblxyXG4gIEVuZ2luZS5sZXZlbHMucHVzaChsZXZlbCk7XHJcblxyXG4gIHZhciBsZXZlbCA9IG5ldyBFbnRpdHkoeyBuYW1lOiAnbGV2ZWwwMicgfSk7XHJcbiAgbGV2ZWwubWVzaCA9IEVuZ2luZS5tZXNoZXNbJ2xldmVsMDIub2JqJ107XHJcbiAgRW5naW5lLnByb2Nlc3NMZXZlbE1lc2gobGV2ZWwsIG5ldyBDb2xvcmYoMC43OCwgMC44MCwgMC42OCksIG5ldyBDb2xvcmYoMC43OCwgMC44NCwgMC44MCkpO1xyXG4gIGxldmVsLmRlZmF1bHQgPSAxMDA7XHJcblxyXG4gIGxldmVsLmdyaWRbODZdLnRyaWdnZXJMaXN0ID0gWzIyNywgMjI4XTtcclxuXHJcbiAgbGV2ZWwuZ3JpZFsxMl0uZXhpdCA9IDM7XHJcbiAgbGV2ZWwuZ3JpZFsxMl0udGFyZ2V0ID0gMjUyO1xyXG5cclxuICBsZXZlbC5ncmlkWzIwN10uZXhpdCA9IDA7XHJcbiAgbGV2ZWwuZ3JpZFsyMDddLnRhcmdldCA9IDMyO1xyXG5cclxuICBsZXZlbC5ncmlkWzIyNF0uZXhpdCA9IDI7XHJcbiAgbGV2ZWwuZ3JpZFsyMjRdLnRhcmdldCA9IDk1O1xyXG4gIEVuZ2luZS5sZXZlbHMucHVzaChsZXZlbCk7XHJcblxyXG4gIHZhciBsZXZlbCA9IG5ldyBFbnRpdHkoeyBuYW1lOiAnbGV2ZWwwMycgfSk7XHJcbiAgbGV2ZWwubWVzaCA9IEVuZ2luZS5tZXNoZXNbJ2xldmVsMDMub2JqJ107XHJcbiAgRW5naW5lLnByb2Nlc3NMZXZlbE1lc2gobGV2ZWwsIG5ldyBDb2xvcmYoMC44LCAwLjcsIDAuOCksIG5ldyBDb2xvcmYoMC44LCAwLjgsIDAuOSkpO1xyXG4gIGxldmVsLmRlZmF1bHQgPSA5MjtcclxuICBsZXZlbC5ncmlkWzk1XS5leGl0ID0gMTtcclxuICBsZXZlbC5ncmlkWzk1XS50YXJnZXQgPSAyMjQ7XHJcblxyXG4gIGxldmVsLmdyaWRbOTBdLnRhcmdldCA9IDY1O1xyXG4gIGxldmVsLmdyaWRbNjVdLnRhcmdldCA9IDkwO1xyXG5cclxuICBFbmdpbmUubGV2ZWxzLnB1c2gobGV2ZWwpO1xyXG5cclxuICB2YXIgbGV2ZWwgPSBuZXcgRW50aXR5KHsgbmFtZTogJ2xldmVsMDQnIH0pO1xyXG4gIGxldmVsLm1lc2ggPSBFbmdpbmUubWVzaGVzWydsZXZlbDA0Lm9iaiddO1xyXG4gIEVuZ2luZS5wcm9jZXNzTGV2ZWxNZXNoKGxldmVsLCBuZXcgQ29sb3JmKDAuNjUsIDAuNzUsIDAuODUpLCBuZXcgQ29sb3JmKDAuNywgMC44NSwgMC44KSk7XHJcbiAgbGV2ZWwuZGVmYXVsdCA9IDEyODtcclxuICBsZXZlbC5ncmlkWzI1Ml0uZXhpdCA9IDE7XHJcbiAgbGV2ZWwuZ3JpZFsyNTJdLnRhcmdldCA9IDEyO1xyXG4gIEVuZ2luZS5sZXZlbHMucHVzaChsZXZlbCk7XHJcblxyXG4gIHZhciBjdWJlID0gbmV3IEVudGl0eSh7IHg6IDAuNSwgeTogMC41LCB6OiAwLjUgfSk7XHJcbiAgY3ViZS5tZXNoID0gRW5naW5lLm1lc2hlc1snY3ViZS5vYmonXTtcclxuICBjdWJlLmFtYmllbnQgPSAwLjQ7XHJcbiAgY3ViZS50aW50ID0gbmV3IENvbG9yZigxLCAwLjUsIDEpO1xyXG4gIEVuZ2luZS5jdWJlID0gY3ViZTtcclxuXHJcbiAgdmFyIHRyYW5zaXRpb247XHJcbiAgRW5naW5lLmFkZFRyYW5zaXRpb24obmV3IFRyYW5zaXRpb24oeyBkdXJhdGlvbjogNTAwLCBzdGFydFZhbHVlOiAwLjUsIGVuZFZhbHVlOiAxLCBvYmplY3Q6IGN1YmUudGludCwgcHJvcGVydHk6ICdyJywgYm91bmNlOiB0cnVlLCByZXBlYXQ6IHRydWUgfSksIHRydWUpO1xyXG5cclxuICB2YXIgbWFya2VyID0gbmV3IEVudGl0eSh7IHg6IDAuNSwgeTogRW5naW5lLmN1YmUudHJhbnNmb3JtLnBvc2l0aW9uLnkgKyAxLCB6OiAwLjUgfSk7XHJcbiAgbWFya2VyLm1lc2ggPSBFbmdpbmUubWVzaGVzWydtYXJrZXIub2JqJ107XHJcbiAgbWFya2VyLmFtYmllbnQgPSAwLjg7XHJcbiAgRW5naW5lLm1hcmtlciA9IG1hcmtlcjtcclxuXHJcbiAgdHJhbnNpdGlvbiA9IG5ldyBUcmFuc2l0aW9uKHsgZHVyYXRpb246IDUwMCwgc3RhcnRWYWx1ZTogMSwgZW5kVmFsdWU6IDEuMiwgb2JqZWN0OiBtYXJrZXIudHJhbnNmb3JtLnBvc2l0aW9uLCBwcm9wZXJ0eTogJ3knLCBib3VuY2U6IHRydWUsIHJlcGVhdDogdHJ1ZSB9KTtcclxuICBFbmdpbmUuYWRkVHJhbnNpdGlvbih0cmFuc2l0aW9uLCB0cnVlKTtcclxuICBFbmdpbmUubWFya2VyLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xyXG5cclxuICBFbmdpbmUuZ3JpZElkID0gMDtcclxuXHJcbiAgLy8gR2xvYmFsIGF4ZXNcclxuICAvLyBFbmdpbmUubGluZXMucHVzaChuZXcgTGluZShuZXcgVmVjdG9yKDAsIDAsIDApLCBuZXcgVmVjdG9yKDIsIDAsIDApLCBDb2xvci5SRUQpKTtcclxuICAvLyBFbmdpbmUubGluZXMucHVzaChuZXcgTGluZShuZXcgVmVjdG9yKDAsIDAsIDApLCBuZXcgVmVjdG9yKDAsIDIsIDApLCBDb2xvci5HUkVFTikpO1xyXG4gIC8vIEVuZ2luZS5saW5lcy5wdXNoKG5ldyBMaW5lKG5ldyBWZWN0b3IoMCwgMCwgMCksIG5ldyBWZWN0b3IoMCwgMCwgMiksIENvbG9yLkJMVUUpKTtcclxuXHJcbiAgRW5naW5lLmhpdCA9IG51bGw7XHJcblxyXG4gIEVuZ2luZS5nb0xldmVsKDApO1xyXG4gIEVuZ2luZS5tb3ZlVG8oRW5naW5lLmxldmVsLmRlZmF1bHQpO1xyXG59XHJcblxyXG5FbmdpbmUuYWRkVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKHRyYW5zaXRpb24sIHN0YXJ0KSB7XHJcbiAgaWYgKHRyYW5zaXRpb24pIHtcclxuICAgIHRoaXMudHJhbnNpdGlvbnMucHVzaCh0cmFuc2l0aW9uKTtcclxuICAgIGlmIChzdGFydCkge1xyXG4gICAgICB0cmFuc2l0aW9uLnN0YXJ0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5FbmdpbmUuaW50ZXJzZWN0UGxhbmUgPSBmdW5jdGlvbihvcmlnaW4sIGRpcmVjdGlvbiwgcGxhbmUsIG5vcm1hbCkge1xyXG4gIHZhciBudW0gPSBWZWN0b3IuZG90KFZlY3Rvci5zdWJ0cmFjdChwbGFuZSwgb3JpZ2luKSwgbm9ybWFsKTtcclxuICB2YXIgZGVuID0gVmVjdG9yLmRvdChkaXJlY3Rpb24sIG5vcm1hbCk7XHJcbiAgdmFyIGQgPSBudW0gLyBkZW47XHJcbiAgdmFyIHAgPSBWZWN0b3IuYWRkKFZlY3Rvci5zY2FsZShkaXJlY3Rpb24sIGQpLCBvcmlnaW4pO1xyXG4gIHJldHVybiBwO1xyXG59XHJcblxyXG5FbmdpbmUuY2FzdFJheSA9IGZ1bmN0aW9uKHBTY3JlZW4sIHBsYW5lKSB7XHJcbiAgdmFyIGNhbWVyYSA9IFJlbmRlcmVyLmNhbWVyYTtcclxuICB2YXIgcHJvamVjdGlvbk1hdHJpeCA9IFJlbmRlcmVyLmdldFByb2plY3Rpb24oKTtcclxuICB2YXIgdmlld01hdHJpeCA9IGNhbWVyYS50b0xvY2FsKCk7XHJcbiAgLy8gdmFyIHBXb3JsZCA9IFJlbmRlcmVyLnJhc3RlclRvV29ybGQocFNjcmVlbiwgdmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCk7XHJcbiAgdmFyIHBXb3JsZCA9IGNhbWVyYS5zY3JlZW5Ub1dvcmxkKHBTY3JlZW4sIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpO1xyXG4gIHZhciBjYW1lcmFUb1dvcmxkID0gY2FtZXJhLnRvV29ybGQoKTtcclxuXHJcbiAgdmFyIGV5ZSwgZGlyO1xyXG5cclxuICBpZiAoY2FtZXJhLnR5cGUgPT0gQ2FtZXJhLlBFUlNQRUNUSVZFKSB7XHJcbiAgICBleWUgPSBjYW1lcmEudHJhbnNmb3JtLnBvc2l0aW9uO1xyXG4gICAgZGlyID0gVmVjdG9yLnN1YnRyYWN0KHBXb3JsZCwgZXllKS5ub3JtYWxpemUoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgZGlyID0gY2FtZXJhLnRyYW5zZm9ybS5wb3NpdGlvbjtcclxuICAgIGV5ZSA9IHBXb3JsZDtcclxuICB9XHJcblxyXG4gIHZhciBwID0gRW5naW5lLmludGVyc2VjdFBsYW5lKGV5ZSwgZGlyLCBwbGFuZSwgbmV3IFZlY3RvcigwLCAxLCAwKSk7XHJcbiAgcmV0dXJuIHA7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUuaXNXYWxrYWJsZSA9IGZ1bmN0aW9uKHNxdWFyZSkge1xyXG4gIHZhciBwb3NpdGlvbiA9IEVuZ2luZS5jdWJlLnRyYW5zZm9ybS5wb3NpdGlvbjtcclxuXHJcbiAgaWYgKHNxdWFyZSkge1xyXG4gICAgaWYgKHNxdWFyZS5oZWlnaHQgIT0gcG9zaXRpb24ueSAtIDAuNSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBpZiAoc3F1YXJlLmNvbG9yLmVxdWFscyhDb2xvci5PUkFOR0UpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5pc1ZhbGlkTW92ZSA9IGZ1bmN0aW9uKGcpIHtcclxuICBpZiAoZyA9PSB1bmRlZmluZWQgfHwgZyA9PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gIHZhciB4ID0gKGcgJSBFbmdpbmUuZ3JpZFNpemUpO1xyXG4gIHZhciB5ID0gRW5naW5lLmdyaWRbZ10uaGVpZ2h0O1xyXG4gIHZhciB6ID0gKChnIC8gRW5naW5lLmdyaWRTaXplKSA+PiAwKTtcclxuXHJcbiAgdmFyIHBvc2l0aW9uID0gRW5naW5lLmN1YmUudHJhbnNmb3JtLnBvc2l0aW9uO1xyXG4gIHZhciBjdWJleCA9IHBvc2l0aW9uLnggKyA3LjUsIGN1YmV6ID0gcG9zaXRpb24ueiArIDcuNTtcclxuXHJcbiAgaWYgKHggPT0gY3ViZXgpIHtcclxuICAgIGlmICh6ID49IGN1YmV6KSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSBjdWJlejsgaSA8PSB6OyBpKyspIGlmICghRW5naW5lLmlzV2Fsa2FibGUoRW5naW5lLmdyaWRbaSAqIEVuZ2luZS5ncmlkU2l6ZSArIHhdKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSBjdWJlejsgaSA+PSB6OyBpLS0pIGlmICghRW5naW5lLmlzV2Fsa2FibGUoRW5naW5lLmdyaWRbaSAqIEVuZ2luZS5ncmlkU2l6ZSArIHhdKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHogPT0gY3ViZXopIHtcclxuICAgIGlmICh4ID49IGN1YmV4KSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSBjdWJleDsgaSA8PSB4OyBpKyspIGlmICghRW5naW5lLmlzV2Fsa2FibGUoRW5naW5lLmdyaWRbeiAqIEVuZ2luZS5ncmlkU2l6ZSArIGldKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSBjdWJleDsgaSA+PSB4OyBpLS0pIGlmICghRW5naW5lLmlzV2Fsa2FibGUoRW5naW5lLmdyaWRbeiAqIEVuZ2luZS5ncmlkU2l6ZSArIGldKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5FbmdpbmUudGVsZXBvcnRUbyA9IGZ1bmN0aW9uKGkpIHtcclxuXHJcblxyXG59XHJcblxyXG5FbmdpbmUuc2V0VG9rZW5Qb3NpdGlvbiA9IGZ1bmN0aW9uKHgsIHksIHopIHtcclxuICB2YXIgcG9zaXRpb24gPSBFbmdpbmUuY3ViZS50cmFuc2Zvcm0ucG9zaXRpb247XHJcbiAgcG9zaXRpb24ueCA9IHggLSAwLjU7XHJcbiAgcG9zaXRpb24ueiA9IHogLSAwLjU7XHJcbiAgcG9zaXRpb24ueSA9IHkgKyAwLjU7XHJcbiAgRW5naW5lLm1hcmtlci50cmFuc2l0aW9uLnN0b3AoKTtcclxuICBFbmdpbmUubWFya2VyLnRyYW5zaXRpb24uc3RhcnRWYWx1ZSA9IHBvc2l0aW9uLnkgKyAxO1xyXG4gIEVuZ2luZS5tYXJrZXIudHJhbnNpdGlvbi5lbmRWYWx1ZSA9IHBvc2l0aW9uLnkgKyAxLjI7XHJcbiAgRW5naW5lLm1hcmtlci50cmFuc2Zvcm0ucG9zaXRpb24ueCA9IHBvc2l0aW9uLng7XHJcbiAgRW5naW5lLm1hcmtlci50cmFuc2Zvcm0ucG9zaXRpb24ueSA9IHBvc2l0aW9uLnkgKyAxO1xyXG4gIEVuZ2luZS5tYXJrZXIudHJhbnNmb3JtLnBvc2l0aW9uLnogPSBwb3NpdGlvbi56O1xyXG4gIEVuZ2luZS5tYXJrZXIudHJhbnNpdGlvbi5zdGFydCgpO1xyXG59XHJcblxyXG5FbmdpbmUubW92ZVRvID0gZnVuY3Rpb24oZykge1xyXG4gIHZhciBzcXVhcmUgPSBFbmdpbmUuZ3JpZFtnXTtcclxuICBpZiAoc3F1YXJlID09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG5cclxuICB2YXIgeCA9IChnICUgRW5naW5lLmdyaWRTaXplKSAtIDc7XHJcbiAgdmFyIHkgPSBFbmdpbmUuZ3JpZFtnXS5oZWlnaHQ7XHJcbiAgdmFyIHogPSAoKGcgLyBFbmdpbmUuZ3JpZFNpemUpID4+IDApIC0gNztcclxuICB2YXIgcG9zaXRpb24gPSBFbmdpbmUuY3ViZS50cmFuc2Zvcm0ucG9zaXRpb247XHJcblxyXG4gIHZhciBvbGRTcXVhcmUgPSBFbmdpbmUuZ3JpZFtFbmdpbmUuY3ViZS5nXTtcclxuXHJcbiAgaWYgKG9sZFNxdWFyZSkge1xyXG4gICAgaWYgKENvbG9yLmVxdWFscyhvbGRTcXVhcmUuY29sb3IsIEdyaWRUeXBlLlNXSVRDSCkpIHtcclxuICAgICAgaWYgKG9sZFNxdWFyZS5lbnRpdHkpIHtcclxuICAgICAgICBvbGRTcXVhcmUuZW50aXR5LnRyYW5zZm9ybS5wb3NpdGlvbi55ID0gb2xkU3F1YXJlLmhlaWdodDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKHNxdWFyZS5leGl0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgIEVuZ2luZS5nb0xldmVsKHNxdWFyZS5leGl0KVxyXG4gICAgeCA9IChzcXVhcmUudGFyZ2V0ICUgRW5naW5lLmdyaWRTaXplKSAtIDc7XHJcbiAgICB5ID0gRW5naW5lLmdyaWRbc3F1YXJlLnRhcmdldF0uaGVpZ2h0O1xyXG4gICAgeiA9ICgoc3F1YXJlLnRhcmdldCAvIEVuZ2luZS5ncmlkU2l6ZSkgPj4gMCkgLSA3O1xyXG4gICAgLy8gRW5naW5lLmdyaWRJbmRleCA9IHNxdWFyZS50YXJnZXQ7XHJcbiAgICBFbmdpbmUuZ3JpZEluZGV4ID0gbnVsbDtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBpZiAoQ29sb3IuZXF1YWxzKEVuZ2luZS5ncmlkW2ddLmNvbG9yLCBHcmlkVHlwZS5URUxFUE9SVCkpIHtcclxuICAgICAgRW5naW5lLmdyaWRJbmRleCA9IGc7XHJcbiAgICAgIGlmIChzcXVhcmUudGFyZ2V0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YXIgaSA9IHNxdWFyZS50YXJnZXQ7XHJcbiAgICAgICAgaWYgKEVuZ2luZS5ncmlkW2ldKSB7XHJcbiAgICAgICAgICBFbmdpbmUuYWRkVHJhbnNpdGlvbihuZXcgVHJhbnNpdGlvbih7IGR1cmF0aW9uOiAyNTAsIHN0YXJ0VmFsdWU6IDEsIGVuZFZhbHVlOiAwLjI1LCBvYmplY3Q6IEVuZ2luZS5jdWJlLnRyYW5zZm9ybS5zY2FsZSwgcHJvcGVydHk6ICd4JyB9KSwgdHJ1ZSk7XHJcbiAgICAgICAgICBFbmdpbmUuYWRkVHJhbnNpdGlvbihuZXcgVHJhbnNpdGlvbih7IGR1cmF0aW9uOiAyNTAsIHN0YXJ0VmFsdWU6IDEsIGVuZFZhbHVlOiAwLjI1LCBvYmplY3Q6IEVuZ2luZS5jdWJlLnRyYW5zZm9ybS5zY2FsZSwgcHJvcGVydHk6ICd6JyB9KSwgdHJ1ZSk7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB4ID0gKGkgJSBFbmdpbmUuZ3JpZFNpemUpIC0gNztcclxuICAgICAgICAgICAgeSA9IEVuZ2luZS5ncmlkW2ldLmhlaWdodDtcclxuICAgICAgICAgICAgeiA9ICgoaSAvIEVuZ2luZS5ncmlkU2l6ZSkgPj4gMCkgLSA3O1xyXG4gICAgICAgICAgICBFbmdpbmUuY3ViZS5nID0gaTtcclxuICAgICAgICAgICAgRW5naW5lLnNldFRva2VuUG9zaXRpb24oeCwgeSwgeik7XHJcbiAgICAgICAgICAgIEVuZ2luZS5hZGRUcmFuc2l0aW9uKG5ldyBUcmFuc2l0aW9uKHsgZHVyYXRpb246IDI1MCwgc3RhcnRWYWx1ZTogMC4yNSwgZW5kVmFsdWU6IDEsIG9iamVjdDogRW5naW5lLmN1YmUudHJhbnNmb3JtLnNjYWxlLCBwcm9wZXJ0eTogJ3gnIH0pLCB0cnVlKTtcclxuICAgICAgICAgICAgRW5naW5lLmFkZFRyYW5zaXRpb24obmV3IFRyYW5zaXRpb24oeyBkdXJhdGlvbjogMjUwLCBzdGFydFZhbHVlOiAwLjI1LCBlbmRWYWx1ZTogMSwgb2JqZWN0OiBFbmdpbmUuY3ViZS50cmFuc2Zvcm0uc2NhbGUsIHByb3BlcnR5OiAneicgfSksIHRydWUpO1xyXG4gICAgICAgICAgfSwgMjUwKTtcclxuICAgICAgICAgIEVuZ2luZS5ncmlkSW5kZXggPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChDb2xvci5lcXVhbHMoc3F1YXJlLmNvbG9yLCBHcmlkVHlwZS5TV0lUQ0gpKSB7XHJcbiAgICAgIGlmIChzcXVhcmUuZW50aXR5KSB7XHJcbiAgICAgICAgc3F1YXJlLmVudGl0eS50cmFuc2Zvcm0ucG9zaXRpb24ueSA9IHNxdWFyZS5oZWlnaHQgLSAwLjE7XHJcbiAgICAgICAgaWYgKHNxdWFyZS50cmlnZ2VyTGlzdCBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNxdWFyZS50cmlnZ2VyTGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0U3F1YXJlID0gRW5naW5lLmdyaWRbc3F1YXJlLnRyaWdnZXJMaXN0W2ldXTtcclxuICAgICAgICAgICAgaWYgKHRhcmdldFNxdWFyZS5hY3RpdmUgPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICB0YXJnZXRTcXVhcmUuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBpZiAoQ29sb3IuZXF1YWxzKHRhcmdldFNxdWFyZS5jb2xvciwgR3JpZFR5cGUuQlJJREdFKSkge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0U3F1YXJlLmhlaWdodCA9IHRhcmdldFNxdWFyZS5oZWlnaHQgKyAxO1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0U3F1YXJlLmVudGl0eS52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoQ29sb3IuZXF1YWxzKHNxdWFyZS5jb2xvciwgR3JpZFR5cGUuQlJJREdFKSkge1xyXG4gICAgICBpZiAoIXNxdWFyZS5hY3RpdmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoQ29sb3IuZXF1YWxzKHNxdWFyZS5jb2xvciwgQ29sb3IuT1JBTkdFKSkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBFbmdpbmUuY3ViZS5nID0gRW5naW5lLmdyaWRJbmRleDtcclxuICBFbmdpbmUuc2V0VG9rZW5Qb3NpdGlvbih4LCB5LCB6KTtcclxuXHJcbiAgLy8gRW5naW5lLm1hcmtlci50cmFuc2Zvcm0ucG9zaXRpb24ueCA9IHBvc2l0aW9uLng7XHJcbiAgLy8gRW5naW5lLm1hcmtlci50cmFuc2Zvcm0ucG9zaXRpb24ueiA9IHBvc2l0aW9uLno7XHJcbiAgLy8gRW5naW5lLnRyYW5zaXRpb25zWydtYXJrZXInXS5zdG9wKCk7XHJcbiAgLy8gRW5naW5lLnRyYW5zaXRpb25zWydtYXJrZXInXSA9IG5ldyBUcmFuc2l0aW9uKHsgZHVyYXRpb246IDUwMCwgc3RhcnRWYWx1ZTogcG9zaXRpb24ueSArIDEsIGVuZFZhbHVlOiBwb3NpdGlvbi55ICsgMS4yLCBvYmplY3Q6IEVuZ2luZS5tYXJrZXIudHJhbnNmb3JtLnBvc2l0aW9uLCBwcm9wZXJ0eTogJ3knLCBib3VuY2U6IHRydWUsIHJlcGVhdDogdHJ1ZSB9KTtcclxuICAvLyBFbmdpbmUudHJhbnNpdGlvbnNbJ21hcmtlciddLnN0YXJ0KCk7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUuZHJhd0VudGl0eSA9IGZ1bmN0aW9uKGVudGl0eSkge1xyXG4gIHZhciBjYW1lcmEgPSBSZW5kZXJlci5jYW1lcmE7XHJcbiAgdmFyIGN1bGwgPSBlbnRpdHkuY3VsbDtcclxuXHJcbiAgaWYgKGVudGl0eS5tZXNoKSB7XHJcbiAgICB2YXIgbWVzaCA9IGVudGl0eS5tZXNoO1xyXG4gICAgdmFyIHRleHR1cmUgPSBlbnRpdHkudGV4dHVyZTtcclxuICAgIHZhciBhbWJpZW50ID0gKGVudGl0eS5hbWJpZW50ICE9PSB1bmRlZmluZWQgPyBlbnRpdHkuYW1iaWVudCA6IDApO1xyXG4gICAgdmFyIHRpbnQgPSAoZW50aXR5LnRpbnQgIT09IHVuZGVmaW5lZCA/IGVudGl0eS50aW50IDogbmV3IENvbG9yZigxLCAxLCAxKSk7XHJcbiAgICB2YXIgYW8gPSBlbnRpdHkuYW87XHJcbiAgICB2YXIgdmlld01hdHJpeCA9IGNhbWVyYS50b0xvY2FsKCk7XHJcbiAgICB2YXIgcHJvamVjdGlvbk1hdHJpeCA9IFJlbmRlcmVyLmdldFByb2plY3Rpb24oKTtcclxuICAgIHZhciBtb2RlbCA9IGVudGl0eS5nZXRUcmFuc2Zvcm1NYXRyaXgoKTtcclxuICAgIHZhciByb3RhdGlvbk1hdHJpeCA9IGVudGl0eS5nZXRSb3RhdGlvbk1hdHJpeCgpO1xyXG4gICAgdmFyIGxpZ2h0Tm9ybWFsID0gKFZlY3Rvci5zY2FsZShFbmdpbmUubGlnaHQuZGlyZWN0aW9uLCAtMSkpO1xyXG4gICAgdmFyIGxpZ2h0RmlsbE5vcm1hbCA9IChWZWN0b3Iuc2NhbGUoRW5naW5lLmxpZ2h0RmlsbC5kaXJlY3Rpb24sIC0xKSk7XHJcbiAgICB2YXIgbGlnaHRDb2xvciA9IENvbG9yZi5mcm9tQ29sb3IoRW5naW5lLmxpZ2h0LmNvbG9yKTtcclxuICAgIHZhciBsaWdodEZpbGxDb2xvciA9IENvbG9yZi5mcm9tQ29sb3IoRW5naW5lLmxpZ2h0RmlsbC5jb2xvcik7XHJcbiAgICAvLyB2YXIgY2FtZXJhTm9ybWFsID0gbmV3IFZlY3RvcihjYW1lcmEudHJhbnNmb3JtLngsIGNhbWVyYS50cmFuc2Zvcm0ueSwgY2FtZXJhLnRyYW5zZm9ybS56KTtcclxuICAgIC8vIHZhciBwcm9qZWN0aW9uID0gQ2FtZXJhLnBlcnNwZWN0aXZlRk9WKGNhbWVyYS5mb3YsIFJlbmRlcmVyLmFzcGVjdCwgY2FtZXJhLm5lYXIsIGNhbWVyYS5mYXIpO1xyXG4gICAgdmFyIHRyaWFuZ2xlO1xyXG4gICAgdmFyIGJhY2tmYWNlO1xyXG4gICAgdmFyIG4sIHYwLCB2MSwgdjI7XHJcbiAgICB2YXIgZmFjaW5nUmF0aW8wLCBmYWNpbmdSYXRpbzE7XHJcbiAgICB2YXIgaWxsdW1pbmF0aW9uID0gbmV3IENvbG9yKCk7XHJcbiAgICB2YXIgZGVmYXVsdENvbG9yID0gbmV3IENvbG9yKDI1NSwgMjU1LCAyNTUsIDApO1xyXG4gICAgdmFyIGlkO1xyXG5cclxuICAgIGlmIChtZXNoLnZlcnRfY2FsYyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIG1lc2gudmVydF9jYWxjID0gbmV3IEFycmF5KG1lc2gudmVydGljZXMubGVuZ3RoKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1lc2gudmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgbWVzaC52ZXJ0X2NhbGNbaV0gPSBtb2RlbC5tdWx0aXBseVBvaW50KG1lc2gudmVydGljZXNbaV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWVzaC50cmlhbmdsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdHJpYW5nbGUgPSBtZXNoLnRyaWFuZ2xlc1tpXTtcclxuICAgICAgaWQgPSAodHJpYW5nbGUuaWQgIT09IHVuZGVmaW5lZCA/IHRyaWFuZ2xlLmlkIDogMCk7XHJcblxyXG4gICAgICB2MCA9IG1lc2gudmVydF9jYWxjW3RyaWFuZ2xlLnZlcnRpY2VzWzBdXTtcclxuICAgICAgdjEgPSBtZXNoLnZlcnRfY2FsY1t0cmlhbmdsZS52ZXJ0aWNlc1sxXV07XHJcbiAgICAgIHYyID0gbWVzaC52ZXJ0X2NhbGNbdHJpYW5nbGUudmVydGljZXNbMl1dO1xyXG5cclxuICAgICAgLy8gdjAgPSBSZW5kZXJlci53b3JsZFRvU2NyZWVuKHYwLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KTtcclxuICAgICAgLy8gdjEgPSBSZW5kZXJlci53b3JsZFRvU2NyZWVuKHYxLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KTtcclxuICAgICAgLy8gdjIgPSBSZW5kZXJlci53b3JsZFRvU2NyZWVuKHYyLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KTtcclxuICAgICAgdjAgPSBjYW1lcmEud29ybGRUb05EQyh2MCwgdmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCk7XHJcbiAgICAgIHYxID0gY2FtZXJhLndvcmxkVG9OREModjEsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpO1xyXG4gICAgICB2MiA9IGNhbWVyYS53b3JsZFRvTkRDKHYyLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KTtcclxuXHJcbiAgICAgIC8vIGJhY2tmYWNlID0gVmVjdG9yLmRvdChuLCBjYW1lcmFOb3JtYWwpO1xyXG4gICAgICBiYWNrZmFjZSA9ICh2MC54ICogdjEueSAtIHYxLnggKiB2MC55KSArICh2MS54ICogdjIueSAtIHYyLnggKiB2MS55KSArICh2Mi54ICogdjAueSAtIHYwLnggKiB2Mi55KTtcclxuXHJcbiAgICAgIGlmIChiYWNrZmFjZSA+IDApIHtcclxuICAgICAgICB2MCA9IGNhbWVyYS5ORENUb1NjcmVlbih2MCk7XHJcbiAgICAgICAgdjEgPSBjYW1lcmEuTkRDVG9TY3JlZW4odjEpO1xyXG4gICAgICAgIHYyID0gY2FtZXJhLk5EQ1RvU2NyZWVuKHYyKTtcclxuXHJcbiAgICAgICAgbiA9IChyb3RhdGlvbk1hdHJpeC5tdWx0aXBseVBvaW50KHRyaWFuZ2xlLm5vcm1hbCkpLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgICAgICBmYWNpbmdSYXRpbzAgPSBNYXRoLm1heCgwLCBWZWN0b3IuZG90KG4sIGxpZ2h0Tm9ybWFsKSk7XHJcbiAgICAgICAgZmFjaW5nUmF0aW8xID0gTWF0aC5tYXgoMCwgVmVjdG9yLmRvdChuLCBsaWdodEZpbGxOb3JtYWwpKTtcclxuXHJcbiAgICAgICAgdjAuY29sb3IgPSBtZXNoLmNvbG9yc1t0cmlhbmdsZS5jb2xvcnNbMF1dO1xyXG4gICAgICAgIHYxLmNvbG9yID0gbWVzaC5jb2xvcnNbdHJpYW5nbGUuY29sb3JzWzFdXTtcclxuICAgICAgICB2Mi5jb2xvciA9IG1lc2guY29sb3JzW3RyaWFuZ2xlLmNvbG9yc1syXV07XHJcblxyXG4gICAgICAgIGlmICh2MC5jb2xvciA9PSB1bmRlZmluZWQpIHYwLmNvbG9yID0gZGVmYXVsdENvbG9yO1xyXG4gICAgICAgIGlmICh2MS5jb2xvciA9PSB1bmRlZmluZWQpIHYxLmNvbG9yID0gZGVmYXVsdENvbG9yO1xyXG4gICAgICAgIGlmICh2Mi5jb2xvciA9PSB1bmRlZmluZWQpIHYyLmNvbG9yID0gZGVmYXVsdENvbG9yO1xyXG5cclxuICAgICAgICBpZiAoZW50aXR5LmJyaWdodCkge1xyXG4gICAgICAgICAgaWxsdW1pbmF0aW9uLnIgPSAxLjA7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uZyA9IDEuMDtcclxuICAgICAgICAgIGlsbHVtaW5hdGlvbi5iID0gMS4wO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uciA9IE1hdGgubWluKDEuMCwgZmFjaW5nUmF0aW8wICogbGlnaHRDb2xvci5yICsgZmFjaW5nUmF0aW8xICogbGlnaHRGaWxsQ29sb3Iucik7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uZyA9IE1hdGgubWluKDEuMCwgZmFjaW5nUmF0aW8wICogbGlnaHRDb2xvci5nICsgZmFjaW5nUmF0aW8xICogbGlnaHRGaWxsQ29sb3IuZyk7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uYiA9IE1hdGgubWluKDEuMCwgZmFjaW5nUmF0aW8wICogbGlnaHRDb2xvci5iICsgZmFjaW5nUmF0aW8xICogbGlnaHRGaWxsQ29sb3IuYik7XHJcblxyXG4gICAgICAgICAgaWxsdW1pbmF0aW9uLnIgPSBNYXRoLm1pbigxLjAsIGlsbHVtaW5hdGlvbi5yICsgYW1iaWVudCk7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uZyA9IE1hdGgubWluKDEuMCwgaWxsdW1pbmF0aW9uLmcgKyBhbWJpZW50KTtcclxuICAgICAgICAgIGlsbHVtaW5hdGlvbi5iID0gTWF0aC5taW4oMS4wLCBpbGx1bWluYXRpb24uYiArIGFtYmllbnQpO1xyXG5cclxuICAgICAgICAgIGlsbHVtaW5hdGlvbi5yID0gTWF0aC5tYXgoMC4yLCBpbGx1bWluYXRpb24ucik7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uZyA9IE1hdGgubWF4KDAuMiwgaWxsdW1pbmF0aW9uLmcpO1xyXG4gICAgICAgICAgaWxsdW1pbmF0aW9uLmIgPSBNYXRoLm1heCgwLjIsIGlsbHVtaW5hdGlvbi5iKTtcclxuXHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uciA9IE1hdGgubWluKDEuMCwgaWxsdW1pbmF0aW9uLnIgKyB2MC5jb2xvci5hLzI1NSk7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uZyA9IE1hdGgubWluKDEuMCwgaWxsdW1pbmF0aW9uLmcgKyB2MC5jb2xvci5hLzI1NSk7XHJcbiAgICAgICAgICBpbGx1bWluYXRpb24uYiA9IE1hdGgubWluKDEuMCwgaWxsdW1pbmF0aW9uLmIgKyB2MC5jb2xvci5hLzI1NSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHJpYW5nbGUudXZzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIHYwLnV2ID0gbWVzaC51dnNbdHJpYW5nbGUudXZzWzBdXTtcclxuICAgICAgICAgIHYxLnV2ID0gbWVzaC51dnNbdHJpYW5nbGUudXZzWzFdXTtcclxuICAgICAgICAgIHYyLnV2ID0gbWVzaC51dnNbdHJpYW5nbGUudXZzWzJdXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgodjAueiA+IDAuMSAmJiB2MS56ID4gMC4xICYmIHYyLnogPiAwLjEpKSB7XHJcbiAgICAgICAgICBSZW5kZXJlci5kcmF3VHJpYW5nbGUodjAsIHYxLCB2MiwgaWxsdW1pbmF0aW9uLCB0aW50LCB0ZXh0dXJlLCBpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5cclxuLy8gRW5naW5lLmRyYXdFbnRpdHlBeGVzID0gZnVuY3Rpb24oZW50aXR5KSB7XHJcbi8vICAgLy8gdmFyIHRyYW5zZm9ybU1hdHJpeCA9IGVudGl0eS5nZXRUcmFuc2Zvcm1NYXRyaXgoKTtcclxuLy8gICB2YXIgeGF4aXMsIHlheGlzLCB6YXhpcywgbGluZTtcclxuLy9cclxuLy8gICB6YXhpcyA9IG5ldyBWZWN0b3IoMCwgMCwgMik7XHJcbi8vICAgdmFyIGEgPSBlbnRpdHkudG9Xb3JsZCh6YXhpcyk7XHJcbi8vICAgbGluZSA9IG5ldyBMaW5lKGVudGl0eS50cmFuc2Zvcm0ucG9zaXRpb24sIGEsIENvbG9yLkJMVUUpO1xyXG4vLyAgIFJlbmRlcmVyLmRyYXdMaW5lKGxpbmUpO1xyXG4vL1xyXG4vLyAgIHlheGlzID0gbmV3IFZlY3RvcigwLCAyLCAwKTtcclxuLy8gICB2YXIgYiA9IGVudGl0eS50b1dvcmxkKHlheGlzKTtcclxuLy8gICBsaW5lID0gbmV3IExpbmUoZW50aXR5LnRyYW5zZm9ybS5wb3NpdGlvbiwgYiwgQ29sb3IuR1JFRU4pO1xyXG4vLyAgIFJlbmRlcmVyLmRyYXdMaW5lKGxpbmUpO1xyXG4vL1xyXG4vLyAgIHhheGlzID0gbmV3IFZlY3RvcigyLCAwLCAwKTtcclxuLy8gICB2YXIgYyA9IGVudGl0eS50b1dvcmxkKHhheGlzKTtcclxuLy8gICBsaW5lID0gbmV3IExpbmUoZW50aXR5LnRyYW5zZm9ybS5wb3NpdGlvbiwgYywgQ29sb3IuUkVEKTtcclxuLy8gICBSZW5kZXJlci5kcmF3TGluZShsaW5lKTtcclxuLy9cclxuLy8gfVxyXG5cclxuXHJcbkVuZ2luZS5kcmF3RW50aXRpZXMgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoRW5naW5lLmxldmVsKSB7XHJcbiAgICBFbmdpbmUuZHJhd0VudGl0eShFbmdpbmUubGV2ZWwpO1xyXG4gIH1cclxuXHJcbiAgaWYgKEVuZ2luZS5jdWJlKSB7XHJcbiAgICBFbmdpbmUuZHJhd0VudGl0eShFbmdpbmUuY3ViZSk7XHJcbiAgfVxyXG5cclxuICAvLyBmb3IgKHZhciBpID0gMDsgaSA8IEVuZ2luZS5lbnRpdGllcy5sZW5ndGg7IGkrKykge1xyXG4gIC8vICAgRW5naW5lLmRyYXdFbnRpdHkoRW5naW5lLmVudGl0aWVzW2ldLCBmYWxzZSk7XHJcbiAgLy8gfVxyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IEVuZ2luZS5saW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgUmVuZGVyZXIuZHJhd0xpbmUoRW5naW5lLmxpbmVzW2ldKTtcclxuICB9XHJcblxyXG4gIC8vIFJlbmRlcmVyLmNsZWFyRGVwdGhCdWZmZXIoKTtcclxuXHJcbiAgaWYgKEVuZ2luZS5tYXJrZXIpIHtcclxuICAgIEVuZ2luZS5kcmF3RW50aXR5KEVuZ2luZS5tYXJrZXIpO1xyXG4gIH1cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBFbmdpbmUubGV2ZWwuZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBlbnRpdHkgPSBFbmdpbmUubGV2ZWwuZW50aXRpZXNbaV07XHJcbiAgICBpZiAoZW50aXR5LnZpc2libGUpIHtcclxuICAgICAgRW5naW5lLmRyYXdFbnRpdHkoZW50aXR5KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIGZvciAodmFyIGkgPSAwOyBpIDwgRW5naW5lLmVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgLy8gICBFbmdpbmUuZHJhd0VudGl0eUF4ZXMoRW5naW5lLmVudGl0aWVzW2ldKTtcclxuICAvLyB9XHJcblxyXG4gIGlmIChFbmdpbmUuZ3JpZEluZGV4ICE9IHVuZGVmaW5lZCAmJiBFbmdpbmUuZ3JpZEluZGV4ICE9IG51bGwgJiYgIUVuZ2luZS5pbnRlcmFjdC5kcmFnKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBFbmdpbmUuY3ViZS50cmFuc2Zvcm0ucG9zaXRpb247XHJcbiAgICB2YXIgZyA9IEVuZ2luZS5ncmlkSW5kZXg7XHJcbiAgICB2YXIgeCA9IChnICUgRW5naW5lLmdyaWRTaXplKSAtIDc7XHJcbiAgICB2YXIgeSA9IEVuZ2luZS5ncmlkW2ddLmhlaWdodDtcclxuICAgIHZhciB6ID0gKChnIC8gRW5naW5lLmdyaWRTaXplKSA+PiAwKSAtIDc7XHJcbiAgICB2YXIgY29sb3I7XHJcbiAgICB2YXIgdmFsaWQgPSBFbmdpbmUuaXNWYWxpZE1vdmUoZyk7XHJcblxyXG4gICAgaWYgKHZhbGlkKVxyXG4gICAgICBjb2xvciA9IENvbG9yLkdSRUVOO1xyXG4gICAgZWxzZVxyXG4gICAgICBjb2xvciA9IENvbG9yLlJFRDtcclxuXHJcbiAgICB2YXIgbGluZTEgPSBuZXcgTGluZShuZXcgVmVjdG9yKHggLSAxLCB5LCB6KSwgbmV3IFZlY3Rvcih4LCB5LCB6KSwgY29sb3IpO1xyXG4gICAgdmFyIGxpbmUyID0gbmV3IExpbmUobmV3IFZlY3Rvcih4IC0gMSwgeSwgeiAtIDEpLCBuZXcgVmVjdG9yKHgsIHksIHogLSAxKSwgY29sb3IpO1xyXG4gICAgdmFyIGxpbmUzID0gbmV3IExpbmUobmV3IFZlY3Rvcih4IC0gMSwgeSwgeiksIG5ldyBWZWN0b3IoeCAtIDEsIHksIHogLSAxKSwgY29sb3IpO1xyXG4gICAgdmFyIGxpbmU0ID0gbmV3IExpbmUobmV3IFZlY3Rvcih4LCB5LCB6KSwgbmV3IFZlY3Rvcih4LCB5LCB6IC0gMSksIGNvbG9yKTtcclxuXHJcbiAgICBSZW5kZXJlci5kcmF3TGluZShsaW5lMSk7XHJcbiAgICBSZW5kZXJlci5kcmF3TGluZShsaW5lMik7XHJcbiAgICBSZW5kZXJlci5kcmF3TGluZShsaW5lMyk7XHJcbiAgICBSZW5kZXJlci5kcmF3TGluZShsaW5lNCk7XHJcblxyXG4gICAgaWYgKHZhbGlkKSB7XHJcbiAgICAgIC8vIGlmIChwb3NpdGlvbi55ID09IEVuZ2luZS5ncmlkW2ddICsgMC41KSB7XHJcbiAgICAgICAgdmFyIGxpbmVwYXRoID0gbmV3IExpbmUocG9zaXRpb24sIG5ldyBWZWN0b3IoeCAtIDAuNSwgeSwgeiAtIDAuNSksIENvbG9yLldISVRFKTtcclxuICAgICAgICBSZW5kZXJlci5kcmF3TGluZShsaW5lcGF0aCk7XHJcbiAgICAgIC8vIH1cclxuICAgIH1cclxuICB9XHJcblxyXG59XHJcblxyXG5cclxuLy8gRW5naW5lLmRyYXdUZXN0ID0gZnVuY3Rpb24oKSB7XHJcbi8vICAgdmFyIHNoYWRlID0gbmV3IENvbG9yZigpO1xyXG4vL1xyXG4vLyAgIC8vIGZvciAodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcclxuLy8gICAvLyAgIHZhciByID0gTWF0aC5yYW5kb20oKTtcclxuLy8gICAvLyAgIHZhciBzID0gTWF0aC5yYW5kb20oKTtcclxuLy8gICAvLyAgIHZhciB0ID0gKDE2MCAqIHIpICsgMTAgPj4gMDtcclxuLy8gICAvLyAgIHZhciB1ID0gKDEwMCAqIHMpICsgMTAgPj4gMDtcclxuLy8gICAvLyAgIHZhciB3ID0gODtcclxuLy8gICAvL1xyXG4vLyAgIC8vICAgdmFyIHYwID0gbmV3IFZlY3Rvcih0LCB1LCAxK3IpO1xyXG4vLyAgIC8vICAgdmFyIHYxID0gbmV3IFZlY3Rvcih0ICsgdywgdSwgMStyKTtcclxuLy8gICAvLyAgIHZhciB2MiA9IG5ldyBWZWN0b3IodCArIHcsIHUgLSB3LCAxK3IpO1xyXG4vLyAgIC8vXHJcbi8vICAgLy8gICB2MC5jb2xvciA9IG5ldyBDb2xvcigoTWF0aC5yYW5kb20oKSoyNTUpLCAoTWF0aC5yYW5kb20oKSoyNTUpLCAoTWF0aC5yYW5kb20oKSoyNTUpKTtcclxuLy8gICAvL1xyXG4vLyAgIC8vICAgUmVuZGVyZXIuZHJhd1RyaWFuZ2xlKHYwLCB2MSwgdjIsIHNoYWRlKTtcclxuLy8gICAvLyB9XHJcbi8vXHJcbi8vICAgdmFyIHZpZXdNYXRyaXggPSBSZW5kZXJlci5jYW1lcmEudG9Mb2NhbCgpO1xyXG4vLyAgIHZhciBwcm9qZWN0aW9uTWF0cml4ID0gUmVuZGVyZXIuZ2V0UHJvamVjdGlvbigpO1xyXG4vL1xyXG4vLyAgIHZhciBsaW5lID0gbmV3IExpbmUobmV3IFZlY3RvcigtNSwgMCwgLTUpLCBuZXcgVmVjdG9yKC01LCAwLCA1KSwgQ29sb3IuV0hJVEUpO1xyXG4vLyAgIHZhciBhID0gQ2FtZXJhLndvcmxkVG9TY3JlZW4obGluZS5hLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KS5yb3VuZCgpO1xyXG4vLyAgIHZhciBiID0gQ2FtZXJhLndvcmxkVG9TY3JlZW4obGluZS5iLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KS5yb3VuZCgpO1xyXG4vLyAgIFJlbmRlcmVyLmxpbmUoYS54LCBhLnksIGIueCwgYi55LCBsaW5lLmNvbG9yLnIsIGxpbmUuY29sb3IuZywgbGluZS5jb2xvci5iLCBsaW5lLmNvbG9yLmEpO1xyXG4vL1xyXG4vLyAgIHZhciBsaW5lID0gbmV3IExpbmUobmV3IFZlY3RvcigtNSwgMCwgNSksIG5ldyBWZWN0b3IoNSwgMCwgNSksIENvbG9yLldISVRFKTtcclxuLy8gICB2YXIgYSA9IENhbWVyYS53b3JsZFRvU2NyZWVuKGxpbmUuYSwgdmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCkucm91bmQoKTtcclxuLy8gICB2YXIgYiA9IENhbWVyYS53b3JsZFRvU2NyZWVuKGxpbmUuYiwgdmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCkucm91bmQoKTtcclxuLy8gICBSZW5kZXJlci5saW5lKGEueCwgYS55LCBiLngsIGIueSwgbGluZS5jb2xvci5yLCBsaW5lLmNvbG9yLmcsIGxpbmUuY29sb3IuYiwgbGluZS5jb2xvci5hKTtcclxuLy9cclxuLy8gICB2YXIgbGluZSA9IG5ldyBMaW5lKG5ldyBWZWN0b3IoNSwgMCwgNSksIG5ldyBWZWN0b3IoNSwgMCwgLTUpLCBDb2xvci5XSElURSk7XHJcbi8vICAgdmFyIGEgPSBDYW1lcmEud29ybGRUb1NjcmVlbihsaW5lLmEsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpLnJvdW5kKCk7XHJcbi8vICAgdmFyIGIgPSBDYW1lcmEud29ybGRUb1NjcmVlbihsaW5lLmIsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpLnJvdW5kKCk7XHJcbi8vICAgUmVuZGVyZXIubGluZShhLngsIGEueSwgYi54LCBiLnksIGxpbmUuY29sb3IuciwgbGluZS5jb2xvci5nLCBsaW5lLmNvbG9yLmIsIGxpbmUuY29sb3IuYSk7XHJcbi8vXHJcbi8vICAgdmFyIGxpbmUgPSBuZXcgTGluZShuZXcgVmVjdG9yKDUsIDAsIC01KSwgbmV3IFZlY3RvcigtNSwgMCwgLTUpLCBDb2xvci5XSElURSk7XHJcbi8vICAgdmFyIGEgPSBDYW1lcmEud29ybGRUb1NjcmVlbihsaW5lLmEsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpLnJvdW5kKCk7XHJcbi8vICAgdmFyIGIgPSBDYW1lcmEud29ybGRUb1NjcmVlbihsaW5lLmIsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpLnJvdW5kKCk7XHJcbi8vICAgUmVuZGVyZXIubGluZShhLngsIGEueSwgYi54LCBiLnksIGxpbmUuY29sb3IuciwgbGluZS5jb2xvci5nLCBsaW5lLmNvbG9yLmIsIGxpbmUuY29sb3IuYSk7XHJcbi8vXHJcbi8vICAgLy8gUmVuZGVyZXIuc2V0UGl4ZWwoYS54LCBhLnksIDI1NSwgMCwgMCwgMjU1KTtcclxuLy8gfVxyXG5cclxuXHJcbkVuZ2luZS5zd2FwQnVmZmVyID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gRW5naW5lLmltYWdlRGF0YS5kYXRhLnNldChSZW5kZXJlci5zdXJmYWNlLmJ1ZjgpO1xyXG4gIC8vIEVuZ2luZS5pbWFnZURhdGEuZGF0YS5zZXQoUmVuZGVyZXIuc3VyZmFjZS5idWYzMik7XHJcbiAgRW5naW5lLm9mZnNjcmVlbkNvbnRleHQucHV0SW1hZ2VEYXRhKEVuZ2luZS5pbWFnZURhdGEsIDAsIDApO1xyXG4gIEVuZ2luZS5jb250ZXh0LmRyYXdJbWFnZShFbmdpbmUub2Zmc2NyZWVuQ2FudmFzLCAwLCAwLCBFbmdpbmUud2lkdGggKiBFbmdpbmUuc2NhbGUsIEVuZ2luZS5oZWlnaHQgKiBFbmdpbmUuc2NhbGUpO1xyXG4gIC8vIEVuZ2luZS5jb250ZXh0LnB1dEltYWdlRGF0YShFbmdpbmUuaW1hZ2VEYXRhLCAwLCAwKTtcclxufVxyXG5cclxuRW5naW5lLmRyYXdPdmVybGF5ID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGN0eCA9IEVuZ2luZS5jb250ZXh0O1xyXG5cclxuICBpZiAoRW5naW5lLnNob3dTdGF0cykge1xyXG4gICAgdmFyIHkgPSA0MDtcclxuXHJcbiAgICBjdHguZmlsbFN0eWxlID0gJ3JnYigwLCAyNTUsIDApJztcclxuICAgIGN0eC5maWxsVGV4dCgnZnBzOiAnICsgTWF0aC5yb3VuZChFbmdpbmUuZnBzLmF2ZXJhZ2UpLCAxMCwgeSk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2IoMCwgMjU1LCAwKSc7XHJcbiAgICBjdHguZmlsbFRleHQoJ3RyaS9sYXJnZTogJyArIFJlbmRlcmVyLnRyaWNvdW50ICsgJy8nICsgUmVuZGVyZXIubGFyZ2V0cmksIDEwLCB5ICsgMjApO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSAncmdiKDAsIDI1NSwgMCknO1xyXG4gICAgY3R4LmZpbGxUZXh0KCdwaXhlbHM6ICcgKyBSZW5kZXJlci5waXhjb3VudCwgMTAsIHkgKyA0MCk7XHJcblxyXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2IoMCwgMjU1LCAwKSc7XHJcbiAgICBjdHguZmlsbFRleHQoJ2FjdGl2ZSB0cmFuc2l0aW9uczogJyArIEVuZ2luZS50cmFuc2l0aW9ucy5sZW5ndGgsIDEwLCB5ICsgNjApO1xyXG5cclxuICAgIGN0eC5maWxsU3R5bGUgPSAncmdiKDAsIDI1NSwgMCknO1xyXG4gICAgY3R4LmZpbGxUZXh0KCdpbmRleDogJyArIEVuZ2luZS5ncmlkSW5kZXgsIDEwLCB5ICsgODApO1xyXG4gIH1cclxuXHJcbiAgdmFyIHRleHQgPSAnQ3Vib2lkIHYnICsgdmVyc2lvbjtcclxuICBjdHguZmlsbFN0eWxlID0gJ3JnYigxNjAsIDE2MCwgMTYwKSc7XHJcbiAgY3R4LmZvbnQgPSAnMTRweCBzYW5zLXNlcmlmJztcclxuICB2YXIgdG0gPSBjdHgubWVhc3VyZVRleHQodGV4dCk7XHJcbiAgY3R4LmZpbGxUZXh0KHRleHQsIDgsIDIwKTtcclxuXHJcbiAgaWYgKCFFbmdpbmUuYWN0aXZlKSB7XHJcbiAgICBjdHguZ2xvYmFsQWxwaGEgPSAxO1xyXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdibGFjayc7XHJcbiAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NhdHVyYXRpb24nO1xyXG4gICAgY3R4LmZpbGxSZWN0KDAsIDAsIEVuZ2luZS5jYW52YXMud2lkdGgsIEVuZ2luZS5jYW52YXMuaGVpZ2h0KTtcclxuICAgIGN0eC5nbG9iYWxBbHBoYSA9IDE7XHJcbiAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcclxuICAgIHZhciB4ID0gMTAsIHkgPSBFbmdpbmUuaGVpZ2h0ICogRW5naW5lLnNjYWxlIC0gMTY7XHJcbiAgICBjdHguZmlsbFN0eWxlID0nd2hpdGUnO1xyXG4gICAgY3R4LmZpbGxSZWN0KHgsIHksIDIsIDYpO1xyXG4gICAgY3R4LmZpbGxSZWN0KHggKyA0LCB5LCAyLCA2KTtcclxuICB9XHJcblxyXG59XHJcblxyXG5cclxuRW5naW5lLmRyYXcgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgY3R4ID0gRW5naW5lLmNvbnRleHQ7XHJcblxyXG4gIFJlbmRlcmVyLnJlc2V0KCk7XHJcbiAgUmVuZGVyZXIuc3VyZmFjZS5maWxsKDI4LCAyOCwgMzIsIDI1NSk7XHJcblxyXG4gIEVuZ2luZS5kcmF3RW50aXRpZXMoKTtcclxuXHJcbiAgLy8gaWYgKEVuZ2luZS5zaG93aWQpIHtcclxuICAvLyAgIGZvciAodmFyIHkgPSAwOyB5IDwgUmVuZGVyZXIuc3VyZmFjZS5oZWlnaHQ7IHkrKykge1xyXG4gIC8vICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IFJlbmRlcmVyLnN1cmZhY2Uud2lkdGg7IHgrKykge1xyXG4gIC8vICAgICAgIHZhciBpZCA9IFJlbmRlcmVyLmlkQnVmZmVyW3kgKiBSZW5kZXJlci5zdXJmYWNlLndpZHRoICsgeF07XHJcbiAgLy8gICAgICAgUmVuZGVyZXIuc2V0UGl4ZWwoeCwgeSwgaWQsIGlkLCBpZCwgMjU1KTtcclxuICAvLyAgICAgfVxyXG4gIC8vICAgfVxyXG4gIC8vIH1cclxuICAvL1xyXG4gIC8vIGlmIChFbmdpbmUuc2hvd2RlcHRoKSB7XHJcbiAgLy8gICBmb3IgKHZhciB5ID0gMDsgeSA8IFJlbmRlcmVyLnN1cmZhY2UuaGVpZ2h0OyB5KyspIHtcclxuICAvLyAgICAgZm9yICh2YXIgeCA9IDA7IHggPCBSZW5kZXJlci5zdXJmYWNlLndpZHRoOyB4KyspIHtcclxuICAvLyAgICAgICB2YXIgY29sb3IgPSBSZW5kZXJlci5kZXB0aEJ1ZmZlclt5ICogUmVuZGVyZXIuc3VyZmFjZS53aWR0aCArIHhdO1xyXG4gIC8vICAgICAgIGNvbG9yID0gTWF0aC5taW4oMjU1LCBjb2xvciAqIChjb2xvciAqIDAuMDUpKTtcclxuICAvLyAgICAgICBSZW5kZXJlci5zZXRQaXhlbCh4LCB5LCBjb2xvciwgY29sb3IsIGNvbG9yLCAyNTUpO1xyXG4gIC8vICAgICB9XHJcbiAgLy8gICB9XHJcbiAgLy8gfVxyXG4gIC8vXHJcbiAgLy8gaWYgKEVuZ2luZS5yYXkpIHtcclxuICAvLyAgIHZhciBsaW5lID0gbmV3IExpbmUobmV3IFZlY3RvcigpLCBFbmdpbmUucmF5LCBDb2xvci5CTFVFKTtcclxuICAvLyAgIFJlbmRlcmVyLmRyYXdMaW5lKGxpbmUpO1xyXG4gIC8vIH1cclxuXHJcbiAgLy8gRW5naW5lLmRyYXdUZXN0KCk7XHJcblxyXG4gIEVuZ2luZS5zd2FwQnVmZmVyKCk7XHJcbiAgRW5naW5lLmRyYXdPdmVybGF5KCk7XHJcblxyXG59XHJcblxyXG5cclxuRW5naW5lLm9uQmx1ciA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgRW5naW5lLnN0b3AoKTtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5vbkZvY3VzID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICBFbmdpbmUucmVzdW1lKCk7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUua2V5VGltZW91dCAgPSBmdW5jdGlvbihrZXkpIHtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5vbkNvbnRleHRNZW51ID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG59XHJcblxyXG5cclxuRW5naW5lLm9uU2Nyb2xsID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG59XHJcblxyXG5cclxuRW5naW5lLm9uS2V5RG93biA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgRW5naW5lLmtleXNbZXZlbnQua2V5XSA9IHRydWU7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUub25LZXlVcCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgaWYgKGV2ZW50LmtleSA9PSAnQXJyb3dMZWZ0Jykge1xyXG5cclxuICB9IGVsc2UgaWYgKGV2ZW50LmtleSA9PSAnQXJyb3dSaWdodCcpIHtcclxuXHJcbiAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJzEnKSB7XHJcbiAgICBFbmdpbmUuZ29MZXZlbCgwKTtcclxuXHJcbiAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJzInKSB7XHJcbiAgICBFbmdpbmUuZ29MZXZlbCgxKTtcclxuXHJcbiAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJzMnKSB7XHJcbiAgICBFbmdpbmUuZ29MZXZlbCgyKTtcclxuXHJcbiAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJzQnKSB7XHJcbiAgICBFbmdpbmUuZ29MZXZlbCgzKTtcclxuXHJcbiAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJ2knKSB7XHJcbiAgICBpZiAoRW5naW5lLnNob3dpZCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICBFbmdpbmUuc2hvd2lkID0gdHJ1ZTtcclxuICAgIGVsc2VcclxuICAgICAgRW5naW5lLnNob3dpZCA9ICFFbmdpbmUuc2hvd2lkO1xyXG4gIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09ICdkJykge1xyXG4gICAgaWYgKEVuZ2luZS5zaG93ZGVwdGggPT09IHVuZGVmaW5lZClcclxuICAgICAgRW5naW5lLnNob3dkZXB0aCA9IHRydWU7XHJcbiAgICBlbHNlXHJcbiAgICAgIEVuZ2luZS5zaG93ZGVwdGggPSAhRW5naW5lLnNob3dkZXB0aDtcclxuICB9IGVsc2UgaWYgKGV2ZW50LmtleSA9PSAncycpIHtcclxuICAgIGlmIChFbmdpbmUuc2hvd1N0YXRzID09PSB1bmRlZmluZWQpXHJcbiAgICAgIEVuZ2luZS5zaG93U3RhdHMgPSB0cnVlO1xyXG4gICAgZWxzZVxyXG4gICAgICBFbmdpbmUuc2hvd1N0YXRzID0gIUVuZ2luZS5zaG93U3RhdHM7XHJcbiAgfSBlbHNlIGlmIChldmVudC5rZXkgPT0gJz0nKSB7XHJcbiAgICBpZiAoRW5naW5lLmxldmVsSW5kZXggKyAxIDw9IEVuZ2luZS5sZXZlbHMubGVuZ3RoIC0gMSkge1xyXG4gICAgICBFbmdpbmUuZ29MZXZlbChFbmdpbmUubGV2ZWxJbmRleCArIDEpO1xyXG4gICAgICBFbmdpbmUubW92ZVRvKEVuZ2luZS5sZXZlbC5kZWZhdWx0KTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKGV2ZW50LmtleSA9PSAnLScpIHtcclxuICAgIGlmIChFbmdpbmUubGV2ZWxJbmRleCAtIDEgPj0gMCkge1xyXG4gICAgICBFbmdpbmUuZ29MZXZlbChFbmdpbmUubGV2ZWxJbmRleCAtIDEpO1xyXG4gICAgICBFbmdpbmUubW92ZVRvKEVuZ2luZS5sZXZlbC5kZWZhdWx0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRlbGV0ZShFbmdpbmUua2V5c1tldmVudC5rZXldKTtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5iZWdpbkludGVyYWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBvaW50ID0gbmV3IFZlY3RvcihFbmdpbmUuaW50ZXJhY3QueCwgRW5naW5lLmludGVyYWN0LnksIDApO1xyXG59XHJcblxyXG5cclxuRW5naW5lLnVwZGF0ZUludGVyYWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBTY3JlZW4gPSBuZXcgVmVjdG9yKChFbmdpbmUuaW50ZXJhY3QueCAvIEVuZ2luZS5zY2FsZSksIChFbmdpbmUuaW50ZXJhY3QueSAvIEVuZ2luZS5zY2FsZSksIDApO1xyXG4gIHZhciBkaXN0YW5jZSA9IE1hdGguYWJzKEVuZ2luZS5pbnRlcmFjdC5zdGFydFggLSBFbmdpbmUuaW50ZXJhY3QueCkgKyBNYXRoLmFicyhFbmdpbmUuaW50ZXJhY3Quc3RhcnRZIC0gRW5naW5lLmludGVyYWN0LnkpO1xyXG5cclxuICBpZiAoRW5naW5lLmludGVyYWN0LnByaW1hcnkgJiYgZGlzdGFuY2UgPiAzKSB7XHJcbiAgICBFbmdpbmUuaW50ZXJhY3QuZHJhZyA9IHRydWU7XHJcbiAgfVxyXG5cclxuICB2YXIgY2FtZXJhID0gUmVuZGVyZXIuY2FtZXJhO1xyXG5cclxuICBpZiAoRW5naW5lLmludGVyYWN0LmRyYWcpIHtcclxuICAgIHZhciBjZW50ZXIgPSBuZXcgVmVjdG9yKCk7XHJcbiAgICB2YXIgYXhpcyA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XHJcbiAgICB2YXIgZGVsdGEgPSBUaW1lLmRlbHRhO1xyXG4gICAgdmFyIGFuZ2xlID0gLShFbmdpbmUuaW50ZXJhY3QuZGVsdGFYKSAqIDAuMjtcclxuICAgIGNhbWVyYS50cmFuc2Zvcm0ucm90YXRlQXJvdW5kUXVhdGVybmlvbihjZW50ZXIsIGF4aXMsIGFuZ2xlKTtcclxuICAgIGNhbWVyYS5sb29rQXQoY2VudGVyLCBheGlzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIG9uID0gZmFsc2U7XHJcbiAgICB2YXIgaGVpZ2h0ID0gRW5naW5lLmN1YmUudHJhbnNmb3JtLnBvc2l0aW9uLnkgLSAwLjU7XHJcbiAgICB2YXIgcGxhbmUgPSBuZXcgVmVjdG9yKDAsIGhlaWdodCwgMClcclxuXHJcbiAgICB2YXIgcCA9IEVuZ2luZS5jYXN0UmF5KHBTY3JlZW4sIHBsYW5lKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IEVuZ2luZS5ncmlkLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBzcXVhcmUgPSBFbmdpbmUuZ3JpZFtpXTtcclxuICAgICAgaWYgKHNxdWFyZSkge1xyXG4gICAgICAgIGlmIChzcXVhcmUuaGVpZ2h0ID09IGhlaWdodCkge1xyXG4gICAgICAgICAgaWYgKGxpYi5wb2ludEluUmVjdChwLngsIHAueiwgc3F1YXJlLnggLSAwLjUsIHNxdWFyZS56IC0gMC41LCAxLjAsIDEuMCkpIHtcclxuICAgICAgICAgICAgb24gPSB0cnVlO1xyXG4gICAgICAgICAgICBFbmdpbmUuZ3JpZEluZGV4ID0gaTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgRW5naW5lLmhpdCA9IHA7XHJcblxyXG4gICAgaWYgKCFvbikge1xyXG4gICAgICBFbmdpbmUuZ3JpZEluZGV4ID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEVuZ2luZS5ncmlkSWQgPSBpZDtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5lbmRJbnRlcmFjdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwUmFzdGVyID0gbmV3IFZlY3RvcihFbmdpbmUuaW50ZXJhY3QueCAvIEVuZ2luZS5zY2FsZSwgRW5naW5lLmludGVyYWN0LnkgLyBFbmdpbmUuc2NhbGUsIDApO1xyXG5cclxuICBpZiAoIUVuZ2luZS5pbnRlcmFjdC5kcmFnKSB7XHJcbiAgICBpZiAoRW5naW5lLmlzVmFsaWRNb3ZlKEVuZ2luZS5ncmlkSW5kZXgpKSB7XHJcbiAgICAgIEVuZ2luZS5tb3ZlVG8oRW5naW5lLmdyaWRJbmRleCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBFbmdpbmUuaW50ZXJhY3QucHJpbWFyeVVwID0gdHJ1ZTtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5wcm9jZXNzTW91c2VFdmVudCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgRW5naW5lLmludGVyYWN0LnggPSBldmVudC5jbGllbnRYIC0gRW5naW5lLnN0YWdlLm9mZnNldExlZnQ7XHJcbiAgRW5naW5lLmludGVyYWN0LnkgPSBldmVudC5jbGllbnRZIC0gRW5naW5lLnN0YWdlLm9mZnNldFRvcDtcclxuXHJcbiAgRW5naW5lLmludGVyYWN0LmJ1dHRvbiA9IGV2ZW50LmJ1dHRvbjtcclxuICBFbmdpbmUuaW50ZXJhY3QuYnV0dG9ucyA9IGV2ZW50LmJ1dHRvbnM7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUub25DbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUub25Nb3VzZURvd24gPSBmdW5jdGlvbihldmVudCkge1xyXG4gIEVuZ2luZS5wcm9jZXNzTW91c2VFdmVudChldmVudCk7XHJcbiAgRW5naW5lLmludGVyYWN0LnN0YXJ0WCA9IEVuZ2luZS5pbnRlcmFjdC54O1xyXG4gIEVuZ2luZS5pbnRlcmFjdC5zdGFydFkgPSBFbmdpbmUuaW50ZXJhY3QueTtcclxuICBFbmdpbmUuaW50ZXJhY3QubGFzdFggPSBFbmdpbmUuaW50ZXJhY3QueDtcclxuICBFbmdpbmUuaW50ZXJhY3QubGFzdFkgPSBFbmdpbmUuaW50ZXJhY3QueTtcclxuICBFbmdpbmUuaW50ZXJhY3QuZGVsdGFYID0gMDtcclxuICBFbmdpbmUuaW50ZXJhY3QuZGVsdGFZID0gMDtcclxuICBFbmdpbmUuaW50ZXJhY3QuZHJhZyA9IGZhbHNlO1xyXG5cclxuICBpZiAoRW5naW5lLmludGVyYWN0LmJ1dHRvbiA9PSAwKSB7XHJcbiAgICBFbmdpbmUuaW50ZXJhY3QucHJpbWFyeSA9IHRydWU7XHJcbiAgICBFbmdpbmUuaW50ZXJhY3QucHJpbWFyeVVwID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBpZiAoRW5naW5lLmFjdGl2ZSkgRW5naW5lLmJlZ2luSW50ZXJhY3Rpb24oKTtcclxuXHJcbiAgRW5naW5lLmludGVyYWN0Lmxhc3RYID0gRW5naW5lLmludGVyYWN0Lng7XHJcbiAgRW5naW5lLmludGVyYWN0Lmxhc3RZID0gRW5naW5lLmludGVyYWN0Lnk7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUub25Nb3VzZU1vdmUgPSBmdW5jdGlvbihldmVudCkge1xyXG4gIEVuZ2luZS5wcm9jZXNzTW91c2VFdmVudChldmVudCk7XHJcblxyXG4gIEVuZ2luZS5pbnRlcmFjdC5kZWx0YVggPSBFbmdpbmUuaW50ZXJhY3QueCAtIEVuZ2luZS5pbnRlcmFjdC5sYXN0WDtcclxuICBFbmdpbmUuaW50ZXJhY3QuZGVsdGFZID0gRW5naW5lLmludGVyYWN0LnkgLSBFbmdpbmUuaW50ZXJhY3QubGFzdFk7XHJcblxyXG4gIGlmIChFbmdpbmUuYWN0aXZlKSBFbmdpbmUudXBkYXRlSW50ZXJhY3Rpb24oKTtcclxuXHJcbiAgRW5naW5lLmludGVyYWN0Lmxhc3RYID0gRW5naW5lLmludGVyYWN0Lng7XHJcbiAgRW5naW5lLmludGVyYWN0Lmxhc3RZID0gRW5naW5lLmludGVyYWN0Lnk7XHJcblxyXG4gIC8vIGNvbnNvbGUubG9nKEVuZ2luZS5pbnRlcmFjdC5kZWx0YVgpO1xyXG5cclxufVxyXG5cclxuXHJcbkVuZ2luZS5vbk1vdXNlVXAgPSBmdW5jdGlvbihldmVudCkge1xyXG4gIEVuZ2luZS5wcm9jZXNzTW91c2VFdmVudChldmVudCk7XHJcbiAgaWYgKEVuZ2luZS5hY3RpdmUpIEVuZ2luZS5lbmRJbnRlcmFjdGlvbigpO1xyXG5cclxuICAvLyBFbmdpbmUuaW50ZXJhY3QubGFzdFggPSBFbmdpbmUuaW50ZXJhY3QueDtcclxuICAvLyBFbmdpbmUuaW50ZXJhY3QubGFzdFkgPSBFbmdpbmUuaW50ZXJhY3QueTtcclxuXHJcbiAgRW5naW5lLmludGVyYWN0Lmxhc3RYID0gMDtcclxuICBFbmdpbmUuaW50ZXJhY3QubGFzdFkgPSAwO1xyXG4gIEVuZ2luZS5pbnRlcmFjdC5wcmltYXJ5ID0gZmFsc2U7XHJcbiAgRW5naW5lLmludGVyYWN0LmRyYWcgPSBmYWxzZTtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5vbk1vdXNlT3V0ID0gZnVuY3Rpb24oZXZlbnQpIHtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5vbk1vdXNlT3ZlciA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUucHJvY2Vzc1RvdWNoRXZlbnQgPSBmdW5jdGlvbihldmVudCkge1xyXG4gIEVuZ2luZS5pbnRlcmFjdC54ID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WCAtIEVuZ2luZS5zdGFnZS5vZmZzZXRMZWZ0O1xyXG4gIEVuZ2luZS5pbnRlcmFjdC55ID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WSAtIEVuZ2luZS5zdGFnZS5vZmZzZXRUb3A7XHJcbiAgRW5naW5lLmludGVyYWN0LnByaW1hcnkgPSB0cnVlO1xyXG59XHJcblxyXG5cclxuRW5naW5lLm9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgRW5naW5lLnByb2Nlc3NUb3VjaEV2ZW50KGV2ZW50KTtcclxuICBFbmdpbmUuaW50ZXJhY3Quc3RhcnRYID0gRW5naW5lLmludGVyYWN0Lng7XHJcbiAgRW5naW5lLmludGVyYWN0LnN0YXJ0WSA9IEVuZ2luZS5pbnRlcmFjdC55O1xyXG4gIEVuZ2luZS5pbnRlcmFjdC5sYXN0WCA9IEVuZ2luZS5pbnRlcmFjdC54O1xyXG4gIEVuZ2luZS5pbnRlcmFjdC5sYXN0WSA9IEVuZ2luZS5pbnRlcmFjdC55O1xyXG4gIEVuZ2luZS5pbnRlcmFjdC5kZWx0YVggPSBFbmdpbmUuaW50ZXJhY3QueCAtIEVuZ2luZS5pbnRlcmFjdC5sYXN0WDtcclxuICBFbmdpbmUuaW50ZXJhY3QuZGVsdGFZID0gRW5naW5lLmludGVyYWN0LnkgLSBFbmdpbmUuaW50ZXJhY3QubGFzdFk7XHJcblxyXG4gIEVuZ2luZS5iZWdpbkludGVyYWN0aW9uKCk7XHJcblxyXG59XHJcblxyXG5cclxuRW5naW5lLm9uVG91Y2hNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIEVuZ2luZS5wcm9jZXNzVG91Y2hFdmVudChldmVudCk7XHJcblxyXG4gIEVuZ2luZS5pbnRlcmFjdC5kZWx0YVggPSBFbmdpbmUuaW50ZXJhY3QueCAtIEVuZ2luZS5pbnRlcmFjdC5sYXN0WDtcclxuICBFbmdpbmUuaW50ZXJhY3QuZGVsdGFZID0gRW5naW5lLmludGVyYWN0LnkgLSBFbmdpbmUuaW50ZXJhY3QubGFzdFk7XHJcblxyXG4gIGlmIChFbmdpbmUuYWN0aXZlKSBFbmdpbmUudXBkYXRlSW50ZXJhY3Rpb24oKTtcclxuXHJcbiAgRW5naW5lLmludGVyYWN0Lmxhc3RYID0gRW5naW5lLmludGVyYWN0Lng7XHJcbiAgRW5naW5lLmludGVyYWN0Lmxhc3RZID0gRW5naW5lLmludGVyYWN0Lnk7XHJcbn1cclxuXHJcblxyXG5FbmdpbmUub25Ub3VjaEVuZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICBFbmdpbmUucHJvY2Vzc1RvdWNoRXZlbnQoZXZlbnQpO1xyXG4gIEVuZ2luZS5lbmRJbnRlcmFjdGlvbigpO1xyXG5cclxuICAvLyBFbmdpbmUuaW50ZXJhY3QubGFzdFggPSBFbmdpbmUuaW50ZXJhY3QueDtcclxuICAvLyBFbmdpbmUuaW50ZXJhY3QubGFzdFkgPSBFbmdpbmUuaW50ZXJhY3QueTtcclxuICBFbmdpbmUuaW50ZXJhY3QubGFzdFggPSAwO1xyXG4gIEVuZ2luZS5pbnRlcmFjdC5sYXN0WSA9IDA7XHJcbiAgRW5naW5lLmludGVyYWN0LnByaW1hcnkgPSBmYWxzZTtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5pbml0RXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpIHtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIEVuZ2luZS5vbkJsdXIpO1xyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIEVuZ2luZS5vbkZvY3VzKTtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIEVuZ2luZS5vbktleURvd24pO1xyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIEVuZ2luZS5vbktleVVwKTtcclxuXHJcblxyXG4gIEVuZ2luZS5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgRW5naW5lLm9uTW91c2VEb3duKTtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgRW5naW5lLm9uTW91c2VNb3ZlKTtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIEVuZ2luZS5vbk1vdXNlVXApO1xyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsIEVuZ2luZS5vbk1vdXNlT3V0KTtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgRW5naW5lLm9uTW91c2VPdmVyKTtcclxuXHJcbiAgRW5naW5lLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIEVuZ2luZS5vbkNvbnRleHRNZW51KTtcclxuXHJcbiAgRW5naW5lLnN0YWdlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBFbmdpbmUub25Ub3VjaFN0YXJ0KTtcclxuICBFbmdpbmUuc3RhZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBFbmdpbmUub25Ub3VjaEVuZCk7XHJcbiAgRW5naW5lLnN0YWdlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIEVuZ2luZS5vblRvdWNoTW92ZSk7XHJcblxyXG4gIC8vIEVuZ2luZS5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgRW5naW5lLm9uU2Nyb2xsKTtcclxufVxyXG5cclxuXHJcbkVuZ2luZS5jcmVhdGVFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gIEVuZ2luZS5zdGFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGFnZScpO1xyXG4gIEVuZ2luZS5zdGFnZS5zdHlsZS53aWR0aCA9IChFbmdpbmUud2lkdGggKiBFbmdpbmUuc2NhbGUpICsgJ3B4JztcclxuICBFbmdpbmUuc3RhZ2Uuc3R5bGUuaGVpZ2h0ID0gKEVuZ2luZS5oZWlnaHQgKiBFbmdpbmUuc2NhbGUpICsgJ3B4JztcclxuXHJcbiAgdmFyIGFib3V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Fib3V0Jyk7XHJcbiAgdmFyIGFib3V0SWNvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhYm91dC1pY29uJyk7XHJcblxyXG4gIGFib3V0Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGlmIChhYm91dC5zdHlsZS52aXNpYmlsaXR5ICE9ICdoaWRkZW4nKSB7XHJcbiAgICAgIGFib3V0LnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFib3V0SWNvbi5vbmNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGFib3V0LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgfVxyXG5cclxuICBFbmdpbmUuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgRW5naW5lLmNhbnZhcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnZ3JlZW4nO1xyXG4gIEVuZ2luZS5jYW52YXMuaWQgPSAnc3VyZmFjZSc7XHJcbiAgRW5naW5lLmNhbnZhcy53aWR0aCA9IEVuZ2luZS53aWR0aCAqIEVuZ2luZS5zY2FsZTtcclxuICBFbmdpbmUuY2FudmFzLmhlaWdodCA9IEVuZ2luZS5oZWlnaHQgKiBFbmdpbmUuc2NhbGU7XHJcbiAgRW5naW5lLmNhbnZhcy5zdHlsZS51c2VyU2VsZWN0ID0gJ25vbmUnO1xyXG4gIEVuZ2luZS5zdGFnZS5hcHBlbmRDaGlsZChFbmdpbmUuY2FudmFzKTtcclxuXHJcbiAgRW5naW5lLmNvbnRleHQgPSBFbmdpbmUuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gIEVuZ2luZS5vZmZzY3JlZW5DYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICBFbmdpbmUub2Zmc2NyZWVuQ2FudmFzLndpZHRoID0gRW5naW5lLm9mZnNjcmVlbldpZHRoO1xyXG4gIEVuZ2luZS5vZmZzY3JlZW5DYW52YXMuaGVpZ2h0ID0gRW5naW5lLm9mZnNjcmVlbkhlaWdodDtcclxuXHJcbiAgRW5naW5lLm9mZnNjcmVlbkNvbnRleHQgPSBFbmdpbmUub2Zmc2NyZWVuQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gIGlmIChFbmdpbmUuY29udGV4dC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgRW5naW5lLmNvbnRleHQubW96SW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XHJcbiAgICBFbmdpbmUuY29udGV4dC53ZWJraXRJbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcclxuICAgIEVuZ2luZS5jb250ZXh0Lm1zSW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XHJcbiAgfSBlbHNlIHtcclxuICAgIEVuZ2luZS5jb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuRW5naW5lLm9uUmVzb3VyY2VMb2FkID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcclxuICB2YXIgcmVzID0gUmVzb3VyY2UuZ2V0KGZpbGVuYW1lKTtcclxuICBpZiAocmVzLnR5cGUgPT0gJ29iaicpIHtcclxuICAgIEVuZ2luZS5tZXNoZXNbZmlsZW5hbWVdID0gTWVzaC5mcm9tT0JKKHJlcyk7XHJcbiAgfSBlbHNlIGlmIChyZXMudHlwZSA9PSAncG5nJykge1xyXG4gICAgRW5naW5lLnRleHR1cmVzW2ZpbGVuYW1lXSA9IFRleHR1cmUuZnJvbUltYWdlKHJlcy5jb250ZW50KTtcclxuICB9XHJcbiAgaWYgKFJlc291cmNlLmRvbmUpIHtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBFbmdpbmUuYm9vdHVwKClcclxuICAgIH0sIDUwMCk7XHJcbiAgfVxyXG59XHJcblxyXG5FbmdpbmUubG9hZFJlc291cmNlcyA9IGZ1bmN0aW9uKCkge1xyXG4gIFJlc291cmNlLmluaXQoRW5naW5lLm9uUmVzb3VyY2VMb2FkKTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IE1FU0hFUy5sZW5ndGg7IGkrKykge1xyXG4gICAgUmVzb3VyY2UubG9hZChNRVNIRVNbaV0pO1xyXG4gIH1cclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBURVhUVVJFUy5sZW5ndGg7IGkrKykge1xyXG4gICAgUmVzb3VyY2UubG9hZChURVhUVVJFU1tpXSk7XHJcbiAgfVxyXG59XHJcblxyXG5FbmdpbmUuYm9vdHVwID0gZnVuY3Rpb24oKSB7XHJcbiAgRW5naW5lLmNyZWF0ZVdvcmxkKCk7XHJcbiAgRW5naW5lLmluaXRpYWxpc2VkID0gdHJ1ZTtcclxuICBFbmdpbmUuZmlyc3QgPSB0cnVlO1xyXG4gIFRpbWUuc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICBFbmdpbmUucmVzdW1lKCk7XHJcbn1cclxuXHJcbkVuZ2luZS51cGRhdGVUcmFuc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgRW5naW5lLnRyYW5zaXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBFbmdpbmUudHJhbnNpdGlvbnNbaV0udXBkYXRlKCk7XHJcbiAgfVxyXG4gIEVuZ2luZS50cmFuc2l0aW9ucyA9IEVuZ2luZS50cmFuc2l0aW9ucy5maWx0ZXIoZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgcmV0dXJuICFlbGVtZW50LmlzQ29tcGxldGVkKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbkVuZ2luZS51cGRhdGUgPSBmdW5jdGlvbigpICB7XHJcbiAgdmFyIGNhbWVyYSA9IFJlbmRlcmVyLmNhbWVyYTtcclxuICB2YXIgY2VudGVyID0gbmV3IFZlY3RvcigpO1xyXG4gIHZhciBheGlzID0gbmV3IFZlY3RvcigwLCAxLCAwKTtcclxuICB2YXIgZGVsdGEgPSBUaW1lLmRlbHRhO1xyXG5cclxuICBpZiAoRW5naW5lLmdyaWQpIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgRW5naW5lLmdyaWQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHNxdWFyZSA9IEVuZ2luZS5ncmlkW2ldO1xyXG4gICAgICBpZiAoc3F1YXJlKSB7XHJcbiAgICAgICAgaWYgKENvbG9yLmVxdWFscyhzcXVhcmUuY29sb3IsIEdyaWRUeXBlLlRFTEVQT1JUKSkge1xyXG4gICAgICAgICAgaWYgKHNxdWFyZS5lbnRpdHkpIHtcclxuICAgICAgICAgICAgc3F1YXJlLmVudGl0eS50cmFuc2Zvcm0ucm90YXRpb24ueSArPSAoMC4yICogZGVsdGEpICogbGliLlJBRDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChFbmdpbmUua2V5c1snQXJyb3dMZWZ0J10pIHtcclxuICB9XHJcblxyXG4gIGlmIChFbmdpbmUua2V5c1snQXJyb3dSaWdodCddKSB7XHJcbiAgfVxyXG5cclxuICBpZiAoRW5naW5lLmtleXNbJ0Fycm93VXAnXSkge1xyXG4gICAgY2FtZXJhLnRyYW5zZm9ybS5wb3NpdGlvbi55LS07XHJcbiAgICBjYW1lcmEubG9va0F0KG5ldyBWZWN0b3IoKSwgbmV3IFZlY3RvcigwLCAxLCAwKSk7XHJcbiAgfVxyXG5cclxuICBpZiAoRW5naW5lLmtleXNbJ0Fycm93RG93biddKSB7XHJcbiAgICBjYW1lcmEudHJhbnNmb3JtLnBvc2l0aW9uLnkrKztcclxuICAgIGNhbWVyYS5sb29rQXQobmV3IFZlY3RvcigpLCBuZXcgVmVjdG9yKDAsIDEsIDApKTtcclxuICB9XHJcblxyXG4gIGlmIChFbmdpbmUua2V5c1snKyddKSB7XHJcbiAgICAvLyBFbmdpbmUuZW50aXRpZXNbMF0udHJhbnNmb3JtLnBvc2l0aW9uLnogKz0gNSAqIGRlbHRhO1xyXG4gIH1cclxuXHJcbiAgaWYgKEVuZ2luZS5rZXlzWyctJ10pIHtcclxuICAgIC8vIEVuZ2luZS5lbnRpdGllc1swXS50cmFuc2Zvcm0ucG9zaXRpb24ueiAtPSA1ICogZGVsdGE7XHJcbiAgfVxyXG5cclxufVxyXG5cclxuRW5naW5lLmZyYW1lID0gZnVuY3Rpb24odGltZXN0YW1wKSB7XHJcbiAgaWYgKEVuZ2luZS5hY3RpdmUgJiYgUmVzb3VyY2UuZG9uZSkge1xyXG4gICAgLy8gdmFyIGludGVydmFsID0gMTAwMCAvIEVuZ2luZS5mcHMuc3RhbmRhcmQ7XHJcbiAgICBUaW1lLm5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgLy8gVGltZS5ub3cgPSB0aW1lc3RhbXA7XHJcbiAgICBUaW1lLmRlbHRhID0gMTAwMCAvIChUaW1lLm5vdyAtIFRpbWUudGhlbik7XHJcblxyXG4gICAgLy8gaWYgKFRpbWUuZGVsdGEgPj0gaW50ZXJ2YWwpIHtcclxuICAgICAgRW5naW5lLnVwZGF0ZSgpO1xyXG4gICAgICBFbmdpbmUudXBkYXRlVHJhbnNpdGlvbnMoKTtcclxuICAgICAgRW5naW5lLmRyYXcoKTtcclxuXHJcbiAgICAgIC8vIFRpbWUudGhlbiA9IFRpbWUubm93IC0gKFRpbWUuZGVsdGEgJSBpbnRlcnZhbCk7XHJcbiAgICAgIEVuZ2luZS5mcHMuYXZlcmFnZSA9IEVuZ2luZS5mcHMuYXZlcmFnZSAqIDAuOTkgKyBUaW1lLmRlbHRhICogMC4wMTtcclxuICAgIC8vIH1cclxuXHJcbiAgICBUaW1lLmNvdW50Kys7XHJcblxyXG4gICAgLy8gaWYgKEVuZ2luZS5mcHNFbCkge1xyXG4gICAgLy8gICBpZiAoVGltZS5jb3VudCAlIEVuZ2luZS5mcHMuc3RhbmRhcmQgPT0gMCkge1xyXG4gICAgLy8gICAgIEVuZ2luZS5mcHNFbC5pbm5lckhUTUwgPSBFbmdpbmUuZnBzLmF2ZXJhZ2UudG9GaXhlZCgxKTtcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfVxyXG5cclxuICAgIFRpbWUudGhlbiA9IFRpbWUubm93O1xyXG4gICAgRW5naW5lLmZyYW1lSUQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoRW5naW5lLmZyYW1lKTtcclxuXHJcbiAgICBFbmdpbmUuZmlyc3QgPSBmYWxzZTtcclxuICB9XHJcbiAgLy8gRW5naW5lLmtleXMgPSB7fTtcclxuICBFbmdpbmUuaW50ZXJhY3QucHJpbWFyeVVwID0gZmFsc2U7XHJcbiAgRW5naW5lLmludGVyYWN0LmRlbHRhWCA9IDA7XHJcbiAgRW5naW5lLmludGVyYWN0LmRlbHRhWSA9IDA7XHJcbn1cclxuXHJcbkVuZ2luZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoRW5naW5lLmluaXRpYWxpc2VkKSB7XHJcbiAgICBFbmdpbmUuYWN0aXZlID0gdHJ1ZTtcclxuICAgIFRpbWUubm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICBUaW1lLnRoZW4gPSBUaW1lLm5vdztcclxuICAgIFRpbWUuY291bnQgPSAwO1xyXG4gICAgRW5naW5lLmZwcy5hdmVyYWdlID0gRW5naW5lLmZwcy5zdGFuZGFyZDtcclxuICAgIEVuZ2luZS5mcmFtZUlEID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKEVuZ2luZS5mcmFtZSk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBFbmdpbmUudHJhbnNpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgRW5naW5lLnRyYW5zaXRpb25zW2ldLnN0YXJ0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5FbmdpbmUuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG4gIEVuZ2luZS5hY3RpdmUgPSBmYWxzZTtcclxuICBjYW5jZWxBbmltYXRpb25GcmFtZShFbmdpbmUuZnJhbWVJRCk7XHJcbiAgRW5naW5lLmRyYXcoKTtcclxufVxyXG5cclxuRW5naW5lLmluaXQgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBzY2FsZSkge1xyXG4gIGNvbnNvbGUubG9nKCdpbml0Jyk7XHJcblxyXG4gIEVuZ2luZS5mcHMgPSB7fTtcclxuICBFbmdpbmUuZnBzLnN0YW5kYXJkID0gNjA7XHJcblxyXG4gIEVuZ2luZS5pbnRlcmFjdCA9IHt9O1xyXG4gIEVuZ2luZS5rZXlzID0ge307XHJcbiAgRW5naW5lLmVudGl0aWVzID0gW107XHJcbiAgRW5naW5lLmxpbmVzID0gW107XHJcbiAgRW5naW5lLnRyYW5zaXRpb25zID0gW107XHJcblxyXG4gIEVuZ2luZS5zY2FsZSA9IChzY2FsZSAhPT0gdW5kZWZpbmVkID8gc2NhbGUgOiAxKTtcclxuXHJcbiAgRW5naW5lLndpZHRoID0gd2lkdGg7XHJcbiAgRW5naW5lLmhlaWdodCA9IGhlaWdodDtcclxuICBFbmdpbmUuZ3JpZFNpemUgPSAxNjtcclxuXHJcbiAgRW5naW5lLm9mZnNjcmVlbldpZHRoID0gRW5naW5lLndpZHRoO1xyXG4gIEVuZ2luZS5vZmZzY3JlZW5IZWlnaHQgPSBFbmdpbmUuaGVpZ2h0O1xyXG5cclxuICBFbmdpbmUubWVzaGVzID0ge307XHJcbiAgRW5naW5lLnRleHR1cmVzID0ge307XHJcblxyXG4gIEVuZ2luZS5jcmVhdGVFbGVtZW50cygpO1xyXG4gIEVuZ2luZS5pbml0RXZlbnRMaXN0ZW5lcnMoKTtcclxuICBFbmdpbmUubG9hZFJlc291cmNlcygpO1xyXG5cclxufVxyXG5cclxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gIEVuZ2luZS5pbml0KDMyMCwgMjAwLCAzKTtcclxufVxyXG5cclxud2luZG93LkVuZ2luZSA9IEVuZ2luZTtcclxud2luZG93LlRpbWUgPSBUaW1lO1xyXG4iLCJ2YXIgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi90cmFuc2Zvcm0nKTtcclxudmFyIE1hdHJpeCA9IHJlcXVpcmUoJy4vbWF0cml4Jyk7XHJcblxyXG5mdW5jdGlvbiBFbnRpdHkocGFyYW1zKSB7XHJcbiAgdGhpcy50cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKCk7XHJcbiAgdGhpcy50cmFuc2Zvcm0ucG9zaXRpb24ueCA9IChwYXJhbXMueCAhPT0gdW5kZWZpbmVkID8gcGFyYW1zLnggOiAwKTtcclxuICB0aGlzLnRyYW5zZm9ybS5wb3NpdGlvbi55ID0gKHBhcmFtcy55ICE9PSB1bmRlZmluZWQgPyBwYXJhbXMueSA6IDApO1xyXG4gIHRoaXMudHJhbnNmb3JtLnBvc2l0aW9uLnogPSAocGFyYW1zLnogIT09IHVuZGVmaW5lZCA/IHBhcmFtcy56IDogMCk7XHJcbiAgdGhpcy50bSA9IG5ldyBNYXRyaXgoKTtcclxuICB0aGlzLnZpc2libGUgPSB0cnVlO1xyXG4gIHRoaXMubmFtZSA9IHBhcmFtcy5uYW1lO1xyXG4gIHRoaXMuYnJpZ2h0ID0gZmFsc2U7XHJcbn1cclxuXHJcbi8vIEVudGl0eS5wcm90b3R5cGUudG9Mb2NhbCA9IGZ1bmN0aW9uKHApIHtcclxuLy8gICB2YXIgdCA9IHRoaXMuZ2V0VHJhbnNmb3JtTWF0cml4KCk7XHJcbi8vICAgcmV0dXJuICh0LmludmVyc2UoKSkubXVsdGlwbHlQb2ludChwKTtcclxuLy8gICAvLyByZXR1cm4gVmVjdG9yLmNvcHkocCk7XHJcbi8vIH1cclxuLy9cclxuLy9cclxuLy8gRW50aXR5LnByb3RvdHlwZS50b1dvcmxkID0gZnVuY3Rpb24ocCkge1xyXG4vLyAgIHZhciB0ID0gdGhpcy5nZXRUcmFuc2Zvcm1NYXRyaXgoKTtcclxuLy8gICByZXR1cm4gdC5tdWx0aXBseVBvaW50KHApO1xyXG4vLyB9XHJcblxyXG5cclxuRW50aXR5LnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1NYXRyaXggPSBmdW5jdGlvbigpIHtcclxuICB2YXIgdCA9IHRoaXMuZ2V0VHJhbnNsYXRpb25NYXRyaXgoKTtcclxuICB2YXIgcyA9IHRoaXMuZ2V0U2NhbGVNYXRyaXgoKTtcclxuICB2YXIgciA9IHRoaXMuZ2V0Um90YXRpb25NYXRyaXgoKTtcclxuICByZXR1cm4gTWF0cml4Lm11bHRpcGx5KHMsIHIpLm11bHRpcGx5KHQpO1xyXG59XHJcblxyXG5FbnRpdHkucHJvdG90eXBlLmdldFRyYW5zbGF0aW9uTWF0cml4ID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIE1hdHJpeC50cmFuc2xhdGlvbih0aGlzLnRyYW5zZm9ybS5wb3NpdGlvbi54LCB0aGlzLnRyYW5zZm9ybS5wb3NpdGlvbi55LCB0aGlzLnRyYW5zZm9ybS5wb3NpdGlvbi56KTtcclxufVxyXG5cclxuRW50aXR5LnByb3RvdHlwZS5nZXRTY2FsZU1hdHJpeCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRyaXguc2NhbGUodGhpcy50cmFuc2Zvcm0uc2NhbGUueCwgdGhpcy50cmFuc2Zvcm0uc2NhbGUueSwgdGhpcy50cmFuc2Zvcm0uc2NhbGUueik7XHJcbn1cclxuXHJcbkVudGl0eS5wcm90b3R5cGUuZ2V0Um90YXRpb25NYXRyaXggPSBmdW5jdGlvbigpIHtcclxuICB2YXIgeCA9IE1hdHJpeC5yb3RhdGlvblgodGhpcy50cmFuc2Zvcm0ucm90YXRpb24ueCk7XHJcbiAgdmFyIHkgPSBNYXRyaXgucm90YXRpb25ZKHRoaXMudHJhbnNmb3JtLnJvdGF0aW9uLnkpO1xyXG4gIHZhciB6ID0gTWF0cml4LnJvdGF0aW9uWih0aGlzLnRyYW5zZm9ybS5yb3RhdGlvbi56KTtcclxuICByZXR1cm4gTWF0cml4Lm11bHRpcGx5KE1hdHJpeC5tdWx0aXBseSh6LCB5KSwgeCk7XHJcbn1cclxuXHJcbkVudGl0eS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gXCJ7XCIgKyB0aGlzLnBvc2l0aW9uICsgXCJ9XCI7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICBSQUQ6IE1hdGguUEkgLyAxODAsXHJcbiAgREVHOiAxODAgLyBNYXRoLlBJLFxyXG5cclxuICBwb2ludEluUmVjdDogZnVuY3Rpb24oeCwgeSwgeDEsIHkxLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICByZXR1cm4gKHggPiB4MSAmJiB4IDwgeDEgKyB3aWR0aCAmJiB5ID4geTEgJiYgeSA8IHkxICsgaGVpZ2h0KTtcclxuICB9LFxyXG5cclxuICBwb2ludEluQ2lyY2xlOiBmdW5jdGlvbihweCwgcHksIGN4LCBjeSwgcmFkaXVzKSB7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KChweCAtIGN4KSAqIChweCAtIGN4KSArIChweSAtIGN5KSAqIChweSAtIGN5KSkgPCByYWRpdXM7XHJcbiAgfSxcclxuXHJcbiAgZGlzdGFuY2U6IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyKSB7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCh4MiAtIHgxKSAqICh4MiAtIHgxKSArICh5MiAtIHkxKSAqICh5MiAtIHkxKSk7XHJcbiAgfSxcclxuXHJcbiAgbWFwOiBmdW5jdGlvbih2YWx1ZSwgYTEsIGEyLCBiMSwgYjIpIHtcclxuICAgIHJldHVybiAoKHZhbHVlIC0gYTEpIC8gKGEyIC0gYTEpKSAqIChiMiAtIGIxKSArIGIxO1xyXG4gIH0sXHJcblxyXG4gIGxlcnA6IGZ1bmN0aW9uKGZpcnN0LCBsYXN0LCB2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICogKGxhc3QgLSBmaXJzdCkgKyBmaXJzdDtcclxuICB9LFxyXG5cclxuICBjbGFtcDogZnVuY3Rpb24odmFsdWUsIG1pbiwgbWF4KSB7XHJcbiAgICB2YXIgb3V0ID0gdmFsdWU7XHJcbiAgICBpZiAodmFsdWUgPCBtaW4pXHJcbiAgICAgIG91dCA9IG1pbjtcclxuICAgIGVsc2UgaWYgKHZhbHVlID4gbWF4KVxyXG4gICAgICBvdXQgPSBtYXg7XHJcbiAgICByZXR1cm4gb3V0O1xyXG4gIH1cclxufVxyXG4iLCJ2YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcclxudmFyIENvbG9yID0gcmVxdWlyZSgnLi9jb2xvcicpO1xyXG52YXIgRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdHknKTtcclxuXHJcbmZ1bmN0aW9uIExpZ2h0KHgsIHksIHosIGNvbG9yKSB7XHJcbiAgRW50aXR5LmNhbGwodGhpcywgeCwgeSwgeik7XHJcbiAgdGhpcy5kaXJlY3Rpb24gPSBuZXcgVmVjdG9yKCk7XHJcbiAgdGhpcy5jb2xvciA9IChjb2xvciAhPT0gdW5kZWZpbmVkID8gQ29sb3IuY29weShjb2xvcikgOiBuZXcgQ29sb3IoMjU1LCAyNTUsIDI1NSwgMjU1KSk7XHJcbn1cclxuXHJcbkxpZ2h0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRW50aXR5LnByb3RvdHlwZSk7XHJcbkxpZ2h0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpZ2h0O1xyXG5cclxuTGlnaHQucHJvdG90eXBlLnNldERpcmVjdGlvbiA9IGZ1bmN0aW9uKHgsIHksIHopIHtcclxuICB0aGlzLmRpcmVjdGlvbiA9IG5ldyBWZWN0b3IoeCwgeSwgeik7XHJcbiAgdGhpcy5kaXJlY3Rpb24ubm9ybWFsaXplKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGlnaHQ7XHJcbiIsIlxyXG5mdW5jdGlvbiBMaW5lKGEsIGIsIGNvbG9yKSB7XHJcbiAgdGhpcy5hID0gYTtcclxuICB0aGlzLmIgPSBiO1xyXG4gIHRoaXMuY29sb3IgPSBjb2xvcjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMaW5lO1xyXG4iLCJ2YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcclxuXHJcbmZ1bmN0aW9uIE1hdHJpeCgpIHtcclxuICB0aGlzLmEgPSBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV07XHJcbn1cclxuXHJcbk1hdHJpeC5JREVOVElUWSA9IFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXTtcclxuXHJcbk1hdHJpeC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcyA9IFwiXCI7XHJcbiAgcyArPSB0aGlzLmFbMF0gKyBcIixcIiArIHRoaXMuYVsxXSArIFwiLFwiICsgdGhpcy5hWzJdICsgXCIsXCIgKyB0aGlzLmFbM10gKyBcIlxcblwiO1xyXG4gIHMgKz0gdGhpcy5hWzRdICsgXCIsXCIgKyB0aGlzLmFbNV0gKyBcIixcIiArIHRoaXMuYVs2XSArIFwiLFwiICsgdGhpcy5hWzddICsgXCJcXG5cIjtcclxuICBzICs9IHRoaXMuYVs4XSArIFwiLFwiICsgdGhpcy5hWzldICsgXCIsXCIgKyB0aGlzLmFbMTBdICsgXCIsXCIgKyB0aGlzLmFbMTFdICsgXCJcXG5cIjtcclxuICBzICs9IHRoaXMuYVsxMl0gKyBcIixcIiArIHRoaXMuYVsxM10gKyBcIixcIiArIHRoaXMuYVsxNF0gKyBcIixcIiArIHRoaXMuYVsxNV0gKyBcIlxcblwiO1xyXG4gIHJldHVybiBzO1xyXG59XHJcblxyXG5NYXRyaXgucHJvdG90eXBlLmlkZW50aXR5ID0gZnVuY3Rpb24oKSB7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmEubGVuZ3RoOyBpKyspIHRoaXMuYVtpXSA9IE1hdHJpeC5JREVOVElUWVtpXTtcclxufVxyXG5cclxuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uKG1hdHJpeCkge1xyXG4gIHZhciBvdXRwdXQgPSBuZXcgTWF0cml4KCksIGEgPSB0aGlzLmE7XHJcblxyXG4gIG91dHB1dC5hWzBdID0gYVswXSAqIG1hdHJpeC5hWzBdICsgYVsxXSAqIG1hdHJpeC5hWzRdICsgYVsyXSAqIG1hdHJpeC5hWzhdICsgYVszXSAqIG1hdHJpeC5hWzEyXTtcclxuICBvdXRwdXQuYVsxXSA9IGFbMF0gKiBtYXRyaXguYVsxXSArIGFbMV0gKiBtYXRyaXguYVs1XSArIGFbMl0gKiBtYXRyaXguYVs5XSArIGFbM10gKiBtYXRyaXguYVsxM107XHJcbiAgb3V0cHV0LmFbMl0gPSBhWzBdICogbWF0cml4LmFbMl0gKyBhWzFdICogbWF0cml4LmFbNl0gKyBhWzJdICogbWF0cml4LmFbMTBdICsgYVszXSAqIG1hdHJpeC5hWzE0XTtcclxuICBvdXRwdXQuYVszXSA9IGFbMF0gKiBtYXRyaXguYVszXSArIGFbMV0gKiBtYXRyaXguYVs3XSArIGFbMl0gKiBtYXRyaXguYVsxMV0gKyBhWzNdICogbWF0cml4LmFbMTVdO1xyXG4gIG91dHB1dC5hWzRdID0gYVs0XSAqIG1hdHJpeC5hWzBdICsgYVs1XSAqIG1hdHJpeC5hWzRdICsgYVs2XSAqIG1hdHJpeC5hWzhdICsgYVs3XSAqIG1hdHJpeC5hWzEyXTtcclxuICBvdXRwdXQuYVs1XSA9IGFbNF0gKiBtYXRyaXguYVsxXSArIGFbNV0gKiBtYXRyaXguYVs1XSArIGFbNl0gKiBtYXRyaXguYVs5XSArIGFbN10gKiBtYXRyaXguYVsxM107XHJcbiAgb3V0cHV0LmFbNl0gPSBhWzRdICogbWF0cml4LmFbMl0gKyBhWzVdICogbWF0cml4LmFbNl0gKyBhWzZdICogbWF0cml4LmFbMTBdICsgYVs3XSAqIG1hdHJpeC5hWzE0XTtcclxuICBvdXRwdXQuYVs3XSA9IGFbNF0gKiBtYXRyaXguYVszXSArIGFbNV0gKiBtYXRyaXguYVs3XSArIGFbNl0gKiBtYXRyaXguYVsxMV0gKyBhWzddICogbWF0cml4LmFbMTVdO1xyXG4gIG91dHB1dC5hWzhdID0gYVs4XSAqIG1hdHJpeC5hWzBdICsgYVs5XSAqIG1hdHJpeC5hWzRdICsgYVsxMF0gKiBtYXRyaXguYVs4XSArIGFbMTFdICogbWF0cml4LmFbMTJdO1xyXG4gIG91dHB1dC5hWzldID0gYVs4XSAqIG1hdHJpeC5hWzFdICsgYVs5XSAqIG1hdHJpeC5hWzVdICsgYVsxMF0gKiBtYXRyaXguYVs5XSArIGFbMTFdICogbWF0cml4LmFbMTNdO1xyXG4gIG91dHB1dC5hWzEwXSA9IGFbOF0gKiBtYXRyaXguYVsyXSArIGFbOV0gKiBtYXRyaXguYVs2XSArIGFbMTBdICogbWF0cml4LmFbMTBdICsgYVsxMV0gKiBtYXRyaXguYVsxNF07XHJcbiAgb3V0cHV0LmFbMTFdID0gYVs4XSAqIG1hdHJpeC5hWzNdICsgYVs5XSAqIG1hdHJpeC5hWzddICsgYVsxMF0gKiBtYXRyaXguYVsxMV0gKyBhWzExXSAqIG1hdHJpeC5hWzE1XTtcclxuICBvdXRwdXQuYVsxMl0gPSBhWzEyXSAqIG1hdHJpeC5hWzBdICsgYVsxM10gKiBtYXRyaXguYVs0XSArIGFbMTRdICogbWF0cml4LmFbOF0gKyBhWzE1XSAqIG1hdHJpeC5hWzEyXTtcclxuICBvdXRwdXQuYVsxM10gPSBhWzEyXSAqIG1hdHJpeC5hWzFdICsgYVsxM10gKiBtYXRyaXguYVs1XSArIGFbMTRdICogbWF0cml4LmFbOV0gKyBhWzE1XSAqIG1hdHJpeC5hWzEzXTtcclxuICBvdXRwdXQuYVsxNF0gPSBhWzEyXSAqIG1hdHJpeC5hWzJdICsgYVsxM10gKiBtYXRyaXguYVs2XSArIGFbMTRdICogbWF0cml4LmFbMTBdICsgYVsxNV0gKiBtYXRyaXguYVsxNF07XHJcbiAgb3V0cHV0LmFbMTVdID0gYVsxMl0gKiBtYXRyaXguYVszXSArIGFbMTNdICogbWF0cml4LmFbN10gKyBhWzE0XSAqIG1hdHJpeC5hWzExXSArIGFbMTVdICogbWF0cml4LmFbMTVdO1xyXG5cclxuICByZXR1cm4gb3V0cHV0O1xyXG59XHJcblxyXG5NYXRyaXgucHJvdG90eXBlLm11bHRpcGx5UG9pbnQgPSBmdW5jdGlvbihwKSB7XHJcbiAgdmFyIG91dCA9IG5ldyBWZWN0b3IoKTtcclxuICB2YXIgdztcclxuXHJcbiAgb3V0LnggPSBwLnggKiB0aGlzLmFbMF0gKyBwLnkgKiB0aGlzLmFbNF0gKyBwLnogKiB0aGlzLmFbOF0gKyAxICogdGhpcy5hWzEyXTtcclxuICBvdXQueSA9IHAueCAqIHRoaXMuYVsxXSArIHAueSAqIHRoaXMuYVs1XSArIHAueiAqIHRoaXMuYVs5XSArIDEgKiB0aGlzLmFbMTNdO1xyXG4gIG91dC56ID0gcC54ICogdGhpcy5hWzJdICsgcC55ICogdGhpcy5hWzZdICsgcC56ICogdGhpcy5hWzEwXSArIDEgKiB0aGlzLmFbMTRdO1xyXG4gIHcgPSBwLnggKiB0aGlzLmFbM10gKyBwLnkgKiB0aGlzLmFbN10gKyBwLnogKiB0aGlzLmFbMTFdICsgMSAqIHRoaXMuYVsxNV07XHJcblxyXG4gIGlmICh3ICE9IDEpIHtcclxuICAgIG91dC54IC89IHc7XHJcbiAgICBvdXQueSAvPSB3O1xyXG4gICAgb3V0LnogLz0gdztcclxuICB9XHJcblxyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbk1hdHJpeC5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIG91dHB1dCA9IG5ldyBNYXRyaXgoKTtcclxuXHJcbiAgb3V0cHV0LmFbMF0gPSB0aGlzLmFbMF07XHJcbiAgb3V0cHV0LmFbMV0gPSB0aGlzLmFbNF07XHJcbiAgb3V0cHV0LmFbMl0gPSB0aGlzLmFbOF07XHJcbiAgb3V0cHV0LmFbM10gPSB0aGlzLmFbMTJdO1xyXG5cclxuICBvdXRwdXQuYVs0XSA9IHRoaXMuYVsxXTtcclxuICBvdXRwdXQuYVs1XSA9IHRoaXMuYVs1XTtcclxuICBvdXRwdXQuYVs2XSA9IHRoaXMuYVs5XTtcclxuICBvdXRwdXQuYVs3XSA9IHRoaXMuYVsxM107XHJcblxyXG4gIG91dHB1dC5hWzhdID0gdGhpcy5hWzJdO1xyXG4gIG91dHB1dC5hWzldID0gdGhpcy5hWzZdO1xyXG4gIG91dHB1dC5hWzEwXSA9IHRoaXMuYVsxMF07XHJcbiAgb3V0cHV0LmFbMTFdID0gdGhpcy5hWzE0XTtcclxuXHJcbiAgb3V0cHV0LmFbMTJdID0gdGhpcy5hWzNdO1xyXG4gIG91dHB1dC5hWzEzXSA9IHRoaXMuYVs3XTtcclxuICBvdXRwdXQuYVsxNF0gPSB0aGlzLmFbMTFdO1xyXG4gIG91dHB1dC5hWzE1XSA9IHRoaXMuYVsxNV07XHJcblxyXG4gIHJldHVybiBvdXRwdXQ7XHJcbn1cclxuXHJcbk1hdHJpeC5wcm90b3R5cGUuaW52ZXJzZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBNYXRyaXguaW52ZXJzZSh0aGlzKTtcclxufVxyXG5cclxuTWF0cml4Lm11bHRpcGx5ID0gZnVuY3Rpb24oYSwgYikge1xyXG4gIHJldHVybiBhLm11bHRpcGx5KGIpO1xyXG59XHJcblxyXG4vLyBib29sIGdsdUludmVydE1hdHJpeChjb25zdCBkb3VibGUgbVsxNl0sIGRvdWJsZSBpbnZPdXRbMTZdKVxyXG5cclxuTWF0cml4LmludmVyc2UgPSBmdW5jdGlvbihtYXRyaXgpXHJcbntcclxuICB2YXIgZGV0LCBpO1xyXG4gIHZhciBtID0gbWF0cml4LmE7XHJcbiAgdmFyIGludiA9IG5ldyBNYXRyaXgoKTtcclxuXHJcbiAgaW52LmFbMF0gPSBtWzVdICAqIG1bMTBdICogbVsxNV0gLVxyXG4gICAgICAgICAgICAgbVs1XSAgKiBtWzExXSAqIG1bMTRdIC1cclxuICAgICAgICAgICAgIG1bOV0gICogbVs2XSAgKiBtWzE1XSArXHJcbiAgICAgICAgICAgICBtWzldICAqIG1bN10gICogbVsxNF0gK1xyXG4gICAgICAgICAgICAgbVsxM10gKiBtWzZdICAqIG1bMTFdIC1cclxuICAgICAgICAgICAgIG1bMTNdICogbVs3XSAgKiBtWzEwXTtcclxuXHJcbiAgaW52LmFbNF0gPSAtbVs0XSAgKiBtWzEwXSAqIG1bMTVdICtcclxuICAgICAgICAgICAgICBtWzRdICAqIG1bMTFdICogbVsxNF0gK1xyXG4gICAgICAgICAgICAgIG1bOF0gICogbVs2XSAgKiBtWzE1XSAtXHJcbiAgICAgICAgICAgICAgbVs4XSAgKiBtWzddICAqIG1bMTRdIC1cclxuICAgICAgICAgICAgICBtWzEyXSAqIG1bNl0gICogbVsxMV0gK1xyXG4gICAgICAgICAgICAgIG1bMTJdICogbVs3XSAgKiBtWzEwXTtcclxuXHJcbiAgaW52LmFbOF0gPSBtWzRdICAqIG1bOV0gKiBtWzE1XSAtXHJcbiAgICAgICAgICAgICBtWzRdICAqIG1bMTFdICogbVsxM10gLVxyXG4gICAgICAgICAgICAgbVs4XSAgKiBtWzVdICogbVsxNV0gK1xyXG4gICAgICAgICAgICAgbVs4XSAgKiBtWzddICogbVsxM10gK1xyXG4gICAgICAgICAgICAgbVsxMl0gKiBtWzVdICogbVsxMV0gLVxyXG4gICAgICAgICAgICAgbVsxMl0gKiBtWzddICogbVs5XTtcclxuXHJcbiAgaW52LmFbMTJdID0gLW1bNF0gICogbVs5XSAqIG1bMTRdICtcclxuICAgICAgICAgICAgICAgbVs0XSAgKiBtWzEwXSAqIG1bMTNdICtcclxuICAgICAgICAgICAgICAgbVs4XSAgKiBtWzVdICogbVsxNF0gLVxyXG4gICAgICAgICAgICAgICBtWzhdICAqIG1bNl0gKiBtWzEzXSAtXHJcbiAgICAgICAgICAgICAgIG1bMTJdICogbVs1XSAqIG1bMTBdICtcclxuICAgICAgICAgICAgICAgbVsxMl0gKiBtWzZdICogbVs5XTtcclxuXHJcbiAgaW52LmFbMV0gPSAtbVsxXSAgKiBtWzEwXSAqIG1bMTVdICtcclxuICAgICAgICAgICAgICBtWzFdICAqIG1bMTFdICogbVsxNF0gK1xyXG4gICAgICAgICAgICAgIG1bOV0gICogbVsyXSAqIG1bMTVdIC1cclxuICAgICAgICAgICAgICBtWzldICAqIG1bM10gKiBtWzE0XSAtXHJcbiAgICAgICAgICAgICAgbVsxM10gKiBtWzJdICogbVsxMV0gK1xyXG4gICAgICAgICAgICAgIG1bMTNdICogbVszXSAqIG1bMTBdO1xyXG5cclxuICBpbnYuYVs1XSA9IG1bMF0gICogbVsxMF0gKiBtWzE1XSAtXHJcbiAgICAgICAgICAgICBtWzBdICAqIG1bMTFdICogbVsxNF0gLVxyXG4gICAgICAgICAgICAgbVs4XSAgKiBtWzJdICogbVsxNV0gK1xyXG4gICAgICAgICAgICAgbVs4XSAgKiBtWzNdICogbVsxNF0gK1xyXG4gICAgICAgICAgICAgbVsxMl0gKiBtWzJdICogbVsxMV0gLVxyXG4gICAgICAgICAgICAgbVsxMl0gKiBtWzNdICogbVsxMF07XHJcblxyXG4gIGludi5hWzldID0gLW1bMF0gICogbVs5XSAqIG1bMTVdICtcclxuICAgICAgICAgICAgICBtWzBdICAqIG1bMTFdICogbVsxM10gK1xyXG4gICAgICAgICAgICAgIG1bOF0gICogbVsxXSAqIG1bMTVdIC1cclxuICAgICAgICAgICAgICBtWzhdICAqIG1bM10gKiBtWzEzXSAtXHJcbiAgICAgICAgICAgICAgbVsxMl0gKiBtWzFdICogbVsxMV0gK1xyXG4gICAgICAgICAgICAgIG1bMTJdICogbVszXSAqIG1bOV07XHJcblxyXG4gIGludi5hWzEzXSA9IG1bMF0gICogbVs5XSAqIG1bMTRdIC1cclxuICAgICAgICAgICAgICBtWzBdICAqIG1bMTBdICogbVsxM10gLVxyXG4gICAgICAgICAgICAgIG1bOF0gICogbVsxXSAqIG1bMTRdICtcclxuICAgICAgICAgICAgICBtWzhdICAqIG1bMl0gKiBtWzEzXSArXHJcbiAgICAgICAgICAgICAgbVsxMl0gKiBtWzFdICogbVsxMF0gLVxyXG4gICAgICAgICAgICAgIG1bMTJdICogbVsyXSAqIG1bOV07XHJcblxyXG4gIGludi5hWzJdID0gbVsxXSAgKiBtWzZdICogbVsxNV0gLVxyXG4gICAgICAgICAgICAgbVsxXSAgKiBtWzddICogbVsxNF0gLVxyXG4gICAgICAgICAgICAgbVs1XSAgKiBtWzJdICogbVsxNV0gK1xyXG4gICAgICAgICAgICAgbVs1XSAgKiBtWzNdICogbVsxNF0gK1xyXG4gICAgICAgICAgICAgbVsxM10gKiBtWzJdICogbVs3XSAtXHJcbiAgICAgICAgICAgICBtWzEzXSAqIG1bM10gKiBtWzZdO1xyXG5cclxuICBpbnYuYVs2XSA9IC1tWzBdICAqIG1bNl0gKiBtWzE1XSArXHJcbiAgICAgICAgICAgICAgbVswXSAgKiBtWzddICogbVsxNF0gK1xyXG4gICAgICAgICAgICAgIG1bNF0gICogbVsyXSAqIG1bMTVdIC1cclxuICAgICAgICAgICAgICBtWzRdICAqIG1bM10gKiBtWzE0XSAtXHJcbiAgICAgICAgICAgICAgbVsxMl0gKiBtWzJdICogbVs3XSArXHJcbiAgICAgICAgICAgICAgbVsxMl0gKiBtWzNdICogbVs2XTtcclxuXHJcbiAgaW52LmFbMTBdID0gbVswXSAgKiBtWzVdICogbVsxNV0gLVxyXG4gICAgICAgICAgICAgIG1bMF0gICogbVs3XSAqIG1bMTNdIC1cclxuICAgICAgICAgICAgICBtWzRdICAqIG1bMV0gKiBtWzE1XSArXHJcbiAgICAgICAgICAgICAgbVs0XSAgKiBtWzNdICogbVsxM10gK1xyXG4gICAgICAgICAgICAgIG1bMTJdICogbVsxXSAqIG1bN10gLVxyXG4gICAgICAgICAgICAgIG1bMTJdICogbVszXSAqIG1bNV07XHJcblxyXG4gIGludi5hWzE0XSA9IC1tWzBdICAqIG1bNV0gKiBtWzE0XSArXHJcbiAgICAgICAgICAgICAgIG1bMF0gICogbVs2XSAqIG1bMTNdICtcclxuICAgICAgICAgICAgICAgbVs0XSAgKiBtWzFdICogbVsxNF0gLVxyXG4gICAgICAgICAgICAgICBtWzRdICAqIG1bMl0gKiBtWzEzXSAtXHJcbiAgICAgICAgICAgICAgIG1bMTJdICogbVsxXSAqIG1bNl0gK1xyXG4gICAgICAgICAgICAgICBtWzEyXSAqIG1bMl0gKiBtWzVdO1xyXG5cclxuICBpbnYuYVszXSA9IC1tWzFdICogbVs2XSAqIG1bMTFdICtcclxuICAgICAgICAgICAgICBtWzFdICogbVs3XSAqIG1bMTBdICtcclxuICAgICAgICAgICAgICBtWzVdICogbVsyXSAqIG1bMTFdIC1cclxuICAgICAgICAgICAgICBtWzVdICogbVszXSAqIG1bMTBdIC1cclxuICAgICAgICAgICAgICBtWzldICogbVsyXSAqIG1bN10gK1xyXG4gICAgICAgICAgICAgIG1bOV0gKiBtWzNdICogbVs2XTtcclxuXHJcbiAgaW52LmFbN10gPSBtWzBdICogbVs2XSAqIG1bMTFdIC1cclxuICAgICAgICAgICAgIG1bMF0gKiBtWzddICogbVsxMF0gLVxyXG4gICAgICAgICAgICAgbVs0XSAqIG1bMl0gKiBtWzExXSArXHJcbiAgICAgICAgICAgICBtWzRdICogbVszXSAqIG1bMTBdICtcclxuICAgICAgICAgICAgIG1bOF0gKiBtWzJdICogbVs3XSAtXHJcbiAgICAgICAgICAgICBtWzhdICogbVszXSAqIG1bNl07XHJcblxyXG4gIGludi5hWzExXSA9IC1tWzBdICogbVs1XSAqIG1bMTFdICtcclxuICAgICAgICAgICAgICAgbVswXSAqIG1bN10gKiBtWzldICtcclxuICAgICAgICAgICAgICAgbVs0XSAqIG1bMV0gKiBtWzExXSAtXHJcbiAgICAgICAgICAgICAgIG1bNF0gKiBtWzNdICogbVs5XSAtXHJcbiAgICAgICAgICAgICAgIG1bOF0gKiBtWzFdICogbVs3XSArXHJcbiAgICAgICAgICAgICAgIG1bOF0gKiBtWzNdICogbVs1XTtcclxuXHJcbiAgaW52LmFbMTVdID0gbVswXSAqIG1bNV0gKiBtWzEwXSAtXHJcbiAgICAgICAgICAgICAgbVswXSAqIG1bNl0gKiBtWzldIC1cclxuICAgICAgICAgICAgICBtWzRdICogbVsxXSAqIG1bMTBdICtcclxuICAgICAgICAgICAgICBtWzRdICogbVsyXSAqIG1bOV0gK1xyXG4gICAgICAgICAgICAgIG1bOF0gKiBtWzFdICogbVs2XSAtXHJcbiAgICAgICAgICAgICAgbVs4XSAqIG1bMl0gKiBtWzVdO1xyXG5cclxuICBkZXQgPSBtWzBdICogaW52LmFbMF0gKyBtWzFdICogaW52LmFbNF0gKyBtWzJdICogaW52LmFbOF0gKyBtWzNdICogaW52LmFbMTJdO1xyXG5cclxuICBpZiAoZGV0ID09IDApXHJcbiAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgZGV0ID0gMS4wIC8gZGV0O1xyXG5cclxuICBmb3IgKGkgPSAwOyBpIDwgMTY7IGkrKylcclxuICAgIGludi5hW2ldID0gaW52LmFbaV0gKiBkZXQ7XHJcblxyXG4gIHJldHVybiBpbnY7XHJcbn1cclxuXHJcbk1hdHJpeC50cmFuc2xhdGlvbiA9IGZ1bmN0aW9uKHgsIHksIHopIHtcclxuICB2YXIgbSA9IG5ldyBNYXRyaXgoKTtcclxuICBtLmFbMTJdID0geDtcclxuICBtLmFbMTNdID0geTtcclxuICBtLmFbMTRdID0gejtcclxuICByZXR1cm4gbTtcclxufVxyXG5cclxuTWF0cml4LnNjYWxlID0gZnVuY3Rpb24oeCwgeSwgeikge1xyXG4gIHZhciBtID0gbmV3IE1hdHJpeCgpO1xyXG4gIG0uYVswXSA9IHg7XHJcbiAgbS5hWzVdID0geTtcclxuICBtLmFbMTBdID0gejtcclxuICByZXR1cm4gbTtcclxufVxyXG5cclxuLy8gYW5nbGU6IFRoZSBhbmdsZSBvZiByb3RhdGlvbiBpbiByYWRpYW5zXHJcbk1hdHJpeC5yb3RhdGlvblggPSBmdW5jdGlvbihhbmdsZSkge1xyXG4gIHZhciBtID0gbmV3IE1hdHJpeCgpO1xyXG5cclxuICB2YXIgY29zID0gTWF0aC5jb3MoYW5nbGUpO1xyXG4gIHZhciBzaW4gPSBNYXRoLnNpbihhbmdsZSk7XHJcbiAgbS5hWzVdID0gY29zO1xyXG4gIG0uYVs2XSA9IHNpbjtcclxuICBtLmFbOV0gPSAtc2luO1xyXG4gIG0uYVsxMF0gPSBjb3M7XHJcblxyXG4gIHJldHVybiBtO1xyXG59XHJcblxyXG5NYXRyaXgucm90YXRpb25ZID0gZnVuY3Rpb24oYW5nbGUpIHtcclxuICB2YXIgbSA9IG5ldyBNYXRyaXgoKTtcclxuXHJcbiAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKTtcclxuICB2YXIgc2luID0gTWF0aC5zaW4oYW5nbGUpO1xyXG4gIG0uYVswXSA9IGNvcztcclxuICBtLmFbMl0gPSAtc2luO1xyXG4gIG0uYVs4XSA9IHNpbjtcclxuICBtLmFbMTBdID0gY29zO1xyXG5cclxuICByZXR1cm4gbTtcclxufVxyXG5cclxuTWF0cml4LnJvdGF0aW9uWiA9IGZ1bmN0aW9uKGFuZ2xlKSB7XHJcbiAgdmFyIG0gPSBuZXcgTWF0cml4KCk7XHJcblxyXG4gIHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSk7XHJcbiAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcclxuICBtLmFbMF0gPSBjb3M7XHJcbiAgbS5hWzFdID0gc2luO1xyXG4gIG0uYVs0XSA9IC1zaW47XHJcbiAgbS5hWzVdID0gY29zO1xyXG5cclxuICByZXR1cm4gbTtcclxufVxyXG5cclxuTWF0cml4LnJvdGF0aW9uID0gZnVuY3Rpb24oeCwgeSwgeikge1xyXG4gIHZhciByeCA9IE1hdHJpeC5yb3RhdGlvblgoeCk7XHJcbiAgdmFyIHJ5ID0gTWF0cml4LnJvdGF0aW9uWSh5KTtcclxuICB2YXIgcnogPSBNYXRyaXgucm90YXRpb25aKHopO1xyXG4gIHJldHVybiBNYXRyaXgubXVsdGlwbHkoTWF0cml4Lm11bHRpcGx5KHJ6LCByeSksIHJ4KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7XHJcbiIsInZhciBSZWN0YW5nbGUgPSByZXF1aXJlKCcuL3JlY3RhbmdsZScpO1xyXG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcclxudmFyIENvbG9yID0gcmVxdWlyZSgnLi9jb2xvcicpO1xyXG5cclxuZnVuY3Rpb24gTWVzaCgpIHtcclxuICB0aGlzLnZlcnRpY2VzID0gW107XHJcbiAgdGhpcy50cmlhbmdsZXMgPSBbXTtcclxuICB0aGlzLmNvbG9ycyA9IFtdO1xyXG4gIHRoaXMubm9ybWFscyA9IFtdO1xyXG4gIHRoaXMudXZzID0gW107XHJcbn1cclxuXHJcbk1lc2gucHJvdG90eXBlLmdldEJvdW5kcyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICBpZiAodGhpcy5ib3VuZHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIGJibWlueCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICAgIHZhciBiYm1pbnkgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XHJcbiAgICB2YXIgYmJtYXh4ID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xyXG4gICAgdmFyIGJibWF4eSA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHYgPSB0aGlzLnZlcnRpY2VzW2ldO1xyXG4gICAgICBpZiAodi54IDwgYmJtaW54KSBiYm1pbnggPSB2Lng7XHJcbiAgICAgIGlmICh2LnkgPCBiYm1pbnkpIGJibWlueSA9IHYueTtcclxuICAgICAgaWYgKHYueCA+IGJibWF4eCkgYmJtYXh4ID0gdi54O1xyXG4gICAgICBpZiAodi55ID4gYmJtYXh5KSBiYm1heHkgPSB2Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5ib3VuZHMgPSBuZXcgUmVjdGFuZ2xlKGJibWlueCwgYmJtaW55LCBiYm1heHggLSBiYm1pbnggKyAxLCBiYm1heHkgLSBiYm1pbnkgKyAxKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0aGlzLmJvdW5kcztcclxufVxyXG5cclxuXHJcbk1lc2gucHJvdG90eXBlLmV4dHJhY3RGYWNlUGFyYW1zID0gZnVuY3Rpb24ocywgZGF0YSkge1xyXG4gIHZhciB2YWx1ZXMgPSBbXTtcclxuICB2YXIgZiA9IHMuc3BsaXQoJy8nKTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAoaXNOYU4oZltpXSkpIHtcclxuICAgICAgdmFsdWVzW2ldID0gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhbHVlc1tpXSA9IHBhcnNlSW50KGZbaV0pIC0gMTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmICh2YWx1ZXNbMF0gIT09IHVuZGVmaW5lZCkgZGF0YS52ZXJ0aWNlcy5wdXNoKHZhbHVlc1swXSk7XHJcbiAgaWYgKHZhbHVlc1sxXSAhPT0gdW5kZWZpbmVkKSBkYXRhLnV2cy5wdXNoKHZhbHVlc1sxXSk7XHJcbiAgaWYgKHZhbHVlc1syXSAhPT0gdW5kZWZpbmVkKSBkYXRhLm5vcm1hbHMucHVzaCh2YWx1ZXNbMl0pO1xyXG4gIGlmICh2YWx1ZXNbM10gIT09IHVuZGVmaW5lZCkgZGF0YS5jb2xvcnMucHVzaCh2YWx1ZXNbM10pO1xyXG5cclxuICAvLyByZXR1cm4gdmFsdWVzO1xyXG59XHJcblxyXG5cclxuTWVzaC5ub3JtYWxpemVVViA9IGZ1bmN0aW9uKHUsIHYpIHtcclxuICAvLyBjb25zb2xlLmxvZyhcIm5vcm1hbGl6ZVVWXCIsIHUsIHYpO1xyXG4gIC8vIHZhciB1diA9IG5ldyBBcnJheSgwLjAsIDAuMCk7XHJcbiAgLy8gc3UgPSBNYXRoLmFicyh1KSA+PiAwO1xyXG4gIC8vIHN2ID0gTWF0aC5hYnModikgPj4gMDtcclxuICAvLyB1dlswXSA9IChzdSA+IDEgPyB1IC0gc3UgOiB1KTtcclxuICAvLyBpZiAodXZbMF0gPCAwKSB1dlswXSA9IHV2WzBdICsgMTtcclxuICAvLyB1dlsxXSA9IChzdiA+IDEgPyB2IC0gc3YgOiB2KTtcclxuICAvLyBpZiAodXZbMV0gPCAwKSB1dlsxXSA9IHV2WzFdICsgMTtcclxuICAvLyBpZiAodXZbMF0gPT0gLTApIHV2WzBdID0gMDtcclxuICAvLyBpZiAodXZbMV0gPT0gLTApIHV2WzFdID0gMDtcclxuICAvLyByZXR1cm4gdXY7XHJcbn1cclxuXHJcbi8vIGNvbnNvbGUubG9nKE1hdGguY2VpbCgtMi41KSk7XHJcblxyXG5NZXNoLmZyb21PQkogPSBmdW5jdGlvbihyZXNvdXJjZSkge1xyXG4gIHZhciBtZXNoID0gbmV3IE1lc2goKTtcclxuICB2YXIgbGluZXMgPSByZXNvdXJjZS5jb250ZW50LnNwbGl0KCdcXG4nKTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGxpbmUgPSBsaW5lc1tpXS50cmltKCk7XHJcblxyXG4gICAgaWYgKGxpbmVbMF0gPT0gJyMnKSBjb250aW51ZTtcclxuXHJcbiAgICB2YXIgcGFyYW1zID0gbGluZS5zcGxpdCgnICcpO1xyXG4gICAgdmFyIHR5cGUgPSBwYXJhbXNbMF07XHJcblxyXG4gICAgaWYgKHR5cGUgPT0gJ3YnKSB7XHJcbiAgICAgIG1lc2gudmVydGljZXMucHVzaChuZXcgVmVjdG9yKHBhcnNlRmxvYXQocGFyYW1zWzFdKSwgcGFyc2VGbG9hdChwYXJhbXNbMl0pLCBwYXJzZUZsb2F0KHBhcmFtc1szXSkpKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PSAndnQnKSB7XHJcbiAgICAgIHZhciB1diA9IG5ldyBBcnJheShwYXJzZUZsb2F0KHBhcmFtc1sxXSksIHBhcnNlRmxvYXQocGFyYW1zWzJdKSk7XHJcbiAgICAgIGlmICh1dlswXSA9PSAtMCkgdXZbMF0gPSAwO1xyXG4gICAgICBpZiAodXZbMV0gPT0gLTApIHV2WzFdID0gMDtcclxuICAgICAgbWVzaC51dnMucHVzaCh1dik7XHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gJ3ZuJykge1xyXG4gICAgICBtZXNoLm5vcm1hbHMucHVzaChuZXcgVmVjdG9yKHBhcnNlRmxvYXQocGFyYW1zWzFdKSwgcGFyc2VGbG9hdChwYXJhbXNbMl0pLCBwYXJzZUZsb2F0KHBhcmFtc1szXSkpKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PSAndmMnKSB7XHJcbiAgICAgIHZhciByID0gcGFyc2VGbG9hdChwYXJhbXNbMV0pO1xyXG4gICAgICB2YXIgZyA9IHBhcnNlRmxvYXQocGFyYW1zWzJdKTtcclxuICAgICAgdmFyIGIgPSBwYXJzZUZsb2F0KHBhcmFtc1szXSk7XHJcbiAgICAgIHZhciBhID0gKHBhcmFtc1s0XSAhPT0gdW5kZWZpbmVkID8gcGFyc2VGbG9hdChwYXJhbXNbNF0pIDogMSk7XHJcbiAgICAgIC8vIG1lc2guY29sb3JzLnB1c2gobmV3IENvbG9yKChyICogMjU1KSA+PiAwLCAoZyAqIDI1NSkgPj4gMCwgKGIgKiAyNTUpID4+IDAsIChhICogMjU1KSA+PiAwKSk7XHJcbiAgICAgIG1lc2guY29sb3JzLnB1c2gobmV3IENvbG9yKChyICogMjU1KSA+PiAwLCAoZyAqIDI1NSkgPj4gMCwgKGIgKiAyNTUpID4+IDAsIDApKTtcclxuXHJcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT0gJ2YnKSB7XHJcbiAgICAgIHZhciBkYXRhID0ge307XHJcbiAgICAgIGRhdGEudmVydGljZXMgPSBuZXcgQXJyYXkoKTtcclxuICAgICAgZGF0YS51dnMgPSBuZXcgQXJyYXkoKTtcclxuICAgICAgZGF0YS5ub3JtYWxzID0gbmV3IEFycmF5KCk7XHJcbiAgICAgIGRhdGEuY29sb3JzID0gbmV3IEFycmF5KCk7XHJcbiAgICAgIGRhdGEubm9ybWFsID0gbnVsbDtcclxuXHJcbiAgICAgIG1lc2guZXh0cmFjdEZhY2VQYXJhbXMocGFyYW1zWzFdLCBkYXRhKTtcclxuICAgICAgbWVzaC5leHRyYWN0RmFjZVBhcmFtcyhwYXJhbXNbMl0sIGRhdGEpO1xyXG4gICAgICBtZXNoLmV4dHJhY3RGYWNlUGFyYW1zKHBhcmFtc1szXSwgZGF0YSk7XHJcblxyXG4gICAgICB2YXIgdjAgPSBtZXNoLnZlcnRpY2VzW2RhdGEudmVydGljZXNbMF1dO1xyXG4gICAgICB2YXIgdjEgPSBtZXNoLnZlcnRpY2VzW2RhdGEudmVydGljZXNbMV1dO1xyXG4gICAgICB2YXIgdjIgPSBtZXNoLnZlcnRpY2VzW2RhdGEudmVydGljZXNbMl1dO1xyXG4gICAgICB2YXIgbiA9IFZlY3Rvci5jcm9zcyhWZWN0b3Iuc3VidHJhY3QodjEsIHYwKSwgVmVjdG9yLnN1YnRyYWN0KHYyLCB2MCkpO1xyXG5cclxuICAgICAgbi5ub3JtYWxpemUoKTtcclxuICAgICAgZGF0YS5ub3JtYWwgPSBuO1xyXG5cclxuICAgICAgLy8gZGF0YS5pZCA9IC0yO1xyXG4gICAgICBtZXNoLnRyaWFuZ2xlcy5wdXNoKGRhdGEpO1xyXG5cclxuICAgIH0gZWxzZSBpZiAodHlwZSA9PSAnbycpIHtcclxuICAgICAgbWVzaC52ZXJ0aWNlcyA9IFtdO1xyXG4gICAgICBtZXNoLnRyaWFuZ2xlcyA9IFtdO1xyXG4gICAgICBtZXNoLmNvbG9ycyA9IFtdO1xyXG4gICAgICBtZXNoLm5vcm1hbHMgPSBbXTtcclxuICAgICAgbWVzaC51dnMgPSBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBtZXNoO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc2g7XHJcbiIsIlxyXG5mdW5jdGlvbiBSZWN0YW5nbGUoeCwgeSwgdywgaCkge1xyXG4gIHRoaXMueCA9ICh4ID09IHVuZGVmaW5lZCA/IDAgOiB4KTtcclxuICB0aGlzLnkgPSAoeSA9PSB1bmRlZmluZWQgPyAwIDogeSk7XHJcbiAgdGhpcy53aWR0aCA9ICh3ID09IHVuZGVmaW5lZCA/IDAgOiB3KTtcclxuICB0aGlzLmhlaWdodCA9IChoID09IHVuZGVmaW5lZCA/IDAgOiBoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWN0YW5nbGU7XHJcbiIsInZhciBWZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpO1xyXG52YXIgQ29sb3IgPSByZXF1aXJlKCcuL2NvbG9yJyk7XHJcbnZhciBDYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYScpO1xyXG5cclxuZnVuY3Rpb24gUmVuZGVyZXIoKSB7XHJcbn1cclxuXHJcblJlbmRlcmVyLmluaXQgPSBmdW5jdGlvbihzdXJmYWNlLCBjYW1lcmEpIHtcclxuICBSZW5kZXJlci5zdXJmYWNlID0gc3VyZmFjZTtcclxuICBSZW5kZXJlci5jYW1lcmEgPSBjYW1lcmE7XHJcbiAgdGhpcy5jYW1lcmEuc2V0UmVjdCh0aGlzLnN1cmZhY2Uud2lkdGgsIHRoaXMuc3VyZmFjZS5oZWlnaHQpO1xyXG5cclxuICAvLyBSZW5kZXJlci5kZXB0aEFycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKFJlbmRlcmVyLnN1cmZhY2Uud2lkdGggKiBSZW5kZXJlci5zdXJmYWNlLmhlaWdodCk7XHJcbiAgLy8gUmVuZGVyZXIuaWRBcnJheUJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihSZW5kZXJlci5zdXJmYWNlLndpZHRoICogUmVuZGVyZXIuc3VyZmFjZS5oZWlnaHQpO1xyXG5cclxuICBSZW5kZXJlci5kZXB0aEJ1ZmZlciA9IG5ldyBBcnJheShSZW5kZXJlci5zdXJmYWNlLndpZHRoICogUmVuZGVyZXIuc3VyZmFjZS5oZWlnaHQpO1xyXG4gIFJlbmRlcmVyLmlkQnVmZmVyID0gbmV3IEFycmF5KFJlbmRlcmVyLnN1cmZhY2Uud2lkdGggKiBSZW5kZXJlci5zdXJmYWNlLmhlaWdodCk7XHJcblxyXG4gIFJlbmRlcmVyLmFzcGVjdCA9IFJlbmRlcmVyLnN1cmZhY2Uud2lkdGggLyBSZW5kZXJlci5zdXJmYWNlLmhlaWdodDtcclxuXHJcbiAgUmVuZGVyZXIuY2xlYXJEZXB0aEJ1ZmZlcigpO1xyXG4gIFJlbmRlcmVyLmNsZWFySWRCdWZmZXIoKTtcclxuXHJcbiAgUmVuZGVyZXIudHJpY291bnQgPSAwO1xyXG4gIFJlbmRlcmVyLmxhcmdldHJpID0gMDtcclxuICBSZW5kZXJlci5waXhjb3VudCA9IDA7XHJcbiAgUmVuZGVyZXIuenNvcnQgPSB0cnVlO1xyXG4gIFJlbmRlcmVyLmlkID0gMDtcclxufVxyXG5cclxuUmVuZGVyZXIuY2xlYXJJZEJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBSZW5kZXJlci5pZEJ1ZmZlci5sZW5ndGg7IGkgPCBsZW47IGkrKykgUmVuZGVyZXIuaWRCdWZmZXJbaV0gPSAwO1xyXG59XHJcblxyXG5SZW5kZXJlci5jbGVhckRlcHRoQnVmZmVyID0gZnVuY3Rpb24oKSB7XHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IFJlbmRlcmVyLmRlcHRoQnVmZmVyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSBSZW5kZXJlci5kZXB0aEJ1ZmZlcltpXSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICAvLyBmb3IgKHZhciBpID0gMCwgbGVuID0gUmVuZGVyZXIuZGVwdGhCdWZmZXIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIFJlbmRlcmVyLmRlcHRoQnVmZmVyW2ldID0gMDtcclxufVxyXG5cclxuUmVuZGVyZXIucmVzZXQgPSBmdW5jdGlvbigpIHtcclxuICBSZW5kZXJlci50cmljb3VudCA9IDA7XHJcbiAgUmVuZGVyZXIubGFyZ2V0cmkgPSAwO1xyXG4gIFJlbmRlcmVyLnBpeGNvdW50ID0gMDtcclxuICBSZW5kZXJlci5jbGVhckRlcHRoQnVmZmVyKCk7XHJcbiAgUmVuZGVyZXIuY2xlYXJJZEJ1ZmZlcigpO1xyXG59XHJcblxyXG5SZW5kZXJlci5nZXRQcm9qZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGNhbWVyYSA9IFJlbmRlcmVyLmNhbWVyYTtcclxuICB2YXIgcHJvamVjdGlvbjtcclxuXHJcbiAgdmFyIGFzcGVjdCA9IChSZW5kZXJlci5jYW1lcmEudmlldy53aWR0aCAqIFJlbmRlcmVyLmFzcGVjdCkgLyBSZW5kZXJlci5jYW1lcmEudmlldy5oZWlnaHQ7XHJcblxyXG4gIGlmIChjYW1lcmEudHlwZSA9PSBDYW1lcmEuT1JUSE9HUkFQSElDKSB7XHJcbiAgICB2YXIgaGVpZ2h0ID0gY2FtZXJhLm9ydGhvU2NhbGUgKiAyO1xyXG4gICAgdmFyIHdpZHRoID0gaGVpZ2h0ICogYXNwZWN0O1xyXG4gICAgcHJvamVjdGlvbiA9IENhbWVyYS5vcnRob2dyYXBoaWMod2lkdGgsIGhlaWdodCwgY2FtZXJhLm5lYXIsIGNhbWVyYS5mYXIpO1xyXG4gICAgLy8gcHJvamVjdGlvbiA9IENhbWVyYS5vcnRob2dyYXBoaWMoYXNwZWN0LCAxLCBjYW1lcmEubmVhciwgY2FtZXJhLmZhciwgY2FtZXJhLm9ydGhvU2NhbGUpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBwcm9qZWN0aW9uID0gQ2FtZXJhLnBlcnNwZWN0aXZlRk9WKGNhbWVyYS5mb3YsIGFzcGVjdCwgY2FtZXJhLm5lYXIsIGNhbWVyYS5mYXIpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHByb2plY3Rpb247XHJcbn1cclxuXHJcblJlbmRlcmVyLnNjcmVlblRvUmFzdGVyID0gZnVuY3Rpb24ocCkge1xyXG4gIHZhciBwUmFzdGVyID0gbmV3IFZlY3RvcigpO1xyXG4gIHBSYXN0ZXIueCA9ICgocC54ICsgMSkgKiAwLjUpICogKFJlbmRlcmVyLnN1cmZhY2Uud2lkdGgpO1xyXG4gIHBSYXN0ZXIueSA9ICgoMSAtIHAueSkgKiAwLjUpICogKFJlbmRlcmVyLnN1cmZhY2UuaGVpZ2h0KTtcclxuICBwUmFzdGVyLnogPSAocC56ICE9PSB1bmRlZmluZWQgPyBwLnogOiAwKTtcclxuICByZXR1cm4gcFJhc3RlcjtcclxufVxyXG5cclxuUmVuZGVyZXIucmFzdGVyVG9TY3JlZW4gPSBmdW5jdGlvbihwUmFzdGVyKSB7XHJcbiAgLy8gdmFyIHBOREMgPSBuZXcgVmVjdG9yKChwLnggKyAwLjUpIC8gUmVuZGVyZXIuc3VyZmFjZS53aWR0aCwgKHAueSArIDAuNSkgLyBSZW5kZXJlci5zdXJmYWNlLmhlaWdodCwgLTEpO1xyXG4gIHZhciBwTkRDID0gbmV3IFZlY3RvcihwUmFzdGVyLnggLyBSZW5kZXJlci5zdXJmYWNlLndpZHRoLCBwUmFzdGVyLnkgLyBSZW5kZXJlci5zdXJmYWNlLmhlaWdodCwgMCk7XHJcbiAgLy8gcmV0dXJuIG5ldyBWZWN0b3IoMiAqIHBOREMueCAtIDEsIDEgLSAyICogcE5EQy55LCAtUmVuZGVyZXIudmlldy5jYW1lcmEubmVhcik7XHJcbiAgLy8gcmV0dXJuIG5ldyBWZWN0b3IoMiAqIHBOREMueCAtIDEsIDEgLSAyICogcE5EQy55LCBSZW5kZXJlci52aWV3LmNhbWVyYS5uZWFyKTtcclxuICByZXR1cm4gbmV3IFZlY3RvcigyICogcE5EQy54IC0gMSwgMSAtIDIgKiBwTkRDLnksIFJlbmRlcmVyLmNhbWVyYS5uZWFyKTtcclxufVxyXG5cclxuUmVuZGVyZXIucmFzdGVyVG9Xb3JsZCA9IGZ1bmN0aW9uKHBSYXN0ZXIsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpIHtcclxuICB2YXIgcFNjcmVlbiA9IFJlbmRlcmVyLnJhc3RlclRvU2NyZWVuKHBSYXN0ZXIpO1xyXG4gIC8vIGlmIChSZW5kZXJlci5jYW1lcmEudHlwZSA9PSBDYW1lcmEuT1JUSE9HUkFQSElDKSB7XHJcbiAgLy8gICBwU2NyZWVuLnogPSAwO1xyXG4gIC8vIH1cclxuICB2YXIgcFdvcmxkID0gUmVuZGVyZXIuc2NyZWVuVG9Xb3JsZChwU2NyZWVuLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KTtcclxuICByZXR1cm4gcFdvcmxkO1xyXG59XHJcblxyXG5SZW5kZXJlci53b3JsZFRvUmFzdGVyID0gZnVuY3Rpb24ocFdvcmxkLCB2aWV3TWF0cml4LCBwcm9qZWN0aW9uTWF0cml4KSB7XHJcbiAgdmFyIHBTY3JlZW4gPSBSZW5kZXJlci53b3JsZFRvU2NyZWVuKHBXb3JsZCwgdmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCk7XHJcbiAgdmFyIHBSYXN0ZXIgPSBSZW5kZXJlci5zY3JlZW5Ub1Jhc3RlcihwU2NyZWVuKTtcclxuICByZXR1cm4gcFJhc3RlcjtcclxufVxyXG5cclxuUmVuZGVyZXIuc2NyZWVuVG9Xb3JsZCA9IGZ1bmN0aW9uKHBTY3JlZW4sIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpIHtcclxuICB2YXIgdmlld1Byb2plY3Rpb25JbnZlcnNlID0gTWF0cml4Lm11bHRpcGx5KHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpLmludmVyc2UoKTtcclxuICB2YXIgcFdvcmxkID0gdmlld1Byb2plY3Rpb25JbnZlcnNlLm11bHRpcGx5UG9pbnQocFNjcmVlbik7XHJcbiAgcmV0dXJuIHBXb3JsZDtcclxufVxyXG5cclxuUmVuZGVyZXIud29ybGRUb1NjcmVlbiA9IGZ1bmN0aW9uKHBXb3JsZCwgdmlld01hdHJpeCwgcHJvamVjdGlvbk1hdHJpeCkge1xyXG4gIHZhciBjYW1lcmEgPSBSZW5kZXJlci5jYW1lcmE7XHJcblxyXG4gIHZhciBwQ2FtZXJhID0gdmlld01hdHJpeC5tdWx0aXBseVBvaW50KHBXb3JsZCk7XHJcbiAgdmFyIHBTY3JlZW4gPSBwcm9qZWN0aW9uTWF0cml4Lm11bHRpcGx5UG9pbnQocENhbWVyYSk7XHJcblxyXG4gIC8vIHBTY3JlZW4ueiA9IHBDYW1lcmEuejtcclxuICBwU2NyZWVuLnogPSAtcENhbWVyYS56O1xyXG5cclxuICByZXR1cm4gcFNjcmVlbjtcclxufVxyXG5cclxuUmVuZGVyZXIuc2V0UGl4ZWwgPSBmdW5jdGlvbih4LCB5LCByLCBnLCBiLCBhKSB7XHJcbiAgaWYgKHggPj0gMCAmJiB5ID49IDAgJiYgeCA8IFJlbmRlcmVyLnN1cmZhY2Uud2lkdGggJiYgeSA8IFJlbmRlcmVyLnN1cmZhY2UuaGVpZ2h0KSB7XHJcbiAgICAvLyB2YXIgaW5kZXggPSAoeSAqIFJlbmRlcmVyLnN1cmZhY2Uud2lkdGggKyB4KSAqIDQ7XHJcbiAgICBSZW5kZXJlci5zdXJmYWNlLmJ1ZjMyW3kgKiBSZW5kZXJlci5zdXJmYWNlLndpZHRoICsgeF0gPSAoMjU1IDw8IDI0KSB8IChiIDw8IDE2KSB8IChnIDw8IDgpIHwgcjtcclxuICB9XHJcbn1cclxuXHJcbi8vIEJyZXNlbmhhbSBMaW5lIEFsZ29yaXRobVxyXG4vLyBodHRwOi8vd3d3LmVkZXBvdC5jb20vbGluZWJyZXNlbmhhbS5odG1sXHJcblxyXG5SZW5kZXJlci5saW5lID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHIsIGcsIGIsIGEpIHtcclxuXHR2YXIgeCA9IDAsIHkgPSAwO1xyXG5cdHZhciBkeCA9IDAsIGR5ID0gMDtcclxuXHR2YXIgaW5jeCA9IDAsIGluY3kgPSAwO1xyXG5cdHZhciBiYWxhbmNlID0gMDtcclxuXHJcblx0aWYgKHgyID49IHgxKSB7XHJcblx0XHRkeCA9IHgyIC0geDE7XHJcblx0XHRpbmN4ID0gMTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZHggPSB4MSAtIHgyO1xyXG5cdFx0aW5jeCA9IC0xO1xyXG5cdH1cclxuXHJcblx0aWYgKHkyID49IHkxKSB7XHJcblx0XHRkeSA9IHkyIC0geTE7XHJcblx0XHRpbmN5ID0gMTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZHkgPSB5MSAtIHkyO1xyXG5cdFx0aW5jeSA9IC0xO1xyXG5cdH1cclxuXHJcblx0eCA9IHgxO1xyXG5cdHkgPSB5MTtcclxuXHJcblx0aWYgKGR4ID49IGR5KSB7XHJcblx0XHRkeSA8PD0gMTtcclxuXHRcdGJhbGFuY2UgPSBkeSAtIGR4O1xyXG5cdFx0ZHggPDw9IDE7XHJcblxyXG5cdFx0d2hpbGUgKHggIT0geDIpIHtcclxuXHRcdFx0UmVuZGVyZXIuc2V0UGl4ZWwoeCwgeSwgciwgZywgYiwgYSk7XHJcblx0XHRcdGlmIChiYWxhbmNlID49IDApIHtcclxuXHRcdFx0XHR5ICs9IGluY3k7XHJcblx0XHRcdFx0YmFsYW5jZSAtPSBkeDtcclxuXHRcdFx0fVxyXG5cdFx0XHRiYWxhbmNlICs9IGR5O1xyXG5cdFx0XHR4ICs9IGluY3g7XHJcblx0XHR9XHJcbiAgICBSZW5kZXJlci5zZXRQaXhlbCh4LCB5LCByLCBnLCBiLCBhKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZHggPDw9IDE7XHJcblx0XHRiYWxhbmNlID0gZHggLSBkeTtcclxuXHRcdGR5IDw8PSAxO1xyXG5cclxuXHRcdHdoaWxlICh5ICE9IHkyKSB7XHJcblx0XHRcdFJlbmRlcmVyLnNldFBpeGVsKHgsIHksIHIsIGcsIGIsIGEpO1xyXG5cdFx0XHRpZiAoYmFsYW5jZSA+PSAwKSB7XHJcblx0XHRcdFx0eCArPSBpbmN4O1xyXG5cdFx0XHRcdGJhbGFuY2UgLT0gZHk7XHJcblx0XHRcdH1cclxuXHRcdFx0YmFsYW5jZSArPSBkeDtcclxuXHRcdFx0eSArPSBpbmN5O1xyXG5cdFx0fVxyXG4gICAgUmVuZGVyZXIuc2V0UGl4ZWwoeCwgeSwgciwgZywgYiwgYSk7XHJcblx0fVxyXG59XHJcblxyXG5SZW5kZXJlci5kcmF3TGluZSA9IGZ1bmN0aW9uKGxpbmUpIHtcclxuICB2YXIgdmlld01hdHJpeCA9IFJlbmRlcmVyLmNhbWVyYS50b0xvY2FsKCk7XHJcbiAgdmFyIHByb2plY3Rpb25NYXRyaXggPSBSZW5kZXJlci5nZXRQcm9qZWN0aW9uKCk7XHJcbiAgdmFyIGEgPSBSZW5kZXJlci5jYW1lcmEud29ybGRUb1NjcmVlbihsaW5lLmEsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpLnJvdW5kKCk7XHJcbiAgdmFyIGIgPSBSZW5kZXJlci5jYW1lcmEud29ybGRUb1NjcmVlbihsaW5lLmIsIHZpZXdNYXRyaXgsIHByb2plY3Rpb25NYXRyaXgpLnJvdW5kKCk7XHJcbiAgUmVuZGVyZXIubGluZShhLngsIGEueSwgYi54LCBiLnksIGxpbmUuY29sb3IuciwgbGluZS5jb2xvci5nLCBsaW5lLmNvbG9yLmIsIGxpbmUuY29sb3IuYSk7XHJcbn1cclxuXHJcblJlbmRlcmVyLmVkZ2VGdW5jdGlvbiA9IGZ1bmN0aW9uKGEsIGIsIGMpIHtcclxuICAvLyBjbG9ja3dpc2UgdmVydGV4IG9yZGVyaW5nXHJcbiAgLy8gcmV0dXJuICgoYy54IC0gYS54KSAqIChiLnkgLSBhLnkpIC0gKGMueSAtIGEueSkgKiAoYi54IC0gYS54KSA+PSAwKTtcclxuXHJcbiAgLy8gY291bnRlci1jbG9ja3dpc2UgdmVydGV4IG9yZGVyaW5nXHJcbiAgcmV0dXJuIChhLnggLSBiLngpICogKGMueSAtIGEueSkgLSAoYS55IC0gYi55KSAqIChjLnggLSBhLngpO1xyXG59XHJcblxyXG5SZW5kZXJlci5kcmF3VHJpYW5nbGUgPSBmdW5jdGlvbih2MCwgdjEsIHYyLCBpbGx1bWluYXRpb24sIHRpbnQsIHRleHR1cmUsIGlkKSB7XHJcbiAgdmFyIGJibWlueCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcclxuICB2YXIgYmJtaW55ID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xyXG4gIHZhciBiYm1heHggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XHJcbiAgdmFyIGJibWF4eSA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcclxuXHJcbiAgaWYgKHYwLnggPCBiYm1pbngpIGJibWlueCA9IHYwLng7XHJcbiAgaWYgKHYxLnggPCBiYm1pbngpIGJibWlueCA9IHYxLng7XHJcbiAgaWYgKHYyLnggPCBiYm1pbngpIGJibWlueCA9IHYyLng7XHJcblxyXG4gIGlmICh2MC55IDwgYmJtaW55KSBiYm1pbnkgPSB2MC55O1xyXG4gIGlmICh2MS55IDwgYmJtaW55KSBiYm1pbnkgPSB2MS55O1xyXG4gIGlmICh2Mi55IDwgYmJtaW55KSBiYm1pbnkgPSB2Mi55O1xyXG5cclxuICBpZiAodjAueCA+IGJibWF4eCkgYmJtYXh4ID0gdjAueDtcclxuICBpZiAodjEueCA+IGJibWF4eCkgYmJtYXh4ID0gdjEueDtcclxuICBpZiAodjIueCA+IGJibWF4eCkgYmJtYXh4ID0gdjIueDtcclxuXHJcbiAgaWYgKHYwLnkgPiBiYm1heHkpIGJibWF4eSA9IHYwLnk7XHJcbiAgaWYgKHYxLnkgPiBiYm1heHkpIGJibWF4eSA9IHYxLnk7XHJcbiAgaWYgKHYyLnkgPiBiYm1heHkpIGJibWF4eSA9IHYyLnk7XHJcblxyXG4gIC8vIHZhciB2eCA9IFJlbmRlcmVyLmNhbWVyYS52aWV3LnggKiBSZW5kZXJlci5zdXJmYWNlLndpZHRoO1xyXG4gIC8vIHZhciB2eSA9IFJlbmRlcmVyLmNhbWVyYS52aWV3LnkgKiBSZW5kZXJlci5zdXJmYWNlLmhlaWdodDtcclxuICAvLyB2YXIgdncgPSBSZW5kZXJlci5jYW1lcmEudmlldy53aWR0aCAqIFJlbmRlcmVyLnN1cmZhY2Uud2lkdGg7XHJcbiAgLy8gdmFyIHZoID0gUmVuZGVyZXIuY2FtZXJhLnZpZXcuaGVpZ2h0ICogUmVuZGVyZXIuc3VyZmFjZS5oZWlnaHQ7XHJcblxyXG4gIGlmIChiYm1pbnggPCAwKSBiYm1pbnggPSAwO1xyXG4gIGlmIChiYm1pbnkgPCAwKSBiYm1pbnkgPSAwO1xyXG5cclxuICBpZiAoYmJtYXh4ID4gUmVuZGVyZXIuc3VyZmFjZS53aWR0aCAtIDEpIGJibWF4eCA9IFJlbmRlcmVyLnN1cmZhY2Uud2lkdGggLSAxO1xyXG4gIGlmIChiYm1heHkgPiBSZW5kZXJlci5zdXJmYWNlLmhlaWdodCAtIDEpIGJibWF4eSA9IFJlbmRlcmVyLnN1cmZhY2UuaGVpZ2h0IC0gMTtcclxuXHJcbiAgYmJtaW54ID0gTWF0aC5yb3VuZChiYm1pbngpO1xyXG4gIGJibWF4eCA9IE1hdGgucm91bmQoYmJtYXh4KTtcclxuICBiYm1pbnkgPSBNYXRoLnJvdW5kKGJibWlueSk7XHJcbiAgYmJtYXh5ID0gTWF0aC5yb3VuZChiYm1heHkpO1xyXG5cclxuICBpZiAoYmJtYXh4IC0gYmJtaW54ID49IDgpIHtcclxuICAgIFJlbmRlcmVyLmxhcmdldHJpKys7XHJcbiAgfVxyXG5cclxuICB2YXIgdjB6ID0gMSAvIHYwLno7XHJcbiAgdmFyIHYxeiA9IDEgLyB2MS56O1xyXG4gIHZhciB2MnogPSAxIC8gdjIuejtcclxuXHJcbiAgdmFyIGFyZWEgPSBSZW5kZXJlci5lZGdlRnVuY3Rpb24odjAsIHYxLCB2Mik7XHJcblxyXG4gIHZhciB3MGYsIHcxZiwgdzJmO1xyXG4gIHZhciB3MCwgdzEsIHcyO1xyXG4gIHZhciB3MF9zdGVwLCB3MV9zdGVwLCB3Ml9zdGVwO1xyXG4gIHZhciBvbmVPdmVyWiwgejtcclxuICB2YXIgY3IsIGNnLCBjYjtcclxuICB2YXIgcCA9IG5ldyBWZWN0b3IoKTtcclxuICB2YXIgY29tcHV0ZWRDb2xvciA9IG5ldyBDb2xvcigpO1xyXG4gIHZhciB1LCB2O1xyXG4gIHZhciBzLCB6O1xyXG5cclxuICBmb3IgKHZhciB5ID0gYmJtaW55OyB5IDw9IGJibWF4eTsgeSsrKSB7XHJcbiAgICB2YXIgb3V0ID0gdHJ1ZTtcclxuICAgIHAueCA9IGJibWlueDtcclxuICAgIHAueSA9IHk7XHJcblxyXG4gICAgdzBmID0gUmVuZGVyZXIuZWRnZUZ1bmN0aW9uKHYxLCB2MiwgcCk7XHJcbiAgICB3MWYgPSBSZW5kZXJlci5lZGdlRnVuY3Rpb24odjIsIHYwLCBwKTtcclxuICAgIHcyZiA9IFJlbmRlcmVyLmVkZ2VGdW5jdGlvbih2MCwgdjEsIHApO1xyXG5cclxuICAgIHMgPSAwO1xyXG5cclxuICAgIGZvciAodmFyIHggPSBiYm1pbng7IHggPD0gYmJtYXh4OyB4KyssIHMrKykge1xyXG4gICAgICBSZW5kZXJlci5waXhjb3VudCsrO1xyXG4gICAgICBwLnggPSB4O1xyXG5cclxuICAgICAgdzAgPSB3MGYgKyAtKHYxLnkgLSB2Mi55KSAqIHM7XHJcbiAgICAgIHcxID0gdzFmICsgLSh2Mi55IC0gdjAueSkgKiBzO1xyXG4gICAgICB3MiA9IHcyZiArIC0odjAueSAtIHYxLnkpICogcztcclxuXHJcbiAgICAgIGlmICh3MCA+PSAwICYmIHcxID49IDAgJiYgdzIgPj0gMCkge1xyXG4gICAgICAgIHcwID0gdzAgLyBhcmVhO1xyXG4gICAgICAgIHcxID0gdzEgLyBhcmVhO1xyXG4gICAgICAgIHcyID0gdzIgLyBhcmVhO1xyXG5cclxuICAgICAgICAvLyBQZXJzcGVjdGl2ZSBjb3JyZWN0XHJcbiAgICAgICAgb25lT3ZlclogPSB2MHogKiB3MCArIHYxeiAqIHcxICsgdjJ6ICogdzI7XHJcbiAgICAgICAgeiA9IDEgLyBvbmVPdmVyWjtcclxuXHJcbiAgICAgICAgLy8gTm8gcGVyc3BlY3RpdmUgY29ycmVjdFxyXG4gICAgICAgIC8vIHogPSB2MC56ICogdzAgKyB2MS56ICogdzEgKyB2Mi56ICogdzI7XHJcblxyXG4gICAgICAgIHZhciBpbmRleCA9IHkgKiBSZW5kZXJlci5zdXJmYWNlLndpZHRoICsgeDtcclxuXHJcbiAgICAgICAgaWYgKHogPCBSZW5kZXJlci5kZXB0aEJ1ZmZlcltpbmRleF0pIHtcclxuICAgICAgICAgIFJlbmRlcmVyLmRlcHRoQnVmZmVyW2luZGV4XSA9IHo7XHJcblxyXG4gICAgICAgICAgY3IgPSAyNTU7XHJcbiAgICAgICAgICBjZyA9IDI1NTtcclxuICAgICAgICAgIGNiID0gMjU1O1xyXG5cclxuICAgICAgICAgIGlmICh2MC5jb2xvciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNyID0gdjAuY29sb3IucjtcclxuICAgICAgICAgICAgY2cgPSB2MC5jb2xvci5nO1xyXG4gICAgICAgICAgICBjYiA9IHYwLmNvbG9yLmI7XHJcbiAgICAgICAgICAgIGlmICh0aW50KSB7XHJcbiAgICAgICAgICAgICAgY3IgPSBjciAqIHRpbnQuciA+PiAwO1xyXG4gICAgICAgICAgICAgIGNnID0gY2cgKiB0aW50LmcgPj4gMDtcclxuICAgICAgICAgICAgICBjYiA9IGNiICogdGludC5iID4+IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodjAudXYpIHtcclxuICAgICAgICAgICAgLy8gdSA9IHYwLnV2WzBdICogdzAgKyB2MS51dlswXSAqIHcxICsgdjIudXZbMF0gKiB3MjtcclxuICAgICAgICAgICAgLy8gdiA9IHYwLnV2WzFdICogdzAgKyB2MS51dlsxXSAqIHcxICsgdjIudXZbMV0gKiB3MjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodGV4dHVyZSkge1xyXG4gICAgICAgICAgICAvLyB2YXIgYzMyID0gdGV4dHVyZS51dkxvb2t1cCh1LCB2KTtcclxuICAgICAgICAgICAgLy8gY3IgPSBjMzIgJiAweGZmO1xyXG4gICAgICAgICAgICAvLyBjZyA9IChjMzIgPj4gOCkgJiAweGZmO1xyXG4gICAgICAgICAgICAvLyBjYiA9IChjMzIgPj4gMTYpICYgMHhmZjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBpZiAoYW8pIHtcclxuICAgICAgICAgICAgLy8gdmFyIGMzMiA9IGFvLnV2TG9va3VwKHUsIHYpO1xyXG4gICAgICAgICAgICAvLyBjciA9IGNyICogKChjMzIgJiAweGZmKSAvIDI1NSk7XHJcbiAgICAgICAgICAgIC8vIGNnID0gY2cgKiAoKChjMzIgPj4gOCkgJiAweGZmKSAvIDI1NSk7XHJcbiAgICAgICAgICAgIC8vIGNiID0gY2IgKiAoKChjMzIgPj4gMTYpICYgMHhmZikgLyAyNTUpO1xyXG4gICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAgIGlmIChpbGx1bWluYXRpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjciA9IChjciAqIGlsbHVtaW5hdGlvbi5yKSA+PiAwO1xyXG4gICAgICAgICAgICBjZyA9IChjZyAqIGlsbHVtaW5hdGlvbi5nKSA+PiAwO1xyXG4gICAgICAgICAgICBjYiA9IChjYiAqIGlsbHVtaW5hdGlvbi5iKSA+PiAwO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIFJlbmRlcmVyLnNldFBpeGVsKHgsIHksIGNyLCBjZywgY2IsIDI1NSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG91dCA9IGZhbHNlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChvdXQgPT0gZmFsc2UpIHtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgUmVuZGVyZXIudHJpY291bnQrKztcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjtcclxuIiwid2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcclxuXHJcbnZhciBSZXNvdXJjZSA9IHt9O1xyXG5cclxuUmVzb3VyY2UuUEFUSCA9ICcuL2RhdGEvJztcclxuXHJcblJlc291cmNlLmluaXQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gIFJlc291cmNlLmVudHJpZXMgPSB7fTtcclxuICBSZXNvdXJjZS5sb2FkQ291bnQgPSAwO1xyXG4gIFJlc291cmNlLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgUmVzb3VyY2UuZG9uZSA9IHRydWU7XHJcbn1cclxuXHJcblJlc291cmNlLmZpbmlzaGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKFJlc291cmNlLmxvYWRDb3VudCA9PSAwKVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5SZXNvdXJjZS5sb2FkID0gZnVuY3Rpb24oZmlsZW5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgLy8gY29uc29sZS5sb2coJ2xvYWQnLCBmaWxlbmFtZSk7XHJcbiAgUmVzb3VyY2UuZG9uZSA9IGZhbHNlO1xyXG5cclxuICB2YXIgdHlwZSA9IGZpbGVuYW1lLnN1YnN0cihmaWxlbmFtZS5sYXN0SW5kZXhPZignLicpICsgMSk7XHJcbiAgUmVzb3VyY2UuZW50cmllc1tmaWxlbmFtZV0gPSB7XHJcbiAgICBmaWxlbmFtZTogZmlsZW5hbWUsXHJcbiAgICB0eXBlOiB0eXBlLFxyXG4gICAgbG9hZGVkOiBmYWxzZSxcclxuICAgIGNvbnRlbnQ6IG51bGwsXHJcbiAgICBjYWxsYmFjazogY2FsbGJhY2tcclxuICB9O1xyXG5cclxuICBSZXNvdXJjZS5sb2FkQ291bnQrKztcclxuXHJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICBpZiAocmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlKSByZXF1ZXN0Lm92ZXJyaWRlTWltZVR5cGUoJ3RleHQvcGxhaW47IGNoYXJzZXQ9eC11c2VyLWRlZmluZWQnKTtcclxuICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IFJlc291cmNlLm9uUmVhZHlTdGF0ZUNoYW5nZTtcclxuICByZXF1ZXN0Lm9wZW4oJ0dFVCcsIFJlc291cmNlLlBBVEggKyBmaWxlbmFtZSwgdHJ1ZSk7XHJcbiAgaWYgKHR5cGUgPT0gJ3BuZycpIHtcclxuICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gJ2Jsb2InO1xyXG4gIH1cclxuXHJcbiAgcmVxdWVzdC5zZW5kKCk7XHJcbn1cclxuXHJcblJlc291cmNlLnRleHRUb0JpbmFyeSA9IGZ1bmN0aW9uKHRleHQpIHtcclxuICB2YXIgYmluID0gbmV3IFVpbnQ4QXJyYXkoKTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcclxuICAgIGJpbi5wdXNoKHRleHRbaV0gJiAweGZmKTtcclxuICB9XHJcbiAgcmV0dXJuIGJpbjtcclxufVxyXG5cclxuUmVzb3VyY2UubG9hZGVkID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcclxuICBSZXNvdXJjZS5lbnRyaWVzW2ZpbGVuYW1lXS5sb2FkZWQgPSB0cnVlO1xyXG4gIFJlc291cmNlLmxvYWRDb3VudC0tO1xyXG4gIGlmIChSZXNvdXJjZS5sb2FkQ291bnQgPT0gMCkgUmVzb3VyY2UuZG9uZSA9IHRydWU7XHJcbiAgaWYgKFJlc291cmNlLmNhbGxiYWNrKSB7XHJcbiAgICBSZXNvdXJjZS5jYWxsYmFjayhmaWxlbmFtZSk7XHJcbiAgfVxyXG59XHJcblxyXG5SZXNvdXJjZS5vblJlYWR5U3RhdGVDaGFuZ2UgPSBmdW5jdGlvbihldmVudCkge1xyXG4gIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFhNTEh0dHBSZXF1ZXN0LkRPTkUpIHtcclxuICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgIHZhciBmaWxlbmFtZSA9IHRoaXMucmVzcG9uc2VVUkwuc3Vic3RyKHRoaXMucmVzcG9uc2VVUkwubGFzdEluZGV4T2YoJy8nKSArIDEpO1xyXG5cclxuICAgICAgaWYgKFJlc291cmNlLmVudHJpZXNbZmlsZW5hbWVdLnR5cGUgPT0gJ29iaicpIHtcclxuICAgICAgICBSZXNvdXJjZS5lbnRyaWVzW2ZpbGVuYW1lXS5jb250ZW50ID0gdGhpcy5yZXNwb25zZVRleHQ7XHJcbiAgICAgICAgUmVzb3VyY2UubG9hZGVkKGZpbGVuYW1lKTtcclxuICAgICAgfSBlbHNlIGlmIChSZXNvdXJjZS5lbnRyaWVzW2ZpbGVuYW1lXS50eXBlID09ICdwbmcnKSB7XHJcbiAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbdGhpcy5yZXNwb25zZV0sIHt0eXBlOiAnaW1hZ2UvcG5nJ30pO1xyXG4gICAgICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgd2luZG93LlVSTC5yZXZva2VPYmplY3RVUkwoaW1nLnNyYyk7IC8vIENsZWFuIHVwIGFmdGVyIHlvdXJzZWxmLlxyXG4gICAgICAgICAgUmVzb3VyY2UuZW50cmllc1tmaWxlbmFtZV0uY29udGVudCA9IGltZztcclxuICAgICAgICAgIFJlc291cmNlLmxvYWRlZChmaWxlbmFtZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpbWcuc3JjID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdSZXNvdXJjZSBtaXNzaW5nOicsIHRoaXMucmVzcG9uc2VVUkwpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuUmVzb3VyY2UuZ2V0ID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcclxuICByZXR1cm4gUmVzb3VyY2UuZW50cmllc1tmaWxlbmFtZV07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVzb3VyY2U7XHJcbiIsIlxyXG5mdW5jdGlvbiBTdXJmYWNlKHdpZHRoLCBoZWlnaHQsIGJ1ZmZlcikge1xyXG4gIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgdGhpcy5idWZmZXIgPSBidWZmZXI7XHJcbiAgdGhpcy5idWYgPSB0aGlzLmJ1ZmZlci5kYXRhLmJ1ZmZlcjtcclxuICB0aGlzLmJ1ZjggPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodGhpcy5idWYpO1xyXG4gIHRoaXMuYnVmMzIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5idWYpO1xyXG5cclxuICAvLyB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcclxuICAvLyB0aGlzLmJ1ZjMyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMuYnVmZmVyLmRhdGEpO1xyXG4gIC8vIHRoaXMuY29udGV4dCA9IEVuZ2luZS5vZmZzY3JlZW5Db250ZXh0O1xyXG59XHJcblxyXG5TdXJmYWNlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5idWYzMi5sZW5ndGg7IGkrKykgdGhpcy5idWYzMltpXSA9IDB4MDAwMDAwMDA7XHJcbn1cclxuXHJcblN1cmZhY2UucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XHJcbiAgLy8gZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJ1ZmZlci5kYXRhLmxlbmd0aDsgaSA9IGkgKyA0KSB7XHJcbiAgLy8gICB0aGlzLmJ1ZmZlcltpICsgMF0gPSByO1xyXG4gIC8vICAgdGhpcy5idWZmZXJbaSArIDFdID0gZztcclxuICAvLyAgIHRoaXMuYnVmZmVyW2kgKyAyXSA9IGI7XHJcbiAgLy8gICB0aGlzLmJ1ZmZlcltpICsgM10gPSBhO1xyXG4gIC8vIH1cclxuICB2YXIgYyA9ICgoYSAmIDB4ZmYpIDw8IDI0KSB8ICgoYiAmIDB4ZmYpIDw8IDE2KSB8ICgoZyAmIDB4ZmYpIDw8IDgpIHwgKHIgJiAweGZmKTtcclxuICAvLyBjb25zb2xlLmxvZygoKGEpIDw8IDI0KS50b1N0cmluZygxNikpO1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYnVmMzIubGVuZ3RoOyBpKyspIHRoaXMuYnVmMzJbaV0gPSBjO1xyXG59XHJcblxyXG5TdXJmYWNlLnByb3RvdHlwZS5maWxsUmVjdCA9IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQsIGNvbG9yKSB7XHJcbiAgLy8gZm9yICh2YXIgcm93ID0geTsgcm93IDwgeSArIGhlaWdodDsgcm93KyspIHtcclxuICAvLyAgIGZvciAodmFyIGNvbCA9IHg7IGNvbCA8IHggKyB3aWR0aDsgY29sKyspIHtcclxuICAvLyAgICAgdmFyIGluZGV4ID0gKHJvdyAqIHRoaXMud2lkdGggKyBjb2wpICogNDtcclxuICAvLyAgICAgdGhpcy5idWZmZXJbaW5kZXggKyAwXSA9IGNvbG9yLnI7XHJcbiAgLy8gICAgIHRoaXMuYnVmZmVyW2luZGV4ICsgMV0gPSBjb2xvci5nO1xyXG4gIC8vICAgICB0aGlzLmJ1ZmZlcltpbmRleCArIDJdID0gY29sb3IuYjtcclxuICAvLyAgICAgdGhpcy5idWZmZXJbaW5kZXggKyAzXSA9IGNvbG9yLmE7XHJcbiAgLy8gICB9XHJcbiAgLy8gfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN1cmZhY2U7XHJcbiIsInZhciBsaWIgPSByZXF1aXJlKCcuL2xpYicpO1xyXG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcclxuXHJcbmZ1bmN0aW9uIFRyYW5zZm9ybSgpIHtcclxuICB0aGlzLnJvdGF0aW9uID0gbmV3IFZlY3RvcigpOyAvLyBSYWRpYW5zXHJcbiAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IoKTtcclxuICB0aGlzLnNjYWxlID0gbmV3IFZlY3RvcigxLCAxLCAxKTtcclxuICB0aGlzLnE7XHJcbn1cclxuXHJcblRyYW5zZm9ybS5wcm90b3R5cGUucm90YXRlQXJvdW5kID0gZnVuY3Rpb24odGFyZ2V0LCBheGlzLCBhbmdsZSkge1xyXG4gIC8vIHZhciB0aGV0YSA9IGFuZ2xlICogUkFEO1xyXG4gIC8vIHZhciBwID0gdGhpcy5wb3NpdGlvbjtcclxuICAvLyB2YXIgciA9IE1hdHJpeC5yb3RhdGlvblkodGhldGEpO1xyXG4gIC8vIHAgPSByLm11bHRpcGx5UG9pbnQocCk7XHJcbiAgLy8gdGhpcy5wb3NpdGlvbi54ID0gcC54O1xyXG4gIC8vIHRoaXMucG9zaXRpb24ueSA9IHAueTtcclxuICAvLyB0aGlzLnBvc2l0aW9uLnogPSBwLno7XHJcbn1cclxuXHJcblxyXG4vLyB0YXJnZXQgLSA/Pz9cclxuLy8gYXhpcyAtIFJvdGF0aW9uIGF4aXNcclxuLy8gYW5nbGUgLSByb3RhdGlvbiBhbW91bnQgaW4gZGVncmVlc1xyXG5cclxuVHJhbnNmb3JtLnByb3RvdHlwZS5yb3RhdGVBcm91bmRRdWF0ZXJuaW9uID0gZnVuY3Rpb24odGFyZ2V0LCBheGlzLCBhbmdsZSkge1xyXG4gIC8vIHZhciB0aGV0YSA9IGFuZ2xlICogUkFEO1xyXG4gIC8vIHZhciBwID0gdGhpcy5wb3NpdGlvbjtcclxuICAvLyB2YXIgciA9IE1hdHJpeC5yb3RhdGlvblkodGhldGEpO1xyXG4gIC8vIHAgPSByLm11bHRpcGx5UG9pbnQocCk7XHJcbiAgLy8gdGhpcy5wb3NpdGlvbi54ID0gcC54O1xyXG4gIC8vIHRoaXMucG9zaXRpb24ueSA9IHAueTtcclxuICAvLyB0aGlzLnBvc2l0aW9uLnogPSBwLno7XHJcblxyXG4gIC8vIFF1YXRlcm5pb24gcm90YXRpb24gbWV0aG9kXHJcbiAgLy8gaHR0cDovL2Fuc3dlcnMudW5pdHkzZC5jb20vcXVlc3Rpb25zLzM3MjM3MS9tdWx0aXBseS1xdWF0ZXJuaW9uLWJ5LXZlY3RvcjMtaG93LWlzLWRvbmUuaHRtbFxyXG5cclxuICB2YXIgdCA9IChhbmdsZSAqIGxpYi5SQUQpIC8gMjtcclxuICB2YXIgc2luID0gTWF0aC5zaW4odCk7XHJcbiAgdmFyIHcgPSBNYXRoLmNvcyh0KTtcclxuICB2YXIgeCA9IChheGlzLngpICogc2luO1xyXG4gIHZhciB5ID0gKGF4aXMueSkgKiBzaW47XHJcbiAgdmFyIHogPSAoYXhpcy56KSAqIHNpbjtcclxuXHJcbiAgdmFyIG1hZyA9ICh3ICogdyArIHggKiB4ICsgeSAqIHkgKyB6ICogeik7XHJcbiAgaWYgKG1hZyAhPSAxKSB7XHJcbiAgICB3ID0gdyAvIG1hZztcclxuICAgIHggPSB4IC8gbWFnO1xyXG4gICAgeSA9IHkgLyBtYWc7XHJcbiAgICB6ID0geiAvIG1hZztcclxuICB9XHJcblxyXG4gIHZhciBudW0gPSB4ICogMjtcclxuICB2YXIgbnVtMiA9IHkgKiAyO1xyXG4gIHZhciBudW0zID0geiAqIDI7XHJcbiAgdmFyIG51bTQgPSB4ICogbnVtO1xyXG4gIHZhciBudW01ID0geSAqIG51bTI7XHJcbiAgdmFyIG51bTYgPSB6ICogbnVtMztcclxuICB2YXIgbnVtNyA9IHggKiBudW0yO1xyXG4gIHZhciBudW04ID0geCAqIG51bTM7XHJcbiAgdmFyIG51bTkgPSB5ICogbnVtMztcclxuICB2YXIgbnVtMTAgPSB3ICogbnVtO1xyXG4gIHZhciBudW0xMSA9IHcgKiBudW0yO1xyXG4gIHZhciBudW0xMiA9IHcgKiBudW0zO1xyXG5cclxuICB2YXIgcHggPSB0aGlzLnBvc2l0aW9uLng7XHJcbiAgdmFyIHB5ID0gdGhpcy5wb3NpdGlvbi55O1xyXG4gIHZhciBweiA9IHRoaXMucG9zaXRpb24uejtcclxuXHJcbiAgdGhpcy5wb3NpdGlvbi54ID0gKDEgLSAobnVtNSArIG51bTYpKSAqIHB4ICsgKG51bTcgLSBudW0xMikgKiBweSArIChudW04ICsgbnVtMTEpICogcHo7XHJcbiAgdGhpcy5wb3NpdGlvbi55ID0gKG51bTcgKyBudW0xMikgKiBweCArICgxIC0gKG51bTQgKyBudW02KSkgKiBweSArIChudW05IC0gbnVtMTApICogcHo7XHJcbiAgdGhpcy5wb3NpdGlvbi56ID0gKG51bTggLSBudW0xMSkgKiBweCArIChudW05ICsgbnVtMTApICogcHkgKyAoMSAtIChudW00ICsgbnVtNSkpICogcHo7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybTtcclxuIiwiXHJcbmZ1bmN0aW9uIFRyYW5zaXRpb24ocGFyYW1zKSB7XHJcbiAgdGhpcy5kdXJhdGlvbiA9IHBhcmFtcy5kdXJhdGlvbjtcclxuICB0aGlzLm9iamVjdCA9IHBhcmFtcy5vYmplY3Q7XHJcbiAgdGhpcy5wcm9wZXJ0eSA9IHBhcmFtcy5wcm9wZXJ0eTtcclxuICB0aGlzLnN0YXJ0VmFsdWUgPSBwYXJhbXMuc3RhcnRWYWx1ZTtcclxuICB0aGlzLmVuZFZhbHVlID0gcGFyYW1zLmVuZFZhbHVlO1xyXG4gIHRoaXMuYm91bmNlID0gcGFyYW1zLmJvdW5jZSAhPT0gdW5kZWZpbmVkID8gcGFyYW1zLmJvdW5jZSA6IGZhbHNlO1xyXG4gIHRoaXMucmVwZWF0ID0gcGFyYW1zLnJlcGVhdCAhPT0gdW5kZWZpbmVkID8gcGFyYW1zLnJlcGVhdCA6IGZhbHNlO1xyXG4gIHRoaXMuY2FsbGJhY2sgPSBwYXJhbXMuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCA/IHBhcmFtcy5jYWxsYmFjayA6IG51bGw7XHJcbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICB0aGlzLmNvbXBsZXRlZCA9IGZhbHNlO1xyXG59XHJcblxyXG5UcmFuc2l0aW9uLnByb3RvdHlwZS5pc0NvbXBsZXRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmNvbXBsZXRlZDtcclxufVxyXG5cclxuLy8gVHJhbnNpdGlvbi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcclxuLy9cclxuLy8gfVxyXG5cclxuVHJhbnNpdGlvbi5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLm9iamVjdFt0aGlzLnByb3BlcnR5XSA9IHRoaXMuc3RhcnRWYWx1ZTtcclxuICB0aGlzLnN0YXJ0VGltZSA9IFRpbWUubm93O1xyXG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxufVxyXG5cclxuVHJhbnNpdGlvbi5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgaWYgKHRoaXMuYWN0aXZlKSB7XHJcbiAgICB2YXIgZCA9IChUaW1lLm5vdyAtIHRoaXMuc3RhcnRUaW1lKSAvIHRoaXMuZHVyYXRpb247XHJcbiAgICBpZiAoZCA8IDEpXHJcbiAgICAgIHRoaXMub2JqZWN0W3RoaXMucHJvcGVydHldID0gdGhpcy5zdGFydFZhbHVlICsgKHRoaXMuZW5kVmFsdWUgLSB0aGlzLnN0YXJ0VmFsdWUpICogZDtcclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLm9iamVjdFt0aGlzLnByb3BlcnR5XSA9IHRoaXMuZW5kVmFsdWU7XHJcbiAgICAgIGlmICh0aGlzLmJvdW5jZSkge1xyXG4gICAgICAgIHRoaXMuc3RhcnRWYWx1ZSA9IHRoaXMuZW5kVmFsdWUgKyAodGhpcy5lbmRWYWx1ZSA9IHRoaXMuc3RhcnRWYWx1ZSwgMCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLnJlcGVhdCkgdGhpcy5ib3VuY2UgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMucmVwZWF0KSB7XHJcbiAgICAgICAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICBpZiAodGhpcy5jYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0aGlzLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5UcmFuc2l0aW9uLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2l0aW9uO1xyXG4iLCJcclxuZnVuY3Rpb24gVmVjdG9yKHgsIHksIHopIHtcclxuICB0aGlzLnggPSAoeCA9PT0gdW5kZWZpbmVkID8gMCA6IHgpO1xyXG4gIHRoaXMueSA9ICh5ID09PSB1bmRlZmluZWQgPyAwIDogeSk7XHJcbiAgdGhpcy56ID0gKHogPT09IHVuZGVmaW5lZCA/IDAgOiB6KTtcclxufVxyXG5cclxuVmVjdG9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBcIntcIiArIHRoaXMueCArIFwiLFwiICsgdGhpcy55ICsgXCIsXCIgKyB0aGlzLnogKyBcIn1cIjtcclxufVxyXG5cclxuVmVjdG9yLmNvcHkgPSBmdW5jdGlvbih2ZWN0b3IpIHtcclxuICAgIHJldHVybiBuZXcgVmVjdG9yKHZlY3Rvci54LCB2ZWN0b3IueSwgdmVjdG9yLnopO1xyXG59XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHZlY3Rvcikge1xyXG4gIHRoaXMueCA9IHRoaXMueCArIHZlY3Rvci54O1xyXG4gIHRoaXMueSA9IHRoaXMueSArIHZlY3Rvci55O1xyXG4gIHRoaXMueiA9IHRoaXMueiArIHZlY3Rvci56O1xyXG4gIHJldHVybiB0aGlzO1xyXG4gIC8vIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHZlY3Rvci54LCB0aGlzLnkgKyB2ZWN0b3IueSwgdGhpcy56ICsgdmVjdG9yLnopO1xyXG59XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLmRpdmlkZSA9IGZ1bmN0aW9uKHZlY3Rvcikge1xyXG4gIHRoaXMueCA9IHRoaXMueCAvIHZlY3Rvci54O1xyXG4gIHRoaXMueSA9IHRoaXMueSAvIHZlY3Rvci55O1xyXG4gIHRoaXMueiA9IHRoaXMueiAvIHZlY3Rvci56O1xyXG4gIHJldHVybiB0aGlzO1xyXG4gIC8vIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAvIHZlY3Rvci54LCB0aGlzLnkgLyB2ZWN0b3IueSwgdGhpcy56IC8gdmVjdG9yLnopO1xyXG59XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uKHZlY3Rvcikge1xyXG4gIHJldHVybiB0aGlzLnggPT09IHZlY3Rvci54ICYmIHRoaXMueSA9PT0gdmVjdG9yLnkgJiYgdGhpcy56ID09PSB2ZWN0b3IuejtcclxufVxyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueik7XHJcbn1cclxuXHJcblZlY3Rvci5wcm90b3R5cGUubGltaXQgPSBmdW5jdGlvbihtYXgpIHtcclxuICBpZiAodGhpcy5sZW5ndGgoKSA+IG1heCkge1xyXG4gICAgdGhpcy5ub3JtYWxpemUoKTtcclxuICAgIHRoaXMuc2NhbGUobWF4KTtcclxuICB9XHJcbn1cclxuXHJcblZlY3Rvci5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbih2ZWN0b3IpIHtcclxuICB0aGlzLnggPSB0aGlzLnggKiB2ZWN0b3IueDtcclxuICB0aGlzLnkgPSB0aGlzLnkgKiB2ZWN0b3IueTtcclxuICB0aGlzLnogPSB0aGlzLnogKiB2ZWN0b3IuejtcclxuICByZXR1cm4gdGhpcztcclxuICAvLyByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKiB2ZWN0b3IueCwgdGhpcy55ICogdmVjdG9yLnksIHRoaXMueiAqIHZlY3Rvci56KTtcclxufVxyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgZG90ID0gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56O1xyXG4gIGlmIChkb3QgPiAwICYmIGRvdCAhPSAxKSB7XHJcbiAgICB2YXIgaW52ZXJzZUxlbmd0aCA9IDEgLyBNYXRoLnNxcnQoZG90KTtcclxuICAgIHRoaXMueCA9IHRoaXMueCAqIGludmVyc2VMZW5ndGg7XHJcbiAgICB0aGlzLnkgPSB0aGlzLnkgKiBpbnZlcnNlTGVuZ3RoO1xyXG4gICAgdGhpcy56ID0gdGhpcy56ICogaW52ZXJzZUxlbmd0aDtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gdmFyIGxlbiA9IHRoaXMubGVuZ3RoKCk7XHJcbiAgLy8gaWYgKGxlbiAhPSAwKSB7XHJcbiAgLy8gICB0aGlzLnggPSB0aGlzLnggLyBsZW47XHJcbiAgLy8gICB0aGlzLnkgPSB0aGlzLnkgLyBsZW47XHJcbiAgLy8gICB0aGlzLnogPSB0aGlzLnogLyBsZW47XHJcbiAgLy8gfVxyXG59XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLnJvdW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy54ID0gTWF0aC5yb3VuZCh0aGlzLngpO1xyXG4gIHRoaXMueSA9IE1hdGgucm91bmQodGhpcy55KTtcclxuICB0aGlzLnogPSBNYXRoLnJvdW5kKHRoaXMueik7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcblZlY3Rvci5wcm90b3R5cGUuZmxvb3IgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnggPSB0aGlzLnggPj4gMDtcclxuICB0aGlzLnkgPSB0aGlzLnkgPj4gMDtcclxuICB0aGlzLnogPSB0aGlzLnogPj4gMDtcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuVmVjdG9yLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxhcikge1xyXG4gIHRoaXMueCA9IHRoaXMueCAqIHNjYWxhcjtcclxuICB0aGlzLnkgPSB0aGlzLnkgKiBzY2FsYXI7XHJcbiAgdGhpcy56ID0gdGhpcy56ICogc2NhbGFyO1xyXG4gIHJldHVybiB0aGlzO1xyXG4gIC8vIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAqIHNjYWxhciwgdGhpcy55ICogc2NhbGFyLCB0aGlzLnogKiBzY2FsYXIpO1xyXG59XHJcblxyXG5WZWN0b3IucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24odmVjdG9yKSB7XHJcbiAgdGhpcy54ID0gdGhpcy54IC0gdmVjdG9yLng7XHJcbiAgdGhpcy55ID0gdGhpcy55IC0gdmVjdG9yLnk7XHJcbiAgdGhpcy56ID0gdGhpcy56IC0gdmVjdG9yLno7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbiAgLy8gcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC0gdmVjdG9yLngsIHRoaXMueSAtIHZlY3Rvci55LCB0aGlzLnogLSB2ZWN0b3Iueik7XHJcbn1cclxuXHJcblZlY3Rvci5hZGQgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgcmV0dXJuIG5ldyBWZWN0b3IoYS54ICsgYi54LCBhLnkgKyBiLnksIGEueiArIGIueik7XHJcbn1cclxuXHJcblZlY3Rvci5jcm9zcyA9IGZ1bmN0aW9uKGEsIGIpIHtcclxuICByZXR1cm4gbmV3IFZlY3RvcihcclxuICAgIGEueSAqIGIueiAtIGEueiAqIGIueSxcclxuICAgIGEueiAqIGIueCAtIGEueCAqIGIueixcclxuICAgIGEueCAqIGIueSAtIGEueSAqIGIueFxyXG4gICk7XHJcbn1cclxuXHJcblZlY3Rvci5kaXZpZGUgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgcmV0dXJuIG5ldyBWZWN0b3IoYS54IC8gYi54LCBhLnkgLyBiLnksIGEueiAvIGIueik7XHJcbn1cclxuXHJcblZlY3Rvci5kb3QgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgcmV0dXJuIChhLnggKiBiLnggKyBhLnkgKiBiLnkgKyBhLnogKiBiLnopO1xyXG59XHJcblxyXG5WZWN0b3IubXVsdGlwbHkgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgcmV0dXJuIG5ldyBWZWN0b3IoYS54ICogYi54LCBhLnkgKiBiLnksIGEueiAqIGIueik7XHJcbn1cclxuXHJcblZlY3Rvci5ub3JtYWxpemUgPSBmdW5jdGlvbih2ZWN0b3IpIHtcclxuICB2YXIgb3V0ID0gbmV3IFZlY3RvcigpO1xyXG4gIHZhciBkb3QgPSB2ZWN0b3IueCAqIHZlY3Rvci54ICsgdmVjdG9yLnkgKiB2ZWN0b3IueSArIHZlY3Rvci56ICogdmVjdG9yLno7XHJcbiAgaWYgKGRvdCA+IDApIHtcclxuICAgIHZhciBpbnZlcnNlTGVuZ3RoID0gMSAvIE1hdGguc3FydChkb3QpO1xyXG4gICAgb3V0LnggPSB2ZWN0b3IueCAqIGludmVyc2VMZW5ndGg7XHJcbiAgICBvdXQueSA9IHZlY3Rvci55ICogaW52ZXJzZUxlbmd0aDtcclxuICAgIG91dC56ID0gdmVjdG9yLnogKiBpbnZlcnNlTGVuZ3RoO1xyXG4gIH1cclxuICByZXR1cm4gb3V0O1xyXG59XHJcblxyXG5WZWN0b3Iuc2NhbGUgPSBmdW5jdGlvbih2ZWN0b3IsIHNjYWxhcikge1xyXG4gIHJldHVybiBuZXcgVmVjdG9yKHZlY3Rvci54ICogc2NhbGFyLCB2ZWN0b3IueSAqIHNjYWxhciwgdmVjdG9yLnogKiBzY2FsYXIpO1xyXG59XHJcblxyXG5WZWN0b3Iuc3VidHJhY3QgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgcmV0dXJuIG5ldyBWZWN0b3IoYS54IC0gYi54LCBhLnkgLSBiLnksIGEueiAtIGIueik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yO1xyXG4iXX0=
