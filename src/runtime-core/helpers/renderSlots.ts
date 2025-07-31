import { h } from "../h";
import { Fragment } from "../vnode";
export function renderSlots(slots, slotName, props?) {
  if (typeof slots[slotName] === "function") {
    return h(Fragment, {}, slots[slotName](props));
  }
}
