from app.models.stream import Stream


class FFmpegCommandBuilder:
    @staticmethod
    def build(
        stream: Stream,
    ) -> list[str]:
        return [
            "/usr/bin/ffmpeg",

            "-hide_banner",
            "-loglevel",
            "info",

            # Читать источник в реальном времени.
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

            # Для live HLS начинаем ближе
            # к текущему сегменту.
            "-live_start_index",
            "-3",

            "-i",
            stream.source_url,

            # Первый видеопоток.
            # Знак ? делает поток необязательным.
            "-map",
            "0:v:0?",

            # Первый аудиопоток.
            "-map",
            "0:a:0?",

            # Никакого перекодирования.
            "-c:v",
            "copy",
            "-c:a",
            "copy",

            # Коррекция временных меток
            # для live-потоков.
            "-avoid_negative_ts",
            "make_zero",

            # Машинно-читаемые метрики
            # отправляются в stdout.
            "-progress",
            "pipe:1",
            "-stats_period",
            "1",
            "-nostats",

            # RTMP/FLV.
            "-f",
            "flv",
            "-flvflags",
            "no_duration_filesize",

            stream.destination_rtmp_url,
        ]
