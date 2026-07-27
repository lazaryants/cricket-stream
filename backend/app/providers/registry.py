from app.providers.streamlink import (
    StreamlinkResolver,
)


class SourceResolverRegistry:
    def __init__(self):
        self.streamlink = (
            StreamlinkResolver()
        )

    def get_streamlink(
        self,
    ) -> StreamlinkResolver:
        return self.streamlink


source_resolvers = (
    SourceResolverRegistry()
)
