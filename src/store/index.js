import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import uiReducer from './uiSlice.js';
import { authApi } from './api/authApi.js';
import { usersApi } from './api/usersApi.js';
import { meetingsApi } from './api/meetingsApi.js';
import { agendaApi } from './api/agendaApi.js';
import { votingApi } from './api/votingApi.js';
import { wingsApi } from './api/wingsApi.js';
import { reportsApi } from './api/reportsApi.js';
import { notificationsApi } from './api/notificationsApi.js';
import { configApi } from './api/configApi.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [meetingsApi.reducerPath]: meetingsApi.reducer,
    [agendaApi.reducerPath]: agendaApi.reducer,
    [votingApi.reducerPath]: votingApi.reducer,
    [wingsApi.reducerPath]: wingsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [configApi.reducerPath]: configApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(
      authApi.middleware,
      usersApi.middleware,
      meetingsApi.middleware,
      agendaApi.middleware,
      votingApi.middleware,
      wingsApi.middleware,
      reportsApi.middleware,
      notificationsApi.middleware,
      configApi.middleware
    ),
});
