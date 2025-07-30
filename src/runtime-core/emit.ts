import { toHandlerKey } from "../shared";
//父组件将emit函数传给子组件
//子组件触发这一函数，父组件根据emit中第一个参数事件名称
//去查找是否有这一事件注册，这里涉及到一些命名规范转化
//若有注册方法，则调用该方法，并将一并传入参数
export function emitEvent(instance, eventName, ...args) {
  const { props } = instance;
  let handlerName = toHandlerKey(eventName);
  const hander = props[handlerName];
  hander && hander(...args);
}
