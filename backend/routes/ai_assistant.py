"""
routes/ai_assistant.py
------------------------
AI Travel Assistant for Explore Pakistan
Uses Google Gemini API — 100% FREE (gemini-1.5-flash)
"""

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import logging, os, json, requests as req_lib


logger = logging.getLogger(__name__)
bp     = Blueprint('ai_assistant', __name__, url_prefix='/api/ai')

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions'

SYSTEM_CONTEXT = """You are a friendly AI travel assistant for "Explore Pakistan",
a tourism web app covering Pakistan's top destinations.

Your job:
- Help plan trips (Hunza, Skardu, K2, Islamabad, Lahore, Swat, Murree, Naran, etc.)
- Recommend destinations based on interests, budget, season
- Flag safe zones and travel warnings
- Give packing lists, food tips, transport advice, local customs
- Generate day-by-day itineraries

Tone: warm, enthusiastic, concise. Use emojis (✅ ⚠️ 🏔️ 🌸 🍽️ 🚗 💰 📅).
Max 250 words unless asked for a full plan.
If asked something unrelated to travel/Pakistan, politely redirect."""


def call_gemini(prompt, max_tokens=600):
    if not GROQ_API_KEY:
        return None, 'GROQ_API_KEY environment variable is not set.'
    try:
        response = req_lib.post(
            GROQ_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GROQ_API_KEY}'
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": SYSTEM_CONTEXT},
                    {"role": "user",   "content": prompt}
                ],
                "max_tokens": max_tokens,
                "temperature": 0.7
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content'], None
        elif response.status_code == 429:
            return None, 'Rate limit — wait a moment and retry.'
        elif response.status_code == 401:
            return None, 'Invalid Groq API key.'
        else:
            logger.error(f'Groq {response.status_code}: {response.text}')
            return None, f'Groq error {response.status_code}'
    except Exception as e:
        logger.error(f'Groq call failed: {e}')
        return None, str(e)


@bp.route('/chat', methods=['POST', 'OPTIONS'])
@cross_origin()
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    data    = request.get_json(silent=True) or {}
    message = (data.get('message') or '').strip()
    history = data.get('history', [])
    if not message:
        return jsonify({'success': False, 'error': 'message is required'}), 400

    prompt = ''
    for turn in history[-6:]:
        role, content = turn.get('role',''), turn.get('content','')
        if role == 'user':        prompt += f'User: {content}\n'
        elif role == 'assistant': prompt += f'Assistant: {content}\n'
    prompt += f'User: {message}\nAssistant:'

    reply, error = call_gemini(prompt, max_tokens=500)
    if error: return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'reply': reply.strip()})


@bp.route('/recommend', methods=['POST', 'OPTIONS'])
@cross_origin()
def recommend():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    data      = request.get_json(silent=True) or {}
    interests = data.get('interests', 'sightseeing')
    budget    = data.get('budget', 'medium')
    duration  = data.get('duration', '7 days')
    season    = data.get('season', 'summer')

    prompt = f"""Tourist preferences:
- Interests: {interests}
- Budget: {budget}
- Duration: {duration}
- Season: {season}

Give:
1. Top 3 recommended Pakistan destinations (with brief reason)
2. One hidden gem
3. One safety tip for their season
Be exciting. Use emojis."""

    reply, error = call_gemini(prompt, max_tokens=450)
    if error: return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'reply': reply.strip(),
                    'context': {'interests':interests,'budget':budget,
                                'duration':duration,'season':season}})


@bp.route('/plan', methods=['POST', 'OPTIONS'])
@cross_origin()
def plan():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    data         = request.get_json(silent=True) or {}
    destinations = data.get('destinations', [])
    days         = int(data.get('days', 5))
    interests    = data.get('interests', 'sightseeing')
    budget       = data.get('budget', 'medium')
    if not destinations:
        return jsonify({'success': False, 'error': 'destinations required'}), 400

    prompt = f"""Create a {days}-day Pakistan itinerary.
Destinations: {', '.join(destinations)}
Interests: {interests} | Budget: {budget}

Format each day as:
**Day N — Place**
- Morning / Afternoon / Evening activities
- Stay: hotel type for {budget} budget
- 🍽️ Food: one local meal
- 💰 Est. cost: PKR range

End with one safety tip."""

    reply, error = call_gemini(prompt, max_tokens=900)
    if error: return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'reply': reply.strip(),
                    'context': {'destinations':destinations,'days':days}})


@bp.route('/quick-tips', methods=['GET', 'OPTIONS'])
@cross_origin()
def quick_tips():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    destination = request.args.get('destination', '').strip()
    if not destination:
        return jsonify({'success': False, 'error': 'destination param required'}), 400

    prompt = f"""Quick travel tips for {destination}, Pakistan.
4 sections, 2-3 bullets each, each bullet under 15 words:
🏆 Must-Do Activities
🌤️ Best Time to Visit
⚠️ Safety & Warnings
💰 Budget Tips"""

    reply, error = call_gemini(prompt, max_tokens=300)
    if error: return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'destination': destination, 'tips': reply.strip()})