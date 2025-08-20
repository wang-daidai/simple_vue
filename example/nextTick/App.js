import { h, ref, getCurrentInstance, nextTick } from "../../dist/mini-vue.esm.js";

export default {
  name: "App",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();
    async function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
      }
      console.log(instance, "外部");
      nextTick(() => {
        console.log(instance, "内部");
      });
      //   await nextTick();
      //   console.log(instance, "await");
    }
    return { count, onClick };
  },
  render() {
    const button = h("button", { onClick: this.onClick }, "update");
    const p = h("p", {}, "count:" + this.count);
    return h("div", {}, [button, p]);
  },
};
