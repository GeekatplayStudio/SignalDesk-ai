import pathlib
import sys
import unittest

APP_DIR = pathlib.Path(__file__).resolve().parents[1] / "app"
sys.path.insert(0, str(APP_DIR))

from planner_core import (  # noqa: E402
    choose_tool,
    fallback_assistant_reply,
    normalize_assistant_reply,
    normalize_tool_name,
    truncate,
)


class PlannerCoreTests(unittest.TestCase):
    def test_choose_tool_routes_booking_intents(self) -> None:
        self.assertEqual(choose_tool("Can you book me for next week?"), "book_appointment")

    def test_choose_tool_routes_issue_intents(self) -> None:
        self.assertEqual(choose_tool("I have a billing issue."), "create_ticket")

    def test_normalize_tool_name_falls_back_for_invalid_tool(self) -> None:
        tool = normalize_tool_name("unknown_tool", "I need a human agent now")
        self.assertEqual(tool, "handoff_to_human")

    def test_normalize_assistant_reply_uses_fallback_when_empty(self) -> None:
        reply = normalize_assistant_reply("   ", "check_availability")
        self.assertEqual(reply, fallback_assistant_reply("check_availability"))

    def test_truncate_respects_max_length(self) -> None:
        value = truncate("abcdef", 4)
        self.assertEqual(value, "abc...")


if __name__ == "__main__":
    unittest.main()
