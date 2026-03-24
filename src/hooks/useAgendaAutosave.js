import { useState, useEffect, useRef, useCallback } from 'react';
import { useUpdateAgendaItemMutation } from '../store/api/agendaApi.js';

export const useAgendaAutosave = ({ agendaItemId, getFormData, isDirty, interval = 30000 }) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const [updateAgendaItem] = useUpdateAgendaItemMutation();
  const timerRef = useRef(null);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const save = useCallback(async () => {
    if (!agendaItemId || !isDirtyRef.current) return;

    const data = getFormData();
    if (!data) return;

    setSaveStatus('saving');
    try {
      await updateAgendaItem({ id: agendaItemId, ...data }).unwrap();
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  }, [agendaItemId, getFormData, updateAgendaItem]);

  useEffect(() => {
    if (!agendaItemId) return;

    timerRef.current = setInterval(save, interval);
    return () => clearInterval(timerRef.current);
  }, [agendaItemId, save, interval]);

  const forceSave = useCallback(() => save(), [save]);

  return { saveStatus, lastSaved, forceSave };
};
