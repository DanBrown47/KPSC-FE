import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const wingsApi = createApi({
  reducerPath: 'wingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Wing', 'ApprovalConfig', 'AgendaForm', 'WingAgendaForm'],
  endpoints: (builder) => ({
    getWings: builder.query({
      query: (params) => ({ url: 'wings/', params }),
      providesTags: ['Wing'],
    }),
    getWing: builder.query({
      query: (id) => `wings/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Wing', id }],
    }),
    createWing: builder.mutation({
      query: (data) => ({
        url: 'wings/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wing'],
    }),
    updateWing: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `wings/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Wing'],
    }),
    deleteWing: builder.mutation({
      query: (id) => ({ url: `wings/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Wing'],
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
    getAgendaForms: builder.query({
      query: () => 'wings/agenda-forms/',
      providesTags: ['AgendaForm'],
    }),
    getWingAgendaForms: builder.query({
      query: (wingId) => `wings/${wingId}/agenda-forms/`,
      providesTags: (result, error, wingId) => [{ type: 'WingAgendaForm', id: wingId }],
    }),
    updateWingAgendaForms: builder.mutation({
      query: ({ wingId, agenda_form_ids }) => ({
        url: `wings/${wingId}/agenda-forms/`,
        method: 'PUT',
        body: { agenda_form_ids },
      }),
      invalidatesTags: (result, error, { wingId }) => [{ type: 'WingAgendaForm', id: wingId }, 'Wing'],
    }),
  }),
});

export const {
  useGetWingsQuery,
  useGetWingQuery,
  useCreateWingMutation,
  useUpdateWingMutation,
  useDeleteWingMutation,
  useUpdateWingPriorityMutation,
  useGetApprovalConfigQuery,
  useUpdateApprovalConfigMutation,
  useGetAgendaFormsQuery,
  useGetWingAgendaFormsQuery,
  useUpdateWingAgendaFormsMutation,
} = wingsApi;
