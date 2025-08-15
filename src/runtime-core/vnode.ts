import { ShapeFlags } from "@/shared/shapeFlags";
import { isObject } from "@/shared";
export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");
export function createVNode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
    shapeFlags: getShapeFlage(type),
    key: props && props.key,
  };
  if (typeof children === "string") {
    //位运算通过|来赋值
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
  }
  //父组件是否有传入插槽内容
  //首先要为一个组件vnode，并且children为h函数返回的一个对象
  if (vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(vnode.children)) {
      vnode.shapeFlags |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

function getShapeFlage(type) {
  if (typeof type == "string") {
    //'div' 'span'
    return ShapeFlags.ElEMENT;
  } else if (isObject(type)) {
    //{name:"",render(){},setup(){}}
    return ShapeFlags.STATEFUL_COMPONENT;
  }
}

//创建text节点
export function createTextVNode(text: String) {
  return createVNode(Text, {}, text);
}
