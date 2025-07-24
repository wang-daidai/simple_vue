import { isObject } from "../shared";
import { createComponentInstance, setupComponent } from "./component";
export function render(vnode: any, container: any) {
  path(vnode, container);
}

function path(vnode: any, container: any) {
  const { type } = vnode;
  if (isObject(type)) {
    //处理组件
    processComponent(vnode, container);
  } else {
    //处理element
    processElement(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}
function processElement(vnode: any, container: any) {
  //init
  mountElement(vnode, container);
  //TODO update
}

//挂载组件
function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance: any, vnode: any, container: any) {
  const subTree = instance.render();
  //subTree 为组件对应的vnode
  //组件转换完毕后，再次patch vnode=>element

  path(subTree, container);
}

//TODO更新组件
function updateComponent(vnode: any, container: any) {}

//挂载element
function mountElement(vnode: any, container: any) {
  const { type, props, children } = vnode;
  const el = document.createElement(type);

  el.textContent = children;
  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }
  container.append(el);
}
