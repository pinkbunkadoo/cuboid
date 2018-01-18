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

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText('tdelta: ' + Time.delta, 10, y + 100);
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

Engine.onBlur = function(event) {
  Engine.stop();
}

Engine.onFocus = function(event) {
  Engine.resume();
}

Engine.onVisibilityChange = function() {
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

  document.addEventListener('visibilitychange', Engine.onVisibilityChange);

  Engine.canvas.addEventListener('contextmenu', Engine.onContextMenu);

  Engine.stage.addEventListener('touchstart', Engine.onTouchStart);
  Engine.stage.addEventListener('touchend', Engine.onTouchEnd);
  Engine.stage.addEventListener('touchmove', Engine.onTouchMove);

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
    Engine.bootup();
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
    // Time.now = performance.now();
    Time.now = Date.now();
    Time.delta = (Time.then !== Time.now ? 1000 / (Time.now - Time.then) : 0);

    Engine.update();
    Engine.updateTransitions();
    Engine.draw();

    Engine.fps.average = Engine.fps.average * 0.99 + Time.delta * 0.01;

    Time.count++;

    Time.then = Time.now;
    Engine.frameID = requestAnimationFrame(Engine.frame);

    Engine.first = false;
  }

  Engine.interact.primaryUp = false;
  Engine.interact.deltaX = 0;
  Engine.interact.deltaY = 0;
}

Engine.resume = function() {
  if (Engine.initialised) {
    if (!Engine.active) {
      // console.log('resume', Date.now());
      Engine.active = true;
      // Time.now = performance.now();
      if (Time.start === undefined) Time.start = Date.now();
      Time.now = Date.now();
      Time.then = Time.now;
      Time.count = 0;
      Engine.fps.average = Engine.fps.standard;

      Engine.frameID = requestAnimationFrame(Engine.frame);

      for (var i = 0; i < Engine.transitions.length; i++) {
        Engine.transitions[i].start();
      }
    }
  }
}

Engine.stop = function() {
  Engine.active = false;
  cancelAnimationFrame(Engine.frameID);
  Engine.draw();
}

Engine.bootup = function() {
  Engine.initialised = true;
  Engine.first = true;
  Engine.createWorld();
  // Time.start = performance.now();
  if (!document.hidden) {
    Engine.resume();
  }
}

Engine.init = function(width, height, scale) {
  console.log('init');

  Engine.title = document.title;

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

function ready() {
  Engine.init(320, 200, 3);
}

if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', function() {
    document.removeEventListener('DOMContentLoaded', arguments.callee, false);
    ready();
  }, false);
} else {
  ready();
}

window.Engine = Engine;
window.Time = Time;
