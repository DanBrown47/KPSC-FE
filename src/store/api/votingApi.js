import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';
import { agendaApi } from './agendaApi.js';

export const votingApi = createApi({
  reducerPath: 'votingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Vote', 'Remark'],
  endpoints: (builder) => ({
    castVote: builder.mutation({
      query: ({ agendaItemId, vote, remarks }) => ({
        url: `agenda/${agendaItemId}/vote/`,
        method: 'POST',
        body: { vote, remarks },
      }),
      async onQueryStarted({ agendaItemId, vote }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          agendaApi.util.updateQueryData('getAgendaItem', agendaItemId, (draft) => {
            if (draft) {
              draft.my_vote = vote;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { agendaItemId }) => [
        { type: 'Vote', id: agendaItemId },
        'Vote',
      ],
    }),
    getVotes: builder.query({
      query: (agendaItemId) => `agenda/${agendaItemId}/votes/`,
      providesTags: (result, error, id) => [{ type: 'Vote', id }],
    }),
    getRemarks: builder.query({
      query: (agendaItemId) => `agenda/${agendaItemId}/remarks/`,
      providesTags: (result, error, id) => [{ type: 'Remark', id }],
    }),
    createRemark: builder.mutation({
      query: ({ agendaItemId, content }) => ({
        url: `agenda/${agendaItemId}/remarks/`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { agendaItemId }) => [{ type: 'Remark', id: agendaItemId }],
    }),
    submitChairmanDecision: builder.mutation({
      query: ({ agendaItemId, decision, remarks }) => ({
        url: `agenda/${agendaItemId}/chairman_decision/`,
        method: 'POST',
        body: { decision, remarks },
      }),
      invalidatesTags: ['Vote'],
    }),
    submitCommissionDecision: builder.mutation({
      query: ({ agendaItemId, decision }) => ({
        url: `agenda/${agendaItemId}/commission_decision/`,
        method: 'POST',
        body: { decision },
      }),
      invalidatesTags: ['Vote'],
    }),
  }),
});

export const {
  useCastVoteMutation,
  useGetVotesQuery,
  useGetRemarksQuery,
  useCreateRemarkMutation,
  useSubmitChairmanDecisionMutation,
  useSubmitCommissionDecisionMutation,
} = votingApi;
