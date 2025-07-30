import { h } from "../../dist/mini-vue.esm.js";
import { Emit } from "./Emit.js";
export const App = {
  name: "App",
  render() {
    return h(
      "div",
      {
        id: "app",
        class: ["red", "hard"],
      },
      [
        h("div", {}, "hi," + this.msg),
        h(Emit, {
          onAdd(payload) {
            console.log(payload, "onAdd");
          },
          onAddFoo(payload) {
            console.log(payload, "onAddFoo");
          },
        }),
      ]
    );
  },
  setup() {
    return {
      msg: "王呆呆",
    };
  },
};
