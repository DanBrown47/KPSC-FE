import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const agendaApi = createApi({
  reducerPath: 'agendaApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AgendaItem', 'Attachment', 'ReferenceNote'],
  endpoints: (builder) => ({
    getAgendaItems: builder.query({
      query: (params) => ({ url: 'agenda/', params }),
      providesTags: ['AgendaItem'],
    }),
    getAgendaItem: builder.query({
      query: (id) => `agenda/${id}/`,
      providesTags: (result, error, id) => [{ type: 'AgendaItem', id }],
    }),
    createAgendaItem: builder.mutation({
      query: (data) => ({ url: 'agenda/', method: 'POST', body: data }),
      invalidatesTags: ['AgendaItem'],
    }),
    updateAgendaItem: builder.mutation({
      query: ({ id, ...data }) => ({ url: `agenda/${id}/`, method: 'PATCH', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AgendaItem', id }],
    }),
    submitAgendaItem: builder.mutation({
      query: (id) => ({ url: `agenda/${id}/submit/`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'AgendaItem', id }, 'AgendaItem'],
    }),
    approveWing: builder.mutation({
      query: (id) => ({ url: `agenda/${id}/approve_wing/`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'AgendaItem', id }, 'AgendaItem'],
    }),
    returnFromWing: builder.mutation({
      query: ({ id, reason }) => ({
        url: `agenda/${id}/return_wing/`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AgendaItem', id }, 'AgendaItem'],
    }),
    approveRNA: builder.mutation({
      query: (id) => ({ url: `agenda/${id}/approve_rna/`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'AgendaItem', id }, 'AgendaItem'],
    }),
    returnFromRNA: builder.mutation({
      query: ({ id, reason }) => ({
        url: `agenda/${id}/return_rna/`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AgendaItem', id }, 'AgendaItem'],
    }),
    consolidate: builder.mutation({
      query: ({ id, serialNumber }) => ({
        url: `agenda/${id}/consolidate/`,
        method: 'POST',
        body: { serial_number: serialNumber },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AgendaItem', id }, 'AgendaItem'],
    }),
    bulkApproveRNA: builder.mutation({
      query: (ids) => ({
        url: 'agenda/bulk_approve_rna/',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: ['AgendaItem'],
    }),
    getAttachments: builder.query({
      query: (agendaItemId) => `agenda/${agendaItemId}/attachments/`,
      providesTags: (result, error, agendaItemId) => [{ type: 'Attachment', id: agendaItemId }],
    }),
    uploadAttachment: builder.mutation({
      query: ({ agendaItemId, formData }) => ({
        url: `agenda/${agendaItemId}/attachments/`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { agendaItemId }) => [{ type: 'Attachment', id: agendaItemId }],
    }),
    deleteAttachment: builder.mutation({
      query: ({ agendaItemId, attachmentId }) => ({
        url: `agenda/${agendaItemId}/attachments/${attachmentId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { agendaItemId }) => [{ type: 'Attachment', id: agendaItemId }],
    }),
    getAttachmentStream: builder.query({
      query: ({ agendaItemId, attachmentId }) =>
        `agenda/${agendaItemId}/attachments/${attachmentId}/stream/`,
    }),
    getReferenceNotes: builder.query({
      query: ({ agendaItemId, attachmentId }) =>
        `agenda/${agendaItemId}/attachments/${attachmentId}/notes/`,
      providesTags: (result, error, { attachmentId }) => [{ type: 'ReferenceNote', id: attachmentId }],
    }),
    createReferenceNote: builder.mutation({
      query: ({ agendaItemId, attachmentId, content }) => ({
        url: `agenda/${agendaItemId}/attachments/${attachmentId}/notes/`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { attachmentId }) => [{ type: 'ReferenceNote', id: attachmentId }],
    }),
  }),
});

export const {
  useGetAgendaItemsQuery,
  useGetAgendaItemQuery,
  useCreateAgendaItemMutation,
  useUpdateAgendaItemMutation,
  useSubmitAgendaItemMutation,
  useApproveWingMutation,
  useReturnFromWingMutation,
  useApproveRNAMutation,
  useReturnFromRNAMutation,
  useConsolidateMutation,
  useBulkApproveRNAMutation,
  useGetAttachmentsQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
  useGetAttachmentStreamQuery,
  useGetReferenceNotesQuery,
  useCreateReferenceNoteMutation,
} = agendaApi;
