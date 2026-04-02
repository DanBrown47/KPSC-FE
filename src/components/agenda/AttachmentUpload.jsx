import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Tooltip from '@mui/material/Tooltip';
import { useUploadAttachmentMutation, useGetAttachmentsQuery, useDeleteAttachmentMutation } from '../../store/api/agendaApi.js';
import { useSelector } from 'react-redux';
import { selectMaxAttachmentSizeMb } from '../../store/uiSlice.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

const validateFile = (file, maxSizeMb) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only PDF, JPG, and PNG files are allowed.';
  }
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File size must be under ${maxSizeMb}MB.`;
  }
  return null;
};

export const AttachmentUpload = ({ agendaItemId }) => {
  const dispatch = useDispatch();
  const maxSizeMb = useSelector(selectMaxAttachmentSizeMb);
  const [stagedFiles, setStagedFiles] = useState([]); // { file, friendlyName, error, uploading, uploaded }
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const { data: attachmentsData, isLoading } = useGetAttachmentsQuery(agendaItemId, { skip: !agendaItemId });
  const existingAttachments = Array.isArray(attachmentsData?.results) ? attachmentsData.results : Array.isArray(attachmentsData) ? attachmentsData : [];

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((r) => {
      dispatch(showToast({ message: `Rejected: ${r.file.name} - ${r.errors[0]?.message || 'Invalid file'}`, severity: 'error' }));
    });

    const newFiles = acceptedFiles.map((file) => {
      const validationError = validateFile(file, maxSizeMb);
      return {
        id: Math.random().toString(36).slice(2),
        file,
        friendlyName: '',
        error: validationError,
        uploading: false,
        uploaded: false,
      };
    });
    setStagedFiles((prev) => [...prev, ...newFiles]);
  }, [dispatch, maxSizeMb]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: maxSizeMb * 1024 * 1024,
  });

  const handleFriendlyNameChange = (id, value) => {
    setStagedFiles((prev) => prev.map((f) => f.id === id ? { ...f, friendlyName: value } : f));
  };

  const handleUpload = async (stagedFile) => {
    if (!stagedFile.friendlyName.trim()) {
      dispatch(showToast({ message: 'Friendly name is required before uploading', severity: 'warning' }));
      return;
    }
    if (stagedFile.error) return;

    setStagedFiles((prev) => prev.map((f) => f.id === stagedFile.id ? { ...f, uploading: true } : f));

    try {
      const formData = new FormData();
      formData.append('file', stagedFile.file);
      formData.append('friendly_name', stagedFile.friendlyName.trim());

      await uploadAttachment({ agendaItemId, formData }).unwrap();
      setStagedFiles((prev) => prev.filter((f) => f.id !== stagedFile.id));
      dispatch(showToast({ message: `"${stagedFile.friendlyName}" uploaded`, severity: 'success' }));
    } catch {
      setStagedFiles((prev) => prev.map((f) => f.id === stagedFile.id ? { ...f, uploading: false } : f));
      dispatch(showToast({ message: 'Upload failed', severity: 'error' }));
    }
  };

  const handleDeleteExisting = async (attachmentId) => {
    try {
      await deleteAttachment({ agendaItemId, attachmentId }).unwrap();
      dispatch(showToast({ message: 'Attachment deleted', severity: 'info' }));
    } catch {
      dispatch(showToast({ message: 'Delete failed', severity: 'error' }));
    }
  };

  const removeStagedFile = (id) => setStagedFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <Box>
      {/* Dropzone */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : '#CBD5E1',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? '#EFF6FF' : '#F8FAFC',
          transition: 'all 0.2s',
          '&:hover': { borderColor: 'primary.main', bgcolor: '#F0F9FF' },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
          PDF, JPG, PNG — max {maxSizeMb}MB per file
        </Typography>
      </Box>

      {/* Staged files (pending upload) */}
      {stagedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Pending Upload</Typography>
          {stagedFiles.map((staged) => (
            <Box
              key={staged.id}
              sx={{
                p: 2,
                mb: 1.5,
                border: '1px solid',
                borderColor: staged.error ? 'error.main' : '#E2E8F0',
                borderRadius: 2,
                bgcolor: staged.error ? '#FEF2F2' : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ flex: 1 }} noWrap>{staged.file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(staged.file.size / 1024).toFixed(0)} KB
                </Typography>
                <IconButton size="small" onClick={() => removeStagedFile(staged.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              {staged.error ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
                  <Typography variant="caption" color="error">{staged.error}</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    size="small"
                    label="Friendly Name *"
                    placeholder="e.g. Appointment Order 2026"
                    value={staged.friendlyName}
                    onChange={(e) => handleFriendlyNameChange(staged.id, e.target.value)}
                    sx={{ flex: 1 }}
                    error={!staged.friendlyName.trim() && staged.uploading === false}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleUpload(staged)}
                    disabled={staged.uploading || !staged.friendlyName.trim()}
                    sx={{ flexShrink: 0, height: 36 }}
                  >
                    {staged.uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </Box>
              )}
              {staged.uploading && <LinearProgress sx={{ mt: 1 }} />}
            </Box>
          ))}
        </Box>
      )}

      {/* Existing attachments */}
      {existingAttachments.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>Uploaded Documents</Typography>
          <List disablePadding>
            {existingAttachments.map((att) => (
              <ListItem
                key={att.id}
                disablePadding
                sx={{ py: 1, borderBottom: '1px solid #F1F5F9' }}
                secondaryAction={
                  <IconButton size="small" color="error" onClick={() => handleDeleteExisting(att.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: '#059669' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Tooltip title={att.original_filename || att.file_name || ''}>
                      <Typography variant="body2" fontWeight={500}>
                        {att.friendly_name || att.file_name}
                      </Typography>
                    </Tooltip>
                  }
                  secondary={att.file_size ? `${(att.file_size / 1024).toFixed(0)} KB` : null}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};
