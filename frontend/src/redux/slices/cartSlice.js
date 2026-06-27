import { createSlice } from "@reduxjs/toolkit";

const isClient = typeof window !== "undefined";

const getSaved = (key, fallback) => {
  if (!isClient) return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, val) => {
  if (isClient) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }
};

const initialState = {
  cart: getSaved("cart_items", []),
  wishlist: getSaved("wishlist_items", []),
  recentlyViewed: getSaved("recently_viewed_items", []),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, selectedVariant = null } = action.payload;
      const existing = state.cart.find(
        (item) =>
          item.product._id === product._id &&
          JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.cart.push({ product, quantity, selectedVariant });
      }
      save("cart_items", state.cart);
    },
    removeFromCart: (state, action) => {
      const { productId, selectedVariant = null } = action.payload;
      state.cart = state.cart.filter(
        (item) =>
          !(
            item.product._id === productId &&
            JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
          )
      );
      save("cart_items", state.cart);
    },
    updateCartQuantity: (state, action) => {
      const { productId, selectedVariant = null, quantity } = action.payload;
      const target = state.cart.find(
        (item) =>
          item.product._id === productId &&
          JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)
      );
      if (target) {
        target.quantity = Math.max(1, quantity);
      }
      save("cart_items", state.cart);
    },
    clearCart: (state) => {
      state.cart = [];
      save("cart_items", state.cart);
    },
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const exists = state.wishlist.find((item) => item._id === product._id);
      if (exists) {
        state.wishlist = state.wishlist.filter((item) => item._id !== product._id);
      } else {
        state.wishlist.push(product);
      }
      save("wishlist_items", state.wishlist);
    },
    removeFromWishlist: (state, action) => {
      const productId = action.payload;
      state.wishlist = state.wishlist.filter((item) => item._id !== productId);
      save("wishlist_items", state.wishlist);
    },
    addRecentlyViewed: (state, action) => {
      const product = action.payload;
      // Filter out existing occurrence to move to front
      const filtered = state.recentlyViewed.filter((item) => item._id !== product._id);
      state.recentlyViewed = [product, ...filtered].slice(0, 12);
      save("recently_viewed_items", state.recentlyViewed);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  toggleWishlist,
  removeFromWishlist,
  addRecentlyViewed,
} = cartSlice.actions;

export default cartSlice.reducer;
export const selectCart = (s) => s.cart.cart;
export const selectWishlist = (s) => s.cart.wishlist;
export const selectRecentlyViewed = (s) => s.cart.recentlyViewed;
export const selectCartTotal = (s) =>
  s.cart.cart.reduce((total, item) => {
    const price = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    return total + price * item.quantity;
  }, 0);
export const selectCartItemsCount = (s) =>
  s.cart.cart.reduce((total, item) => total + item.quantity, 0);
