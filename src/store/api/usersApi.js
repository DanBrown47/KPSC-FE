import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery.js';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'WingRole', 'PermissionRole'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({ url: 'users/', params }),
      providesTags: ['User'],
    }),
    getUser: builder.query({
      query: (id) => `users/${id}/`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation({
      query: (data) => ({ url: 'users/', method: 'POST', body: data }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({ url: `users/${id}/`, method: 'PATCH', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deactivateUser: builder.mutation({
      query: (id) => ({ url: `users/${id}/deactivate/`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),
    activateUser: builder.mutation({
      query: (id) => ({ url: `users/${id}/activate/`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),
    resetPassword: builder.mutation({
      query: ({ id, new_password }) => ({
        url: `users/${id}/reset-password/`,
        method: 'POST',
        body: { new_password },
      }),
    }),
    getWingRoles: builder.query({
      // Flat endpoint: users/wing-roles/?user=<id>
      query: (userId) => ({ url: 'users/wing-roles/', params: { user: userId } }),
      providesTags: ['WingRole'],
    }),
    addWingRole: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: 'users/wing-roles/',
        method: 'POST',
        body: { user: userId, ...data },
      }),
      invalidatesTags: ['WingRole', 'User'],
    }),
    removeWingRole: builder.mutation({
      query: (roleId) => ({
        url: `users/wing-roles/${roleId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WingRole', 'User'],
    }),
    getPermissionRoles: builder.query({
      // Flat endpoint: users/permission-roles/?user_wing_role=<id>
      query: (wingRoleId) => ({ url: 'users/permission-roles/', params: { user_wing_role: wingRoleId } }),
      providesTags: ['PermissionRole'],
    }),
    addPermissionRole: builder.mutation({
      query: (data) => ({
        url: 'users/permission-roles/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PermissionRole', 'User'],
    }),
    removePermissionRole: builder.mutation({
      query: (roleId) => ({
        url: `users/permission-roles/${roleId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PermissionRole', 'User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useResetPasswordMutation,
  useGetWingRolesQuery,
  useAddWingRoleMutation,
  useRemoveWingRoleMutation,
  useGetPermissionRolesQuery,
  useAddPermissionRoleMutation,
  useRemovePermissionRoleMutation,
} = usersApi;
