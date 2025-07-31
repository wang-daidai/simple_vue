import { h } from "../h";
export function renderSlots(slots, slotName) {
  if (slots[slotName]) {
    return h("div", {}, slots[slotName]);
  }
}
