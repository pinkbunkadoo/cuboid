
function Transition(params) {
  this.duration = params.duration;
  this.object = params.object;
  this.property = params.property;
  this.startValue = params.startValue;
  this.endValue = params.endValue;
  this.bounce = params.bounce;
  this.repeat = params.repeat;
  this.active = false;
}


Transition.prototype.start = function() {
  this.object[this.property] = this.startValue;
  this.startTime = Time.now;
  this.active = true;
}


Transition.prototype.update = function() {
  if (this.active) {
    // this.object[this.property] += 0.1;
    var d = (Time.now - this.startTime) / this.duration;
    // console.log(d);
    if (d < 1)
      this.object[this.property] = this.startValue + (this.endValue - this.startValue) * d;
    else {
      this.object[this.property] = this.endValue;

      if (this.bounce) {
        this.startValue = this.endValue + (this.endValue = this.startValue, 0)
        if (!this.repeat) this.bounce = false;
        this.start();
      } else {
        if (this.repeat) {
          this.start();
        } else {
          this.active = false;
        }
      }
    }
  }
}

Transition.prototype.stop = function() {
  this.active = false;
}