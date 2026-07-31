from app.providers.streamlink import (
    StreamlinkResolver,
)
from app.providers.ytdlp import YtDlpResolver
from app.core.config import settings


class SourceResolverRegistry:
    def __init__(self):
        self.streamlink = (
            StreamlinkResolver(
                binary=settings.streamlink_path
            )
        )
        self.ytdlp = YtDlpResolver(
            binary=settings.yt_dlp_path
        )

    def get_streamlink(
        self,
    ) -> StreamlinkResolver:
        return self.streamlink

    def get_ytdlp(self) -> YtDlpResolver:
        return self.ytdlp


source_resolvers = (
    SourceResolverRegistry()
)
