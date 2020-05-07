goog.provide("a.b.c");

a.b.c.SOME_VALUE = "";

a.b.c.sayHello = function (name, suffix = a.b.c.SOME_VALUE) {
  return `Hello, ${name}; ${suffix}`;
};

a.b.c.consoleHello = function (name) {
  console.log(a.b.c.sayHello(name, a.b.c.SOME_VALUE));
};
