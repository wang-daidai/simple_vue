import { h } from "../../dist/mini-vue.esm.js";
export const App = {
  name: "App",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "app",
        class: ["red", "hard"],
        onClick() {
          console.log("点击了");
        },
      },
      //   "hi,mini-vue"
      "hi," + this.msg
    );
  },
  setup() {
    return {
      msg: "王呆呆",
    };
  },
};
