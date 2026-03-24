import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const wingsApi = createApi({
  reducerPath: 'wingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Wing', 'ApprovalConfig'],
  endpoints: (builder) => ({
    getWings: builder.query({
      query: (params) => ({ url: 'wings/', params }),
      providesTags: ['Wing'],
    }),
    getWing: builder.query({
      query: (id) => `wings/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Wing', id }],
    }),
    updateWingPriority: builder.mutation({
      query: (wings) => ({
        url: 'wings/reorder/',
        method: 'POST',
        body: { wings },
      }),
      invalidatesTags: ['Wing'],
    }),
    getApprovalConfig: builder.query({
      query: (wingId) => `wings/${wingId}/approval_config/`,
      providesTags: (result, error, wingId) => [{ type: 'ApprovalConfig', id: wingId }],
    }),
    updateApprovalConfig: builder.mutation({
      query: ({ wingId, ...data }) => ({
        url: `wings/${wingId}/approval_config/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { wingId }) => [{ type: 'ApprovalConfig', id: wingId }],
    }),
  }),
});

export const {
  useGetWingsQuery,
  useGetWingQuery,
  useUpdateWingPriorityMutation,
  useGetApprovalConfigQuery,
  useUpdateApprovalConfigMutation,
} = wingsApi;
