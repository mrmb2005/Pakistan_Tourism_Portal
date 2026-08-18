// API Configuration — Explore Pakistan
const API_BASE_URL = 'http://localhost:5000/api';

const API_ENDPOINTS = {
    destinations: {
        getAll:    () => `${API_BASE_URL}/destinations/`,
        getOne:    (id) => `${API_BASE_URL}/destinations/${id}`,
        getHotels: (id) => `${API_BASE_URL}/destinations/${id}/hotels`
    },
    hotels: {
        getAll:  () => `${API_BASE_URL}/hotels/`,
        getOne:  (id) => `${API_BASE_URL}/hotels/${id}`,
        search:  (q) => `${API_BASE_URL}/hotels/search?q=${q}`
    },
    bookings: {
        getAll:  (uid) => uid ? `${API_BASE_URL}/bookings/?user_id=${uid}` : `${API_BASE_URL}/bookings/`,
        getOne:  (id) => `${API_BASE_URL}/bookings/${id}`,
        create:  () => `${API_BASE_URL}/bookings/`,
        update:  (id) => `${API_BASE_URL}/bookings/${id}`,
        delete:  (id) => `${API_BASE_URL}/bookings/${id}`
    },
    trips: {
        getAll:     (uid) => uid ? `${API_BASE_URL}/trips/?user_id=${uid}` : `${API_BASE_URL}/trips/`,
        getOne:     (id) => `${API_BASE_URL}/trips/${id}`,
        create:     () => `${API_BASE_URL}/trips/`,
        addHotel:   (tid) => `${API_BASE_URL}/trips/${tid}/hotels`,
        removeHotel:(tid,hid) => `${API_BASE_URL}/trips/${tid}/hotels/${hid}`,
        delete:     (id) => `${API_BASE_URL}/trips/${id}`
    },
    users: {
        register:      () => `${API_BASE_URL}/users/register`,
        login:         () => `${API_BASE_URL}/users/login`,
        getOne:        (id) => `${API_BASE_URL}/users/${id}`,
        getFavorites:  (id) => `${API_BASE_URL}/users/${id}/favorites`,
        addFavorite:   (id) => `${API_BASE_URL}/users/${id}/favorites`,
        removeFavorite:(id,fid) => `${API_BASE_URL}/users/${id}/favorites/${fid}`
    },
    reviews: {
        getHotelReviews:(hid) => `${API_BASE_URL}/reviews/hotel/${hid}`,
        create: () => `${API_BASE_URL}/reviews/`,
        delete: (id) => `${API_BASE_URL}/reviews/${id}`
    },
    gis: {
        popularity: () => `${API_BASE_URL}/gis/popularity`,
        crime:      () => `${API_BASE_URL}/gis/crime`,
        accidents:  () => `${API_BASE_URL}/gis/accidents`
    },
    // ── Gemini AI endpoints ──────────────────────────────────
    ai: {
        chat:      () => `${API_BASE_URL}/ai/chat`,
        recommend: () => `${API_BASE_URL}/ai/recommend`,
        plan:      () => `${API_BASE_URL}/ai/plan`,
        quickTips: (dest) => `${API_BASE_URL}/ai/quick-tips?destination=${encodeURIComponent(dest)}`
    }
};

async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

