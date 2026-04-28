export type CartItem = {
  product_id: number;
  title: string;
  price: number;
  sale_price?: number | null;
  image_url?: string | null;
  store_name: string;
  store_slug: string;
  quantity: number;
};

const CART_KEY = "marketplace_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem) {
  const current = getCart();
  const existing = current.find((i) => i.product_id === item.product_id);

  if (existing) {
    existing.quantity += item.quantity;
    saveCart([...current]);
    return;
  }

  saveCart([...current, item]);
}

export function updateCartItemQuantity(productId: number, quantity: number) {
  const current = getCart().map((item) =>
    item.product_id === productId ? { ...item, quantity } : item
  );

  saveCart(current.filter((item) => item.quantity > 0));
}

export function removeFromCart(productId: number) {
  const current = getCart().filter((item) => item.product_id !== productId);
  saveCart(current);
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => {
    const unit = item.sale_price ?? item.price;
    return sum + unit * item.quantity;
  }, 0);
}