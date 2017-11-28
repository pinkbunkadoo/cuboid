
var Engine = {};
var Time = {};

MESHES = [ 'level01.obj', 'level02.obj', 'level03.obj', 'level04.obj', 'cube.obj', 'cone.obj', 'ico.obj', 'marker.obj', 'pad.obj', 'bridge.obj' ];
TEXTURES = [ ];

Engine.createElements = function() {
  document.body.style.backgroundColor = 'rgb(16, 16, 16)';

  Engine.stage = document.getElementById('stage');
  // Engine.stage.id = 'stage';
  Engine.stage.style.position = 'absolute';
  Engine.stage.style.overflow = 'hidden';
  Engine.stage.style.top = '50%';
  Engine.stage.style.left = '50%';
  Engine.stage.style.width = (Engine.width * Engine.scale) + 'px';
  Engine.stage.style.height = (Engine.height * Engine.scale) + 'px';
  Engine.stage.style.margin = '-' + ((Engine.height * Engine.scale) / 2) + 'px 0 0 -' + ((Engine.width * Engine.scale) / 2) + 'px';
  Engine.stage.style.userSelect = 'none';
  Engine.stage.style.padding = '0px';
  Engine.stage.style.border = '0px';
  Engine.stage.style.fontSize = '0';
  // document.body.appendChild(Engine.stage);

  Engine.canvas = document.createElement('canvas');
  Engine.canvas.style.backgroundColor = 'green';
  Engine.canvas.id = 'surface';
  Engine.canvas.width = Engine.width * Engine.scale;
  Engine.canvas.height = Engine.height * Engine.scale;
  Engine.canvas.style.userSelect = 'none';
  Engine.stage.appendChild(Engine.canvas);

  // Engine.fpsEl = document.createElement('div');
  // Engine.fpsEl.style.color = 'white';
  // Engine.fpsEl.style.position = 'absolute';
  // Engine.fpsEl.style.top = '0px';
  // Engine.fpsEl.style.left = '0px';
  // Engine.stage.appendChild(Engine.fpsEl);

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
  // Engine.bootup();
}


