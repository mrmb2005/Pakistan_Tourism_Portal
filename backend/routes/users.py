from flask import Blueprint, jsonify, request
from database import execute_query
import logging
import hashlib

bp = Blueprint('users', __name__, url_prefix='/api/users')
logger = logging.getLogger(__name__)

def hash_password(password):
    """Simple password hashing (use bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

@bp.route('/register', methods=['POST'])
def register_user():
    """Register a new user"""
    try:
        data = request.get_json()
        
        required_fields = ['full_name', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check if email already exists
        check_query = "SELECT user_id FROM users WHERE email = %s"
        existing = execute_query(check_query, (data['email'],), fetch=True, fetch_one=True)
        
        if existing:
            return jsonify({"error": "Email already registered"}), 409
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        query = """
            INSERT INTO users (full_name, email, password_hash, phone, user_role)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (
            data['full_name'],
            data['email'],
            password_hash,
            data.get('phone'),
            data.get('user_role', 'user')
        )
        
        execute_query(query, params)
        
        # Get the created user
        last_id_query = "SELECT LAST_INSERT_ID() as user_id"
        result = execute_query(last_id_query, fetch=True, fetch_one=True)
        user_id = result['user_id']
        
        return jsonify({
            "message": "User registered successfully",
            "user_id": user_id
        }), 201
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        return jsonify({"error": "Failed to register user"}), 500

@bp.route('/login', methods=['POST'])
def login_user():
    """Login a user"""
    try:
        data = request.get_json()
        
        if 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400
        
        password_hash = hash_password(data['password'])
        
        query = """
            SELECT user_id, full_name, email, phone, user_role
            FROM users
            WHERE email = %s AND password_hash = %s
        """
        user = execute_query(query, (data['email'], password_hash), fetch=True, fetch_one=True)
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        return jsonify({
            "message": "Login successful",
            "user": user
        }), 200
    except Exception as e:
        logger.error(f"Error logging in: {str(e)}")
        return jsonify({"error": "Failed to login"}), 500

@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user details"""
    try:
        query = """
            SELECT user_id, full_name, email, phone, user_role, created_at
            FROM users
            WHERE user_id = %s
        """
        user = execute_query(query, (user_id,), fetch=True, fetch_one=True)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify(user), 200
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        return jsonify({"error": "Failed to fetch user"}), 500

@bp.route('/<int:user_id>/favorites', methods=['GET'])
def get_user_favorites(user_id):
    """Get user's favorite destinations and hotels"""
    try:
        query = """
            SELECT f.fav_id, f.destination_id, f.hotel_id,
                   d.name as destination_name, h.hotel_name
            FROM favorites f
            LEFT JOIN destinations d ON f.destination_id = d.destination_id
            LEFT JOIN hotels h ON f.hotel_id = h.hotel_id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
        """
        favorites = execute_query(query, (user_id,), fetch=True)
        
        return jsonify(favorites), 200
    except Exception as e:
        logger.error(f"Error fetching favorites: {str(e)}")
        return jsonify({"error": "Failed to fetch favorites"}), 500

@bp.route('/<int:user_id>/favorites', methods=['POST'])
def add_favorite(user_id):
    """Add a destination or hotel to favorites"""
    try:
        data = request.get_json()
        
        if 'destination_id' not in data and 'hotel_id' not in data:
            return jsonify({"error": "Either destination_id or hotel_id required"}), 400
        
        query = """
            INSERT INTO favorites (user_id, destination_id, hotel_id)
            VALUES (%s, %s, %s)
        """
        params = (
            user_id,
            data.get('destination_id'),
            data.get('hotel_id')
        )
        
        execute_query(query, params)
        
        return jsonify({"message": "Added to favorites successfully"}), 201
    except Exception as e:
        logger.error(f"Error adding favorite: {str(e)}")
        return jsonify({"error": "Failed to add favorite"}), 500

@bp.route('/<int:user_id>/favorites/<int:fav_id>', methods=['DELETE'])
def remove_favorite(user_id, fav_id):
    """Remove from favorites"""
    try:
        query = "DELETE FROM favorites WHERE fav_id = %s AND user_id = %s"
        rowcount = execute_query(query, (fav_id, user_id))
        
        if rowcount == 0:
            return jsonify({"error": "Favorite not found"}), 404
        
        return jsonify({"message": "Removed from favorites successfully"}), 200
    except Exception as e:
        logger.error(f"Error removing favorite: {str(e)}")
        return jsonify({"error": "Failed to remove favorite"}), 500
