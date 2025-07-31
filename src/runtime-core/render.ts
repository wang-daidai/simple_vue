import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { isOn } from "../shared";
import { Fragment, Text } from "./vnode";

export function render(vnode: any, container: any) {
  path(vnode, container);
}

function path(vnode: any, container: any) {
  const { shapeFlags, type } = vnode;
  //区分vnode中的type
  switch (type) {
    case Fragment:
      //Fragment -> 只渲染 children
      processFragment(vnode, container);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlags & ShapeFlags.ElEMENT) {
        //处理element
        processElement(vnode, container);
      } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        //处理组件
        processComponent(vnode, container);
      }
  }
}
//处理type 为 Fragment 类型的节点 渲染子节点，将渲染后的dom直接放到container下
function processFragment(vnode, container) {
  mountChildren(vnode.children, container);
}
//处理文本节点，通过createTextNode方法，将文本内容直接显示，内容外面没有标签包裹
function processText(vnode, container) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}
//处理组件
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}
//处理Element 节点
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
    mountChildren(vnode.children, el);
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
function mountChildren(vnodes: any, el: any) {
  for (const child of vnodes) {
    path(child, el);
  }
}
