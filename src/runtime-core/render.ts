import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { isOn } from "../shared";
export function render(vnode: any, container: any) {
  path(vnode, container);
}

function path(vnode: any, container: any) {
  const { shapeFlags } = vnode;
  if (shapeFlags & ShapeFlags.ElEMENT) {
    //处理element
    processElement(vnode, container);
  } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    //处理组件
    processComponent(vnode, container);
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
function mountComponent(initinalVnode: any, container: any) {
  const instance = createComponentInstance(initinalVnode);

  setupComponent(instance);
  setupRenderEffect(instance, initinalVnode, container);
}

function setupRenderEffect(instance: any, initinalVnode: any, container: any) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  //subTree 为组件对应的vnode
  //组件转换完毕后，再次patch vnode=>element

  path(subTree, container);

  //等element挂载完毕后，再赋值el
  initinalVnode.el = subTree.el;
}

//TODO更新组件
function updateComponent(vnode: any, container: any) {}

//挂载element
function mountElement(vnode: any, container: any) {
  const { type, props, children, shapeFlags } = vnode;
  const el = (vnode.el = document.createElement(type));

  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChild(vnode, el);
  }
  for (const key in props) {
    const val = props[key];
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  container.append(el);
}

//挂载子组件
function mountChild(vnode: any, el: any) {
  const { chilidren } = vnode;
  for (const child of chilidren) {
    path(child, el);
  }
}
