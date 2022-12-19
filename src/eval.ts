export const wrappedEval = (
  textExpression: string,
  contextData: any,
  returnInputOnError = true
) => {
  try {
    let declarations = ``;
    if (contextData) {
      for (let key of Object.keys(contextData)) {
        declarations += `var ${key} = this.${key};`;
      }
    }
    // console.log(textExpression);
    let fn = Function(
      `"use strict"; ${declarations} return (${textExpression})`
    );
    // console.log(textExpression, fn.bind(contextData)());
    return fn.bind(contextData)();
  } catch (err) {
    if (returnInputOnError) return textExpression;
    else {
      throw err;
    }
  }
};
