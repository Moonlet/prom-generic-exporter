export const fromAtomic = (
  atomicAmount: string | number,
  decimals: number
): number => {
  // console.log("fromAtomic", atomicAmount, decimals);
  const amount =
    new Array(decimals).fill("0", 0, decimals).join("") + atomicAmount;

  if (/[0-9]+/i.test(amount)) {
    return parseFloat(
      amount.slice(0, amount.length - decimals) + "." + amount.slice(-decimals)
    );
    //);
  }
  return NaN;
};

export const toAtomic = (amount: string | number, decimals: number): string => {
  const amt = "" + amount + new Array(decimals).fill("0", 0, decimals).join("");
  const parts = amt.split(".");

  if (
    parts.length <= 2 &&
    parts.length >= 1 &&
    /[0-9]+/i.test(parts[0]) &&
    /[0-9]*/i.test(parts[1])
  ) {
    return (parts[0] + (parts[1] || "").slice(0, decimals)).replace(
      /^0+/gi,
      ""
    );
  }
  return "NaN";
};

export const fromHex = (data: string): string => {
  // console.log("fromHex", data, BigInt(data).toString());
  return BigInt(data).toString();
};
