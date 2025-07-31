import { ShapeFlags } from "@/shared/shapeFlags";

export function initSlots(instance) {
  const { children, shapeFlags } = instance.vnode;
  if (shapeFlags & ShapeFlags.SLOT_CHILDREN) {
    for (const key in children) {
      const value = children[key];
      instance.slots[key] = Array.isArray(value) ? value : [value];
    }
  }
}
