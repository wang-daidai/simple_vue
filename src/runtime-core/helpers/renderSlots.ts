import { h } from "../h";
export function renderSlots(slots, slotName, props?) {
  if (typeof slots[slotName] === "function") {
    return h("div", {}, slots[slotName](props));
  }
}
