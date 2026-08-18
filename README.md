# Explore Pakistan - Tourism Website

A full-stack tourism website for exploring destinations in Pakistan with Flask backend and MySQL database.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- MySQL Server
- Web browser (Chrome, Firefox, or Edge recommended)

### Setup Steps

1. **Set up the database:**
   - Open MySQL and run the schema file (provided SQL)
   - Run `backend/sample_data.sql` to insert sample data

2. **Configure the backend:**
   - Edit `backend/config.py` with your MySQL credentials
   - Run `start_backend.bat` (Windows) or see manual instructions below

3. **Open the website:**
   - Open `front end code.html` in your web browser
   - The page will load data from the Flask API

### Manual Backend Start

```bash
cd backend
pip install -r requirements.txt
python app.py
```

## 📁 Project Structure

```
explore_pakistan/
├── backend/                    # Flask backend
│   ├── app.py                 # Main application
│   ├── config.py              # Configuration
│   ├── database.py            # Database utilities
│   ├── requirements.txt       # Python dependencies
│   ├── sample_data.sql        # Sample database data
│   └── routes/                # API endpoints
│       ├── destinations.py
│       ├── hotels.py
│       ├── bookings.py
│       ├── trips.py
│       ├── users.py
│       └── reviews.py
│
├── Images/                    # Image assets
├── api-config.js             # API configuration
├── api-data-loader.js        # Dynamic data loading
├── front end code.html        # Main page
├── hotel bookings.html        # Hotel booking page
├── trips.html                 # Trip details page
├── start_backend.bat          # Windows startup script
├── SETUP_GUIDE.md            # Detailed setup guide
└── README.md                 # This file
```

## 🌐 API Endpoints

The Flask backend runs on `http://localhost:5000` and provides:

- **Destinations:** CRUD operations for tourist destinations
- **Hotels:** Hotel listings and search
- **Bookings:** Booking management
- **Trips:** Trip planning and itineraries
- **Users:** User authentication and favorites
- **Reviews:** Hotel reviews and ratings

See `SETUP_GUIDE.md` for complete API documentation.

## 📊 Database Schema

The application uses MySQL with the following main tables:
- `users` - User accounts
- `destinations` - Tourist destinations
- `hotels` - Hotel listings
- `bookings` - Hotel bookings
- `trips` - Planned trips
- `reviews` - Hotel reviews
- `favorites` - User favorites

## 🛠️ Technologies Used

### Backend
- **Flask** - Python web framework
- **MySQL** - Database
- **mysql-connector-python** - Database driver
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **HTML5/CSS3** - Structure and styling
- **JavaScript** - Interactivity
- **Leaflet.js** - Interactive maps
- **AOS** - Scroll animations

## 📖 Usage

1. **Browse Destinations:** View all tourist destinations on the main page
2. **View Hotels:** See available hotels for each destination
3. **Book Hotels:** Make hotel reservations
4. **Plan Trips:** Create trip itineraries
5. **Add Reviews:** Share experiences and ratings

## 🔒 Security Notes

**⚠️ This is a development version. For production:**
- Change the SECRET_KEY in config.py
- Use bcrypt for password hashing
- Implement proper JWT authentication
- Add input validation
- Enable HTTPS
- Use environment variables for sensitive data

## 🐛 Troubleshooting

### Backend won't start
- Ensure MySQL is running
- Check database credentials in `backend/config.py`
- Verify Python packages are installed

### Data not loading
- Confirm Flask server is running on localhost:5000
- Check browser console for errors
- Verify database has sample data

### Database errors
- Ensure MySQL service is active
- Check database name is `explore_pakistan`
- Verify user has proper permissions

## 📝 Development

To add new features:

1. **Backend:** Add routes in `backend/routes/`
2. **Frontend:** Update `api-data-loader.js` for new API calls
3. **Database:** Update schema and run migrations

## 📄 License

This project is for educational purposes.

## 👥 Contributors

Developed for the Explore Pakistan tourism initiative.

---

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
