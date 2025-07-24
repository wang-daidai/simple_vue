import { render } from "./render";
import { createVNode } from "./vnode";

export function createApp(rootComponent: any) {
  return {
    mount(rootContainer: any) {
      //1.转化为vnode，后续所有操作都会基于虚拟节点做处理
      const vnode = createVNode(rootComponent);
      //2.render 实现渲染
      render(vnode, rootContainer);
    },
  };
}