Engine.processLevelMesh = function(level) {
  var mesh = level.mesh;
  var grid = level.grid = new Array(Engine.gridSize * Engine.gridSize);
  var tt = 0;

  mesh.colors.push(new Color(220, 220, 220, 255));
  mesh.colors.push(new Color(190, 190, 190, 255));
  var color_1 = mesh.colors.length - 2;
  var color_2 = mesh.colors.length - 1;

  for (var i = 0; i < mesh.triangles.length; i++) {
    var triangle = mesh.triangles[i];
    var color = mesh.colors[triangle.colors[0]];

    var v0 = mesh.vertices[triangle.vertices[0]];
    var v1 = mesh.vertices[triangle.vertices[1]];
    var v2 = mesh.vertices[triangle.vertices[2]];

    var d0 = distance(v0.x, v0.z, v1.x, v1.z);
    var d1 = distance(v0.x, v0.z, v2.x, v2.z);
    var d2 = distance(v1.x, v1.z, v2.x, v2.z);

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

      if (!Color.equals(color, Color.WHITE)) {
        if (Color.equals(color, Color.GREY)) {
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
        }
        // triangle.id = id;
        grid[index] = { x: mp.x, z: mp.z, height: v0.y, color: color };
      }
    }
  }

  level.entities = [];

  for (var i = 0; i < grid.length; i++) {
    var square = grid[i];
    if (square) {
      if (Color.equals(square.color, Color.BLACK)) {
        var pad = new Entity(square.x, square.height, square.z);
        pad.mesh = Engine.meshes['pad.obj'];
        level.entities.push(pad);
        square.entity = pad;
      } else if (Color.equals(square.color, Color.MAGENTA)) {
        var bridge = new Entity(square.x, square.height, square.z);
        bridge.mesh = Engine.meshes['bridge.obj'];
        bridge.visible = false;
        level.entities.push(bridge);
        square.entity = bridge;
        square.height = square.height - 1;
        square.active = false;
        // console.log('bridge', i);
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
  // camera.transform.position.x = 100; //35
  // camera.transform.position.y = 100; //35
  // camera.transform.position.z = 100; //35
  camera.transform.position.x = 35;
  camera.transform.position.y = 35;
  camera.transform.position.z = 35;
  // camera.transform.rotation.x = -90 * RAD;

  camera.lookAt(new Vector(), new Vector(0, 1, 0));
}


Engine.createWorld = function() {
  // console.log('Engine.createWorld');

  Engine.imageData = Engine.offscreenContext.getImageData(0, 0, Engine.offscreenWidth, Engine.offscreenHeight);
  var surface = new Surface(Engine.offscreenWidth, Engine.offscreenHeight, Engine.imageData);

  var camera = new Camera(Camera.PERSPECTIVE, 30, 1, 100);
  // camera.view = new Rectangle(0.25, 0.25, 0.5, 0.5);
  // var camera = new Camera(Camera.ORTHOGRAPHIC, 10, 1, 100);
  // camera.orthoScale = 10;

  Renderer.init(surface, camera);

  Engine.grid = new Array(Engine.gridSize * Engine.gridSize);

  Engine.light = new Light(0, 0, 0, new Color(255, 255, 255, 255));
  // Engine.light.setDirection(-0.4, -1, -0.6);
  Engine.light.setDirection(-0.6, -1, -0.4);

  Engine.lightFill = new Light(0, 0, 0, new Color(128, 140, 160, 255));
  // Engine.lightFill.setDirection(0.4, 0, 0.6);
  Engine.lightFill.setDirection(0.6, 0, 0.4);

  Engine.levels = [];

  var level = new Entity();
  level.mesh = Engine.meshes['level01.obj'];
  Engine.processLevelMesh(level);
  level.default = 236;
  level.grid[32].exit = 1;
  level.grid[32].target = 207;
  Engine.levels.push(level);

  var level = new Entity();
  level.mesh = Engine.meshes['level02.obj'];
  Engine.processLevelMesh(level);
  level.default = 100;
  level.grid[86].target = 227;

  level.grid[12].exit = 3;
  level.grid[12].target = 252;

  level.grid[207].exit = 0;
  level.grid[207].target = 32;

  level.grid[224].exit = 2;
  level.grid[224].target = 95;
  Engine.levels.push(level);

  var level = new Entity();
  level.mesh = Engine.meshes['level03.obj'];
  Engine.processLevelMesh(level);
  level.default = 92;
  level.grid[95].exit = 1;
  level.grid[95].target = 224;
  Engine.levels.push(level);

  var level = new Entity();
  level.mesh = Engine.meshes['level04.obj'];
  Engine.processLevelMesh(level);
  level.default = 128;
  level.grid[252].exit = 1;
  level.grid[252].target = 12;
  Engine.levels.push(level);

  // var ico = new Entity(level03.grid[90].x, level03.grid[90].height + 0.75, level03.grid[90].z);
  // ico.mesh = Engine.meshes['ico.obj'];
  // ico.ambient = 0.2;
  // ico.tint = new Colorf(0.5, 0.8, 1);
  // level03.grid[90].entity = ico;
  // level03.entities.push(ico);

  // var transition = new Transition({ duration: 2000, startValue: 0, endValue: Math.PI * 2, object: ico.transform.rotation, property: 'y', bounce: false, repeat: true });
  // Engine.transitions['ico'] = transition;
  // Engine.levels.push(level03);

  var cube = new Entity(0.5, 0.5, 0.5);
  cube.mesh = Engine.meshes['cube.obj'];
  cube.ambient = 0.4;
  cube.tint = new Colorf(1, 1, 1);
  Engine.cube = cube;

  var transition = new Transition({ duration: 500, startValue: 0.25, endValue: 1, object: cube.tint, property: 'r', bounce: true, repeat: true });
  Engine.transitions['cube'] = transition;

  var marker = new Entity(0.5, Engine.cube.transform.position.y + 1, 0.5);
  marker.mesh = Engine.meshes['marker.obj'];
  marker.ambient = 0.8;
  Engine.marker = marker;

  var transition = new Transition({ duration: 500, startValue: 1, endValue: 1.2, object: marker.transform.position, property: 'y', bounce: true, repeat: true });
  Engine.transitions['marker'] = transition;

  Engine.gridId = 0;

  // var cone = new Entity(0, 0, 0);
  // cone.mesh = Engine.meshes['cone.obj'];
  // Engine.entities.push(cone);
  // Engine.cone = cone;
  //
  // var ico = new Entity(2, 2, 0);
  // ico.mesh = Engine.meshes['ico.obj'];
  // Engine.ico = ico;
  // Engine.entities.push(ico);

  // var plane = new Entity(0, 0, 0);
  // plane.mesh = Engine.meshes['plane.obj'];
  // plane.texture = Engine.textures['cube.png'];
  // Engine.entities.push(plane);

  // var compass = new Entity(0.5, 0.5, 0.5);
  // compass.mesh = Engine.meshes['compass.obj'];
  // compass.ambient = 1.0;
  // Engine.entities.push(compass);
  // Engine.compass = compass;

  // Engine.lines.push(new Line(new Vector(0, 0, 0), new Vector(2, 0, 0), Color.RED));
  // Engine.lines.push(new Line(new Vector(0, 0, 0), new Vector(0, 2, 0), Color.GREEN));
  // Engine.lines.push(new Line(new Vector(0, 0, 0), new Vector(0, 0, 2), Color.BLUE));
  Engine.hit = null;

  Engine.goLevel(0);
  Engine.moveTo(Engine.level.default);
}


Engine.bootup = function() {
  Engine.createWorld();
  Engine.initialised = true;
  Engine.first = true;
  Time.start = performance.now();
  Engine.resume();
}


Engine.resume = function() {
  if (Engine.initialised) {

    Engine.active = true;
    Time.now = performance.now();
    Time.then = Time.now;
    Time.count = 0;
    Engine.fps.average = Engine.fps.standard;
    Engine.frameID = requestAnimationFrame(Engine.frame);

    for (i in Engine.transitions) {
      Engine.transitions[i].start();
    }

  }
}


Engine.stop = function() {
  Engine.active = false;
  cancelAnimationFrame(Engine.frameID);

  // for (i in Engine.transitions) {
  //   Engine.transitions[i].stop();
  // }

  var ctx = Engine.context;
  var x = 10, y = 8;
  ctx.fillStyle ='white';
  ctx.fillRect(x, y, 2, 6);
  ctx.fillRect(x + 4, y, 2, 6);
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

  // var h = cameraToWorld.multiplyPoint(new Vector(0, 0, -1));
  // console.log(h);


  if (camera.type == Camera.PERSPECTIVE) {
    eye = camera.transform.position;
    dir = Vector.subtract(pWorld, eye).normalize();
  } else {
    dir = camera.transform.position;
    eye = pWorld;
  }

  // Engine.ray = Vector.scale(dir, -10);

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


Engine.moveTo = function(g) {
  var square = Engine.grid[g];
  if (square == undefined) return;

  var x = (g % Engine.gridSize) - 7;
  var y = Engine.grid[g].height;
  var z = ((g / Engine.gridSize) >> 0) - 7;
  var position = Engine.cube.transform.position;

  var oldSquare = Engine.grid[Engine.cube.g];

  if (oldSquare) {
    if (Color.equals(oldSquare.color, Color.BLACK)) {
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
    // Engine.moveTo(Engine.level.exit);
    Engine.gridIndex = square.target;
  } else {
    if (Color.equals(Engine.grid[g].color, Color.CYAN) || Color.equals(Engine.grid[g].color, Color.GREEN)) {
      for (var i = 0, len = Engine.grid.length; i < len; i++) {
        var square = Engine.grid[i];
        if (square) {
          if (i != g && Color.equals(square.color, Engine.grid[g].color)) {
            x = (i % Engine.gridSize) - 7;
            y = square.height;
            z = ((i / Engine.gridSize) >> 0) - 7;
            Engine.gridIndex = i;
            break;
          }
        }
      }
    } else if (Color.equals(square.color, Color.BLACK)) {
      if (square.entity) {
        square.entity.transform.position.y = square.height - 0.1;
        if (square.target !== undefined) {
          // console.log(square.target);
          var targetSquare = Engine.grid[square.target];
          if (targetSquare.active == false) {
            targetSquare.active = true;
            if (Color.equals(targetSquare.color, Color.MAGENTA)) {
              targetSquare.height = targetSquare.height + 1;
              targetSquare.entity.visible = true;
            }
          }
        }
      }
    } else if (Color.equals(square.color, Color.MAGENTA)) {
      if (!square.active) {
        return;
      }
    } else if (Color.equals(square.color, Color.ORANGE)) {
      return;
    }
  }

  Engine.cube.g = Engine.gridIndex;

  position.x = x - 0.5;
  position.z = z - 0.5;
  position.y = y + 0.5;

  Engine.marker.transform.position.x = position.x;
  Engine.marker.transform.position.z = position.z;

  delete Engine.transitions['marker'];
  var transition = new Transition({ duration: 500, startValue: position.y + 1, endValue: position.y + 1.2, object: Engine.marker.transform.position, property: 'y', bounce: true, repeat: true });
  Engine.transitions['marker'] = transition;
  transition.start();
}


Engine.updateTransitions = function() {
  for (i in Engine.transitions) {
    Engine.transitions[i].update();
  }
}


Engine.update = function() {
  var camera = Renderer.camera;
  var center = new Vector();
  var axis = new Vector(0, 1, 0);
  var delta = Time.delta;

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

  if (Engine.ico) {
    var angle = (0.01 * delta);
    Engine.ico.transform.rotateAround(center, new Vector(0, 1, 0), angle);
  }

  if (Engine.compass) {
    // if (Engine.compass.transform.scale.x >= 1.5) Engine.compass.transform.scale.x = 1;
    // if (Engine.compass.transform.scale.z >= 1.5) Engine.compass.transform.scale.z = 1;
    // Engine.compass.transform.scale.x += 0.01;
    // Engine.compass.transform.scale.z += 0.01;
  }

  if (Engine.cube) {
    // Engine.cube.ambient -= 0.004;
    // if (Engine.cube.ambient <= 0.4) Engine.cube.ambient = 0.6;
    if (Engine.cube.tint) {
      // if (Time.count % 8 == 0) Engine.cube.tint.r = Math.max(0.2, Math.random());
    }
    // if (Time.count % 8 == 0) Engine.cube.ambient = clamp(Math.random(), 0.4, 0.6);
    // Engine.cube.tint.g  = Math.random();
    // Engine.cube.tint.b  = Math.random();
  }

  // Engine.cone.transform.rotation.y += angle;
  // Engine.cone.transform.rotation.z += theta;

  if (Engine.interact.primary) {
    // var angle = -(Engine.interact.deltaX) * 0.01 * delta;
    // Renderer.view.camera.transform.rotateAround(center, axis, angle);
    // camera.orientation = Camera.lookAt(camera.transform.position, new Vector(), new Vector(0, 1, 0));
  }

  // var angle = -(Engine.interact.deltaX * 10) * delta;
  // Renderer.view.camera.transform.rotateAround(center, axis, 10 * delta);
  // camera.orientation = Camera.lookAt(camera.transform.position, new Vector(), new Vector(0, 1, 0));

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

    if (Engine.fpsEl) {
      if (Time.count % Engine.fps.standard == 0) {
        Engine.fpsEl.innerHTML = Engine.fps.average.toFixed(1);
      }
    }

    Time.then = Time.now;
    Engine.frameID = requestAnimationFrame(Engine.frame);

    Engine.first = false;
  }
  // Engine.keys = {};
  Engine.interact.primaryUp = false;
  Engine.interact.deltaX = 0;
  Engine.interact.deltaY = 0;
}


Engine.drawEntity = function(entity, cull) {
  var camera = Renderer.camera;

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

        illumination.r = Math.min(1.0, facingRatio0 * lightColor.r + facingRatio1 * lightFillColor.r);
        illumination.g = Math.min(1.0, facingRatio0 * lightColor.g + facingRatio1 * lightFillColor.g);
        illumination.b = Math.min(1.0, facingRatio0 * lightColor.b + facingRatio1 * lightFillColor.b);

        illumination.r = Math.min(1.0, illumination.r + ambient);
        illumination.g = Math.min(1.0, illumination.g + ambient);
        illumination.b = Math.min(1.0, illumination.b + ambient);

        illumination.r = Math.max(0.2, illumination.r);
        illumination.g = Math.max(0.2, illumination.g);
        illumination.b = Math.max(0.2, illumination.b);

        v0.color = mesh.colors[triangle.colors[0]];
        v1.color = mesh.colors[triangle.colors[1]];
        v2.color = mesh.colors[triangle.colors[2]];

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

    // id = 0;
  }
}


Engine.drawEntityAxes = function(entity) {
  // var transformMatrix = entity.getTransformMatrix();
  var xaxis, yaxis, zaxis, line;

  zaxis = new Vector(0, 0, 2);
  var a = entity.toWorld(zaxis);
  line = new Line(entity.transform.position, a, Color.BLUE);
  Renderer.drawLine(line);

  yaxis = new Vector(0, 2, 0);
  var b = entity.toWorld(yaxis);
  line = new Line(entity.transform.position, b, Color.GREEN);
  Renderer.drawLine(line);

  xaxis = new Vector(2, 0, 0);
  var c = entity.toWorld(xaxis);
  line = new Line(entity.transform.position, c, Color.RED);
  Renderer.drawLine(line);

}


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

  // for (var i = 0; i < Engine.lines.length; i++) {
  //   Renderer.drawLine(Engine.lines[i], Color.WHITE);
  // }

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
        var linepath = new Line(position, new Vector(x - 0.5, y, z - 0.5), Color.YELLOW);
        Renderer.drawLine(linepath);
      // }
    }
  }
}


