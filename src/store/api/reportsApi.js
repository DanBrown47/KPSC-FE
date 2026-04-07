import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Report'],
  endpoints: (builder) => ({
    generateReport: builder.mutation({
      query: ({ meetingId, reportType }) => ({
        url: 'reports/generate/',
        method: 'POST',
        body: { meeting_id: meetingId, report_type: reportType },
      }),
      invalidatesTags: ['Report'],
    }),
    getReportStatus: builder.query({
      query: (reportId) => `reports/${reportId}/`,
      providesTags: (result, error, reportId) => [{ type: 'Report', id: reportId }],
    }),
    getReports: builder.query({
      query: (params) => ({ url: 'reports/', params }),
      providesTags: ['Report'],
    }),
  }),
});

export const {
  useGenerateReportMutation,
  useGetReportStatusQuery,
  useGetReportsQuery,
} = reportsApi;
