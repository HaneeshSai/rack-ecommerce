// All prices are stored as integer paise.
const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const fmt2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export const inr = (paise: number) => fmt.format(paise / 100);
export const inr2 = (paise: number) => fmt2.format(paise / 100);
