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

},{}]},{},[5]);
