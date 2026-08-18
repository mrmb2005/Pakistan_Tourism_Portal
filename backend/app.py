from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_db_connection, test_db_connection
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ── Existing routes ──────────────────────────────────────────
from routes import destinations, hotels, bookings, trips, users, reviews
from routes import gis_layers

app.register_blueprint(destinations.bp)
app.register_blueprint(hotels.bp)
app.register_blueprint(bookings.bp)
app.register_blueprint(trips.bp)
app.register_blueprint(users.bp)
app.register_blueprint(reviews.bp)
app.register_blueprint(gis_layers.bp, url_prefix='/api/gis')

# ── NEW: Gemini AI Assistant ─────────────────────────────────
from routes import ai_assistant
app.register_blueprint(ai_assistant.bp)


@app.route('/')
def index():
    return jsonify({
        "message": "Explore Pakistan API",
        "version": "2.0",
        "status": "running",
        "ai_endpoints": [
            "POST /api/ai/chat",
            "POST /api/ai/recommend",
            "POST /api/ai/plan",
            "GET  /api/ai/quick-tips?destination=Hunza"
        ]
    })


@app.route('/health')
def health():
    try:
        conn = get_db_connection()
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"})
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 EXPLORE PAKISTAN API - Starting Server")
    print("="*60)

    print("\n📊 Testing Database Connection...")
    db_status = test_db_connection()
    if db_status['connected']:
        print("✅ Database Connection: SUCCESS")
        print(f"   ├─ Host: {db_status['host']}")
        print(f"   ├─ Database: {db_status['database']}")
        print(f"   ├─ User: {db_status['user']}")
        print(f"   └─ MySQL Version: {db_status['mysql_version']}")
    else:
        print("❌ Database Connection: FAILED")
        print(f"   └─ Error: {db_status.get('error', 'Unknown')}")

    print("\n🤖 Checking Gemini AI...")
    import os
    key = os.environ.get('GROQ_API_KEY', '')
    if key:
        print("✅ Groq AI: READY")
        print(f"   └─ Key starts with: {key[:8]}...")
    else:
        print("⚠️  Groq AI: API key NOT set")
        print("   └─ Run: $env:GROQ_API_KEY=\"gsk_...your-key-here\"")

    print("\n🌐 Server Configuration:")
    print(f"   ├─ Host: localhost")
    print(f"   ├─ Port: 5000")
    print(f"   └─ Debug Mode: ON")
    print("\n🤖 AI Endpoints:")
    print("   ├─ POST /api/ai/chat")
    print("   ├─ POST /api/ai/recommend")
    print("   ├─ POST /api/ai/plan")
    print("   └─ GET  /api/ai/quick-tips?destination=Hunza")
    print("\n" + "="*60)
    print("📡 Server running at: http://localhost:5000")
    print("="*60 + "\n")

app.run(debug=True, host='0.0.0.0', port=5000)