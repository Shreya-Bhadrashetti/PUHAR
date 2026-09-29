from backend.services.backhaul_matcher import find_backhaul_match
from backend.services.explainability import explain_backhaul_match


def test_paradip_explanation():
    matches = find_backhaul_match("Paradip", "Southeast Asia")
    assert len(matches) > 0

    result = explain_backhaul_match(
        destination_port="Paradip",
        vessel_type="Supramax",
        origin_region="Southeast Asia",
        match=matches[0],
    )

    print("EXPLANATION:", result["explanation"])
    print("BASED ON:", result["based_on"])

    # sanity check: the explanation should mention the actual commodity, not something invented
    assert matches[0]["commodity"].split()[0].lower() in result["explanation"].lower()


if __name__ == "__main__":
    test_paradip_explanation()