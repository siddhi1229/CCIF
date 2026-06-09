from fastapi import APIRouter
from app.database import get_connection

router = APIRouter()


def _numeric_tail(value):
    digits = "".join(char for char in str(value) if char.isdigit())
    return int(digits) if digits else 0


@router.get("/network")
def get_graph_network():
    conn = get_connection()
    cur = conn.cursor()

    # ── Fetch all data from DB ────────────────────────────────────────────
    cur.execute("SELECT id, title, location, type, status, trust FROM cases")
    case_rows = cur.fetchall()

    cur.execute("SELECT id, name, age, risk, gang, location FROM suspects")
    suspect_rows = cur.fetchall()

    cur.execute("SELECT id, case_id, type, trust FROM evidence LIMIT 15")
    evidence_rows = cur.fetchall()

    cur.close()
    conn.close()

    nodes = []
    edges = []

    # ── CASE NODES ────────────────────────────────────────────────────────
    case_locations = set()
    for case_id, title, location, case_type, status, trust in case_rows:
        risk = trust or 80
        if str(status).lower() == "critical":
            risk = max(risk, 95)
        elif str(case_type).lower() in {"smuggling", "weapons", "corruption"}:
            risk = max(risk, 88)

        nodes.append({
            "data": {
                "id": f"case-{case_id}",
                "label": title,
                "type": "case",
                "group": "case",
                "location": location,
                "crimeType": case_type,
                "risk": risk,
            }
        })

        # collect unique locations
        if location:
            case_locations.add(location.strip())

    # ── SUSPECT NODES ─────────────────────────────────────────────────────
    gang_set = set()
    for suspect_id, name, age, risk, gang, location in suspect_rows:
        s_risk = risk if risk is not None else 70 + (_numeric_tail(suspect_id) % 25)
        nodes.append({
            "data": {
                "id": f"suspect-{suspect_id}",
                "label": name,
                "type": "suspect",
                "group": "suspect",
                "location": location,
                "risk": s_risk,
            }
        })
        if gang and gang.strip().lower() not in ("none", ""):
            gang_set.add(gang.strip())

    # ── EVIDENCE NODES ────────────────────────────────────────────────────
    for ev_id, case_id, ev_type, trust in evidence_rows:
        nodes.append({
            "data": {
                "id": f"ev-{ev_id}",
                "label": ev_type or "Evidence",
                "type": "evidence",
                "group": "evidence",
                "risk": trust or 70,
            }
        })
        # edge: case → evidence
        edges.append({
            "data": {
                "id": f"edge-{case_id}-{ev_id}",
                "source": f"case-{case_id}",
                "target": f"ev-{ev_id}",
                "label": "HAS_EVIDENCE",
                "relationship": "HAS_EVIDENCE",
                "confidence": trust or 70,
            }
        })

    # ── LOCATION NODES ────────────────────────────────────────────────────
    for loc_name in case_locations:
        loc_id = f"loc-{loc_name.replace(' ', '_')}"
        nodes.append({
            "data": {
                "id": loc_id,
                "label": loc_name,
                "type": "location",
                "group": "location",
                "risk": 72,
            }
        })

    # ── GANG NODES ────────────────────────────────────────────────────────
    for gang_name in gang_set:
        gang_id = f"gang-{gang_name.replace(' ', '_')}"
        nodes.append({
            "data": {
                "id": gang_id,
                "label": gang_name,
                "type": "gang",
                "group": "gang",
                "risk": 86,
            }
        })

    # ── RELATIONSHIP EDGES ────────────────────────────────────────────────

    # Build lookup sets for fast dedup
    case_id_set = {f"case-{r[0]}" for r in case_rows}
    suspect_location_map = {
        f"suspect-{r[0]}": r[5].strip() if r[5] else None
        for r in suspect_rows
    }
    case_location_map = {
        f"case-{r[0]}": r[2].strip() if r[2] else None
        for r in case_rows
    }

    edge_ids_seen = set()

    def add_edge(edge_id, source, target, label, confidence=50):
        if edge_id not in edge_ids_seen:
            edge_ids_seen.add(edge_id)
            edges.append({
                "data": {
                    "id": edge_id,
                    "source": source,
                    "target": target,
                    "label": label,
                    "relationship": label,
                    "confidence": confidence,
                }
            })

    # Suspect → Case (INVOLVED_IN) — via location match or numeric parity
    for suspect_id, name, age, risk, gang, s_loc in suspect_rows:
        s_node = f"suspect-{suspect_id}"
        for case_id, title, c_loc, case_type, status, trust in case_rows:
            c_node = f"case-{case_id}"
            score = 0
            if s_loc and c_loc and s_loc.strip().lower() == c_loc.strip().lower():
                score += 50
            if "harbor" in title.lower():
                score += 25
            if _numeric_tail(suspect_id) % 2 == _numeric_tail(case_id) % 2:
                score += 25
            if score >= 50:
                add_edge(
                    f"edge-{suspect_id}-{case_id}",
                    s_node, c_node,
                    "INVOLVED_IN", score
                )

    # Suspect → Gang (AFFILIATED_WITH)
    for suspect_id, name, age, risk, gang, location in suspect_rows:
        if gang and gang.strip().lower() not in ("none", ""):
            gang_id = f"gang-{gang.strip().replace(' ', '_')}"
            add_edge(
                f"edge-{suspect_id}-gang",
                f"suspect-{suspect_id}", gang_id,
                "AFFILIATED_WITH", 90
            )

    # Case → Location (LOCATED_AT)
    for case_id, title, location, case_type, status, trust in case_rows:
        if location:
            loc_id = f"loc-{location.strip().replace(' ', '_')}"
            add_edge(
                f"edge-{case_id}-loc",
                f"case-{case_id}", loc_id,
                "LOCATED_AT", 80
            )

    # Fallback edge if nothing connected
    if not edges and case_rows and suspect_rows:
        suspect_id = suspect_rows[0][0]
        case_id = case_rows[0][0]
        add_edge(
            f"edge-{suspect_id}-{case_id}-fallback",
            f"suspect-{suspect_id}", f"case-{case_id}",
            "INVOLVED_IN", 50
        )

    return {"nodes": nodes, "edges": edges}
