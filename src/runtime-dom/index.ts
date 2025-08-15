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
    //删除属性
    if (val === undefined || val === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, val);
    }
  }
}

//为元素设置文本内容
function setElementText(text, el) {
  el.textContent = text;
}

//删除子节点
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

//insert 插入节点
//anchor为null则insertBefore相当于是append
//anchor为一个node节点时，可看成在parent父节点中，anchor这个锚点前插入el元素
function insert(el, parent, anchor = null) {
  parent.insertBefore(el, anchor);
}

//创建文本节点
function createTextNode(text) {
  return document.createTextNode(text);
}
const renderer = createRenderer({ createElement, patchProp, insert, setElementText, remove, createTextNode });

export function createApp(rootComponent) {
  return renderer.createApp(rootComponent);
}

export * from "../runtime-core";
