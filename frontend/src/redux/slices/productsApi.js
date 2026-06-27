import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../baseQuery";

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Product", "ProductStats"],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: "/products",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: "Product", id: _id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),
    getProduct: builder.query({
      query: (idOrSlug) => ({
        url: `/products/${idOrSlug}`,
        method: "GET",
      }),
      providesTags: (result, error, idOrSlug) => [{ type: "Product", id: idOrSlug }],
    }),
    addProduct: builder.mutation({
      query: (data) => ({
        url: "/products/add",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    getMyProducts: builder.query({
      query: (params) => ({
        url: "/products/vendor/my-products",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Product", id: "VENDOR_LIST" }],
    }),
    addReview: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/${id}/reviews`,
        method: "POST",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }],
    }),
    toggleFeatured: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/featured`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "ProductStats" },
      ],
    }),
    approveProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "ProductStats" },
      ],
    }),
    rejectProduct: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/products/${id}/reject`,
        method: "PATCH",
        data: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "ProductStats" },
      ],
    }),
    adminStats: builder.query({
      query: () => ({
        url: "/products/admin/stats",
        method: "GET",
      }),
      providesTags: [{ type: "ProductStats" }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetMyProductsQuery,
  useAddReviewMutation,
  useToggleFeaturedMutation,
  useApproveProductMutation,
  useRejectProductMutation,
  useAdminStatsQuery,
} = productsApi;
