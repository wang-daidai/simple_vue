import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { queueJobs } from "./scheduler";
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
          processComponent(preVnode, vnode, container, parentComponent);
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
  function processComponent(n1: any, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountComponent(n2, container, parentComponent);
    } else {
      updateComponent(n1, n2, container, parentComponent);
    }
  }
  //更新组件
  function updateComponent(n1, n2, container, parentComponent) {
    //当外部组件更新时，父组件实例会再次调用render，生成组件最新的 subTree
    //然后进行path
    //组件更新时主要是对比props有无发生变化

    //如果没有发生变化
    //则为最新的subTree也就是n2，赋值 component，component为组件实例，因为render update等方法都在组件实例上
    // 所以该步骤可保证后续组件更新正常

    // 同时因为el是在组件初次挂载时才会赋值的，因此这里要为n2赋值el
    const instance = (n2.component = n1.component);
    n2.el = n1.el;
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  }
  //根据props 判断是否要更新组件
  function shouldUpdateComponent(prevVnode, nextVnode) {
    const { props: prevProps } = prevVnode;
    const { props: nextProps } = nextVnode;

    for (const key in nextProps) {
      if (nextProps[key] != prevProps[key]) {
        return true;
      }
    }
    return false;
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
    //在vnode上挂载组件实例
    const instance = (initinalVnode.component = createComponentInstance(initinalVnode, parentComponent));
    setupComponent(instance);
    setupRenderEffect(instance, initinalVnode, container);
  }

  function setupRenderEffect(instance: any, initinalVnode: any, container: any) {
    //effect可以实现当setup中依赖的值修改后，再次渲染元素
    //配合元素更新逻辑，否则会生成新的dom元素
    instance.update = effect(
      () => {
        const { proxy, next } = instance;
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
          if (next) {
            updateComponentPreRender(instance, next);
          }
          //更新节点
          const subTree = instance.render.call(proxy, proxy);

          //prevSubTree更新前的节点
          const prevSubTree = instance.subTree;
          path(prevSubTree, subTree, container, instance);
          instance.subTree = subTree;
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
  }

  //更新组件属性
  function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.next = null;
    instance.props = nextVnode.props;
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
    //更新props
    patchProps(oldProps, newProps, el);
    //更新children
    patchChildren(n1, n2, el, parentComponent);
  }

  //更新props
  function patchProps(oldProps, newProps, el) {
    if (oldProps === newProps) return;
    for (const key of Object.keys(newProps)) {
      if (newProps[key] != oldProps[key]) {
        hostPatchProp(el, key, newProps[key]);
      }
    }
    if (oldProps !== EMPTY_OBJ) {
      for (const key of Object.keys(oldProps)) {
        if (!hasOwn(newProps, key)) {
          hostPatchProp(el, key, null);
        }
      }
    }
  }
  //更新子元素
  function patchChildren(n1, n2, container, parentComponent) {
    const { shapeFlags: prevShapeFlags, children: prevChildren } = n1;
    const { shapeFlags: nextShapeFlags, children: nextChildren, el } = n2;

    //新的是文本
    if (nextShapeFlags & ShapeFlags.TEXT_CHILDREN) {
      //老的也是文本
      if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
        if (nextChildren === prevChildren) {
          return;
        }
      }
      //老的是数组
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(prevChildren);
      }
      hostSetElementText(nextChildren, el);
    }

    //新的是数组
    if (nextShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      //老的是文本
      if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText("", el);
        mountChildren(nextChildren, el, parentComponent);
      }
      //老的是数组
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        patchKeyedChildren(prevChildren, nextChildren, container, parentComponent);
      }
    }
  }
  function patchKeyedChildren(c1, c2, container, parentComponent) {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    //左边对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        path(n1, n2, container, parentComponent);
      } else {
        break;
      }
      i++;
    }

    //右边对比
    while (e1 >= i && e2 >= i) {
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
    if (i >= e1 && i <= e2) {
      //新的比老的 长在右边
      //   for (let j = i; j <= e2; j++) {
      //     path(null, c2[j], container, parentComponent);
      //   }

      //新的比老的 长在左边
      //使用倒序遍历，保证锚点是稳定的，如果锚点为null，则相当于节点挂载在尾部，和长在右边一样
      for (let j = e2; j >= i; j--) {
        let insertNode = c2[j + 1] ? c2[j + 1].el : null;
        path(null, c2[j], container, parentComponent, insertNode);
      }
    }

    //老的比新的长
    if (i >= e2 && i <= e1) {
      for (let j = i; j <= e1; j++) {
        const child = c1[j].el;
        hostRemove(child);
      }
    }

    //中间对比
    let s1 = i;
    let s2 = i;
    let patched = 0;
    //toBePatched 要新增的节点数
    const toBePatched = e2 - i + 1;
    const keyToMap = new Map();

    //把新节点的key存取来 key=>新序列中的下标
    for (let j = s2; j <= e2; j++) {
      const nextChild = c2[j];
      keyToMap.set(nextChild.key, j);
    }

    let moved = false;
    let maxNewIndexSoFar = 0;

    //创建一个定长数组，这样性能是最好的
    const newIndexToOldIndexMap = new Array(toBePatched);
    for (let j = 0; j < toBePatched; j++) {
      newIndexToOldIndexMap[j] = 0;
    }

    for (let j = s1; j <= e1; j++) {
      const prevChild = c1[j];
      //如果已经挂载的数量已经等于需要挂载的数量了，则后续的老节点都删除
      if (patched >= toBePatched) {
        hostRemove(prevChild.el);
        continue;
      }
      let newIndex;
      //查找新的中有没有老的节点
      if (prevChild.key != null) {
        newIndex = keyToMap.get(prevChild.key);
      } else {
        for (let k = s1; k <= e2; k++) {
          if (isSameVNodeType(prevChild, c2[k])) {
            newIndex = k;
            break;
          }
        }
      }
      if (!newIndex && newIndex !== 0) {
        hostRemove(prevChild.el);
      } else {
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex;
        } else {
          moved = true;
        }
        newIndexToOldIndexMap[newIndex - s2] = j + 1;
        path(prevChild, c2[newIndex], container, parentComponent);
        patched++;
      }
    }
    const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
    let j = increasingNewIndexSequence.length - 1;

    //倒序
    for (let i = toBePatched - 1; i >= 0; i--) {
      const newIndex = i + s2;
      const nextChild = c2[newIndex];
      const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : null;
      if (newIndexToOldIndexMap[i] === 0) {
        //是0 说明这个节点原来没有 需要创建
        path(null, nextChild, container, parentComponent, anchor);
      } else if (moved) {
        //TODO 这部分逻辑 不太理解 怎么就实现了
        if (j < 0 || i != increasingNewIndexSequence[j]) {
          hostInsert(nextChild.el, container, anchor);
        } else {
          j--;
        }
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

//最长递增子序列算法
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
