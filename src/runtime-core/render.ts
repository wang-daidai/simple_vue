import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity";
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    setElementText: hostSetElementText,
  } = options;
  function render(vnode: any, container: any) {
    path(null, vnode, container, null);
  }

  function path(preVnode: any, vnode: any, container: any, parentComponent) {
    const { shapeFlags, type } = vnode;
    //区分vnode中的type
    switch (type) {
      case Fragment:
        //Fragment -> 只渲染 children
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        if (shapeFlags & ShapeFlags.ElEMENT) {
          //处理element
          processElement(preVnode, vnode, container, parentComponent);
        } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
          //处理组件
          processComponent(vnode, container, parentComponent);
        }
    }
  }
  //处理type 为 Fragment 类型的节点 渲染子节点，将渲染后的dom直接放到container下
  function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode.children, container, parentComponent);
  }
  //处理文本节点，通过createTextNode方法，将文本内容直接显示，内容外面没有标签包裹
  function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }
  //处理组件
  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }
  //处理Element 节点
  function processElement(preVnode, vnode: any, container: any, parentComponent) {
    if (!preVnode) {
      //init
      mountElement(vnode, container, parentComponent);
    } else {
      //update
      pathElement(preVnode, vnode, container, parentComponent);
    }
  }

  //挂载组件
  function mountComponent(initinalVnode: any, container: any, parentComponent) {
    const instance = createComponentInstance(initinalVnode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initinalVnode, container);
  }

  function setupRenderEffect(instance: any, initinalVnode: any, container: any) {
    //effect可以实现当setup中依赖的值修改后，再次渲染元素
    //配合元素更新逻辑，否则会生成新的dom元素
    effect(() => {
      const { proxy } = instance;

      if (!instance.isMounted) {
        //subTree 为组件对应的vnode
        const subTree = (instance.subTree = instance.render.call(proxy));
        //第一次挂载
        //组件转换完毕后，再次patch vnode=>element
        path(null, subTree, container, instance);
        instance.isMounted = true;
        //等element挂载完毕后，再赋值el
        initinalVnode.el = subTree.el;
      } else {
        //更新节点
        const subTree = instance.render.call(proxy, proxy);
        //prevSubTree更新前的节点
        const prevSubTree = instance.subTree;
        path(prevSubTree, subTree, container, instance);
        instance.subTree = subTree;
      }
    });
  }

  //TODO更新组件
  function updateComponent(vnode: any, container: any) {}

  //挂载element
  function mountElement(vnode: any, container: any, parentComponent) {
    const { type, props, children, shapeFlags } = vnode;
    const el = (vnode.el = hostCreateElement(type));

    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent);
    }
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, val);
    }
    hostInsert(el, container);
  }

  //更新element
  function pathElement(n1, n2, container, parentComponent) {
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent);
  }

  //更新子元素
  function patchChildren(n1, n2, container, parentComponent) {
    const preShapeFlags = n1.shapeFlags;
    const shapeFlags = n2.shapeFlags;
    console.log(n1, "就节点");
    console.log(n2, "新节点");
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      //新节点的元素内容是文本
    }
  }

  //挂载子组件
  function mountChildren(vnodes: any, el: any, parentComponent) {
    for (const child of vnodes) {
      path(null, child, el, parentComponent);
    }
  }

  return {
    createApp: createAppAPI(render),
  };
}
