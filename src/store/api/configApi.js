import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const configApi = createApi({
  reducerPath: 'configApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Config'],
  endpoints: (builder) => ({
    getSystemConfig: builder.query({
      query: () => 'config/system/',
      providesTags: ['Config'],
    }),
    updateSystemConfig: builder.mutation({
      query: (data) => ({
        url: 'config/system/',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Config'],
    }),
    getAuditLogs: builder.query({
      query: (params) => ({ url: 'audit/', params }),
    }),
  }),
});

export const {
  useGetSystemConfigQuery,
  useUpdateSystemConfigMutation,
  useGetAuditLogsQuery,
} = configApi;
