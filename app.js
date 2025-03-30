import * as config from './config.js';
import { generateDummyData, getDummyUser } from './dummyData.js';
import * as L from 'leaflet'; // Import Leaflet

// --- DOM Elements ---
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const marketplaceList = document.getElementById('marketplace-list');
const timebankList = document.getElementById('timebank-list');
const suggestionList = document.getElementById('suggestion-list');
const mapElement = document.getElementById('map');
const addResourceForm = document.getElementById('add-resource-form');
const resourceTypeSelect = document.getElementById('resource-type');
const itemFields = document.getElementById('item-fields');
const serviceFields = document.getElementById('service-fields');
const timeBalanceSpan = document.getElementById('time-balance');
const profileTimeBalanceSpan = document.getElementById('profile-time-balance');
const profileUsernameSpan = document.getElementById('profile-username');
const profileLocationSpan = document.getElementById('profile-location');
const myListingsContainer = document.getElementById('my-listings');
const myTransactionsContainer = document.getElementById('my-transactions');
const marketplaceFilterButton = document.getElementById('filter-button');
const marketplaceCategoryFilter = document.getElementById('category-filter');
const marketplaceSearchInput = document.getElementById('search-input');
const timebankFilterButton = document.getElementById('service-filter-button');
const timebankCategoryFilter = document.getElementById('service-category-filter');
const timebankSearchInput = document.getElementById('service-search-input');

// --- State ---
let currentSection = 'marketplace'; // Default section
let mapInstance = null; // To hold the Leaflet map instance
let resources = []; // Holds all marketplace items
let services = []; // Holds all timebank services
let suggestions = []; // Holds donation/sharing suggestions
let user = getDummyUser(); // Get current user info
let userLocation = null; // Will be determined later

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing app...");
    setupEventListeners();
    loadInitialData();
    updateUserProfile();
    navigateToSection(currentSection); // Show the initial section
    initializeMap();
    requestLocationAndLoadSuggestions();
});

// --- Navigation ---
function navigateToSection(sectionId) {
    console.log(`Navigating to section: ${sectionId}`);
    // Hide all sections
    contentSections.forEach(section => section.classList.remove('active'));
    // Deactivate all nav links
    navLinks.forEach(link => link.classList.remove('active'));

    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        // Activate the corresponding nav link
        const targetLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
        // Refresh map if navigating to suggestions
        if (sectionId === 'suggestions' && mapInstance) {
            setTimeout(() => mapInstance.invalidateSize(), 0); // Ensure map resizes correctly
        }
    } else {
        console.error(`Section with id "${sectionId}" not found.`);
        // Fallback to default section if target not found
        navigateToSection('marketplace');
    }
}

function setupEventListeners() {
    console.log("Setting up event listeners...");
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const sectionId = link.getAttribute('data-section');
            navigateToSection(sectionId);
            // Update URL hash for basic history/bookmarking
            // window.location.hash = link.getAttribute('href');
        });
    });

    // Form type change
    resourceTypeSelect.addEventListener('change', handleResourceTypeChange);

    // Add resource form submission
    addResourceForm.addEventListener('submit', handleAddResource);

    // Marketplace filters
    marketplaceFilterButton.addEventListener('click', filterMarketplace);

    // Timebank filters
    timebankFilterButton.addEventListener('click', filterTimebank);

    // Delegate event listeners for dynamically added buttons
    document.body.addEventListener('click', (event) => {
        if (event.target.matches('.claim-button')) {
            handleClaimResource(event.target.dataset.id);
        } else if (event.target.matches('.request-service-button')) {
            handleRequestService(event.target.dataset.id);
        } else if (event.target.matches('.offer-service-button')) {
            navigateToSection('add-resource');
            resourceTypeSelect.value = 'service';
            handleResourceTypeChange(); // Update form fields visibility
        } else if (event.target.matches('.edit-profile-button')) {
            handleEditProfile(); // Placeholder for editing profile
        }
    });
}

