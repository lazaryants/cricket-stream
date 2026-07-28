import {
  Box,
  Typography,
} from "@mui/material";

interface MetricItemProps {
  label: string;
  value: string;
}

export function MetricItem({
  label,
  value,
}: MetricItemProps) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          mb: 0.25,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
