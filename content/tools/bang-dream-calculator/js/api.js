/**
 * Bestdori API Client
 * Handles all interactions with the Bestdori API including caching and data fetching
 * @module api
 */

// API Configuration Constants
const API_BASE = 'https://bestdori.com/api';
const CORS_PROXY = 'https://corsproxy.io/?';
const API_SERVER = 3; // JP server
const DATA_INDEX = 1; // Index for localized data in API responses
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const EVENT_ID_THRESHOLD = 1000; // Filter out special events with ID >= 1000

// Cache key prefixes for localStorage
const CACHE_KEYS = {
    EVENTS: 'bandori_events',
    CHARACTERS: 'bandori_characters',
    CARDS: 'bandori_cards'
};

/**
 * Bestdori API client for fetching and caching BanG Dream! game data
 * Implements a two-tier caching strategy: memory cache and localStorage
 */
class BestdoriAPI {
    constructor() {
        /** @type {Object.<string, any>} In-memory cache for API responses */
        this.cache = {};
    }

    /**
     * Constructs the full API URL with CORS proxy
     * @param {string} endpoint - The API endpoint path
     * @returns {string} The complete URL with CORS proxy
     * @private
     */
    buildUrl(endpoint) {
        return `${CORS_PROXY}${API_BASE}${endpoint}`;
    }

    /**
     * Retrieves cached data from localStorage if not expired
     * @param {string} key - The cache key
     * @returns {Object|null} The cached data or null if expired/missing
     * @private
     */
    getCachedData(key) {
        try {
            const cacheTime = localStorage.getItem(`${key}_time`);
            if (!cacheTime) return null;

            const now = Date.now();
            const age = now - parseInt(cacheTime, 10);

            if (age < CACHE_DURATION) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
        } catch (error) {
            console.warn(`[API] Failed to read cache for ${key}:`, error.message);
        }

        return null;
    }

    /**
     * Stores data in localStorage with timestamp
     * @param {string} key - The cache key
     * @param {any} data - The data to cache
     * @private
     */
    setCachedData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(`${key}_time`, Date.now().toString());
        } catch (error) {
            // Handle QuotaExceededError or other storage errors gracefully
            console.warn(`[API] Cache storage failed for ${key}:`, error.message);
        }
    }

    /**
     * Fetches all events from the API with caching
     * @returns {Promise<Object>} Map of event IDs to event objects
     * @throws {Error} If the API request fails
     */
    async fetchEvents() {
        // Check memory cache first
        if (this.cache.events) return this.cache.events;

        // Check localStorage cache
        const cached = this.getCachedData(CACHE_KEYS.EVENTS);
        if (cached) {
            this.cache.events = cached;
            return cached;
        }

        // Fetch from API
        try {
            const response = await axios.get(this.buildUrl(`/events/all.${API_SERVER}.json`));
            this.cache.events = response.data;
            this.setCachedData(CACHE_KEYS.EVENTS, response.data);
            return response.data;
        } catch (error) {
            console.error('[API] Failed to fetch events:', error.message);
            throw new Error('Failed to load event data from server');
        }
    }

    /**
     * Fetches detailed information for a specific event
     * @param {number} eventId - The event ID to fetch
     * @returns {Promise<Object>} The event details object
     * @throws {Error} If the API request fails
     */
    async fetchEventDetails(eventId) {
        try {
            const response = await axios.get(this.buildUrl(`/events/${eventId}.json`));
            return response.data;
        } catch (error) {
            console.error(`[API] Failed to fetch event ${eventId}:`, error.message);
            throw new Error(`Failed to load details for event ${eventId}`);
        }
    }

    /**
     * Fetches all characters from the API with caching
     * @returns {Promise<Object>} Map of character IDs to character objects
     * @throws {Error} If the API request fails
     */
    async fetchCharacters() {
        if (this.cache.characters) return this.cache.characters;

        const cached = this.getCachedData(CACHE_KEYS.CHARACTERS);
        if (cached) {
            this.cache.characters = cached;
            return cached;
        }

        try {
            const response = await axios.get(this.buildUrl('/characters/all.5.json'));
            this.cache.characters = response.data;
            this.setCachedData(CACHE_KEYS.CHARACTERS, response.data);
            return response.data;
        } catch (error) {
            console.error('[API] Failed to fetch characters:', error.message);
            throw new Error('Failed to load character data from server');
        }
    }

    /**
     * Fetches all cards from the API with caching
     * @returns {Promise<Object>} Map of card IDs to card objects
     * @throws {Error} If the API request fails
     */
    async fetchCards() {
        if (this.cache.cards) return this.cache.cards;

        const cached = this.getCachedData(CACHE_KEYS.CARDS);
        if (cached) {
            this.cache.cards = cached;
            return cached;
        }

        try {
            const response = await axios.get(this.buildUrl(`/cards/all.${API_SERVER}.json`));
            this.cache.cards = response.data;
            this.setCachedData(CACHE_KEYS.CARDS, response.data);
            return response.data;
        } catch (error) {
            console.error('[API] Failed to fetch cards:', error.message);
            throw new Error('Failed to load card data from server');
        }
    }

    /**
     * Fetches all necessary data in parallel
     * @returns {Promise<{events: Object, characters: Object, cards: Object}>} All game data
     * @throws {Error} If any API request fails
     */
    async fetchAllData() {
        try {
            const [events, characters, cards] = await Promise.all([
                this.fetchEvents(),
                this.fetchCharacters(),
                this.fetchCards()
            ]);

            return { events, characters, cards };
        } catch (error) {
            console.error('[API] Failed to fetch all data:', error.message);
            throw error; // Re-throw to let caller handle
        }
    }

    /**
     * Finds the most recent active or upcoming event
     * Filters out special events (ID >= 1000) and looks for valid date ranges
     * @param {Object} events - Map of event IDs to event objects
     * @returns {{eventId: number, event: Object}|null} The current/latest event or null
     */
    findCurrentEvent(events) {
        if (!events || typeof events !== 'object') return null;

        // Get valid event IDs, sorted descending (most recent first)
        const eventIds = Object.keys(events)
            .map(Number)
            .filter(id => id < EVENT_ID_THRESHOLD)
            .sort((a, b) => b - a);

        // Find first event with valid date range
        for (const id of eventIds) {
            const event = events[id];

            if (!event?.startAt?.[DATA_INDEX] || !event?.endAt?.[DATA_INDEX]) {
                continue;
            }

            const start = parseInt(event.startAt[DATA_INDEX], 10);
            const end = parseInt(event.endAt[DATA_INDEX], 10);

            // Validate timestamps are valid numbers
            if (start && end && !Number.isNaN(start) && !Number.isNaN(end)) {
                return { eventId: id, event };
            }
        }

        return null;
    }

    /**
     * Clears all cached data from localStorage
     * Useful for forcing a refresh of all data
     */
    clearCache() {
        try {
            Object.values(CACHE_KEYS).forEach(key => {
                localStorage.removeItem(key);
                localStorage.removeItem(`${key}_time`);
            });
            this.cache = {};
            console.log('[API] Cache cleared successfully');
        } catch (error) {
            console.warn('[API] Failed to clear cache:', error.message);
        }
    }
}

// Export singleton instance
export default new BestdoriAPI();

// Export constants for use in other modules
export { DATA_INDEX, API_SERVER };