const API = {
    // Destinations
    async getAllDestinations()      { return fetchAPI(API_ENDPOINTS.destinations.getAll()); },
    async getDestinations()         { return this.getAllDestinations(); },
    async getDestination(id)        { return fetchAPI(API_ENDPOINTS.destinations.getOne(id)); },
    async getDestinationHotels(id)  { return fetchAPI(API_ENDPOINTS.destinations.getHotels(id)); },

    // Hotels
    async getAllHotels()  { return fetchAPI(API_ENDPOINTS.hotels.getAll()); },
    async getHotels()    { return this.getAllHotels(); },
    async getHotel(id)   { return fetchAPI(API_ENDPOINTS.hotels.getOne(id)); },
    async searchHotels(query, filters = {}) {
        let url = API_ENDPOINTS.hotels.search(query);
        if (filters.min_price) url += `&min_price=${filters.min_price}`;
        if (filters.max_price) url += `&max_price=${filters.max_price}`;
        if (filters.min_rating) url += `&min_rating=${filters.min_rating}`;
        return fetchAPI(url);
    },

    // Bookings
    async getAllBookings(uid=null) { return fetchAPI(API_ENDPOINTS.bookings.getAll(uid)); },
    async getBookings(uid=null)   { return this.getAllBookings(uid); },
    async getBooking(id)          { return fetchAPI(API_ENDPOINTS.bookings.getOne(id)); },
    async createBooking(d)  { return fetchAPI(API_ENDPOINTS.bookings.create(),  {method:'POST',body:JSON.stringify(d)}); },
    async updateBooking(id,d){ return fetchAPI(API_ENDPOINTS.bookings.update(id),{method:'PUT', body:JSON.stringify(d)}); },
    async deleteBooking(id)  { return fetchAPI(API_ENDPOINTS.bookings.delete(id),{method:'DELETE'}); },

    // Trips
    async getAllTrips(uid=null) { return fetchAPI(API_ENDPOINTS.trips.getAll(uid)); },
    async getTrip(id)          { return fetchAPI(API_ENDPOINTS.trips.getOne(id)); },
    async createTrip(d)        { return fetchAPI(API_ENDPOINTS.trips.create(),  {method:'POST',body:JSON.stringify(d)}); },
    async addHotelToTrip(tid,hid)    { return fetchAPI(API_ENDPOINTS.trips.addHotel(tid),   {method:'POST',  body:JSON.stringify({hotel_id:hid})}); },
    async removeHotelFromTrip(tid,hid){ return fetchAPI(API_ENDPOINTS.trips.removeHotel(tid,hid),{method:'DELETE'}); },
    async deleteTrip(id)             { return fetchAPI(API_ENDPOINTS.trips.delete(id),{method:'DELETE'}); },

    // Users
    async register(d)         { return fetchAPI(API_ENDPOINTS.users.register(),{method:'POST',body:JSON.stringify(d)}); },
    async login(d)            { return fetchAPI(API_ENDPOINTS.users.login(),   {method:'POST',body:JSON.stringify(d)}); },
    async getUser(id)         { return fetchAPI(API_ENDPOINTS.users.getOne(id)); },
    async getUserFavorites(id){ return fetchAPI(API_ENDPOINTS.users.getFavorites(id)); },
    async addFavorite(uid,d)  { return fetchAPI(API_ENDPOINTS.users.addFavorite(uid),   {method:'POST',body:JSON.stringify(d)}); },
    async removeFavorite(uid,fid){ return fetchAPI(API_ENDPOINTS.users.removeFavorite(uid,fid),{method:'DELETE'}); },

    // Reviews
    async getHotelReviews(hid){ return fetchAPI(API_ENDPOINTS.reviews.getHotelReviews(hid)); },
    async createReview(d)     { return fetchAPI(API_ENDPOINTS.reviews.create(),{method:'POST',body:JSON.stringify(d)}); },
    async deleteReview(id)    { return fetchAPI(API_ENDPOINTS.reviews.delete(id),{method:'DELETE'}); },

    // GIS
    async getPopularityLayer(){ return fetchAPI(API_ENDPOINTS.gis.popularity()); },
    async getCrimeLayer()     { return fetchAPI(API_ENDPOINTS.gis.crime()); },
    async getAccidentLayer()  { return fetchAPI(API_ENDPOINTS.gis.accidents()); },

    // ── Gemini AI ────────────────────────────────────────────
    async aiChat(message, history=[]) {
        return fetchAPI(API_ENDPOINTS.ai.chat(), {
            method: 'POST', body: JSON.stringify({ message, history })
        });
    },
    async aiRecommend(prefs) {
        return fetchAPI(API_ENDPOINTS.ai.recommend(), {
            method: 'POST', body: JSON.stringify(prefs)
        });
    },
    async aiPlan(planData) {
        return fetchAPI(API_ENDPOINTS.ai.plan(), {
            method: 'POST', body: JSON.stringify(planData)
        });
    },
    async aiQuickTips(destination) {
        return fetchAPI(API_ENDPOINTS.ai.quickTips(destination));
    }
};