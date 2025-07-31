import { getCurrentInstance } from "./component";
//存
export function provide(key, value) {
  const { provider } = getCurrentInstance();
  provider[key] = value;
}

//取
export function inject(key, defaultValue) {
  const { provider } = getCurrentInstance();
  console.log(provider, "取的时候获取的实例对象");
  if (provider[key]) {
    return provider[key];
  }
}
