import { h } from "../../dist/mini-vue.esm.js";

export const Emit = {
  name: "Emit",
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log("触发emit事件");
      emit("add", "add");
      emit("add-foo", "add-foo");
    };
    return { emitAdd };
  },
  render() {
    const btn = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "实现emit"
    );
    return h("div", {}, [btn]);
  },
};