// --- Data Loading and Rendering ---
function loadInitialData() {
    console.log("Loading initial data...");
    // Generate dummy data for now
    const dummyData = generateDummyData(config.NUM_DUMMY_ITEMS, config.NUM_DUMMY_SERVICES, config.NUM_DUMMY_SUGGESTIONS);
    resources = dummyData.resources;
    services = dummyData.services;
    suggestions = dummyData.suggestions;

    renderMarketplace(resources);
    renderTimebank(services);
    // Suggestions are loaded after location is obtained
    renderMyListings(); // Render user's own items/services
    renderMyTransactions(); // Render user's transactions
}

function renderMarketplace(itemsToRender) {
    console.log("Rendering marketplace...");
    marketplaceList.innerHTML = ''; // Clear existing content
    if (itemsToRender.length === 0) {
        marketplaceList.innerHTML = '<div class="resource-item placeholder">No resources found matching your criteria.</div>';
        return;
    }
    itemsToRender.forEach(item => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <p><strong>Category:</strong> <span class="category">${item.category}</span></p>
            <p><strong>Location:</strong> ${item.location}</p>
            <p><strong>Posted by:</strong> ${item.user} ${item.user === user.username ? '(You)' : ''}</p>
            ${item.user !== user.username ? `<button class="claim-button" data-id="${item.id}">Claim</button>` : '<p><em>This is your listing.</em></p>'}
        `;
        marketplaceList.appendChild(div);
    });
}

function renderTimebank(servicesToRender) {
    console.log("Rendering timebank...");
    timebankList.innerHTML = ''; // Clear existing content
    if (servicesToRender.length === 0) {
        timebankList.innerHTML = '<div class="resource-item placeholder">No services found matching your criteria.</div>';
        return;
    }
    servicesToRender.forEach(service => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `
            <h3>${service.title}</h3>
            <p>${service.description}</p>
            <p><strong>Category:</strong> <span class="category">${service.category}</span></p>
            <p><strong>Estimated Time:</strong> ${service.hours} hour(s)</p>
            <p><strong>Location:</strong> ${service.location}</p>
            <p><strong>Offered by:</strong> ${service.user} ${service.user === user.username ? '(You)' : ''}</p>
            ${service.user !== user.username ? `<button class="request-service-button" data-id="${service.id}">Request Service (${service.hours}h)</button>` : '<p><em>This is your listing.</em></p>'}
        `;
        timebankList.appendChild(div);
    });
    updateTimeBalanceDisplay(); // Update balance display whenever timebank renders
}

function renderSuggestions(suggestionsToRender) {
    console.log("Rendering suggestions...");
    suggestionList.innerHTML = ''; // Clear existing content
    if (!suggestionsToRender || suggestionsToRender.length === 0) {
        suggestionList.innerHTML = '<div class="suggestion-item placeholder">Could not find nearby suggestions. Ensure location services are enabled.</div>';
        return;
    }
    // Clear previous markers
    if (mapInstance) {
        mapInstance.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                mapInstance.removeLayer(layer);
            }
        });
        // Keep the base tile layer
        mapInstance.eachLayer(layer => {
            if (!(layer instanceof L.TileLayer)) {
                if (layer.options && layer.options.pane === 'markerPane') { // Check if it's a marker
                    mapInstance.removeLayer(layer);
                }
            }
        });
    }

    suggestionsToRender.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
            <h3>${suggestion.name}</h3>
            <p>${suggestion.description}</p>
            <p><strong>Type:</strong> <span class="type">${suggestion.type}</span></p>
            <p><strong>Address:</strong> ${suggestion.address}</p>
            ${suggestion.distance ? `<p><strong>Distance:</strong> ${suggestion.distance.toFixed(1)} km</p>` : ''}
        `;
        suggestionList.appendChild(div);

        // Add marker to map
        if (mapInstance && suggestion.lat && suggestion.lng) {
            const marker = L.marker([suggestion.lat, suggestion.lng]).addTo(mapInstance);
            marker.bindPopup(`<b>${suggestion.name}</b><br>${suggestion.type}<br>${suggestion.address}`);
        }
    });

    // Add user location marker if available
    if (mapInstance && userLocation) {
        L.marker(userLocation, { icon: createUserIcon() })
            .addTo(mapInstance)
            .bindPopup("Your approximate location")
            .openPopup();
        mapInstance.setView(userLocation, config.MAP_INITIAL_ZOOM); // Center map on user
    } else if (mapInstance && suggestionsToRender.length > 0) {
        // If no user location, center on the first suggestion
        mapInstance.setView([suggestionsToRender[0].lat, suggestionsToRender[0].lng], config.MAP_INITIAL_ZOOM - 2);
    }
}

