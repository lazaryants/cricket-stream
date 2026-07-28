import {
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import type {
  SessionLogEntry,
} from "../types/session";


interface SessionLogViewerProps {
  logs: Array<
    string | SessionLogEntry
  >;
}


function formatTimestamp(
  value: unknown,
): string | null {
  if (
    typeof value !== "string"
    || !value
  ) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      dateStyle: "short",
      timeStyle: "medium",
    },
  ).format(date);
}


function getMessage(
  entry: SessionLogEntry,
): string {
  if (
    typeof entry.message === "string"
    && entry.message
  ) {
    return entry.message;
  }

  return JSON.stringify(
    entry,
    null,
    2,
  );
}


export function SessionLogViewer({
  logs,
}: SessionLogViewerProps) {
  if (logs.length === 0) {
    return (
      <Typography
        color="text.secondary"
      >
        Журнал пуст.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        maxHeight: 520,
        overflow: "auto",
        borderRadius: 1,
        bgcolor:
          "rgba(0,0,0,0.35)",
      }}
    >
      <Stack>
        {logs.map(
          (entry, index) => {
            if (
              typeof entry
              === "string"
            ) {
              return (
                <Box
                  key={index}
                  sx={{
                    px: 2,
                    py: 1,
                    borderBottom:
                      "1px solid "
                      + "rgba(255,255,255,0.05)",
                    fontFamily:
                      "monospace",
                    fontSize: 12,
                    whiteSpace:
                      "pre-wrap",
                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {entry}
                </Box>
              );
            }

            const timestamp =
              formatTimestamp(
                entry.timestamp,
              );

            const level =
              typeof entry.level
                === "string"
                ? entry.level
                : null;

            const source =
              typeof entry.source
                === "string"
                ? entry.source
                : null;

            return (
              <Box
                key={index}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderBottom:
                    "1px solid "
                    + "rgba(255,255,255,0.05)",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems:
                      "center",
                    flexWrap: "wrap",
                    mb: 0.5,
                  }}
                >
                  {timestamp && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {timestamp}
                    </Typography>
                  )}

                  {level && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        level.toUpperCase()
                      }
                    />
                  )}

                  {source && (
                    <Chip
                      size="small"
                      label={source}
                    />
                  )}
                </Stack>

                <Typography
                  component="pre"
                  sx={{
                    m: 0,
                    fontFamily:
                      "monospace",
                    fontSize: 12,
                    whiteSpace:
                      "pre-wrap",
                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {getMessage(entry)}
                </Typography>
              </Box>
            );
          },
        )}
      </Stack>
    </Box>
  );
}
