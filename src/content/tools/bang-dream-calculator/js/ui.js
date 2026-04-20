/**
 * UI Manager Module
 * Handles all DOM manipulation and UI updates for the calculator
 * @module ui
 */

import { DATA_INDEX } from './api.js';
import { formatNumber } from './utils.js';

// Event type display names
const EVENT_TYPE_NAMES = {
    story: 'Story Event',
    versus: 'VS Live',
    challenge: 'Challenge Live',
    mission_live: 'Mission Live',
    live_try: 'Live Try',
    live_goals: 'Live Goals',
    festival: 'Festival'
};

// Attribute display names
const ATTRIBUTE_NAMES = {
    powerful: 'Powerful',
    cool: 'Cool',
    pure: 'Pure',
    happy: 'Happy'
};

// Default values
const DEFAULT_BONUS_PERCENT = 20;
const DEFAULT_ATTRIBUTE_PERCENT = 10;
const DEFAULT_CHARACTER_COLOR = '#888';
const COUNTDOWN_UPDATE_INTERVAL = 1000; // 1 second

/**
 * UI Manager for displaying event data and calculation results
 * Manages DOM updates, event banners, countdowns, and result displays
 */
class UIManager {
    constructor() {
        /** @type {number|null} Interval ID for countdown timer */
        this.countdownInterval = null;

        /** @type {Object|null} Cached characters data */
        this.charactersCache = null;

        /** @type {Object|null} Cached cards data */
        this.cardsCache = null;
    }

    /**
     * Sets cached character and card data for later use
     * @param {Object} characters - Character data from API
     * @param {Object} cards - Card data from API
     */
    setCaches(characters, cards) {
        this.charactersCache = characters;
        this.cardsCache = cards;
    }

    /**
     * Displays the event banner with all event information
     * @param {Object} eventData - Event data from API
     * @param {number} eventId - Event ID
     */
    displayEventBanner(eventData, eventId) {
        if (!eventData?.eventName?.[DATA_INDEX]) {
            this.showError('Invalid event data');
            return;
        }

        const name = eventData.eventName[DATA_INDEX];

        const banner = document.getElementById('eventBanner');
        const nameElement = document.getElementById('eventName');

        if (!banner || !nameElement) {
            console.error('[UI] Required DOM elements not found');
            return;
        }

        banner.classList.remove('hidden');
        nameElement.textContent = name;

        // Display all event information components
        this.displayDates(eventData);
        this.displayType(eventData.eventType);
        this.displayAttribute(eventData.attributes);
        this.displayCharacters(eventData.characters, eventData.eventAttributeAndCharacterBonus);
        this.setupCountdown(eventData);
    }

    /**
     * Displays event date range
     * @param {Object} event - Event data object
     * @private
     */
    displayDates(event) {
        if (!event?.startAt?.[DATA_INDEX] || !event?.endAt?.[DATA_INDEX]) {
            return;
        }

        const start = parseInt(event.startAt[DATA_INDEX], 10);
        const end = parseInt(event.endAt[DATA_INDEX], 10);

        if (!start || !end || Number.isNaN(start) || Number.isNaN(end)) {
            return;
        }

        const startDate = dayjs(start).format('MMM D, YYYY');
        const endDate = dayjs(end).format('MMM D, YYYY');

        const datesElement = document.getElementById('eventDates');
        if (datesElement) {
            datesElement.textContent = `${startDate} - ${endDate}`;
        }
    }

    /**
     * Displays event type with human-readable name
     * @param {string} type - Event type identifier
     * @private
     */
    displayType(type) {
        if (!type) return;

        const displayName = EVENT_TYPE_NAMES[type] || type;

        const typeElement = document.getElementById('eventType');
        if (typeElement) {
            typeElement.textContent = displayName;
        }
    }

    /**
     * Displays event attribute bonus if available
     * @param {Array} attributes - Array of attribute bonus objects
     * @private
     */
    displayAttribute(attributes) {
        const attributeSection = document.getElementById('eventAttribute');
        const attributeText = document.getElementById('attributeText');

        if (!attributeSection || !attributeText) return;

        // Hide if no valid attributes
        if (!attributes || !Array.isArray(attributes) || !attributes[0]?.attribute) {
            attributeSection.classList.add('hidden');
            return;
        }

        const attrData = attributes[0];
        const displayName = ATTRIBUTE_NAMES[attrData.attribute] || attrData.attribute;
        const percent = attrData.percent || DEFAULT_ATTRIBUTE_PERCENT;

        attributeText.textContent = `${displayName} +${percent}%`;
        attributeSection.classList.remove('hidden');
    }

    /**
     * Displays featured character badges
     * @param {Array} characters - Array of character IDs or character data objects
     * @param {number} bonusPercent - Bonus percentage for featured characters
     * @private
     */
    displayCharacters(characters, bonusPercent) {
        const container = document.getElementById('charactersList');
        const section = document.getElementById('featuredCharacters');

        if (!container || !section) return;

        // Hide section if no valid data
        if (!characters || !Array.isArray(characters) || characters.length === 0 || !this.charactersCache) {
            section.classList.add('hidden');
            return;
        }

        // Clear previous content
        container.innerHTML = '';

        // Extract numeric bonus percentage
        const bonus = typeof bonusPercent === 'number' ? bonusPercent : DEFAULT_BONUS_PERCENT;

        // Create badge for each character
        characters.forEach((charData) => {
            const charId = charData.characterId || charData;
            const character = this.charactersCache[charId];

            if (!character?.nickname?.[DATA_INDEX]) return;

            const stageName = character.nickname[DATA_INDEX];
            const color = character.colorCode || DEFAULT_CHARACTER_COLOR;

            if (typeof stageName === 'string' && stageName.trim()) {
                const badge = this.createCharacterBadge(stageName, color, bonus);
                container.appendChild(badge);
            }
        });

        // Show section only if we added badges
        if (container.children.length > 0) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    }

