"""
routes/safety_scores.py
────────────────────────────────────────────────────────
New endpoint: GET /api/gis/safety-scores

Returns a pre-computed safety score for every destination,
combining accident + crime density data.

Score formula (0-100, higher = safer):
  risk = 0.55 * avg_crime_severity + 0.45 * avg_accident_severity
       + density_penalty (capped at 0.35)
  score = round((1 - risk) * 100)

Query params (all optional):
  ?destination=Hunza   → filter by destination name (partial match)
  ?min_score=60        → only return destinations with score >= 60
  ?format=ranked       → sort by score descending (default: by name)
"""

from flask import Blueprint, jsonify, request
import logging, sys, os, math

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_query

logger = logging.getLogger(__name__)
bp = Blueprint('safety_scores', __name__, url_prefix='/api/gis')

RADIUS   = 0.38   # decimal degrees (~40 km)
W_CRIME  = 0.55
W_ACCID  = 0.45


def _haversine_approx(lat1, lng1, lat2, lng2):
    """Fast Euclidean distance in decimal degrees (good enough for small radii)."""
    return math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2)


@bp.route('/safety-scores', methods=['GET'])
def get_safety_scores():
    """
    Returns a safety score per destination.
    Response: { success, count, data: [{name, lat, lng, score, label, accCount, criCount}] }
    """
    try:
        dest_filter = request.args.get('destination', '').strip().lower()
        min_score   = int(request.args.get('min_score', 0))
        fmt         = request.args.get('format', 'name')   # 'ranked' | 'name'

        # ── fetch all raw data ──
        dests = execute_query(
            "SELECT destination_name, latitude, longitude FROM popularity_data ORDER BY destination_name",
            fetch=True
        )
        accidents = execute_query(
            "SELECT latitude, longitude, severity FROM accident_data",
            fetch=True
        )
        crime = execute_query(
            "SELECT latitude, longitude, severity FROM crime_data",
            fetch=True
        )

        # ── compute score per destination ──
        results = []
        for d in dests:
            name = d['destination_name']
            lat  = float(d['latitude'])
            lng  = float(d['longitude'])

            if dest_filter and dest_filter not in name.lower():
                continue

            nearby_acc = [a for a in accidents
                          if _haversine_approx(lat, lng, float(a['latitude']), float(a['longitude'])) <= RADIUS]
            nearby_cri = [c for c in crime
                          if _haversine_approx(lat, lng, float(c['latitude']), float(c['longitude'])) <= RADIUS]

            avg_acc = (sum(float(a['severity']) for a in nearby_acc) / len(nearby_acc)) if nearby_acc else 0
            avg_cri = (sum(float(c['severity']) for c in nearby_cri) / len(nearby_cri)) if nearby_cri else 0

            density_penalty = min((len(nearby_acc) * 1.8 + len(nearby_cri) * 2.2) / 100, 0.35)

            risk  = W_CRIME * avg_cri + W_ACCID * avg_acc + density_penalty
            score = max(0, min(100, round((1 - risk) * 100)))

            if score < min_score:
                continue

            if   score >= 80: label = 'Safe'
            elif score >= 60: label = 'Mostly Safe'
            elif score >= 40: label = 'Caution'
            elif score >= 20: label = 'High Risk'
            else:             label = 'Danger'

            results.append({
                'name'     : name,
                'lat'      : lat,
                'lng'      : lng,
                'score'    : score,
                'label'    : label,
                'accCount' : len(nearby_acc),
                'criCount' : len(nearby_cri),
                'avgAccSev': round(avg_acc * 100, 1),
                'avgCriSev': round(avg_cri * 100, 1),
            })

        if fmt == 'ranked':
            results.sort(key=lambda x: x['score'], reverse=True)
        else:
            results.sort(key=lambda x: x['name'])

        return jsonify({'success': True, 'count': len(results), 'data': results})

    except Exception as e:
        logger.error(f"Error computing safety scores: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/safety-scores/top', methods=['GET'])
def get_top_safe():
    """Convenience: GET /api/gis/safety-scores/top?limit=5  → top N safest destinations"""
    try:
        limit = int(request.args.get('limit', 5))
        dests = execute_query(
            "SELECT destination_name, latitude, longitude FROM popularity_data",
            fetch=True
        )
        accidents = execute_query("SELECT latitude, longitude, severity FROM accident_data", fetch=True)
        crime     = execute_query("SELECT latitude, longitude, severity FROM crime_data", fetch=True)

        scored = []
        for d in dests:
            lat, lng = float(d['latitude']), float(d['longitude'])
            nearby_acc = [a for a in accidents
                          if _haversine_approx(lat, lng, float(a['latitude']), float(a['longitude'])) <= RADIUS]
            nearby_cri = [c for c in crime
                          if _haversine_approx(lat, lng, float(c['latitude']), float(c['longitude'])) <= RADIUS]
            avg_acc = (sum(float(a['severity']) for a in nearby_acc) / len(nearby_acc)) if nearby_acc else 0
            avg_cri = (sum(float(c['severity']) for c in nearby_cri) / len(nearby_cri)) if nearby_cri else 0
            density_penalty = min((len(nearby_acc) * 1.8 + len(nearby_cri) * 2.2) / 100, 0.35)
            risk  = W_CRIME * avg_cri + W_ACCID * avg_acc + density_penalty
            score = max(0, min(100, round((1 - risk) * 100)))
            scored.append({'name': d['destination_name'], 'lat': lat, 'lng': lng, 'score': score})

        scored.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({'success': True, 'data': scored[:limit]})

    except Exception as e:
        logger.error(f"Error fetching top safe: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500