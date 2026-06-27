import API from "@/services/axios";

/**
 * Custom base query wrapper for RTK Query using Axios.
 * This ensures that standard authorization interceptors and refresh token handlers
 * defined in services/axios.js are applied to all RTK Query endpoints.
 */
export const axiosBaseQuery = ({ baseUrl } = { baseUrl: "" }) =>
  async ({ url, method = "GET", data, params, headers }) => {
    try {
      const result = await API({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data || axiosError.message,
        },
      };
    }
  };