function createUserIcon() {
    // Simple blue circle marker for user location
    return L.divIcon({
        html: '<svg viewbox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#3498db" stroke="white" stroke-width="5"/></svg>',
        className: 'user-location-icon',
        iconSize: [20, 20],
        popupAnchor: [0, -10]
    });
}

function renderMyListings() {
    console.log("Rendering user's listings...");
    myListingsContainer.innerHTML = '';
    const userItems = resources.filter(item => item.user === user.username);
    const userServices = services.filter(service => service.user === user.username);

    if (userItems.length === 0 && userServices.length === 0) {
        myListingsContainer.innerHTML = '<div class="resource-item placeholder">You have not added any resources or services yet.</div>';
        return;
    }

    userItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `
            <h3>${item.title} (Item)</h3>
            <p>${item.description}</p>
            <p><strong>Category:</strong> <span class="category">${item.category}</span></p>
            <button class="edit-listing-button" data-id="${item.id}" data-type="item">Edit</button>
            <button class="delete-listing-button" data-id="${item.id}" data-type="item">Delete</button>
        `;
        myListingsContainer.appendChild(div);
    });

    userServices.forEach(service => {
        const div = document.createElement('div');
        div.className = 'resource-item';
        div.innerHTML = `
            <h3>${service.title} (Service)</h3>
            <p>${service.description}</p>
            <p><strong>Category:</strong> <span class="category">${service.category}</span></p>
            <p><strong>Hours:</strong> ${service.hours}</p>
            <button class="edit-listing-button" data-id="${service.id}" data-type="service">Edit</button>
            <button class="delete-listing-button" data-id="${service.id}" data-type="service">Delete</button>
        `;
        myListingsContainer.appendChild(div);
    });

    // Add event listeners for edit/delete buttons if needed in future
}

function renderMyTransactions() {
    console.log("Rendering user's transactions...");
    myTransactionsContainer.innerHTML = '';
    // Dummy transaction data for now
    const transactions = [
        { id: 't1', type: 'received', description: 'Tutoring help from UserX', hours: 2, date: '2024-07-20' },
        { id: 't2', type: 'provided', description: 'Gardening for UserY', hours: 3, date: '2024-07-18' },
        { id: 't3', type: 'claimed', description: 'Claimed "Used Books" from UserZ', date: '2024-07-15' },
    ];

    if (transactions.length === 0) {
        myTransactionsContainer.innerHTML = '<div class="transaction-item placeholder">No transactions recorded yet.</div>';
        return;
    }

    transactions.forEach(tx => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        let details = '';
        if (tx.type === 'received' || tx.type === 'provided') {
            details = `<strong>${tx.type === 'received' ? 'Received' : 'Provided'} Service:</strong> ${tx.description} (${tx.hours} hours)`;
        } else if (tx.type === 'claimed') {
            details = `<strong>Claimed Item:</strong> ${tx.description}`;
        }
        div.innerHTML = `
            <p>${details}</p>
            <p><em>Date: ${tx.date}</em></p>
        `;
        myTransactionsContainer.appendChild(div);
    });
}

// --- User Profile ---
function updateUserProfile() {
    profileUsernameSpan.textContent = user.username;
    profileLocationSpan.textContent = user.location;
    updateTimeBalanceDisplay(); // Ensure balance is consistent
}

