import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../baseQuery";

export const categoriesApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Category"],
  endpoints: (builder) => ({
    getCategoryTree: builder.query({
      query: () => ({
        url: "/categories/tree",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: "Category", id: _id })),
              { type: "Category", id: "TREE" },
            ]
          : [{ type: "Category", id: "TREE" }],
    }),
    getFeaturedCategories: builder.query({
      query: () => ({
        url: "/categories/featured",
        method: "GET",
      }),
      providesTags: [{ type: "Category", id: "FEATURED" }],
    }),
    getAllCategories: builder.query({
      query: (params) => ({
        url: "/categories",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Category", id: "LIST" }],
    }),
    getCategory: builder.query({
      query: (idOrSlug) => ({
        url: `/categories/${idOrSlug}`,
        method: "GET",
      }),
      providesTags: (result, error, idOrSlug) => [{ type: "Category", id: idOrSlug }],
    }),
    createCategory: builder.mutation({
      query: (data) => ({
        url: "/categories",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Category", id: "TREE" }, { type: "Category", id: "LIST" }],
    }),
    updateCategory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "TREE" },
        { type: "Category", id: "LIST" },
      ],
    }),
    deleteCategory: builder.mutation({
      query: ({ id, force }) => ({
        url: `/categories/${id}`,
        method: "DELETE",
        params: { force },
      }),
      invalidatesTags: [{ type: "Category", id: "TREE" }, { type: "Category", id: "LIST" }],
    }),
    toggleCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Category", id },
        { type: "Category", id: "TREE" },
        { type: "Category", id: "LIST" },
      ],
    }),
    reorderCategories: builder.mutation({
      query: (data) => ({
        url: "/categories/reorder",
        method: "PUT",
        data,
      }),
      invalidatesTags: [{ type: "Category", id: "TREE" }, { type: "Category", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCategoryTreeQuery,
  useGetFeaturedCategoriesQuery,
  useGetAllCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useToggleCategoryMutation,
  useReorderCategoriesMutation,
} = categoriesApi;
