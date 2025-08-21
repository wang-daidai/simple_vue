/**
 * 异步渲染逻辑
 * 例如nextTick这个example这个例子中，遍历修改count 如果采用同步渲染策略，则遍历几次就会重新渲染几次
 * 和只渲染遍历结束后的最终值，是一样效果，所以同步渲染显然会导致性能浪费，
 *
 * 实际渲染配合efffect中的 scheduler 配置和队列来实现异步，只渲染一次
 * 首先当effect函数中配置了scheduler后，当依赖修改后，会调用scheduler
 * 在scheduler中放置组件更新方法
 *
 * 将组件update事件放入一个非重复的队列中，保证队列中只存在一个组件更新的方法
 * 同时将这个更新的方法设置为微任务，这样可以保证在所有遍历等同步任务完成
 * 才执行更新逻辑，同时数据为最新数据
 *
 * 这里用promise 来实现更新方法为微任务
 *
 * 同时nextTick可看成，将传入的内容函数放入微任务队列中，更页面渲染更新完毕后
 * 去获取组件实例
 *
 * **/
const queue = [];
let isFlushPending = false;
export function queueJobs(job) {
  if (isFlushPending) return;
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

function queueFlush() {
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
