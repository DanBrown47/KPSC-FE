import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query({
      query: () => 'auth/me/',
      providesTags: ['User'],
    }),
    logout: builder.mutation({
      query: () => ({
        url: 'auth/logout/',
        method: 'POST',
      }),
    }),
    refreshToken: builder.mutation({
      query: (refreshToken) => ({
        url: 'auth/refresh/',
        method: 'POST',
        body: { refresh: refreshToken },
      }),
    }),
    switchWing: builder.mutation({
      query: (wingId) => ({
        url: 'auth/switch-wing/',
        method: 'POST',
        body: { wing_id: wingId },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  useSwitchWingMutation,
} = authApi;
