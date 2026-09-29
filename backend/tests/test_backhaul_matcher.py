# backend/tests/test_backhaul_matcher.py
from backend.services.backhaul_matcher import find_backhaul_match
def test_paradip_southeast_asia_match():
    results = find_backhaul_match("Paradip", "Southeast Asia")
    assert len(results) > 0
    assert any("iron ore" in r["commodity"].lower() for r in results)
    print("PASS:", results)

if __name__ == "__main__":
    test_paradip_southeast_asia_match()