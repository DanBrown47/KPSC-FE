import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const meetingsApi = createApi({
  reducerPath: 'meetingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Meeting'],
  endpoints: (builder) => ({
    getMeetings: builder.query({
      query: (params) => ({ url: 'meetings/', params }),
      providesTags: ['Meeting'],
    }),
    getMeeting: builder.query({
      query: (id) => `meetings/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Meeting', id }],
    }),
    createMeeting: builder.mutation({
      query: (data) => ({ url: 'meetings/', method: 'POST', body: data }),
      invalidatesTags: ['Meeting'],
    }),
    updateMeeting: builder.mutation({
      query: ({ id, ...data }) => ({ url: `meetings/${id}/`, method: 'PATCH', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Meeting', id }, 'Meeting'],
    }),
    finalizeMeeting: builder.mutation({
      query: (id) => ({ url: `meetings/${id}/finalize/`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'Meeting', id }, 'Meeting', 'AgendaItem'],
    }),
    generateReport: builder.mutation({
      query: ({ id, reportType }) => ({
        url: `meetings/${id}/generate_report/`,
        method: 'POST',
        body: { report_type: reportType },
      }),
    }),
    getReportStatus: builder.query({
      query: ({ meetingId, taskId }) => `meetings/${meetingId}/report_status/?task_id=${taskId}`,
    }),
    toggleSupplementary: builder.mutation({
      query: ({ meetingId, wingIds, open }) => ({
        url: `meetings/${meetingId}/toggle_supplementary/`,
        method: 'POST',
        body: { wing_ids: wingIds, open },
      }),
      invalidatesTags: (result, error, { meetingId }) => [{ type: 'Meeting', id: meetingId }, 'Meeting'],
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useFinalizeMeetingMutation,
  useGenerateReportMutation,
  useGetReportStatusQuery,
  useToggleSupplementaryMutation,
} = meetingsApi;
