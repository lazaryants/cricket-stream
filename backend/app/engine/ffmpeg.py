from app.models.stream import Stream


class FFmpegCommandBuilder:
    @staticmethod
    def build(stream: Stream) -> list[str]:

        return [
            "/usr/bin/ffmpeg",

            "-hide_banner",
            "-loglevel",
            "info",

            # realtime mode
            "-re",

            # HLS reconnect protection
            "-reconnect",
            "1",
            "-reconnect_streamed",
            "1",
            "-reconnect_delay_max",
            "5",

            "-live_start_index",
            "-3",

            "-i",
            stream.source_url,

            # select first video/audio streams
            "-map",
            "0:v:0",

            "-map",
            "0:a:0",

            # passthrough codecs
            "-c:v",
            "copy",

            "-c:a",
            "aac",

            # RTMP compatibility
            "-f",
            "flv",

            "-flvflags",
            "no_duration_filesize",

            stream.destination_rtmp_url,
        ]
