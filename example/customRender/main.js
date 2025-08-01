import { App } from "./App.js";
import { createRenderer } from "../../dist/mini-vue.esm.js";
console.log(PIXI, "poxi");

const game = new PIXI.Application({
  width: 500,
  height: 500,
});
document.body.append(game.view);

//通过customRender 通过自己提供的api去创建元素，设置属性等
const render = createRenderer({
  createElement(type) {
    if (type === "rect") {
      const rect = new PIXI.Graphics();
      rect.beginFill(0xae1e23);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();
      return rect;
    }
  },
  patchProp(el, key, val) {
    el[key] = val;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

const rootContainer = document.querySelector("#app");
render.createApp(App).mount(game.stage);
