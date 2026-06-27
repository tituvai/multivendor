import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../baseQuery";

export const vendorsApi = createApi({
  reducerPath: "vendorsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Vendor", "VendorStats"],
  endpoints: (builder) => ({
    getPublicVendorShop: builder.query({
      query: (vendorId) => ({
        url: `/vendors/${vendorId}/shop`,
        method: "GET",
      }),
      providesTags: (result, error, vendorId) => [{ type: "Vendor", id: vendorId }],
    }),
    applyAsVendor: builder.mutation({
      query: (data) => ({
        url: "/vendors/apply",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Vendor", id: "APPLICATIONS" }],
    }),
    getVendorProfile: builder.query({
      query: () => ({
        url: "/vendors/profile",
        method: "GET",
      }),
      providesTags: [{ type: "Vendor", id: "PROFILE" }],
    }),
    updateVendorProfile: builder.mutation({
      query: (data) => ({
        url: "/vendors/profile",
        method: "PUT",
        data,
      }),
      invalidatesTags: [{ type: "Vendor", id: "PROFILE" }],
    }),
    adminGetStats: builder.query({
      query: () => ({
        url: "/vendors/admin/stats",
        method: "GET",
      }),
      providesTags: [{ type: "VendorStats" }],
    }),
    adminGetApplications: builder.query({
      query: (params) => ({
        url: "/vendors/admin/applications",
        method: "GET",
        params,
      }),
      providesTags: [{ type: "Vendor", id: "APPLICATIONS" }],
    }),
    adminGetDetails: builder.query({
      query: (id) => ({
        url: `/vendors/admin/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Vendor", id }],
    }),
    adminApproveVendor: builder.mutation({
      query: ({ id, data }) => ({
        url: `/vendors/admin/${id}/approve`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Vendor", id },
        { type: "Vendor", id: "APPLICATIONS" },
        { type: "VendorStats" },
      ],
    }),
    adminRejectVendor: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/vendors/admin/${id}/reject`,
        method: "PATCH",
        data: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Vendor", id },
        { type: "Vendor", id: "APPLICATIONS" },
        { type: "VendorStats" },
      ],
    }),
    adminSuspendVendor: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/vendors/admin/${id}/suspend`,
        method: "PATCH",
        data: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Vendor", id },
        { type: "Vendor", id: "APPLICATIONS" },
        { type: "VendorStats" },
      ],
    }),
    adminReactivateVendor: builder.mutation({
      query: (id) => ({
        url: `/vendors/admin/${id}/reactivate`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Vendor", id },
        { type: "Vendor", id: "APPLICATIONS" },
        { type: "VendorStats" },
      ],
    }),
  }),
});

export const {
  useGetPublicVendorShopQuery,
  useApplyAsVendorMutation,
  useGetVendorProfileQuery,
  useUpdateVendorProfileMutation,
  useAdminGetStatsQuery,
  useAdminGetApplicationsQuery,
  useAdminGetDetailsQuery,
  useAdminApproveVendorMutation,
  useAdminRejectVendorMutation,
  useAdminSuspendVendorMutation,
  useAdminReactivateVendorMutation,
} = vendorsApi;