function updateTimeBalanceDisplay() {
    timeBalanceSpan.textContent = user.timeBalance;
    profileTimeBalanceSpan.textContent = user.timeBalance;
}

function handleEditProfile() {
    alert("Profile editing functionality not yet implemented.");
    // Future: Open a modal or navigate to an edit page
}

// --- Map and Location ---
function initializeMap() {
    console.log("Initializing map...");
    if (!mapElement) {
        console.error("Map element not found.");
        return;
    }
    try {
        mapInstance = L.map(mapElement).setView(config.MAP_DEFAULT_CENTER, config.MAP_DEFAULT_ZOOM);
        L.tileLayer(config.MAP_TILE_LAYER_URL, {
            maxZoom: 19,
            attribution: config.MAP_ATTRIBUTION
        }).addTo(mapInstance);
        console.log("Map initialized successfully.");
    } catch (error) {
        console.error("Error initializing Leaflet map:", error);
        mapElement.innerHTML = "<p>Error loading map. Please try refreshing the page.</p>";
    }
}

function requestLocationAndLoadSuggestions() {
    console.log("Requesting user location...");
    if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser.");
        alert("Geolocation is not supported by your browser. Suggestions will be based on default location.");
        renderSuggestions(suggestions); // Render suggestions without user location context
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            console.log("Location obtained:", userLocation);
            // Calculate distances (simple Euclidean for now, ideally Haversine)
            suggestions.forEach(s => {
                if (s.lat && s.lng) {
                    s.distance = calculateDistance(userLocation[0], userLocation[1], s.lat, s.lng);
                }
            });
            // Sort suggestions by distance
            suggestions.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
            renderSuggestions(suggestions);
        },
        (error) => {
            console.warn(`Error getting location: ${error.message}`);
            alert(`Could not get your location: ${error.message}. Showing default suggestions.`);
            renderSuggestions(suggestions); // Render default suggestions if location fails
            if (mapInstance) mapInstance.setView(config.MAP_DEFAULT_CENTER, config.MAP_DEFAULT_ZOOM); // Reset map view
        }
    );
}

// Simple distance calculation (approximation, not accurate for large distances)
// Replace with Haversine formula for better accuracy if needed
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// --- Resource/Service Handling ---
function handleResourceTypeChange() {
    const selectedType = resourceTypeSelect.value;
    if (selectedType === 'item') {
        itemFields.style.display = 'block';
        serviceFields.style.display = 'none';
        // Make item category required, service fields not required
        document.getElementById('item-category').required = true;
        document.getElementById('service-category').required = false;
        document.getElementById('service-hours').required = false;
    } else { // service
        itemFields.style.display = 'none';
        serviceFields.style.display = 'block';
        // Make service fields required, item category not required
        document.getElementById('item-category').required = false;
        document.getElementById('service-category').required = true;
        document.getElementById('service-hours').required = true;
    }
}

function handleAddResource(event) {
    event.preventDefault();
    console.log("Adding new resource/service...");
    const formData = new FormData(addResourceForm);
    const type = formData.get('type');
    const newItem = {
        id: `new-${Date.now()}`, // Temporary ID
        title: formData.get('title'),
        description: formData.get('description'),
        location: formData.get('location') || 'Unspecified',
        user: user.username, // Assume current user adds it
    };

    if (type === 'item') {
        newItem.category = formData.get('item_category');
        resources.push(newItem);
        console.log("New Item Added:", newItem);
        renderMarketplace(resources); // Re-render marketplace
        filterMarketplace(); // Apply current filters
        alert(`Item "${newItem.title}" added successfully!`);
    } else { // service
        newItem.category = formData.get('service_category');
        newItem.hours = parseInt(formData.get('hours'), 10);
        if (isNaN(newItem.hours) || newItem.hours <= 0) {
            alert("Please enter a valid number of hours for the service.");
            return;
        }
        services.push(newItem);
        console.log("New Service Added:", newItem);
        renderTimebank(services); // Re-render timebank
        filterTimebank(); // Apply current filters
        alert(`Service "${newItem.title}" added successfully!`);
    }

    addResourceForm.reset(); // Clear the form
    handleResourceTypeChange(); // Reset form field visibility
    renderMyListings(); // Update profile listings
    navigateToSection(type === 'item' ? 'marketplace' : 'timebank'); // Navigate to the relevant section
}

