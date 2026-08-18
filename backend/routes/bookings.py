from flask import Blueprint, jsonify, request
from database import execute_query
import logging

bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_all_bookings():
    """Get all bookings (admin or filtered by user)"""
    try:
        user_id = request.args.get('user_id', type=int)
        
        query = """
            SELECT b.booking_id, b.user_id, b.hotel_id, b.check_in, b.check_out,
                   b.price_paid, b.booking_status, b.created_at,
                   h.hotel_name, u.full_name as user_name, u.email
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.hotel_id
            JOIN users u ON b.user_id = u.user_id
        """
        params = []
        
        if user_id:
            query += " WHERE b.user_id = %s"
            params.append(user_id)
        
        query += " ORDER BY b.created_at DESC"
        
        bookings = execute_query(query, tuple(params) if params else None, fetch=True)
        return jsonify(bookings), 200
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        return jsonify({"error": "Failed to fetch bookings"}), 500

@bp.route('/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Get a single booking by ID"""
    try:
        query = """
            SELECT b.booking_id, b.user_id, b.hotel_id, b.check_in, b.check_out,
                   b.price_paid, b.booking_status, b.created_at,
                   h.hotel_name, h.price as hotel_price, h.rating,
                   u.full_name as user_name, u.email, u.phone
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.hotel_id
            JOIN users u ON b.user_id = u.user_id
            WHERE b.booking_id = %s
        """
        booking = execute_query(query, (booking_id,), fetch=True, fetch_one=True)
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        return jsonify(booking), 200
    except Exception as e:
        logger.error(f"Error fetching booking: {str(e)}")
        return jsonify({"error": "Failed to fetch booking"}), 500

@bp.route('/', methods=['POST'])
def create_booking():
    """Create a new booking"""
    connection = None
    cursor = None
    try:
        from database import get_db_connection
        data = request.get_json()
        
        required_fields = ['user_id', 'hotel_id', 'check_in']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Use single connection for INSERT and getting last ID
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        query = """
            INSERT INTO bookings (user_id, hotel_id, check_in, check_out, price_paid, booking_status)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (
            data['user_id'],
            data['hotel_id'],
            data['check_in'],
            data.get('check_out'),
            data.get('price_paid'),
            data.get('booking_status', 'pending')
        )
        
        cursor.execute(query, params)
        connection.commit()
        
        # Get the last inserted ID in the same connection
        booking_id = cursor.lastrowid
        
        return jsonify({
            "message": "Booking created successfully",
            "booking_id": booking_id
        }), 201
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        if connection:
            connection.rollback()
        return jsonify({"error": f"Failed to create booking: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@bp.route('/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    """Update a booking"""
    try:
        data = request.get_json()
        
        allowed_fields = ['check_in', 'check_out', 'price_paid', 'booking_status']
        update_fields = []
        params = []
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                params.append(data[field])
        
        if not update_fields:
            return jsonify({"error": "No fields to update"}), 400
        
        params.append(booking_id)
        query = f"UPDATE bookings SET {', '.join(update_fields)} WHERE booking_id = %s"
        
        rowcount = execute_query(query, tuple(params))
        
        if rowcount == 0:
            return jsonify({"error": "Booking not found"}), 404
        
        return jsonify({"message": "Booking updated successfully"}), 200
    except Exception as e:
        logger.error(f"Error updating booking: {str(e)}")
        return jsonify({"error": "Failed to update booking"}), 500

@bp.route('/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    """Delete a booking"""
    try:
        query = "DELETE FROM bookings WHERE booking_id = %s"
        rowcount = execute_query(query, (booking_id,))
        
        if rowcount == 0:
            return jsonify({"error": "Booking not found"}), 404
        
        return jsonify({"message": "Booking deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error deleting booking: {str(e)}")
        return jsonify({"error": "Failed to delete booking"}), 500
