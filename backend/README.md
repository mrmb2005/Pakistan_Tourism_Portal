# Explore Pakistan - Flask Backend

This is the backend API for the Explore Pakistan tourism website.

## Setup

1. Install Python 3.8 or higher

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure database:
   - Create MySQL database named `explore_pakistan`
   - Run the SQL schema script to create tables
   - Update database credentials in `config.py`

4. Run the application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Destinations
- `GET /api/destinations/` - Get all destinations
- `GET /api/destinations/<id>` - Get specific destination
- `GET /api/destinations/<id>/hotels` - Get hotels for a destination

### Hotels
- `GET /api/hotels/` - Get all hotels
- `GET /api/hotels/<id>` - Get specific hotel
- `GET /api/hotels/search?q=<query>` - Search hotels

### Bookings
- `GET /api/bookings/` - Get all bookings
- `GET /api/bookings/<id>` - Get specific booking
- `POST /api/bookings/` - Create new booking
- `PUT /api/bookings/<id>` - Update booking
- `DELETE /api/bookings/<id>` - Delete booking

### Trips
- `GET /api/trips/` - Get all trips
- `GET /api/trips/<id>` - Get specific trip
- `POST /api/trips/` - Create new trip
- `POST /api/trips/<id>/hotels` - Add hotel to trip
- `DELETE /api/trips/<id>/hotels/<hotel_id>` - Remove hotel from trip
- `DELETE /api/trips/<id>` - Delete trip

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/<id>` - Get user details
- `GET /api/users/<id>/favorites` - Get user favorites
- `POST /api/users/<id>/favorites` - Add to favorites
- `DELETE /api/users/<id>/favorites/<fav_id>` - Remove from favorites

### Reviews
- `GET /api/reviews/hotel/<hotel_id>` - Get hotel reviews
- `POST /api/reviews/` - Create new review
- `DELETE /api/reviews/<id>` - Delete review

## Configuration

Edit `config.py` to update:
- Database credentials
- Flask secret key
- Debug mode
