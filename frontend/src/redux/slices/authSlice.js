import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { authAPI } from "@/services/api";

// ── Async Thunks ──────────────────────────────────────────────
export const loginUser = createAsyncThunk("auth/login", async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data);
    Cookies.set("accessToken", res.data.accessToken, { expires: 1 / 96 });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Login failed");
  }
});

export const registerUser = createAsyncThunk("auth/register", async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Registration failed");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await authAPI.logout();
    Cookies.remove("accessToken");
  } catch (err) {
    Cookies.remove("accessToken");
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getMe();
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

// ── Slice ─────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:        null,
    accessToken: Cookies.get("accessToken") || null,
    isLoading:   false,
    error:       null,
    initialized: false,
  },
  reducers: {
    clearError:   (state) => { state.error = null; },
    setToken:     (state, action) => { state.accessToken = action.payload; },
    clearAuth:    (state) => { state.user = null; state.accessToken = null; Cookies.remove("accessToken"); },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.isLoading   = false;
        s.user        = a.payload.user;
        s.accessToken = a.payload.accessToken;
      })
      .addCase(loginUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; })

    // register
      .addCase(registerUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(registerUser.fulfilled, (s) => { s.isLoading = false; })
      .addCase(registerUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; })

    // logout
      .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.accessToken = null; })

    // fetchMe
      .addCase(fetchMe.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.isLoading = false; s.user = a.payload; s.initialized = true; })
      .addCase(fetchMe.rejected,  (s) => { s.isLoading = false; s.initialized = true; });
  },
});

export const { clearError, setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────
export const selectAuth        = (s) => s.auth;
export const selectUser        = (s) => s.auth.user;
export const selectIsLoggedIn  = (s) => !!s.auth.user;
export const selectUserRole    = (s) => s.auth.user?.role;
export const selectAuthLoading = (s) => s.auth.isLoading;