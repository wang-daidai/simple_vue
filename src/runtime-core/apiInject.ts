import { getCurrentInstance } from "./component";
//存
export function provide(key, value) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    let { provides, parent } = currentInstance;
    //下面这个判断是确保 currentInstance.provides 只初始化一次
    //否则当组件中provide 两次后 为currentInstance.provides初始化两次
    //上一次设置的值会被覆盖
    if (provides === parent.provides) {
      //子节点的provides 不能直接引用为父节点的provides
      //不然当子节点中provide了和父节点相同key的值之后
      //父节点provides值修改了
      //之后在inject去获取值时，获取到的就是修改后的新值，而非父节点的原始数据
      //这里的处理逻辑是 使用 Object.create 以父节点provides作为原型，创建一个新对象
      //在此之后，inject中即可通过原型链获取到父节点provides中的数据
      //同时在修改当前节点的provides值时，父节点的数据不会被修改
      currentInstance.provides = Object.create(parent.provides);
    }
    currentInstance.provides[key] = value;
  }
}

//取
export function inject(key, defaultValue) {
  const currentInstance = getCurrentInstance();
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (typeof defaultValue === "function") {
      return defaultValue();
    } else if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      return defaultValue;
    }
  }
}
