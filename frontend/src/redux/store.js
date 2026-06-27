import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import { productsApi } from "./slices/productsApi";
import { categoriesApi } from "./slices/categoriesApi";
import { ordersApi } from "./slices/ordersApi";
import { vendorsApi } from "./slices/vendorsApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [vendorsApi.reducerPath]: vendorsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      productsApi.middleware,
      categoriesApi.middleware,
      ordersApi.middleware,
      vendorsApi.middleware
    ),
});