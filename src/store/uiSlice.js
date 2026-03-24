import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  toasts: [],
  maxAttachmentSizeMb: 10,
  systemConfig: null,
};

let toastId = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showToast: (state, action) => {
      const { message, severity = 'info', duration = 4000 } = action.payload;
      state.toasts.push({ id: ++toastId, message, severity, duration });
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setSystemConfig: (state, action) => {
      state.systemConfig = action.payload;
      if (action.payload?.max_attachment_size_mb) {
        state.maxAttachmentSizeMb = action.payload.max_attachment_size_mb;
      }
    },
  },
});

export const { showToast, dismissToast, setSystemConfig } = uiSlice.actions;

export const selectToasts = (state) => state.ui.toasts;
export const selectMaxAttachmentSizeMb = (state) => state.ui.maxAttachmentSizeMb;
export const selectSystemConfig = (state) => state.ui.systemConfig;

export default uiSlice.reducer;
