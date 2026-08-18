"""
routes/gis_layers.py
--------------------
GIS Layer API endpoints for:
  - Popularity layer  GET /api/gis/popularity
  - Crime layer       GET /api/gis/crime
  - Accident layer    GET /api/gis/accidents
  - Summary stats     GET /api/gis/summary
"""

from flask import Blueprint, jsonify, request
import logging
import sys
import os

# Make sure database module is importable (adjust path if needed)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import execute_query

logger = logging.getLogger(__name__)

bp = Blueprint('gis_layers', __name__, url_prefix='/api/gis')


# ─────────────────────────────────────────────
#  POPULARITY LAYER
# ─────────────────────────────────────────────
@bp.route('/popularity', methods=['GET'])
def get_popularity_data():
    """
    Returns popularity heatmap points.
    Optional query param: ?season=summer|winter|spring|autumn|all
    Response format: list of {lat, lng, intensity, name, visits}
    """
    try:
        season = request.args.get('season', None)

        if season and season != 'all':
            query = """
                SELECT destination_name, latitude, longitude,
                       visit_count, popularity_score, season
                FROM popularity_data
                WHERE season = %s OR season = 'all'
                ORDER BY popularity_score DESC
            """
            rows = execute_query(query, (season,), fetch=True)
        else:
            query = """
                SELECT destination_name, latitude, longitude,
                       visit_count, popularity_score, season
                FROM popularity_data
                ORDER BY popularity_score DESC
            """
            rows = execute_query(query, fetch=True)

        # Format for Leaflet.heat: [{lat, lng, intensity, ...metadata}]
        points = []
        for row in rows:
            points.append({
                'lat':       float(row['latitude']),
                'lng':       float(row['longitude']),
                'intensity': float(row['popularity_score']),   # 0.0–1.0
                'name':      row['destination_name'],
                'visits':    row['visit_count'],
                'season':    row['season']
            })

        return jsonify({
            'success': True,
            'layer':   'popularity',
            'count':   len(points),
            'data':    points
        })

    except Exception as e:
        logger.error(f"Error fetching popularity data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
#  CRIME LAYER
# ─────────────────────────────────────────────
@bp.route('/crime', methods=['GET'])
def get_crime_data():
    """
    Returns crime heatmap points.
    Optional query param: ?type=theft|fraud|assault|other
    Response format: list of {lat, lng, intensity, type, area, date}
    """
    try:
        crime_type = request.args.get('type', None)

        if crime_type:
            query = """
                SELECT latitude, longitude, crime_type,
                       severity, area_name, reported_at, description
                FROM crime_data
                WHERE crime_type = %s
                ORDER BY severity DESC
            """
            rows = execute_query(query, (crime_type,), fetch=True)
        else:
            query = """
                SELECT latitude, longitude, crime_type,
                       severity, area_name, reported_at, description
                FROM crime_data
                ORDER BY severity DESC
            """
            rows = execute_query(query, fetch=True)

        points = []
        for row in rows:
            points.append({
                'lat':         float(row['latitude']),
                'lng':         float(row['longitude']),
                'intensity':   float(row['severity']),
                'type':        row['crime_type'],
                'area':        row['area_name'] or 'Unknown',
                'date':        str(row['reported_at']),
                'description': row['description'] or ''
            })

        return jsonify({
            'success': True,
            'layer':   'crime',
            'count':   len(points),
            'data':    points
        })

    except Exception as e:
        logger.error(f"Error fetching crime data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
#  ACCIDENT LAYER
# ─────────────────────────────────────────────
@bp.route('/accidents', methods=['GET'])
def get_accident_data():
    """
    Returns accident heatmap points.
    Optional query param: ?type=road|trekking|weather|other
    Response format: list of {lat, lng, intensity, type, casualties, area, date}
    """
    try:
        acc_type = request.args.get('type', None)

        if acc_type:
            query = """
                SELECT latitude, longitude, accident_type,
                       severity, casualties, area_name, occurred_at, description
                FROM accident_data
                WHERE accident_type = %s
                ORDER BY severity DESC
            """
            rows = execute_query(query, (acc_type,), fetch=True)
        else:
            query = """
                SELECT latitude, longitude, accident_type,
                       severity, casualties, area_name, occurred_at, description
                FROM accident_data
                ORDER BY severity DESC
            """
            rows = execute_query(query, fetch=True)

        points = []
        for row in rows:
            points.append({
                'lat':         float(row['latitude']),
                'lng':         float(row['longitude']),
                'intensity':   float(row['severity']),
                'type':        row['accident_type'],
                'casualties':  row['casualties'],
                'area':        row['area_name'] or 'Unknown',
                'date':        str(row['occurred_at']),
                'description': row['description'] or ''
            })

        return jsonify({
            'success': True,
            'layer':   'accidents',
            'count':   len(points),
            'data':    points
        })

    except Exception as e:
        logger.error(f"Error fetching accident data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
#  SUMMARY STATS (for dashboard/info panel)
# ─────────────────────────────────────────────
@bp.route('/summary', methods=['GET'])
def get_gis_summary():
    """
    Returns summary statistics for all three layers.
    Useful for an info panel in the UI.
    """
    try:
        pop_query  = "SELECT COUNT(*) AS cnt, AVG(popularity_score) AS avg_score FROM popularity_data"
        crime_query = "SELECT COUNT(*) AS cnt, AVG(severity) AS avg_sev FROM crime_data"
        acc_query  = "SELECT COUNT(*) AS cnt, SUM(casualties) AS total_cas FROM accident_data"

        pop_row   = execute_query(pop_query,   fetch=True, fetch_one=True)
        crime_row = execute_query(crime_query, fetch=True, fetch_one=True)
        acc_row   = execute_query(acc_query,   fetch=True, fetch_one=True)

        return jsonify({
            'success': True,
            'summary': {
                'popularity': {
                    'total_destinations': pop_row['cnt'],
                    'avg_popularity':     round(float(pop_row['avg_score'] or 0), 2)
                },
                'crime': {
                    'total_incidents': crime_row['cnt'],
                    'avg_severity':    round(float(crime_row['avg_sev'] or 0), 2)
                },
                'accidents': {
                    'total_incidents':  acc_row['cnt'],
                    'total_casualties': acc_row['total_cas'] or 0
                }
            }
        })

    except Exception as e:
        logger.error(f"Error fetching GIS summary: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500