function handleClaimResource(itemId) {
    // Find the item
    const itemIndex = resources.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const item = resources[itemIndex];
        if (item.user === user.username) {
            alert("You cannot claim your own item.");
            return;
        }
        // Basic confirmation
        const confirmation = confirm(`Are you sure you want to claim "${item.title}"?`);
        if (confirmation) {
            console.log(`Claiming item ${itemId}: ${item.title}`);
            alert(`You claimed "${item.title}"! (Functionality placeholder)`);
            // In a real app: Update database, notify owner, remove/mark item as claimed
            resources.splice(itemIndex, 1); // Remove item from list (temporary)
            filterMarketplace(); // Re-render marketplace with current filters
            // Add to user's transaction history (placeholder)
            renderMyTransactions(); // Re-render transactions (would fetch updated data in real app)
        }

    } else {
        console.error(`Item with ID ${itemId} not found for claiming.`);
        alert("Could not find the item to claim.");
    }
}

function handleRequestService(serviceId) {
    // Find the service
    const serviceIndex = services.findIndex(service => service.id === serviceId);
    if (serviceIndex > -1) {
        const service = services[serviceIndex];
        if (service.user === user.username) {
            alert("You cannot request your own service.");
            return;
        }

        // Check if user has enough time balance
        if (user.timeBalance < service.hours) {
            alert(`You do not have enough time credits (${user.timeBalance}h) to request this service (${service.hours}h).`);
            return;
        }

        // Basic confirmation
        const confirmation = confirm(`Request "${service.title}" for ${service.hours} hours? This will deduct ${service.hours} hours from your balance.`);
        if (confirmation) {
            console.log(`Requesting service ${serviceId}: ${service.title}`);

            // Simulate transaction
            user.timeBalance -= service.hours; // Deduct hours from requester
            // Ideally, credit the provider, handle pending state etc.
            console.log(`User time balance updated: ${user.timeBalance}`);

            alert(`Service "${service.title}" requested! ${service.hours} hours deducted. (Functionality placeholder)`);
            // In a real app: Create transaction record, notify provider, update balances in DB

            // Temporary: remove service from list for demo purposes
            // services.splice(serviceIndex, 1);
            // filterTimebank(); // Re-render timebank

            updateTimeBalanceDisplay(); // Update displayed balance
            renderMyTransactions(); // Update transaction history
        }

    } else {
        console.error(`Service with ID ${serviceId} not found for requesting.`);
        alert("Could not find the service to request.");
    }
}

// --- Filtering ---
function filterMarketplace() {
    const category = marketplaceCategoryFilter.value;
    const searchTerm = marketplaceSearchInput.value.toLowerCase();

    const filteredResources = resources.filter(item => {
        const categoryMatch = category === 'all' || item.category === category;
        const searchMatch = !searchTerm ||
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.user.toLowerCase().includes(searchTerm);
        return categoryMatch && searchMatch;
    });

    renderMarketplace(filteredResources);
}

function filterTimebank() {
    const category = timebankCategoryFilter.value;
    const searchTerm = timebankSearchInput.value.toLowerCase();

    const filteredServices = services.filter(service => {
        const categoryMatch = category === 'all' || service.category === category;
        const searchMatch = !searchTerm ||
            service.title.toLowerCase().includes(searchTerm) ||
            service.description.toLowerCase().includes(searchTerm) ||
            service.user.toLowerCase().includes(searchTerm);
        return categoryMatch && searchMatch;
    });

    renderTimebank(filteredServices);
}