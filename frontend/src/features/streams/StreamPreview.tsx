import {
  useEffect,
  useState,
} from "react";

import ImageIcon
  from "@mui/icons-material/Image";

import RefreshIcon
  from "@mui/icons-material/Refresh";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  useQuery,
} from "@tanstack/react-query";

import axios from "axios";

import {
  getStreamPreview,
} from "../../api/streams";


interface StreamPreviewProps {
  streamId: number;
  processAlive: boolean;
}


function getErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return (
    "Не удалось получить кадр. "
    + "Источник может быть временно "
    + "недоступен."
  );
}


export function StreamPreview({
  streamId,
  processAlive,
}: StreamPreviewProps) {
  const [
    imageUrl,
    setImageUrl,
  ] = useState<string | null>(
    null,
  );

  const previewQuery = useQuery({
    queryKey: [
      "stream-preview",
      streamId,
    ],

    queryFn: () =>
      getStreamPreview(
        streamId,
        640,
      ),

    enabled: processAlive,

    refetchInterval:
      processAlive
        ? 15_000
        : false,

    refetchIntervalInBackground:
      false,

    retry: false,
  });

  useEffect(() => {
    if (!previewQuery.data) {
      return;
    }

    const nextUrl =
      URL.createObjectURL(
        previewQuery.data,
      );

    setImageUrl(
      (previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(
            previousUrl
          );
        }

        return nextUrl;
      },
    );

    return () => {
      URL.revokeObjectURL(
        nextUrl
      );
    };
  }, [previewQuery.data]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(
          imageUrl
        );
      }
    };
  }, [imageUrl]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
            sx={{
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent:
                "space-between",
            }}
          >
            <Box>
              <Typography variant="h6">
                Предпросмотр
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                JPEG 640 px, обновление
                каждые 15 секунд
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={
                previewQuery.isFetching
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : <RefreshIcon />
              }
              disabled={
                previewQuery.isFetching
              }
              onClick={() => {
                void previewQuery.refetch();
              }}
            >
              Обновить
            </Button>
          </Stack>

          {!processAlive && (
            <Alert severity="info">
              Основной процесс остановлен.
              Кадр всё равно можно запросить
              напрямую у источника.
            </Alert>
          )}

          {previewQuery.isError && (
            <Alert severity="warning">
              {getErrorMessage(
                previewQuery.error
              )}
            </Alert>
          )}

          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 720,
              mx: "auto",
              aspectRatio: "16 / 9",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              borderRadius: 1.5,
              bgcolor:
                "rgba(0,0,0,0.45)",
              border:
                "1px solid "
                + "rgba(255,255,255,0.08)",
            }}
          >
            {imageUrl ? (
              <Box
                component="img"
                src={imageUrl}
                alt="Предпросмотр потока"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <Stack
                spacing={1}
                sx={{
                  alignItems: "center",
                  color: "text.secondary",
                }}
              >
                {previewQuery.isFetching
                  ? (
                    <CircularProgress />
                  )
                  : (
                    <ImageIcon
                      sx={{
                        fontSize: 56,
                      }}
                    />
                  )}

                <Typography>
                  {previewQuery.isFetching
                    ? "Получение кадра…"
                    : "Предпросмотр отсутствует"}
                </Typography>
              </Stack>
            )}
          </Box>

          {previewQuery.dataUpdatedAt > 0 && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Последнее обновление:{" "}
              {new Intl.DateTimeFormat(
                "ru-RU",
                {
                  timeStyle: "medium",
                },
              ).format(
                new Date(
                  previewQuery.dataUpdatedAt
                )
              )}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
