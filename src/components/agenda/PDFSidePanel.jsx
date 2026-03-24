import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { ReferenceNotesPanel } from './ReferenceNotesPanel.jsx';
import { useGetAttachmentStreamQuery } from '../../store/api/agendaApi.js';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const PDFSidePanel = ({ open, attachment, agendaItemId, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  const { data: streamData, isLoading } = useGetAttachmentStreamQuery(
    { agendaItemId, attachmentId: attachment?.id },
    { skip: !open || !attachment?.id || !agendaItemId }
  );

  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      setScale(1.0);
    }
  }, [open, attachment?.id]);

  if (!open) return null;

  const pdfUrl = streamData?.url || (typeof streamData === 'string' ? streamData : null);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, numPages || 1));

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 64, // below TopBar
        right: 0,
        bottom: 0,
        width: 520,
        bgcolor: 'background.paper',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
      }}
    >
      {/* Custom toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: '1px solid #E2E8F0',
          bgcolor: '#F8FAFC',
          flexShrink: 0,
        }}
      >
        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }} noWrap>
          {attachment?.friendly_name || 'Document'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Previous page">
            <span>
              <IconButton size="small" onClick={handlePrev} disabled={currentPage <= 1}>
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'center' }}>
            {numPages ? `${currentPage} / ${numPages}` : '—'}
          </Typography>
          <Tooltip title="Next page">
            <span>
              <IconButton size="small" onClick={handleNext} disabled={!numPages || currentPage >= numPages}>
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Tooltip title="Zoom out">
          <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </Typography>
        <Tooltip title="Zoom in">
          <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 3.0}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* PDF viewer area */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'auto', p: 2, bgcolor: '#475569' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress sx={{ color: '#fff' }} />
          </Box>
        )}
        {!isLoading && pdfUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#fff' }} />
                </Box>
              }
              error={
                <Box sx={{ color: '#fff', textAlign: 'center', py: 4 }}>
                  <Typography variant="body2">Failed to load PDF</Typography>
                </Box>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </Document>
          </Box>
        )}
        {!isLoading && !pdfUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No preview available
            </Typography>
          </Box>
        )}
      </Box>

      {/* Reference notes */}
      <Box sx={{ px: 2, pb: 2, maxHeight: 300, overflowY: 'auto', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
        <ReferenceNotesPanel agendaItemId={agendaItemId} attachmentId={attachment?.id} />
      </Box>
    </Box>
  );
};
