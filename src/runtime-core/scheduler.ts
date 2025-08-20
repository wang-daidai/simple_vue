const queue = [];
let isFlushPending = false;
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  //isFlushPending 防止创建多个promise
  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
let p = Promise.resolve();
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}
