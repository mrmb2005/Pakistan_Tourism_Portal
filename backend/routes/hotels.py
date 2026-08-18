from flask import Blueprint, jsonify, request
from database import execute_query
import logging

bp = Blueprint('hotels', __name__, url_prefix='/api/hotels')
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_all_hotels():
    """Get all hotels"""
    try:
        query = """
            SELECT h.hotel_id, h.hotel_name, h.price, h.rating, h.latitude, h.longitude,
                   h.destination_id, d.name as destination_name
            FROM hotels h
            LEFT JOIN destinations d ON h.destination_id = d.destination_id
            ORDER BY h.rating DESC
        """
        hotels = execute_query(query, fetch=True)
        
        # Get images for each hotel
        for hotel in hotels:
            img_query = """
                SELECT image_url FROM hotel_images 
                WHERE hotel_id = %s
            """
            images = execute_query(img_query, (hotel['hotel_id'],), fetch=True)
            hotel['images'] = [img['image_url'] for img in images]
        
        return jsonify(hotels), 200
    except Exception as e:
        logger.error(f"Error fetching hotels: {str(e)}")
        return jsonify({"error": "Failed to fetch hotels"}), 500

@bp.route('/<int:hotel_id>', methods=['GET'])
def get_hotel(hotel_id):
    """Get a single hotel by ID"""
    try:
        query = """
            SELECT h.hotel_id, h.hotel_name, h.price, h.rating, h.latitude, h.longitude,
                   h.destination_id, d.name as destination_name
            FROM hotels h
            LEFT JOIN destinations d ON h.destination_id = d.destination_id
            WHERE h.hotel_id = %s
        """
        hotel = execute_query(query, (hotel_id,), fetch=True, fetch_one=True)
        
        if not hotel:
            return jsonify({"error": "Hotel not found"}), 404
        
        # Get images
        img_query = """
            SELECT image_url FROM hotel_images 
            WHERE hotel_id = %s
        """
        images = execute_query(img_query, (hotel_id,), fetch=True)
        hotel['images'] = [img['image_url'] for img in images]
        
        # Get reviews
        review_query = """
            SELECT r.review_id, r.rating, r.review_text, r.created_at,
                   u.full_name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.hotel_id = %s
            ORDER BY r.created_at DESC
        """
        reviews = execute_query(review_query, (hotel_id,), fetch=True)
        hotel['reviews'] = reviews
        
        return jsonify(hotel), 200
    except Exception as e:
        logger.error(f"Error fetching hotel: {str(e)}")
        return jsonify({"error": "Failed to fetch hotel"}), 500

@bp.route('/search', methods=['GET'])
def search_hotels():
    """Search hotels by name or destination"""
    try:
        search_term = request.args.get('q', '')
        min_price = request.args.get('min_price', type=int)
        max_price = request.args.get('max_price', type=int)
        min_rating = request.args.get('min_rating', type=float)
        
        query = """
            SELECT h.hotel_id, h.hotel_name, h.price, h.rating, h.latitude, h.longitude,
                   h.destination_id, d.name as destination_name
            FROM hotels h
            LEFT JOIN destinations d ON h.destination_id = d.destination_id
            WHERE 1=1
        """
        params = []
        
        if search_term:
            query += " AND (h.hotel_name LIKE %s OR d.name LIKE %s)"
            params.extend([f"%{search_term}%", f"%{search_term}%"])
        
        if min_price is not None:
            query += " AND h.price >= %s"
            params.append(min_price)
        
        if max_price is not None:
            query += " AND h.price <= %s"
            params.append(max_price)
        
        if min_rating is not None:
            query += " AND h.rating >= %s"
            params.append(min_rating)
        
        query += " ORDER BY h.rating DESC"
        
        hotels = execute_query(query, tuple(params) if params else None, fetch=True)
        
        # Get images for each hotel
        for hotel in hotels:
            img_query = """
                SELECT image_url FROM hotel_images 
                WHERE hotel_id = %s
            """
            images = execute_query(img_query, (hotel['hotel_id'],), fetch=True)
            hotel['images'] = [img['image_url'] for img in images]
        
        return jsonify(hotels), 200
    except Exception as e:
        logger.error(f"Error searching hotels: {str(e)}")
        return jsonify({"error": "Failed to search hotels"}), 500
