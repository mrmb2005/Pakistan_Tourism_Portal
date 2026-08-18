// API-powered data loader for Explore Pakistan
// This file replaces dummy data with API calls

// Global variables to store API data
window.destinations = [];
window.hotels = [];
window.reviews = [];



// Load destinations from API and render
async function loadDestinations() {
    try {
        const destinations = await API.getAllDestinations();
        window.destinations = destinations;
        renderDestinations(destinations);
        // Map will be added after it's initialized
        return destinations;
    } catch (error) {
        console.error('Error loading destinations:', error);
        alert('Failed to load destinations. Please ensure the backend server is running on http://localhost:5000');
        window.destinations = [];
        return [];
    }
}

// Render destination cards
function renderDestinations(destinations) {
    const grid = document.getElementById('dest-grid');
    if (!grid) return;
    
    grid.innerHTML = destinations.map(dest => `
        <article class="card" data-aos="fade-up" 
                 data-dest-id="${dest.destination_id}"
                 data-name="${dest.name}"
                 data-lat="${dest.latitude}"
                 data-lon="${dest.longitude}"
                 data-img="${dest.images && dest.images[0] ? dest.images[0] : 'Images/placeholder.jpg'}"
                 data-description="${(dest.description || '').replace(/"/g, '&quot;')}">
            <img src="${dest.images && dest.images[0] ? dest.images[0] : 'Images/placeholder.jpg'}" 
                 alt="${dest.name}"
                 style="cursor: pointer;"
                 onclick="viewDestinationDetails('${dest.name}')">
            <div class="card-body">
                <h3 style="cursor: pointer;" onclick="viewDestinationDetails('${dest.name}')">${dest.name}</h3>
                <p class="muted">${dest.description ? dest.description.substring(0, 100) + '...' : dest.area || ''}</p>
                <div class="actions">
                    <button class="btn-ghost" 
                            onclick="viewDestinationDetails('${dest.name}')">
                        View Details
                    </button>
                    <button class="btn-primary" data-name="${dest.name}" data-dest-id="${dest.destination_id}">
                        Add to Plan
                    </button>
                </div>
            </div>
        </article>
    `).join('');
    
    // Re-initialize AOS for new elements
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
    
    // Trigger event for other scripts to attach handlers
    window.dispatchEvent(new Event('destinationsRendered'));
}

// Add destinations to map
function addDestinationsToMap(destinations) {
    if (typeof L === 'undefined' || !window.map) return;
    
    destinations.forEach(dest => {
        if (dest.latitude && dest.longitude) {
            const marker = L.marker([dest.latitude, dest.longitude]).addTo(window.map);
            marker.bindPopup(`<b>${dest.name}</b><br>${dest.description || ''}`);
        }
    });
}

// Load hotels from API and render
async function loadHotels() {
    try {
        const hotels = await API.getAllHotels();
        window.hotels = hotels;
        renderHotels(hotels);
        return hotels;
    } catch (error) {
        console.error('Error loading hotels:', error);
        window.hotels = [];
        return [];
    }
}

// Render hotel cards
function renderHotels(hotels) {
    const grid = document.getElementById('hotels-grid');
    if (!grid) return;
    
    grid.innerHTML = hotels.map(hotel => {
        const imageUrl = hotel.images && hotel.images[0] ? hotel.images[0] : 'Images/placeholder.jpg';
        return `
            <div class="hotel-card original-card" 
                 data-name="${hotel.hotel_name}" 
                 data-destination="${hotel.destination_name || ''}" 
                 data-price="${hotel.price || 0}" 
                 data-rating="${hotel.rating || 0}"
                 data-hotel-id="${hotel.hotel_id}"
                 data-image="${imageUrl}">
                <div class="hotel-thumb">
                    <img src="${imageUrl}" alt="${hotel.hotel_name}">
                </div>
                <div class="hotel-info">
                    <h4>${hotel.hotel_name}</h4>
                    <div class="flex">
                        <p class="muted">From PKR ${hotel.price ? hotel.price.toLocaleString() : 'N/A'} / night</p>
                        <span class="rating">★ ${hotel.rating || 'N/A'}</span>
                    </div>
                </div>
                <div style="margin-left:auto">
                    <button class="btn-primary book-btn" data-hotel-id="${hotel.hotel_id}">Book</button>
                </div>
            </div>
        `;
    }).join('');
}

// Store destination info for modal (this would ideally come from API too)
let destinationInfoCache = {};

