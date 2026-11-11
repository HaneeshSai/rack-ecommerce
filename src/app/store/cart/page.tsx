import { buildPriceMap } from "@/components/store/price-map";
import { CartView } from "./cart-view";

export default function CartPage() {
  return <CartView priceMap={buildPriceMap()} />;
}
