import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../baseQuery";

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Order", "OrderStats"],
  endpoints: (builder) => ({
    placeOrder: builder.mutation({
      query: (data) => ({
        url: "/orders",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Order", id: "LIST" }],
    }),
    getMyOrders: builder.query({
      query: (params) => ({
        url: "/orders/my-orders",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: "Order", id: _id })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),
    getOrderDetail: builder.query({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    cancelOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: "PATCH",
        data: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),
    getVendorOrders: builder.query({
      query: (params) => ({
        url: "/orders/vendor/my-orders",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Order", id: "VENDOR_LIST" }],
    }),
    updateItemStatus: builder.mutation({
      query: ({ orderId, itemId, status }) => ({
        url: `/orders/${orderId}/items/${itemId}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Order", id: "VENDOR_LIST" },
      ],
    }),
    adminGetAllOrders: builder.query({
      query: (params) => ({
        url: "/orders/admin/all",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Order", id: "ADMIN_LIST" }],
    }),
    adminUpdateStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/admin/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "ADMIN_LIST" },
        { type: "OrderStats" },
      ],
    }),
    adminOrderStats: builder.query({
      query: (params) => ({
        url: "/orders/admin/stats",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "OrderStats" }],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderDetailQuery,
  useCancelOrderMutation,
  useGetVendorOrdersQuery,
  useUpdateItemStatusMutation,
  useAdminGetAllOrdersQuery,
  useAdminUpdateStatusMutation,
  useAdminOrderStatsQuery,
} = ordersApi;
