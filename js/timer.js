
function Timer(params)
{
  this.id = params.id;
  this.duration = params.duration;
  this.startTime = Time.now;
  this.endTime = Time.now + this.duration;
  this.onComplete = params.onComplete;
  this.finished = false;
  this.repeat = exists(params.repeat) ? params.repeat : 0;
}


Timer.prototype.tick = function()
{
  if (!this.finished)
  {
    if (Time.now >= this.endTime) {
      if (this.repeat > 1) {
        this.startTime = Time.now;
        this.endTime = Time.now + this.duration;
        this.repeat--;
      } else if (this.repeat == 0) {
        this.startTime = Time.now;
        this.endTime = Time.now + this.duration;
      } else if (this.repeat == 1) {
        this.finished = true;
      }
      this.onComplete(this);
    }
  }
}
