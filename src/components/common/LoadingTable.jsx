import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export const LoadingTable = ({ rows = 5, columns = 5 }) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1, px: 2, py: 1.5, bgcolor: '#F1F5F9', borderRadius: '8px 8px 0 0' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={20} />
        ))}
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <Box
          key={rowIdx}
          sx={{
            display: 'flex',
            gap: 2,
            px: 2,
            py: 2,
            borderBottom: '1px solid #E2E8F0',
            minHeight: 56,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              variant="text"
              width={colIdx === 0 ? '8%' : `${92 / (columns - 1)}%`}
              height={18}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};
