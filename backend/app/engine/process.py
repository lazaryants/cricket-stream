import asyncio

from asyncio.subprocess import Process

from app.engine.logs import log_buffer


class FFmpegProcess:

    def __init__(
        self,
        stream_id: int,
        command: list[str],
    ):
        self.stream_id = stream_id
        self.command = command
        self.process: Process | None = None


    async def start(self):

        self.process = await asyncio.create_subprocess_exec(
            *self.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        asyncio.create_task(
            self._read_stream(
                self.process.stdout,
                "stdout",
            )
        )

        asyncio.create_task(
            self._read_stream(
                self.process.stderr,
                "stderr",
            )
        )

        asyncio.create_task(
            self._wait_exit()
        )

        log_buffer.add(
            self.stream_id,
            f"FFmpeg started PID={self.process.pid}",
        )

        return self.process.pid


    async def _read_stream(
        self,
        stream,
        name: str,
    ):

        while True:

            line = await stream.readline()

            if not line:
                break

            text = line.decode(
                errors="ignore"
            ).strip()

            if not text:
                continue


            log_buffer.add(
                self.stream_id,
                f"[{name}] {text}",
            )


            print(
                f"[FFMPEG {name}]",
                text,
            )


    async def _wait_exit(self):

        if self.process is None:
            return

        code = await self.process.wait()

        log_buffer.add(
            self.stream_id,
            f"FFmpeg exited code={code}",
        )


    async def stop(self):

        if self.process is None:
            return

        if self.process.returncode is not None:
            return


        log_buffer.add(
            self.stream_id,
            "Stopping FFmpeg",
        )


        self.process.terminate()


        try:

            await asyncio.wait_for(
                self.process.wait(),
                timeout=10,
            )

        except asyncio.TimeoutError:

            log_buffer.add(
                self.stream_id,
                "Force killing FFmpeg",
            )

            self.process.kill()

            await self.process.wait()


    def running(self):

        return (
            self.process is not None
            and self.process.returncode is None
        )
