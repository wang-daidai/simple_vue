import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity";
import { hasOwn, EMPTY_OBJ } from "@/shared";
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    setElementText: hostSetElementText,
    remove: hostRemove,
    createTextNode: hostCreateTextNode,
  } = options;
  function render(vnode: any, container: any) {
    path(null, vnode, container, null);
  }

  function path(preVnode: any, vnode: any, container: any, parentComponent, anchor = null) {
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
          processElement(preVnode, vnode, container, parentComponent, anchor);
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
    const textNode = (vnode.el = hostCreateTextNode(children));
    container.append(textNode);
  }
  //处理组件
  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }
  //处理Element 节点
  function processElement(preVnode, vnode: any, container: any, parentComponent, anchor = null) {
    if (!preVnode) {
      //init
      mountElement(vnode, container, parentComponent, anchor);
    } else {
      //update
      patchElement(preVnode, vnode, container, parentComponent);
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

  //挂载element
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
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
    hostInsert(el, container, anchor);
  }

  //更新element
  function patchElement(n1, n2, container, parentComponent) {
    const el = (n2.el = n1.el);

    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el, parentComponent);
  }

  //更新props
  function patchProps(oldProps, newProps, el) {
    if (oldProps === newProps) return;
    //设置新值
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        hostPatchProp(el, key, newProps[key]);
      }
    }
    if (oldProps !== EMPTY_OBJ) {
      //原来有 现在没有了要删除
      for (const key in oldProps) {
        if (!hasOwn(newProps, key)) {
          hostPatchProp(el, key, undefined);
        }
      }
    }
  }
  //更新子元素
  function patchChildren(n1, n2, container, parentComponent) {
    const { shapeFlags: preShapeFlags, children: preChildren } = n1;
    const { children: nextChildren, shapeFlags: nextShapeFlags } = n2;
    //新节点的元素内容是文本
    if (nextShapeFlags & ShapeFlags.TEXT_CHILDREN) {
      //老的是数组
      if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        //删除老的内容
        unmountChildren(preChildren);
      }
      //老的是文本
      if (preShapeFlags & ShapeFlags.TEXT_CHILDREN) {
        if (preChildren === nextChildren) {
          return;
        }
      }
      hostSetElementText(nextChildren, container);
    }
    //新的是数组
    if (nextShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      //老的是数组
      if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        patchKeyedChildren(preChildren, nextChildren, container, parentComponent);
      }
      //老的是文本
      if (preShapeFlags & ShapeFlags.TEXT_CHILDREN) {
        //将老的文本置为空
        hostSetElementText("", container);
        //创建新的
        mountChildren(nextChildren, container, parentComponent);
      }
    }
  }
  function patchKeyedChildren(c1, c2, container, parentComponent) {
    console.log(c1, "旧节点");
    console.log(c2, "新节点");
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    //左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        //相同节点进一步对比渲染
        path(n1, n2, container, parentComponent);
      } else {
        break;
      }
      i++;
    }

    //右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        path(n1, n2, container, parentComponent);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    //新的比老的长
    if (i > e1 && i <= e2) {
      //这里要使用inserNode 如何新增的在左侧则要使用anchor锚点插入
      let inserNode = c2[e2 + 1] ? c2[e2 + 1].el : null;
      for (let j = i; j <= e2; j++) {
        path(null, c2[j], container, parentComponent, inserNode);
      }
    }
    //老的比新的长
    if (i > e2 && i <= e1) {
      for (let j = i; j <= e1; j++) {
        //删除多出来的
        hostRemove(c1[j].el);
      }
    }

    //中间对比
    let s1 = i;
    let s2 = i;
    let patched = 0;
    //toBePatched 要新增的节点数
    const toBePatched = e2 - i + 1;
    const keyToMap = new Map();

    //把新节点的key存取来
    for (let j = s2; j <= e2; j++) {
      const nextChild = c2[j];
      keyToMap.set(nextChild.key, j);
    }

    for (let j = s1; j <= e1; j++) {
      const prevChild = c1[j];
      let newIndex;

      //如果已经渲染的节点数量比实际需要的多，则直接删除当前节点
      if (patched >= toBePatched) {
        hostRemove(prevChild.el);
        continue;
      }

      if (prevChild.key != null) {
        //如果旧的元素有key则去映射表里查找
        newIndex = keyToMap.get(prevChild.key);
      } else {
        //没有key则遍历查找
        for (let k = s1; k <= e2; k++) {
          if (isSameVNodeType(prevChild, c2[k])) {
            newIndex = k;
            break;
          }
        }
      }
      //新的中不存在则删除
      if (!newIndex) {
        hostRemove(prevChild.el);
      } else {
        patched++;
      }
    }
  }
  function isSameVNodeType(n1, n2) {
    //type key
    //如果虚拟节点的type即div p 相同以及key相同，则视为同一节点
    return n1.type === n2.type && n1.key === n2.key;
  }
  //挂载子组件
  function mountChildren(vnodes: any, el: any, parentComponent) {
    for (const child of vnodes) {
      path(null, child, el, parentComponent);
    }
  }
  function unmountChildren(children) {
    for (const child of children) {
      const el = child.el;
      hostRemove(el);
    }
  }
  return {
    createApp: createAppAPI(render),
  };
}
