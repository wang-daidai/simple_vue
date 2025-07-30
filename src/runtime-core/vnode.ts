import { ShapeFlags } from "@/shared/shapeFlags";
import { isObject } from "@/shared";
export function createVNode(type: any, props?: any, children?: any[]) {
  const vnode = {
    type,
    props,
    children,
    shapeFlags: getShapeFlage(type),
  };
  if (typeof children === "string") {
    //位运算通过|来赋值
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN;
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
