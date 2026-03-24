import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LockIcon from '@mui/icons-material/Lock';
import { formatDistanceToNow } from 'date-fns';
import { useGetReferenceNotesQuery, useCreateReferenceNoteMutation } from '../../store/api/agendaApi.js';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/authSlice.js';

export const ReferenceNotesPanel = ({ agendaItemId, attachmentId }) => {
  const [newNote, setNewNote] = useState('');
  const currentUser = useSelector(selectCurrentUser);

  const { data: allNotes } = useGetReferenceNotesQuery(
    { agendaItemId, attachmentId },
    { skip: !agendaItemId || !attachmentId }
  );
  const [createNote, { isLoading }] = useCreateReferenceNoteMutation();

  // Double-filter: API filters + client-side filter
  const notes = (allNotes?.results || allNotes || [])
    .filter((n) => n.created_by_id === currentUser?.id || n.created_by?.id === currentUser?.id);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    try {
      await createNote({ agendaItemId, attachmentId, note_text: newNote.trim() }).unwrap();
      setNewNote('');
    } catch {
      // silently fail
    }
  };

  return (
    <Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
          MY PRIVATE NOTES
        </Typography>
      </Box>

      {notes.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>
          No notes yet. Your notes are private and visible only to you.
        </Typography>
      ) : (
        <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {notes.map((note) => (
            <Box
              key={note.id}
              sx={{
                p: 1.5,
                bgcolor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 1,
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {note.note_text}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                {note.created_at
                  ? formatDistanceToNow(new Date(note.created_at), { addSuffix: true })
                  : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          size="small"
          fullWidth
          multiline
          rows={2}
          placeholder="Add a private note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleSubmit}
          disabled={!newNote.trim() || isLoading}
          sx={{ flexShrink: 0, height: 56 }}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};
