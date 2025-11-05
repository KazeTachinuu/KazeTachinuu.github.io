/**
 * Main Application Module
 * Orchestrates the BanG Dream! Event Calculator application
 * @module app
 */

import api from './api.js';
import calculator, { parseNumber, formatNumber } from './calculator.js';
import ui from './ui.js';

// Theme constants
const THEME_KEY = 'theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';
const MOBILE_BREAKPOINT = 1024; // Pixels - matches Tailwind's lg breakpoint

/**
 * Main application class for the BanG Dream! Event Calculator
 * Manages initialization, event handling, and coordination between modules
 */
class BandoriCalculatorApp {
    constructor() {
        /** @type {boolean} Tracks if app has been initialized */
        this.initialized = false;

        /** @type {string} Current calculation mode */
        this.currentMode = 'max';
    }

    /**
     * Initializes the application
     * Sets up event listeners, theme, and loads event data
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) {
            console.warn('[App] Already initialized');
            return;
        }

        try {
            this.setupEventListeners();
            this.initTheme();
            await this.loadEventData();
            this.initialized = true;
            console.log('[App] Initialization complete');
        } catch (error) {
            console.error('[App] Initialization failed:', error);
        }
    }

    /**
     * Loads event data from the API and displays it
     * @returns {Promise<void>}
     * @private
     */
    async loadEventData() {
        try {
            const { events, characters, cards } = await api.fetchAllData();

            // Cache character and card data for UI
            ui.setCaches(characters, cards);

            // Find and display current event
            const currentEvent = api.findCurrentEvent(events);
            if (!currentEvent) {
                ui.showError('No active event found');
                return;
            }

            // Fetch detailed event information
            const details = await api.fetchEventDetails(currentEvent.eventId);
            ui.displayEventBanner(details, currentEvent.eventId);
        } catch (error) {
            console.error('[App] Error loading event data:', error);
            ui.showError('Failed to load event data');
        }
    }

