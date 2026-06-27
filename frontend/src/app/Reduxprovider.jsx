"use client";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import AuthInitializer from "@/components/AuthInitializer";

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
      
    </Provider>
  );
}