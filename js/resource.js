window.URL = window.URL || window.webkitURL;

var Resource = {};

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

  // console.log(type);

  Resource.loadCount++;

  var request = new XMLHttpRequest();
  if (request.overrideMimeType) request.overrideMimeType('text/plain; charset=x-user-defined');
  request.onreadystatechange = Resource.onReadyStateChange;
  request.open('GET', Resource.PATH + '/' + filename, true);
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
  // console.log('loaded', filename);

  Resource.entries[filename].loaded = true;
  Resource.loadCount--;

  if (Resource.loadCount == 0) Resource.done = true;
  if (Resource.callback) {
    // console.log('callback');
    Resource.callback(filename);
  }
}


Resource.onReadyStateChange = function(event) {
  // var request = event.target;
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

        // var blob = new Blob([this.response], {type: 'image/png'});
        // createImageBitmap(blob).then(function(response) {
        //   Resource.entries[filename].content = response;
        //   Resource.loaded(filename);
        // });

      }

    } else {
      console.log('There was a problem with the request.');
    }
  }
}



Resource.get = function(filename) {
  return Resource.entries[filename];
}


Resource.PATH = './resource';