    /**
     * Sets up all event listeners for the application
     * @private
     */
    setupEventListeners() {
        // Mode selection buttons
        this.addClickListener('maxBtn', () => this.setMode('max'));
        this.addClickListener('goalBtn', () => this.setMode('goal'));

        // Calculate button
        this.addClickListener('calculateBtn', () => this.calculate());

        // Enter key to calculate
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.calculate();
            }
        });

        // Settings toggle
        this.addClickListener('settingsToggle', () => this.toggleSettings());

        // Theme toggle
        this.addClickListener('themeToggle', () => this.toggleTheme());

        // Number input formatting
        this.setupNumberInputs();
    }

    /**
     * Helper to add click listener with null check
     * @param {string} elementId - Element ID
     * @param {Function} handler - Click handler function
     * @private
     */
    addClickListener(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        } else {
            console.warn(`[App] Element not found: ${elementId}`);
        }
    }

    /**
     * Sets up number input formatting for all inputs with data-number attribute
     * @private
     */
    setupNumberInputs() {
        const numberInputs = document.querySelectorAll('input[data-number]');

        numberInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const parsed = parseNumber(e.target.value);
                e.target.value = formatNumber(parsed);
            });

            // Also format on focus loss to clean up any invalid input
            input.addEventListener('blur', (e) => {
                const parsed = parseNumber(e.target.value);
                e.target.value = formatNumber(parsed);
            });
        });
    }

    /**
     * Sets the calculation mode (max or goal)
     * @param {string} mode - Either 'max' or 'goal'
     */
    setMode(mode) {
        this.currentMode = mode;
        calculator.setMode(mode);

        const maxBtn = document.getElementById('maxBtn');
        const goalBtn = document.getElementById('goalBtn');
        const maxInput = document.getElementById('maxInput');
        const goalInput = document.getElementById('goalInput');

        // Verify elements exist
        if (!maxBtn || !goalBtn || !maxInput || !goalInput) {
            console.error('[App] Required mode elements not found');
            return;
        }

        // Update button active states
        maxBtn.classList.toggle('active', mode === 'max');
        goalBtn.classList.toggle('active', mode === 'goal');

        // Toggle input visibility
        maxInput.classList.toggle('hidden', mode !== 'max');
        goalInput.classList.toggle('hidden', mode !== 'goal');
    }

    /**
     * Performs the calculation and displays results
     */
    calculate() {
        // Gather inputs from UI
        const inputs = this.gatherInputs();
        if (!inputs) {
            console.error('[App] Failed to gather inputs');
            return;
        }

        // Gather settings from UI
        const settings = this.gatherSettings();
        if (!settings) {
            console.error('[App] Failed to gather settings');
            return;
        }

        try {
            // Update calculator with current settings
            calculator.updateSettings(settings);

            // Perform calculation
            const results = calculator.calculate(inputs);

            // Display results
            ui.displayResults(results);
        } catch (error) {
            console.error('[App] Calculation failed:', error);
        }
    }

    /**
     * Gathers input values from the UI
     * @returns {Object|null} Input values object or null if elements missing
     * @private
     */
    gatherInputs() {
        const currentScore = document.getElementById('currentScore');
        const currentBadges = document.getElementById('currentBadges');
        const boosts = document.getElementById('boosts');
        const goal = document.getElementById('goal');

        if (!currentScore || !currentBadges) {
            return null;
        }

        return {
            currentScore: currentScore.value,
            currentBadges: currentBadges.value,
            boosts: boosts?.value,
            goal: goal?.value
        };
    }

    /**
     * Gathers settings values from the UI
     * @returns {Object|null} Settings object or null if elements missing
     * @private
     */
    gatherSettings() {
        const multiPoints = document.getElementById('multiPoints');
        const multiBadges = document.getElementById('multiBadges');
        const challengePoints = document.getElementById('challengePoints');
        const challengeBadges = document.getElementById('challengeBadges');

        if (!multiPoints || !multiBadges || !challengePoints || !challengeBadges) {
            return null;
        }

        return {
            multiPoints: parseNumber(multiPoints.value),
            multiBadges: parseNumber(multiBadges.value),
            challengePoints: parseNumber(challengePoints.value),
            challengeBadges: parseNumber(challengeBadges.value)
        };
    }

    /**
     * Toggles the settings panel visibility
     */
    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        const icon = document.getElementById('settingsIcon');

        if (!panel || !icon) {
            console.error('[App] Settings elements not found');
            return;
        }

        panel.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    }

    /**
     * Toggles between light and dark theme
     */
    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains(THEME_DARK);
        const newTheme = isDark ? THEME_LIGHT : THEME_DARK;

        // Update DOM
        html.classList.toggle(THEME_DARK, !isDark);

        // Persist theme preference
        try {
            localStorage.setItem(THEME_KEY, newTheme);
        } catch (error) {
            console.warn('[App] Failed to save theme preference:', error);
        }
    }

    /**
     * Initializes theme based on saved preference or system preference
     * Also handles initial settings panel state on mobile
     * @private
     */
    initTheme() {
        try {
            const savedTheme = localStorage.getItem(THEME_KEY);
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            // Apply dark theme if saved or if system prefers dark and no saved preference
            if (savedTheme === THEME_DARK || (!savedTheme && prefersDark)) {
                document.documentElement.classList.add(THEME_DARK);
            }
        } catch (error) {
            console.warn('[App] Failed to load theme preference:', error);
        }

        // Hide settings panel on mobile by default
        if (window.innerWidth < MOBILE_BREAKPOINT) {
            const settingsPanel = document.getElementById('settingsPanel');
            if (settingsPanel) {
                settingsPanel.classList.add('hidden');
            }
        }
    }

    /**
     * Cleanup method to be called when the app is being destroyed
     * Prevents memory leaks by cleaning up UI elements
     */
    cleanup() {
        ui.cleanup();
        this.initialized = false;
    }
}

// Create and initialize application
const app = new BandoriCalculatorApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    // DOM already loaded
    app.init();
}

// Optional: cleanup on page unload (good practice for SPAs)
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Export for potential testing or external access
export default app;
