from pathlib import Path

from app.core.config import settings
from app.models.stream import Stream


class FFmpegCommandBuilder:
    @staticmethod
    def _outputs(
        stream: Stream,
    ) -> list[str]:
        hls_directory = (
            Path(settings.hls_dir)
            / str(stream.id)
        )
        playlist_path = (
            hls_directory / "index.m3u8"
        )
        segment_path = (
            hls_directory
            / "segment_%06d.ts"
        )

        return [
            "-map", "0:v:0?",
            "-map", "0:a:0?",
            "-c:v", "copy",
            "-c:a", "copy",
            "-f", "flv",
            "-flvflags", "no_duration_filesize",
            stream.destination_rtmp_url,

            # Второй mux-выход использует те же
            # закодированные пакеты: CPU-тяжёлого
            # перекодирования для preview нет.
            "-map", "0:v:0?",
            "-map", "0:a:0?",
            "-c:v", "copy",
            "-c:a", "copy",
            "-f", "hls",
            "-hls_time", str(
                settings.hls_segment_time
            ),
            "-hls_list_size", str(
                settings.hls_list_size
            ),
            "-hls_flags",
            (
                "delete_segments+omit_endlist+"
                "independent_segments+program_date_time"
            ),
            "-hls_segment_filename",
            str(segment_path),
            str(playlist_path),
        ]

    @staticmethod
    def build_direct(
        stream: Stream,
        source_url: str,
    ) -> list[str]:
        """
        FFmpeg читает прямой URL самостоятельно.

        Используется для:
        - HLS .m3u8
        - HTTP/HTTPS media URL
        - RTMP/RTMPS input
        - SRT input
        """
        return [
            settings.ffmpeg_path,
            "-hide_banner",
            "-loglevel",
            "info",

            # Читать VOD/test source в реальном времени.
            # Для настоящего live HLS это не мешает.
            "-re",

            # Повторное подключение к HTTP/HLS.
            "-reconnect",
            "1",
            "-reconnect_streamed",
            "1",
            "-reconnect_delay_max",
            "5",

            # Начинать ближе к live edge.
            "-live_start_index",
            "-3",

            "-i",
            source_url,

            # Коррекция отрицательных timestamps.
            "-avoid_negative_ts",
            "make_zero",

            # Структурированные метрики.
            "-progress",
            "pipe:1",
            "-stats_period",
            "1",
            "-nostats",

            *FFmpegCommandBuilder._outputs(
                stream
            ),
        ]

    @staticmethod
    def build_pipe(
        stream: Stream,
    ) -> list[str]:
        """
        FFmpeg читает транспортный поток из stdin.

        Используется для цепочки:

        Streamlink stdout → FFmpeg stdin → RTMP
        """
        return [
            settings.ffmpeg_path,
            "-hide_banner",
            "-loglevel",
            "info",

            # Увеличиваем входную очередь.
            "-thread_queue_size",
            "4096",

            # Streamlink передаёт live transport stream.
            # Генерируем timestamps, если источник
            # передаёт их неполностью.
            "-fflags",
            "+genpts+discardcorrupt",

            "-i",
            "pipe:0",

            "-avoid_negative_ts",
            "make_zero",

            # Структурированные метрики.
            "-progress",
            "pipe:1",
            "-stats_period",
            "1",
            "-nostats",

            *FFmpegCommandBuilder._outputs(
                stream
            ),
        ]