    /**
     * Creates a character badge DOM element
     * @param {string} name - Character stage name
     * @param {string} color - Character color code
     * @param {number} bonus - Bonus percentage
     * @returns {HTMLElement} The badge element
     * @private
     */
    createCharacterBadge(name, color, bonus) {
        const badge = document.createElement('span');
        badge.className = 'inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium text-white';

        const dot = document.createElement('span');
        dot.className = 'w-2 h-2 rounded-full';
        dot.style.backgroundColor = color;

        const nameText = document.createTextNode(name);

        const bonusSpan = document.createElement('span');
        bonusSpan.className = 'text-xs opacity-75';
        bonusSpan.textContent = `+${bonus}%`;

        badge.appendChild(dot);
        badge.appendChild(nameText);
        badge.appendChild(document.createTextNode(' '));
        badge.appendChild(bonusSpan);

        return badge;
    }

    /**
     * Sets up and starts the countdown timer
     * @param {Object} event - Event data with start and end times
     * @private
     */
    setupCountdown(event) {
        // Clear any existing countdown to prevent memory leaks
        this.clearCountdown();

        if (!event?.startAt?.[DATA_INDEX] || !event?.endAt?.[DATA_INDEX]) {
            return;
        }

        const start = parseInt(event.startAt[DATA_INDEX], 10);
        const end = parseInt(event.endAt[DATA_INDEX], 10);

        if (!start || !end || Number.isNaN(start) || Number.isNaN(end)) {
            return;
        }

        const updateCountdown = () => {
            const countdownText = document.getElementById('countdownText');
            const countdownElement = document.getElementById('eventCountdown');

            if (!countdownText || !countdownElement) {
                this.clearCountdown();
                return;
            }

            const now = dayjs();
            const startTime = dayjs(start);
            const endTime = dayjs(end);

            let text;

            if (now.isBefore(startTime)) {
                // Event hasn't started yet
                const duration = dayjs.duration(startTime.diff(now));
                text = `Starts in ${this.formatDuration(duration)}`;
            } else if (now.isBefore(endTime)) {
                // Event is ongoing
                const duration = dayjs.duration(endTime.diff(now));
                text = `Ends in ${this.formatDuration(duration)}`;
            } else {
                // Event has ended
                const days = Math.floor(dayjs.duration(now.diff(endTime)).asDays());
                text = `Ended ${days} day${days !== 1 ? 's' : ''} ago`;
            }

            countdownText.textContent = text;
            countdownElement.classList.remove('hidden');
        };

        // Update immediately and then every second
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, COUNTDOWN_UPDATE_INTERVAL);
    }

    /**
     * Formats a duration object into a human-readable string
     * @param {Object} duration - Day.js duration object
     * @returns {string} Formatted duration string
     * @private
     */
    formatDuration(duration) {
        const days = Math.floor(duration.asDays());
        const hours = duration.hours();
        const minutes = duration.minutes();
        const seconds = duration.seconds();

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }

    /**
     * Clears the countdown interval to prevent memory leaks
     */
    clearCountdown() {
        if (this.countdownInterval !== null) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    /**
     * Displays an error message in the event banner
     * @param {string} message - Error message to display (currently unused but kept for extensibility)
     */
    showError(message) {
        const eventName = document.getElementById('eventName');
        const eventError = document.getElementById('eventError');
        const eventBanner = document.getElementById('eventBanner');

        if (eventName) eventName.textContent = 'Event Information';
        if (eventError) eventError.classList.remove('hidden');
        if (eventBanner) eventBanner.classList.remove('hidden');
    }

    /**
     * Displays calculation results in the results panel
     * @param {Object} results - Calculation results
     * @param {number} results.finalScore - Final event score
     * @param {number} results.multiLives - Number of multi lives
     * @param {number} results.challengeLives - Number of challenge lives
     * @param {number} results.boostsUsed - Number of boosts used
     * @param {number} results.remainingBadges - Remaining challenge points
     */
    displayResults(results) {
        if (!results) {
            console.error('[UI] Cannot display results: invalid data');
            return;
        }

        // Update all result fields
        const elements = {
            finalScore: document.getElementById('finalScore'),
            multiLives: document.getElementById('multiLives'),
            challengeLives: document.getElementById('challengeLives'),
            boostsUsed: document.getElementById('boostsUsed'),
            remainingBadges: document.getElementById('remainingBadges'),
            resultsSection: document.getElementById('results')
        };

        // Verify all elements exist
        if (Object.values(elements).some(el => !el)) {
            console.error('[UI] Required result elements not found');
            return;
        }

        // Update text content
        elements.finalScore.textContent = formatNumber(results.finalScore);
        elements.multiLives.textContent = results.multiLives;
        elements.challengeLives.textContent = results.challengeLives;
        elements.boostsUsed.textContent = results.boostsUsed;
        elements.remainingBadges.textContent = formatNumber(results.remainingBadges);

        // Show results section and scroll to it
        elements.resultsSection.classList.remove('hidden');
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Cleanup method to be called when the UI manager is no longer needed
     * Prevents memory leaks by clearing intervals
     */
    cleanup() {
        this.clearCountdown();
        this.charactersCache = null;
        this.cardsCache = null;
    }
}

// Export singleton instance
export default new UIManager();
