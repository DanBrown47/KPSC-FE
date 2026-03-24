import { useState, useRef, useCallback } from 'react';
import { useGenerateReportMutation } from '../store/api/reportsApi.js';
import { useGetReportStatusQuery } from '../store/api/reportsApi.js';

export const useReportGeneration = () => {
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'generating' | 'ready' | 'error'
  const [downloadUrl, setDownloadUrl] = useState(null);
  const pollingRef = useRef(null);

  const [generateReport] = useGenerateReportMutation();

  const { data: reportStatus } = useGetReportStatusQuery(taskId, {
    skip: !taskId || status !== 'generating',
    pollingInterval: 3000,
  });

  // Update status when polling returns result
  if (reportStatus && status === 'generating') {
    if (reportStatus.status === 'SUCCESS' && reportStatus.download_url) {
      setStatus('ready');
      setDownloadUrl(reportStatus.download_url);
      setTaskId(null);
    } else if (reportStatus.status === 'FAILURE') {
      setStatus('error');
      setTaskId(null);
    }
  }

  const startGeneration = useCallback(async ({ meetingId, reportType, params }) => {
    setStatus('generating');
    setDownloadUrl(null);
    try {
      const result = await generateReport({ meetingId, reportType, params }).unwrap();
      setTaskId(result.task_id);
    } catch {
      setStatus('error');
    }
  }, [generateReport]);

  const reset = useCallback(() => {
    setStatus('idle');
    setDownloadUrl(null);
    setTaskId(null);
  }, []);

  return { startGeneration, status, downloadUrl, reset };
};
