from flask import Blueprint, jsonify, request
from database import execute_query
import logging

bp = Blueprint('destinations', __name__, url_prefix='/api/destinations')
logger = logging.getLogger(__name__)

@bp.route('/', methods=['GET'])
def get_all_destinations():
    """Get all destinations with their images"""
    try:
        query = """
            SELECT d.destination_id, d.name, d.description, d.latitude, d.longitude, d.area
            FROM destinations d
            ORDER BY d.name
        """
        destinations = execute_query(query, fetch=True)
        
        # Get images for each destination
        for dest in destinations:
            img_query = """
                SELECT image_url FROM destination_images 
                WHERE destination_id = %s
            """
            images = execute_query(img_query, (dest['destination_id'],), fetch=True)
            dest['images'] = [img['image_url'] for img in images]
        
        return jsonify(destinations), 200
    except Exception as e:
        logger.error(f"Error fetching destinations: {str(e)}")
        return jsonify({"error": "Failed to fetch destinations"}), 500

@bp.route('/<int:destination_id>', methods=['GET'])
def get_destination(destination_id):
    """Get a single destination by ID"""
    try:
        query = """
            SELECT d.destination_id, d.name, d.description, d.latitude, d.longitude, d.area
            FROM destinations d
            WHERE d.destination_id = %s
        """
        destination = execute_query(query, (destination_id,), fetch=True, fetch_one=True)
        
        if not destination:
            return jsonify({"error": "Destination not found"}), 404
        
        # Get images
        img_query = """
            SELECT image_url FROM destination_images 
            WHERE destination_id = %s
        """
        images = execute_query(img_query, (destination_id,), fetch=True)
        destination['images'] = [img['image_url'] for img in images]
        
        return jsonify(destination), 200
    except Exception as e:
        logger.error(f"Error fetching destination: {str(e)}")
        return jsonify({"error": "Failed to fetch destination"}), 500

@bp.route('/<int:destination_id>/hotels', methods=['GET'])
def get_destination_hotels(destination_id):
    """Get all hotels for a specific destination"""
    try:
        query = """
            SELECT h.hotel_id, h.hotel_name, h.price, h.rating, h.latitude, h.longitude
            FROM hotels h
            WHERE h.destination_id = %s
            ORDER BY h.rating DESC
        """
        hotels = execute_query(query, (destination_id,), fetch=True)
        
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
        logger.error(f"Error fetching destination hotels: {str(e)}")
        return jsonify({"error": "Failed to fetch hotels"}), 500
