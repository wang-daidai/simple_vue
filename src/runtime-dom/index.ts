import { isOn } from "../shared";
import { createRenderer } from "@/runtime-core/render";
function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, val) {
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    if (val === undefined || val === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, val);
    }
  }
}

//insert 插入节点
//anchor为null则insertBefore相当于是append
//anchor为一个node节点
function insert(el, parent, anchor = null) {
  parent.insertBefore(el, anchor);
}
const renderer = createRenderer({ createElement, patchProp, insert });

export function createApp(rootComponent) {
  return renderer.createApp(rootComponent);
}

export * from "../runtime-core";
