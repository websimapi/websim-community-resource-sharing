// Configuration settings for the Community Resource Share app

export const NUM_DUMMY_ITEMS = 15; // Number of dummy marketplace items to generate
export const NUM_DUMMY_SERVICES = 10; // Number of dummy timebank services
export const NUM_DUMMY_SUGGESTIONS = 8; // Number of dummy suggestions

// Map Configuration
export const MAP_INITIAL_ZOOM = 13; // Initial zoom level for the map
export const MAP_DEFAULT_CENTER = [40.7128, -74.0060]; // Default center (New York City) if location fails
export const MAP_TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // URL for map tiles
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'; // Map attribution text

// User settings (could be fetched from backend in a real app)
export const DEFAULT_USERNAME = "User123";
export const DEFAULT_LOCATION = "Cityville";
export const INITIAL_TIME_BALANCE = 5; // Starting time balance for new users (or dummy user)

// API endpoints (placeholders for future backend integration)
export const API_BASE_URL = '/api/v1';
export const RESOURCES_ENDPOINT = `${API_BASE_URL}/resources`;
export const SERVICES_ENDPOINT = `${API_BASE_URL}/services`;
export const SUGGESTIONS_ENDPOINT = `${API_BASE_URL}/suggestions`;
export const USER_ENDPOINT = `${API_BASE_URL}/user`;

