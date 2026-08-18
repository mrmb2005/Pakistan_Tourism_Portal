from flask import Blueprint, jsonify, request
from database import execute_query
import logging

bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')
logger = logging.getLogger(__name__)

@bp.route('/hotel/<int:hotel_id>', methods=['GET'])
def get_hotel_reviews(hotel_id):
    """Get all reviews for a hotel"""
    try:
        query = """
            SELECT r.review_id, r.rating, r.review_text, r.created_at,
                   r.user_id, u.full_name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.hotel_id = %s
            ORDER BY r.created_at DESC
        """
        reviews = execute_query(query, (hotel_id,), fetch=True)
        
        return jsonify(reviews), 200
    except Exception as e:
        logger.error(f"Error fetching reviews: {str(e)}")
        return jsonify({"error": "Failed to fetch reviews"}), 500

@bp.route('/', methods=['POST'])
def create_review():
    """Create a new review"""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'hotel_id', 'rating']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Validate rating
        if not (1 <= data['rating'] <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        query = """
            INSERT INTO reviews (user_id, hotel_id, rating, review_text)
            VALUES (%s, %s, %s, %s)
        """
        params = (
            data['user_id'],
            data['hotel_id'],
            data['rating'],
            data.get('review_text', '')
        )
        
        execute_query(query, params)
        
        # Get the created review
        last_id_query = "SELECT LAST_INSERT_ID() as review_id"
        result = execute_query(last_id_query, fetch=True, fetch_one=True)
        review_id = result['review_id']
        
        return jsonify({
            "message": "Review created successfully",
            "review_id": review_id
        }), 201
    except Exception as e:
        logger.error(f"Error creating review: {str(e)}")
        return jsonify({"error": "Failed to create review"}), 500

@bp.route('/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    """Delete a review"""
    try:
        query = "DELETE FROM reviews WHERE review_id = %s"
        rowcount = execute_query(query, (review_id,))
        
        if rowcount == 0:
            return jsonify({"error": "Review not found"}), 404
        
        return jsonify({"message": "Review deleted successfully"}), 200
    except Exception as e:
        logger.error(f"Error deleting review: {str(e)}")
        return jsonify({"error": "Failed to delete review"}), 500
