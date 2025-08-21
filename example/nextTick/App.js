import { h, ref, getCurrentInstance, nextTick } from "../../dist/mini-vue.esm.js";

export default {
  name: "App",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();
    async function onClick() {
      for (let i = 2; i < 100; i++) {
        count.value = i;
        //这里面数据还在遍历，此时组件还未重新渲染
        console.log(instance, "外部");
      }
      //遍历完成后，从微任务队列中取出更新方法，重新渲染
      nextTick(() => {
        //待重新渲染的方法调用完毕后
        //再从微任务中取出这个打印事件，此时拿到的组件实例即为更新完毕的实例
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
