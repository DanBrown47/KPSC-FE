import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useGetWingsQuery, useUpdateWingPriorityMutation } from '../../store/api/wingsApi.js';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice.js';

export const WingConfigPage = () => {
  const dispatch = useDispatch();
  const { data, isLoading } = useGetWingsQuery();
  const [updatePriority, { isLoading: saving }] = useUpdateWingPriorityMutation();

  const [wings, setWings] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (data) {
      const sorted = [...(data?.results || data || [])].sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));
      setWings(sorted);
    }
  }, [data]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const reordered = Array.from(wings);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setWings(reordered);
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const payload = wings.map((w, i) => ({ id: w.id, priority_order: i + 1 }));
      await updatePriority(payload).unwrap();
      dispatch(showToast({ message: 'Wing order saved', severity: 'success' }));
      setIsDirty(false);
    } catch {
      dispatch(showToast({ message: 'Failed to save wing order', severity: 'error' }));
    }
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <PageHeader
        title="Wing Configuration"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Wing Configuration' }]}
        actions={
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </Button>
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drag wings to reorder their priority. Lower position = higher priority in agenda ordering.
      </Typography>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="wings">
          {(provided) => (
            <Box ref={provided.innerRef} {...provided.droppableProps}>
              {wings.map((wing, index) => (
                <Draggable key={wing.id} draggableId={String(wing.id)} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        mb: 1.5,
                        opacity: snapshot.isDragging ? 0.85 : 1,
                        boxShadow: snapshot.isDragging ? 4 : 1,
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box {...provided.dragHandleProps} sx={{ color: 'text.disabled', cursor: 'grab', display: 'flex' }}>
                          <DragIndicatorIcon />
                        </Box>
                        <Chip
                          label={index + 1}
                          size="small"
                          sx={{ bgcolor: '#0F1F3D', color: '#fff', fontWeight: 700, minWidth: 32 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5">{wing.name}</Typography>
                          {wing.code && (
                            <Typography variant="caption" color="text.secondary">{wing.code}</Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Priority {index + 1}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );
};
