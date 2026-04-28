const VENDOR_TOKEN_KEY = "token";
const CUSTOMER_TOKEN_KEY = "customer_token";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VENDOR_TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VENDOR_TOKEN_KEY, token);
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VENDOR_TOKEN_KEY);
}

export function getCustomerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function removeCustomerToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}