Engine.drawTest = function() {
  var shade = new Colorf();

  // for (var i = 0; i < 100; i++) {
  //   var r = Math.random();
  //   var s = Math.random();
  //   var t = (160 * r) + 10 >> 0;
  //   var u = (100 * s) + 10 >> 0;
  //   var w = 8;
  //
  //   var v0 = new Vector(t, u, 1+r);
  //   var v1 = new Vector(t + w, u, 1+r);
  //   var v2 = new Vector(t + w, u - w, 1+r);
  //
  //   v0.color = new Color((Math.random()*255), (Math.random()*255), (Math.random()*255));
  //
  //   Renderer.drawTriangle(v0, v1, v2, shade);
  // }

  var viewMatrix = Renderer.camera.toLocal();
  var projectionMatrix = Renderer.getProjection();

  var line = new Line(new Vector(-5, 0, -5), new Vector(-5, 0, 5), Color.WHITE);
  var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
  var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
  Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);

  var line = new Line(new Vector(-5, 0, 5), new Vector(5, 0, 5), Color.WHITE);
  var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
  var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
  Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);

  var line = new Line(new Vector(5, 0, 5), new Vector(5, 0, -5), Color.WHITE);
  var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
  var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
  Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);

  var line = new Line(new Vector(5, 0, -5), new Vector(-5, 0, -5), Color.WHITE);
  var a = Camera.worldToScreen(line.a, viewMatrix, projectionMatrix).round();
  var b = Camera.worldToScreen(line.b, viewMatrix, projectionMatrix).round();
  Renderer.line(a.x, a.y, b.x, b.y, line.color.r, line.color.g, line.color.b, line.color.a);

  // Renderer.setPixel(a.x, a.y, 255, 0, 0, 255);
}


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
    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText(Math.round(Engine.fps.average), 10, 20);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText(Renderer.tricount, 10, 30);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText(Renderer.largetri, 10, 40);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText(Renderer.pixcount, 10, 50);

    ctx.fillStyle = 'rgb(0, 255, 0)';
    ctx.fillText(Engine.gridIndex, 10, 60);

    // ctx.fillStyle = 'rgb(0, 255, 0)';
    // ctx.fillText(Engine.hit.x, 10, 70);

    // var camera = Renderer.camera;
    // var viewMatrix = camera.toLocal();
    // var projectionMatrix = Renderer.getProjection();

    if (Engine.hit) {
      // var pRaster = Renderer.worldToRaster(Engine.hit, viewMatrix, projectionMatrix);
      // ctx.fillStyle = 'red';
      // ctx.beginPath();
      // ctx.arc(pRaster.x * Engine.scale, pRaster.y * Engine.scale, 2, 0, Math.PI * 2);
      // ctx.fill();
    }
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
  // console.log('scroll');
}


