const formatMoney = value => parseFloat(Math.round(value * 100) / 100).toFixed(2);

export default formatMoney;
