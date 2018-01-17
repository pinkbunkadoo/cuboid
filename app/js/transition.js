
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