async function getDestinationInfo(destId) {
    if (destinationInfoCache[destId]) {
        return destinationInfoCache[destId];
    }
    
    try {
        const dest = await API.getDestination(destId);
        destinationInfoCache[destId] = dest;
        return dest;
    } catch (error) {
        console.error('Error loading destination info:', error);
        return null;
    }
}

// Load reviews from API and render
async function loadReviews() {
    try {
        // Get all hotels and their reviews
        const hotels = await API.getAllHotels();
        let allReviews = [];
        
        // For demo purposes, we'll use some sample reviews
        // In a real app, you'd have a dedicated reviews endpoint
        const sampleReviews = [
            { text: "Hunza Valley felt like a fairy tale — the views were unforgettable.", author: "Aisha", year: "2024" },
            { text: "Skardu's lakes are breathtaking and peaceful. Highly recommend guided tours.", author: "Bilal", year: "2024" },
            { text: "Lahore food walk was amazing; history around every corner.", author: "Sana", year: "2024" }
        ];
        
        window.reviews = sampleReviews;
        renderReviews(sampleReviews);
        return sampleReviews;
    } catch (error) {
        console.error('Error loading reviews:', error);
        window.reviews = [];
        return [];
    }
}

// Render reviews
function renderReviews(reviews) {
    const container = document.getElementById('reviews-wrap');
    if (!container) return;
    
    container.innerHTML = reviews.map(review => `
        <article class="review-card">
            <p>"${review.text}"</p>
            <small>- ${review.author}, ${review.year}</small>
        </article>
    `).join('');
}

// Add destinations to map (called after map is initialized)
function addDestinationsToMapAfterInit() {
    if (window.destinations && window.destinations.length > 0) {
        addDestinationsToMap(window.destinations);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Loading data from API...');
    
    // Load all data from API
    await loadDestinations();
    await loadHotels();
    await loadReviews();
    
    console.log('✅ Data loaded successfully');
    console.log('📊 Destinations:', window.destinations.length);
    console.log('🏨 Hotels:', window.hotels.length);
    console.log('💬 Reviews:', window.reviews.length);
    
    // Update counter animations after data loads
    if (typeof animateCounters === 'function') {
        setTimeout(animateCounters, 500);
    }
    
    // Signal that data is loaded for other scripts
    window.dataLoaded = true;
    window.dispatchEvent(new Event('apiDataLoaded'));
});

// Override book button handlers to use hotel ID
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('book-btn')) {
        const hotelCard = e.target.closest('.hotel-card');
        const hotelName = hotelCard.dataset.name;
        const hotelId = hotelCard.dataset.hotelId;
        const hotelImage = hotelCard.dataset.image;
        const hotelPrice = hotelCard.dataset.price;
        const hotelRating = hotelCard.dataset.rating;
        
        // Check if user is logged in
        const user = localStorage.getItem('user');
        const userId = localStorage.getItem('userId');
        
        if (!user || !userId) {
            alert('Please login to book a hotel.');
            // Trigger login modal
            document.getElementById('loginBtn').click();
            return;
        }
        
        // Store selected hotel for booking page
        localStorage.setItem('selectedHotel', JSON.stringify({
            id: hotelId,
            name: hotelName,
            image: hotelImage,
            price: hotelPrice,
            rating: hotelRating
        }));
        
        // Redirect to booking page
        window.location.href = `hotel bookings.html?hotel=${encodeURIComponent(hotelName)}&id=${hotelId}`;
    }
});

// Function to create a booking (can be called from booking page)
window.createBooking = async function(bookingData) {
    try {
        const user = localStorage.getItem('user');
        const userId = localStorage.getItem('userId');
        
        if (!user || !userId) {
            throw new Error('User not logged in');
        }
        
        // Ensure user_id is set
        bookingData.user_id = parseInt(userId);
        
        // Validate required fields
        if (!bookingData.hotel_id || !bookingData.check_in) {
            throw new Error('Hotel and check-in date are required');
        }
        
        // Call booking API
        const response = await API.createBooking(bookingData);
        
        if (response && response.booking_id) {
            return {
                success: true,
                booking_id: response.booking_id,
                message: response.message || 'Booking created successfully'
            };
        } else {
            throw new Error('Failed to create booking');
        }
    } catch (error) {
        console.error('Booking creation error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create booking'
        };
    }
};

// Function to get user's bookings
window.getUserBookings = async function() {
    try {
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            throw new Error('User not logged in');
        }
        
        const bookings = await API.getAllBookings(parseInt(userId));
        return bookings;
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }
};
