function wrappedEval(textExpression, contextData) {
  let declarations = ``;
  for (let key of Object.keys(contextData)) {
    declarations += `var ${key} = this.${key};`;
  }

  let fn = Function(`"use strict"; ${declarations} return (${textExpression})`);
  return fn.bind(contextData)();
}

const context = {
  testFn: (a) => a + 1,
  data: {
    test: 1,
  },
};

console.log(wrappedEval("testFn(data.test)", context));
