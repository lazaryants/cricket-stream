import {
  useEffect,
  useState,
} from "react";

import BrokenImageOutlinedIcon
  from "@mui/icons-material/BrokenImageOutlined";

import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  getStreamPreview,
} from "../../api/streams";
import {
  useI18n,
} from "../../i18n/useI18n";


interface StreamCardPreviewProps {
  streamId: number;
  processAlive: boolean;
}


export function StreamCardPreview({
  streamId,
  processAlive,
}: StreamCardPreviewProps) {
  const {
    t,
  } = useI18n();

  const [
    imageUrl,
    setImageUrl,
  ] = useState<string | null>(
    null,
  );

  const previewQuery = useQuery({
    queryKey: [
      "stream-card-preview",
      streamId,
    ],

    queryFn: () =>
      getStreamPreview(
        streamId,
        480,
      ),

    enabled: processAlive,

    refetchInterval:
      processAlive
        ? 20_000
        : false,

    refetchIntervalInBackground:
      false,

    retry: false,

    /*
     * Кадр не считается актуальным
     * дольше 15 секунд.
     */
    staleTime: 15_000,
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
            previousUrl,
          );
        }

        return nextUrl;
      },
    );

    return () => {
      URL.revokeObjectURL(
        nextUrl,
      );
    };
  }, [previewQuery.data]);

  useEffect(() => {
    if (processAlive) {
      return;
    }

    setImageUrl(
      (previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(
            previousUrl,
          );
        }

        return null;
      },
    );
  }, [processAlive]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(
          imageUrl,
        );
      }
    };
  }, [imageUrl]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        bgcolor:
          "rgba(0,0,0,0.45)",
        borderBottom:
          "1px solid "
          + "rgba(255,255,255,0.08)",
      }}
    >
      {imageUrl && processAlive ? (
        <Box
          component="img"
          src={imageUrl}
          alt={t("preview.alt")}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            gap: 0.75,
            color: "text.secondary",
            textAlign: "center",
            px: 2,
          }}
        >
          {previewQuery.isFetching
            && processAlive
            ? (
              <CircularProgress
                size={28}
              />
            )
            : (
              <BrokenImageOutlinedIcon
                sx={{
                  fontSize: 38,
                }}
              />
            )}

          <Typography
            variant="caption"
          >
            {processAlive
              ? (
                previewQuery.isFetching
                  ? t(
                    "preview.loading",
                  )
                  : t(
                    "preview.unavailable",
                  )
              )
              : t(
                "preview.stopped",
              )}
          </Typography>
        </Box>
      )}

      {processAlive && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1,
            py: 0.4,
            borderRadius: 10,
            bgcolor:
              "rgba(0,0,0,0.65)",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor:
                "success.main",
            }}
          />

          <Typography
            variant="caption"
            sx={{
              color: "common.white",
              fontWeight: 600,
            }}
          >
            LIVE
          </Typography>
        </Box>
      )}
    </Box>
  );
}
