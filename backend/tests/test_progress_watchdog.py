import unittest

from app.engine.progress_watchdog import (
    MediaProgressWatchdog,
)


class ManualClock:
    def __init__(self) -> None:
        self.value = 0.0

    def __call__(self) -> float:
        return self.value

    def advance(self, seconds: float) -> None:
        self.value += seconds


class MediaProgressWatchdogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.clock = ManualClock()
        self.watchdog = MediaProgressWatchdog(
            startup_grace_seconds=45,
            stall_timeout_seconds=30,
            clock=self.clock,
        )

    def test_allows_startup_then_detects_no_media(self):
        first = self.watchdog.observe(10, 123, None)
        self.assertFalse(first.stalled)

        self.clock.advance(44)
        self.assertFalse(
            self.watchdog.observe(10, 123, None).stalled
        )

        self.clock.advance(1)
        result = self.watchdog.observe(10, 123, None)
        self.assertTrue(result.stalled)
        self.assertEqual(result.silence_seconds, 45)

    def test_progress_resets_stall_timer(self):
        self.watchdog.observe(
            10,
            123,
            {"frame": 1, "out_time_seconds": 0.1},
        )

        self.clock.advance(29)
        self.assertFalse(
            self.watchdog.observe(
                10,
                123,
                {"frame": 1, "out_time_seconds": 0.1},
            ).stalled
        )

        self.clock.advance(1)
        self.assertTrue(
            self.watchdog.observe(
                10,
                123,
                {"frame": 1, "out_time_seconds": 0.1},
            ).stalled
        )

        self.clock.advance(1)
        recovered = self.watchdog.observe(
            10,
            123,
            {"frame": 2, "out_time_seconds": 0.2},
        )
        self.assertFalse(recovered.stalled)
        self.assertEqual(recovered.silence_seconds, 0)

    def test_new_pid_gets_a_new_startup_window(self):
        self.watchdog.observe(10, 123, None)
        self.clock.advance(45)
        self.assertTrue(
            self.watchdog.observe(10, 123, None).stalled
        )

        restarted = self.watchdog.observe(10, 456, None)
        self.assertFalse(restarted.stalled)
        self.assertEqual(restarted.silence_seconds, 0)

    def test_any_ffmpeg_counter_counts_as_progress(self):
        self.watchdog.observe(10, 123, {"total_size": 100})
        self.clock.advance(29)
        result = self.watchdog.observe(
            10,
            123,
            {"total_size": 200},
        )
        self.assertFalse(result.stalled)
        self.clock.advance(29)
        self.assertFalse(
            self.watchdog.observe(
                10,
                123,
                {"total_size": 200},
            ).stalled
        )


if __name__ == "__main__":
    unittest.main()
