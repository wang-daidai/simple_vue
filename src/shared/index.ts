//是否为对象
export const isObject = (raw: any) => raw !== null && typeof raw === "object";

//两个值是否相等
export const isSameValue = (val1: any, val2: any) => Object.is(val1, val2);

//是否有属性值
export const hasOwn = (raw: any, key: string) => Object.prototype.hasOwnProperty.call(raw, key);

//注册事件用 onClick
export const isOn = (key: string) => /^on[A-Z]/.test(key);

//add-foo -> addFoo
export function camelize(str: string) {
  //c 是 - 后面第一个字符
  return str.replace(/-(\w)/g, (_, c: String) => {
    return c ? c.toUpperCase() : "";
  });
}

//add->Add
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//add -> onAdd
export function toHandlerKey(str: string) {
  return str ? "on" + capitalize(camelize(str)) : "";
}

//返回一个空对象
export const EMPTY_OBJ = {};