Engine.onKeyDown = function(event) {
  Engine.keys[event.key] = true;
}


Engine.onKeyUp = function(event) {
  if (event.key == 'ArrowLeft') {
    // var position = Engine.cube.transform.position;
    // var x = position.x + 0.5 + 7;
    // var y = position.y + 0.5;
    // var z = position.z + 0.5 + 7;
    // var g = (z * 16 + x) - 1;
    // Engine.moveTo(g);
  } else if (event.key == 'ArrowRight') {
    // var position = Engine.cube.transform.position;
    // var x = position.x + 0.5 + 7;
    // var y = position.y + 0.5;
    // var z = position.z + 0.5 + 7;
    // var g = (z * 16 + x) + 1;
    // Engine.moveTo(g);
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
  // var gx = (Engine.interact.x * Engine.scale) >> 0;
  // var gy = (Engine.interact.y * Engine.scale) >> 0;
  // var id = Renderer.idBuffer[gy * Renderer.surface.width + gx];
  // console.log(pRaster);

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
    camera.transform.rotateAround(center, axis, angle);
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
          if (pointInRect(p.x, p.z, square.x - 0.5, square.z - 0.5, 1.0, 1.0)) {
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

  // console.log('click');
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

  // console.log('onMouseUp');
}


Engine.onMouseOut = function(event) {
  // Engine.interact.primary = false;
  // console.log('out');
}


Engine.onMouseOver = function(event) {
  // Engine.interact.primary = false;
}


Engine.processTouchEvent = function(event) {
  // Engine.interact.x = event.clientX - Engine.stage.offsetLeft;
  // Engine.interact.y = event.clientY - Engine.stage.offsetTop;
  Engine.interact.x = event.changedTouches[0].clientX - Engine.stage.offsetLeft;
  Engine.interact.y = event.changedTouches[0].clientY - Engine.stage.offsetTop;
  // Engine.interact.deltaX = Engine.interact.x - Engine.interact.lastX;
  // Engine.interact.deltaY = Engine.interact.y - Engine.interact.lastY;
  Engine.interact.primary = true;
  // Engine.interact.buttons = event.buttons;
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
