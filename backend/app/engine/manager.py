import os
import signal

from app.engine.process import FFmpegProcess
from app.engine.ffmpeg import FFmpegCommandBuilder


class StreamManager:

    def __init__(self):
        self.processes = {}


    def pid_alive(
        self,
        pid: int | str | None
    ):
        if not pid:
            return False

        try:
            os.kill(
                int(pid),
                0
            )
            return True

        except ProcessLookupError:
            return False

        except PermissionError:
            return True

        except Exception:
            return False


    async def start(
        self,
        stream
    ):
        stream_id = stream.id

        if stream_id in self.processes:

            process = self.processes[stream_id]

            if process.running():
                return process.process.pid

            del self.processes[stream_id]


        command = FFmpegCommandBuilder.build(
            stream
        )

        process = FFmpegProcess(
            stream_id,
            command,
        )

        pid = await process.start()

        self.processes[stream_id] = process

        return pid


    async def stop(
        self,
        stream_id,
        pid=None,
    ):

        #
        # 1. Сначала пробуем объект в памяти
        #
        process = self.processes.get(
            stream_id
        )

        if process:

            try:
                await process.stop()

            finally:
                self.processes.pop(
                    stream_id,
                    None
                )

            return True


        #
        # 2. Если backend перезапускался,
        # ищем PID из базы
        #
        if pid and self.pid_alive(pid):

            try:

                os.kill(
                    int(pid),
                    signal.SIGTERM
                )

                return True

            except Exception as e:

                print(
                    f"[STREAM MANAGER] PID stop error {pid}: {e}"
                )


        return False



    async def stop_all(self):

        stream_ids = list(
            self.processes.keys()
        )

        for stream_id in stream_ids:

            try:

                await self.stop(
                    stream_id
                )

            except Exception as e:

                print(
                    f"[STREAM MANAGER] stop_all error {stream_id}: {e}"
                )


    def running(self, stream_id):
        process = self.processes.get(
            stream_id
        )

        if not process:
            return False

        if process.running():
            return True

        del self.processes[stream_id]

        return False


    def status(
        self,
        stream_id
    ):

        process = self.processes.get(
            stream_id
        )

        if not process:
            return "unknown"

        if process.running():
            return "running"

        return "dead"



    def dead_streams(self):

        dead=[]

        for stream_id, process in list(
            self.processes.items()
        ):

            if not process.running():

                dead.append(stream_id)

                del self.processes[stream_id]


        return dead


    def get_process(
        self,
        stream_id
    ):

        return self.processes.get(
            stream_id
        )


stream_manager = StreamManager()
