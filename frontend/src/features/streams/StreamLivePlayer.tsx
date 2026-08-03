import {
  useEffect,
  useRef,
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

import Hls from "hls.js";

import {
  getStreamPlayback,
} from "../../api/streams";
import {
  useI18n,
} from "../../i18n/useI18n";


interface StreamLivePlayerProps {
  streamId: number;
  processAlive: boolean;
  controls?: boolean;
  compact?: boolean;
  fillContainer?: boolean;
}


export function StreamLivePlayer({
  streamId,
  processAlive,
  controls = true,
  compact = false,
  fillContainer = false,
}: StreamLivePlayerProps) {
  const {
    t,
  } = useI18n();

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const [playerError, setPlayerError] =
    useState<string | null>(null);

  const [playerReady, setPlayerReady] =
    useState(false);

  const [connectionAttempt, setConnectionAttempt] =
    useState(0);

  const playbackQuery = useQuery({
    queryKey: [
      "stream-playback",
      streamId,
    ],
    queryFn: () =>
      getStreamPlayback(streamId),
    enabled: processAlive,
    staleTime: 55 * 60 * 1000,
    refetchInterval: (query) => {
      if (!processAlive) {
        return false;
      }

      // FFmpeg уже может быть запущен, пока
      // первый HLS-плейлист ещё создаётся.
      // Продолжаем проверять готовность без
      // необходимости обновлять всю страницу.
      return query.state.data
        ? 55 * 60 * 1000
        : 2_000;
    },
    refetchIntervalInBackground: true,
    retry: 1,
  });

  useEffect(() => {
    const video = videoRef.current;
    const playlistUrl =
      playbackQuery.data?.playlist_url;

    if (!video || !processAlive || !playlistUrl) {
      return;
    }

    setPlayerError(null);
    setPlayerReady(false);

    let retryTimer:
      number | undefined;

    const retryConnection = () => {
      setPlayerReady(false);
      setPlayerError(null);
      retryTimer = window.setTimeout(
        () => {
          setConnectionAttempt(
            (value) => value + 1,
          );
        },
        2_000,
      );
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: false,
        liveSyncDurationCount: 4,
        liveMaxLatencyDurationCount: 10,
        maxLiveSyncPlaybackRate: 1.05,
        maxBufferLength: 30,
        manifestLoadingMaxRetry: 10,
        levelLoadingMaxRetry: 10,
        fragLoadingMaxRetry: 10,
      });

      hls.loadSource(playlistUrl);
      hls.attachMedia(video);
      hls.on(
        Hls.Events.MANIFEST_PARSED,
        () => {
          setPlayerReady(true);
          void video.play().catch(() => {
            // Controls remain available if autoplay
            // is blocked by the browser.
          });
        },
      );
      hls.on(
        Hls.Events.ERROR,
        (_event, data) => {
          if (!data.fatal) {
            return;
          }
          if (
            data.type
            === Hls.ErrorTypes.NETWORK_ERROR
          ) {
            hls.destroy();
            retryConnection();
            return;
          }
          if (
            data.type
            === Hls.ErrorTypes.MEDIA_ERROR
          ) {
            hls.recoverMediaError();
            return;
          }
          setPlayerError(
            t(
              "player.unavailable",
            ),
          );
          hls.destroy();
        },
      );

      return () => {
        if (retryTimer !== undefined) {
          window.clearTimeout(retryTimer);
        }
        hls.destroy();
      };
    }

    if (
      video.canPlayType(
        "application/vnd.apple.mpegurl",
      )
    ) {
      const handleReady = () => {
        setPlayerReady(true);
      };

      const handleError = () => {
        retryConnection();
      };

      video.addEventListener(
        "loadedmetadata",
        handleReady,
      );
      video.addEventListener(
        "error",
        handleError,
      );
      video.src = playlistUrl;
      void video.play().catch(() => undefined);
      return () => {
        if (retryTimer !== undefined) {
          window.clearTimeout(retryTimer);
        }
        video.removeEventListener(
          "loadedmetadata",
          handleReady,
        );
        video.removeEventListener(
          "error",
          handleError,
        );
        video.removeAttribute("src");
        video.load();
      };
    }

    setPlayerError(
      t(
        "player.unsupported",
      ),
    );
  }, [
    playbackQuery.data?.playlist_url,
    processAlive,
    connectionAttempt,
    t,
  ]);

  useEffect(() => {
    if (!processAlive) {
      setPlayerError(null);
      setPlayerReady(false);
      setConnectionAttempt(0);
    }
  }, [processAlive]);

  const showPlaceholder = (
    !processAlive
    || playbackQuery.isLoading
    || playbackQuery.isError
    || playerError !== null
    || !playerReady
  );

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        aspectRatio: fillContainer
          ? "auto"
          : "16 / 9",
        height: fillContainer
          ? "100%"
          : "auto",
        minHeight: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        bgcolor: "#000",
      }}
    >
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        controls={controls}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center center",
          backgroundColor: "#000",
          display: showPlaceholder
            ? "none"
            : "block",
        }}
      />

      {showPlaceholder && (
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
          {processAlive
            && playbackQuery.isLoading
            ? <CircularProgress size={compact ? 28 : 36} />
            : (
              <BrokenImageOutlinedIcon
                sx={{
                  fontSize: compact ? 38 : 52,
                }}
              />
            )}

          <Typography variant={compact ? "caption" : "body2"}>
            {!processAlive
              ? t(
                "preview.stopped",
              )
              : (
                playerError
                ?? (
                  playbackQuery.isError
                    ? t(
                      "player.hlsNotReady",
                    )
                    : t(
                      "player.connecting",
                    )
                )
              )}
          </Typography>
        </Box>
      )}

      {processAlive && !showPlaceholder && (
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
            bgcolor: "rgba(0,0,0,0.65)",
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "success.main",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "common.white",
              fontWeight: 700,
            }}
          >
            LIVE
          </Typography>
        </Box>
      )}
    </Box>
  );
}
