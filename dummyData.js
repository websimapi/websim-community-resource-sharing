// Generates dummy data for testing purposes
import * as config from './config.js';

const dummyItemTitles = [
    "Slightly Used Textbooks", "Garden Tools Set", "Baby Clothes (0-6mo)", "Board Games Collection",
    "Kitchen Utensils", "Office Chair", "Unused Craft Supplies", "Winter Jacket (Medium)",
    "Bike Pump", "Old Monitor (Working)", "Non-perishable Food Items", "Camping Tent (2-person)",
    "Fiction Books Bundle", "Plant Pots", "Workout Dumbbells (5kg)"
];

const dummyServiceTitles = [
    "Basic Tutoring (Math/English)", "Gardening Help (Weeding/Planting)", "Minor Home Repairs",
    "Computer Troubleshooting", "Language Practice (Spanish)", "Dog Walking", "Grocery Shopping Assistance",
    "Resume Review", "Bike Maintenance Basics", "Plant Sitting"
];

const dummyItemCategories = ["food", "clothing", "tools", "electronics", "books", "household", "other"];
const dummyServiceCategories = ["tutoring", "gardening", "repair", "tech", "language", "pets", "other"];
const dummyLocations = ["Downtown", "North Side", "West End", "Near University", "Suburban Area", "Park District"];
const dummyUsers = ["Alice", "Bob", "Charlie", "Diana", "Eve", config.DEFAULT_USERNAME]; // Include current user

const dummySuggestions = [
    { name: "Community Food Bank", type: "Donation Center (Food)", address: "123 Charity St", lat: 40.715, lng: -74.002 },
    { name: "Goodwill Store", type: "Donation Center (Clothing, Goods)", address: "456 Second Ave", lat: 40.710, lng: -74.008 },
    { name: "Tool Lending Library", type: "Resource Sharing", address: "789 Fixit Rd", lat: 40.720, lng: -74.010 },
    { name: "Local Library Book Drop", type: "Donation (Books)", address: "101 Reading Ln", lat: 40.708, lng: -74.000 },
    { name: "Repair Cafe Event", type: "Community Service", address: "Community Center, Main St", lat: 40.718, lng: -73.998 },
    { name: "Clothing Drive Bin", type: "Donation Point (Clothing)", address: "Supermarket Parking Lot", lat: 40.705, lng: -74.012 },
    { name: "Timebank Meetup", type: "Community Service", address: "Coffee Shop Corner", lat: 40.712, lng: -74.005 },
    { name: "Electronics Recycling Point", type: "Recycling Center", address: "City Hall Annex", lat: 40.725, lng: -74.003 },
];


function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateDummyData(numItems, numServices, numSuggestions) {
    const resources = [];
    const services = [];
    const suggestions = [];

    // Generate Marketplace Items
    for (let i = 0; i < numItems; i++) {
        resources.push({
            id: `item-${i}`,
            title: getRandomElement(dummyItemTitles) + ` #${i+1}`,
            description: `Dummy description for item ${i}. Lorem ipsum dolor sit amet.`,
            category: getRandomElement(dummyItemCategories),
            location: getRandomElement(dummyLocations),
            user: getRandomElement(dummyUsers),
        });
    }

    // Generate Timebank Services
    for (let i = 0; i < numServices; i++) {
        services.push({
            id: `service-${i}`,
            title: getRandomElement(dummyServiceTitles),
            description: `Offering help with service ${i}. Consectetur adipiscing elit.`,
            category: getRandomElement(dummyServiceCategories),
            hours: getRandomInt(1, 5),
            location: getRandomElement(dummyLocations),
            user: getRandomElement(dummyUsers),
        });
    }

     // Get Suggestions (limited by config, using predefined list)
     // Shuffle and take a subset
     const shuffledSuggestions = dummySuggestions.sort(() => 0.5 - Math.random());
     for (let i = 0; i < Math.min(numSuggestions, dummySuggestions.length); i++) {
         // Add a bit more randomness or detail if needed
         suggestions.push({ ...shuffledSuggestions[i], id: `sugg-${i}` });
     }


    return { resources, services, suggestions };
}

export function getDummyUser() {
    // Provides basic info for the current 'logged-in' user
    return {
        username: config.DEFAULT_USERNAME,
        location: config.DEFAULT_LOCATION,
        timeBalance: config.INITIAL_TIME_BALANCE,
        // Add other user-specific details as needed
    };
}

