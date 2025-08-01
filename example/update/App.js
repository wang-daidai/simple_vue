import { h, ref } from "../../dist/mini-vue.esm.js";
export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const onClick = () => {
      count.value++;
    };
    const props = ref({
      foo: "foo",
      bar: "bar",
    });
    const onChangePropsDemo1 = () => {
      debugger;
      props.value.foo = "new-foo";
    };
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: "foo2",
      };
    };
    return {
      count,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
      props,
    };
  },
  render() {
    debugger;
    return h(
      "div",
      {
        id: "app",
        ...this.props,
      },
      [
        h("div", {}, "count:" + this.count),
        h(
          "button",
          {
            onClick: this.onClick,
          },
          "点击"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo1,
          },
          "改变props值"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo2,
          },
          "将props置为undefined"
        ),
        h(
          "button",
          {
            onClick: this.onChangePropsDemo3,
          },
          "修改和删除props"
        ),
      ]
    );
  },
};
