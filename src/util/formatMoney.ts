const formatMoney = (value: number): string =>
  parseFloat(String(Math.round(value * 100) / 100)).toFixed(2);

export default formatMoney;
