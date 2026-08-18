from flask import Blueprint, jsonify, request
from database import execute_query
import logging

bp = Blueprint('trips', __name__, url_prefix='/api/trips')
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_all_trips():
    """Get all trips (admin or filtered by user)"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        query = """
            SELECT t.trip_id, t.user_id, t.destination_id, t.trip_date, t.trip_time,
                   t.description, t.created_at,
                   d.name as destination_name, u.full_name as user_name
            FROM trips t
            LEFT JOIN destinations d ON t.destination_id = d.destination_id
            JOIN users u ON t.user_id = u.user_id
        """
        params = []
        
        if user_id:
            query += " WHERE t.user_id = %s"
            params.append(user_id)
        
        query += " ORDER BY t.trip_date DESC, t.created_at DESC"
        
        trips = execute_query(query, tuple(params) if params else None, fetch=True)
        
        # Get selected hotels for each trip
        for trip in trips:
            hotel_query = """
                SELECT h.hotel_id, h.hotel_name, h.price, h.rating
                FROM trip_hotels_selected ths
                JOIN hotels h ON ths.hotel_id = h.hotel_id
                WHERE ths.trip_id = %s
            """
            hotels = execute_query(hotel_query, (trip['trip_id'],), fetch=True)
            trip['selected_hotels'] = hotels
        
        return jsonify(trips), 200
    except Exception as e:
        logger.error(f"Error fetching trips: {str(e)}")
        return jsonify({"error": "Failed to fetch trips"}), 500

@bp.route('/<int:trip_id>', methods=['GET'])
def get_trip(trip_id):
    """Get a single trip by ID"""
    try:
        query = """
            SELECT t.trip_id, t.user_id, t.destination_id, t.trip_date, t.trip_time,
                   t.description, t.created_at,
                   d.name as destination_name, d.description as destination_description,
                   u.full_name as user_name, u.email
            FROM trips t
            LEFT JOIN destinations d ON t.destination_id = d.destination_id
            JOIN users u ON t.user_id = u.user_id
            WHERE t.trip_id = %s
        """
        trip = execute_query(query, (trip_id,), fetch=True, fetch_one=True)
        
        if not trip:
            return jsonify({"error": "Trip not found"}), 404
        
        # Get selected hotels
        hotel_query = """
            SELECT h.hotel_id, h.hotel_name, h.price, h.rating, h.latitude, h.longitude
            FROM trip_hotels_selected ths
            JOIN hotels h ON ths.hotel_id = h.hotel_id
            WHERE ths.trip_id = %s
        """
        hotels = execute_query(hotel_query, (trip_id,), fetch=True)
        trip['selected_hotels'] = hotels
        
        return jsonify(trip), 200
    except Exception as e:
        logger.error(f"Error fetching trip: {str(e)}")
        return jsonify({"error": "Failed to fetch trip"}), 500

@bp.route('/', methods=['POST'])
def create_trip():
    """Create a new trip"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'destination_id']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        query = """
            INSERT INTO trips (user_id, destination_id, trip_date, trip_time, description)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (
            data['user_id'],
            data['destination_id'],
            data.get('trip_date'),
            data.get('trip_time'),
            data.get('description')
        )
        
        execute_query(query, params)
        
        # Get the created trip
        last_id_query = "SELECT LAST_INSERT_ID() as trip_id"
        result = execute_query(last_id_query, fetch=True, fetch_one=True)
        trip_id = result['trip_id']
        
        # Add selected hotels if provided
        if 'hotel_ids' in data and data['hotel_ids']:
            for hotel_id in data['hotel_ids']:
                hotel_query = """
                    INSERT INTO trip_hotels_selected (trip_id, hotel_id)
                    VALUES (%s, %s)
                """
                execute_query(hotel_query, (trip_id, hotel_id))
        
        return jsonify({
            "message": "Trip created successfully",
            "trip_id": trip_id
        }), 201
    except Exception as e:
        logger.error(f"Error creating trip: {str(e)}")
        return jsonify({"error": "Failed to create trip"}), 500

@bp.route('/<int:trip_id>/hotels', methods=['POST'])
def add_hotel_to_trip(trip_id):
    """Add a hotel to a trip"""
    try:
        data = request.get_json()
        
        if 'hotel_id' not in data:
            return jsonify({"error": "Missing required field: hotel_id"}), 400
        
        query = """
            INSERT INTO trip_hotels_selected (trip_id, hotel_id)
            VALUES (%s, %s)
        """
        execute_query(query, (trip_id, data['hotel_id']))
        
        return jsonify({"message": "Hotel added to trip successfully"}), 201
    except Exception as e:
        logger.error(f"Error adding hotel to trip: {str(e)}")
        return jsonify({"error": "Failed to add hotel to trip"}), 500

@bp.route('/<int:trip_id>/hotels/<int:hotel_id>', methods=['DELETE'])
def remove_hotel_from_trip(trip_id, hotel_id):
    """Remove a hotel from a trip"""
    try:
        query = """
            DELETE FROM trip_hotels_selected 
            WHERE trip_id = %s AND hotel_id = %s
        """
        rowcount = execute_query(query, (trip_id, hotel_id))
        
        if rowcount == 0:
            return jsonify({"error": "Hotel not found in trip"}), 404
        
        return jsonify({"message": "Hotel removed from trip successfully"}), 200
    except Exception as e:
        logger.error(f"Error removing hotel from trip: {str(e)}")
        return jsonify({"error": "Failed to remove hotel from trip"}), 500

@bp.route('/<int:trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    """Delete a trip"""
    try:
        query = "DELETE FROM trips WHERE trip_id = %s"
        rowcount = execute_query(query, (trip_id,))
        
        if rowcount == 0:
            return jsonify({"error": "Trip not found"}), 404
        
        return jsonify({"message": "Trip deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error deleting trip: {str(e)}")
        return jsonify({"error": "Failed to delete trip"}), 500
