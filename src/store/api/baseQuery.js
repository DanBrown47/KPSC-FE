import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { updateToken, logout } from '../authSlice.js';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${baseUrl}/api/v1/`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = api.getState().auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: 'auth/refresh/',
          method: 'POST',
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data?.access) {
        api.dispatch(updateToken(refreshResult.data.access));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};
