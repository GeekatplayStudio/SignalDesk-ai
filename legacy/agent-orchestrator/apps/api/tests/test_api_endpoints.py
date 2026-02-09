def _create_conversation(client):
    res = client.post("/conversation", json={"user_id": "test-user"})
    assert res.status_code == 200
    payload = res.json()
    assert payload["status"] == "active"
    assert payload["id"]
    return payload["id"]


def test_create_conversation(client):
    conversation_id = _create_conversation(client)
    response = client.get(f"/conversation/{conversation_id}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == conversation_id
    assert payload["user_id"] == "test-user"
    assert payload["status"] == "active"


def test_check_availability_flow_logs_tool_call(client):
    conversation_id = _create_conversation(client)
    res = client.post(
        f"/conversation/{conversation_id}/message",
        json={"content": "Please check calendar availability for tomorrow"},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["conversation_status"] == "active"
    assert payload["tool_calls"]
    assert payload["tool_calls"][0]["tool_name"] == "check_availability"
    assert payload["tool_calls"][0]["status"] == "success"

    logs = client.get(f"/conversation/{conversation_id}/logs")
    assert logs.status_code == 200
    log_items = logs.json()
    assert len(log_items) == 1
    assert log_items[0]["tool_name"] == "check_availability"
    assert log_items[0]["status"] == "success"


def test_low_confidence_message_triggers_handoff(client):
    conversation_id = _create_conversation(client)
    res = client.post(f"/conversation/{conversation_id}/message", json={"content": "??"})
    assert res.status_code == 200
    payload = res.json()
    assert payload["conversation_status"] == "handoff"
    assert payload["tool_calls"][0]["tool_name"] == "handoff_to_human"


def test_manual_handoff_blocks_future_agent_actions(client):
    conversation_id = _create_conversation(client)
    handoff = client.post(f"/conversation/{conversation_id}/handoff", json={"reason": "operator override"})
    assert handoff.status_code == 200
    assert handoff.json()["status"] == "handoff"

    res = client.post(
        f"/conversation/{conversation_id}/message",
        json={"content": "book tomorrow at 10:00 for user@example.com"},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["conversation_status"] == "handoff"
    assert payload["tool_calls"] == []
    assert "human operator" in payload["response"].lower()


def test_booking_slot_collection_across_turns(client):
    conversation_id = _create_conversation(client)

    turn1 = client.post(f"/conversation/{conversation_id}/message", json={"content": "I need to book an appointment"})
    assert turn1.status_code == 200
    assert "date" in turn1.json()["response"].lower()

    turn2 = client.post(f"/conversation/{conversation_id}/message", json={"content": "2026-02-12"})
    assert turn2.status_code == 200
    assert "time" in turn2.json()["response"].lower()

    turn3 = client.post(f"/conversation/{conversation_id}/message", json={"content": "10:00"})
    assert turn3.status_code == 200
    assert "email" in turn3.json()["response"].lower()

    turn4 = client.post(f"/conversation/{conversation_id}/message", json={"content": "user@example.com"})
    assert turn4.status_code == 200
    payload = turn4.json()
    assert payload["tool_calls"][0]["tool_name"] == "book_appointment"
    assert payload["tool_calls"][0]["status"] == "success"
    assert "confirmation" in payload["response"].lower()
