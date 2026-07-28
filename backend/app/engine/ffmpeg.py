from app.models.stream import Stream


class FFmpegCommandBuilder:
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
            "/usr/bin/ffmpeg",
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
            "-reconnect_at_eof",
            "1",
            "-reconnect_delay_max",
            "5",

            # Начинать ближе к live edge.
            "-live_start_index",
            "-3",

            "-i",
            source_url,

            # Первый видеопоток, если он существует.
            "-map",
            "0:v:0?",

            # Первый аудиопоток, если он существует.
            "-map",
            "0:a:0?",

            # Строго без перекодирования.
            "-c:v",
            "copy",
            "-c:a",
            "copy",

            # Коррекция отрицательных timestamps.
            "-avoid_negative_ts",
            "make_zero",

            # Структурированные метрики.
            "-progress",
            "pipe:1",
            "-stats_period",
            "1",
            "-nostats",

            # RTMP output.
            "-f",
            "flv",
            "-flvflags",
            "no_duration_filesize",

            stream.destination_rtmp_url,
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
            "/usr/bin/ffmpeg",
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

            # Первый видеопоток, если он существует.
            "-map",
            "0:v:0?",

            # Первый аудиопоток, если он существует.
            "-map",
            "0:a:0?",

            # Строго без перекодирования.
            "-c:v",
            "copy",
            "-c:a",
            "copy",

            "-avoid_negative_ts",
            "make_zero",

            # Структурированные метрики.
            "-progress",
            "pipe:1",
            "-stats_period",
            "1",
            "-nostats",

            # RTMP output.
            "-f",
            "flv",
            "-flvflags",
            "no_duration_filesize",

            stream.destination_rtmp_url,
        ]
