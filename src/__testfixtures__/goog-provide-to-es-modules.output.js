// goog.provide("a.b.c");

export let SOME_VALUE = "";

export let sayHello = function (name, suffix = SOME_VALUE) {
  return `Hello, ${name}; ${suffix}`;
};

export let consoleHello = function (name) {
  console.log(sayHello(name, SOME_VALUE));
};
