export const wrappedEval = (
  textExpression: string,
  contextData: any,
  returnInputOnError = true
) => {
  let declarations = ``;
  if (contextData) {
    for (let key of Object.keys(contextData)) {
      declarations += `var ${key} = this.${key};`;
    }
  }
  let fn = Function(`"use strict"; ${declarations} return (${textExpression})`);
  // console.log(textExpression, fn.bind(contextData)());
  try {
    return fn.bind(contextData)();
  } catch (err) {
    if (returnInputOnError) return textExpression;
    else {
      throw err;
    }
  }
};
