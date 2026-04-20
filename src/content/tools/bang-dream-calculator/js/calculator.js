/**
 * Event Calculator Module
 * Calculates optimal strategies for BanG Dream! event scoring
 * @module calculator
 */

import { parseNumber, formatNumber } from './utils.js';

// Game Constants
const BOOSTS_PER_MULTI_LIVE = 3; // Each multi live consumes 3 boosts
const MAX_ITERATIONS_SAFETY_LIMIT = 10000; // Prevent infinite loops

// Default game values (can be overridden)
const DEFAULT_SETTINGS = {
    multiPoints: 6800,      // Event points earned per Multi Live
    multiBadges: 330,       // Challenge points (CP/badges) earned per Multi Live
    challengePoints: 33000, // Event points earned per Challenge Live
    challengeBadges: 800    // Challenge points (CP/badges) required per Challenge Live
};

/**
 * Calculator modes for different strategies
 * @readonly
 * @enum {string}
 */
const CalculatorMode = {
    MAX: 'max',   // Maximize points with available boosts
    GOAL: 'goal'  // Calculate runs needed to reach target score
};

/**
 * Event points calculator for BanG Dream! events
 * Handles two calculation modes: maximizing points and reaching target goals
 */
class EventCalculator {
    constructor() {
        /** @type {string} Current calculation mode */
        this.mode = CalculatorMode.MAX;

        /** @type {Object} Current game settings */
        this.settings = { ...DEFAULT_SETTINGS };
    }

    /**
     * Sets the calculation mode
     * @param {string} mode - Either 'max' or 'goal'
     */
    setMode(mode) {
        if (mode !== CalculatorMode.MAX && mode !== CalculatorMode.GOAL) {
            console.warn(`[Calculator] Invalid mode: ${mode}, defaulting to MAX`);
            this.mode = CalculatorMode.MAX;
            return;
        }

        this.mode = mode;
    }

    /**
     * Updates calculator settings (points, badges, etc.)
     * @param {Object} settings - Partial settings object to merge
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }

    /**
     * Calculates maximum achievable points with available boosts
     * Strategy: Alternate between Multi Lives (to earn badges) and Challenge Lives (to spend badges)
     * @param {Object} params - Calculation parameters
     * @param {number} params.currentScore - Current event points
     * @param {number} params.currentBadges - Current challenge points (CP)
     * @param {number} params.maxBoosts - Available live boosts
     * @returns {Object} Calculation results with final score and breakdown
     * @private
     */
    calculateMaxPoints(params) {
        const { currentScore, currentBadges, maxBoosts } = params;
        const { multiPoints, multiBadges, challengePoints, challengeBadges } = this.settings;

        let totalPoints = currentScore;
        let totalBadges = currentBadges;
        let multiRuns = 0;
        let challengeRuns = 0;
        let boostsUsed = 0;

        // Phase 1: Optimally use all available boosts
        // Strategy: Do challenge lives when possible, otherwise do multi lives
        while (boostsUsed < maxBoosts) {
            // If we have enough badges for a challenge live, do it (more efficient)
            if (totalBadges >= challengeBadges) {
                totalPoints += challengePoints;
                totalBadges -= challengeBadges;
                challengeRuns++;
            }
            // Otherwise, do a multi live to earn more badges (requires 3 boosts)
            else if (boostsUsed + BOOSTS_PER_MULTI_LIVE <= maxBoosts) {
                totalPoints += multiPoints;
                totalBadges += multiBadges;
                multiRuns++;
                boostsUsed += BOOSTS_PER_MULTI_LIVE;
            }
            // Not enough boosts left for another multi live
            else {
                break;
            }
        }

        // Phase 2: After exhausting boosts, spend remaining badges on challenge lives
        while (totalBadges >= challengeBadges) {
            totalPoints += challengePoints;
            totalBadges -= challengeBadges;
            challengeRuns++;
        }

        return {
            finalScore: totalPoints,
            multiLives: multiRuns,
            challengeLives: challengeRuns,
            boostsUsed,
            remainingBadges: totalBadges
        };
    }

    /**
     * Calculates the strategy needed to reach a target score
     * Strategy: Prioritize challenge lives (more efficient), play multi lives when needed for badges
     * @param {Object} params - Calculation parameters
     * @param {number} params.currentScore - Current event points
     * @param {number} params.currentBadges - Current challenge points (CP)
     * @param {number} params.targetScore - Target event points to reach
     * @returns {Object} Calculation results with final score and breakdown
     * @private
     */
    calculateGoalStrategy(params) {
        const { currentScore, currentBadges, targetScore } = params;
        const { multiPoints, multiBadges, challengePoints, challengeBadges } = this.settings;

        // Early return if already at or above goal
        if (currentScore >= targetScore) {
            return {
                finalScore: currentScore,
                multiLives: 0,
                challengeLives: 0,
                boostsUsed: 0,
                remainingBadges: currentBadges
            };
        }

        let totalPoints = currentScore;
        let totalBadges = currentBadges;
        let multiRuns = 0;
        let challengeRuns = 0;
        let boostsUsed = 0;
        let iterations = 0;

        // Keep playing until we reach or exceed the goal
        while (totalPoints < targetScore) {
            // Safety check: prevent infinite loops from invalid configurations
            iterations++;
            if (iterations > MAX_ITERATIONS_SAFETY_LIMIT) {
                console.warn('[Calculator] Safety iteration limit reached');
                break;
            }

            // Prefer challenge lives (more point-efficient) if we have enough badges
            if (totalBadges >= challengeBadges) {
                totalPoints += challengePoints;
                totalBadges -= challengeBadges;
                challengeRuns++;
            }
            // Otherwise play multi live to earn more badges
            else {
                totalPoints += multiPoints;
                totalBadges += multiBadges;
                multiRuns++;
                boostsUsed += BOOSTS_PER_MULTI_LIVE;
            }
        }

        return {
            finalScore: totalPoints,
            multiLives: multiRuns,
            challengeLives: challengeRuns,
            boostsUsed,
            remainingBadges: totalBadges
        };
    }

    /**
     * Main calculation entry point
     * Validates inputs and delegates to appropriate calculation method
     * @param {Object} inputs - Raw input values from UI
     * @param {string} inputs.currentScore - Current event score (string/number)
     * @param {string} inputs.currentBadges - Current challenge points (string/number)
     * @param {string} [inputs.boosts] - Available boosts (for max mode)
     * @param {string} [inputs.goal] - Target score (for goal mode)
     * @returns {Object} Calculation results
     */
    calculate(inputs) {
        // Parse and validate inputs
        const params = {
            currentScore: parseNumber(inputs.currentScore),
            currentBadges: parseNumber(inputs.currentBadges)
        };

        // Ensure non-negative values
        params.currentScore = Math.max(0, params.currentScore);
        params.currentBadges = Math.max(0, params.currentBadges);

        // Route to appropriate calculation mode
        if (this.mode === CalculatorMode.MAX) {
            params.maxBoosts = Math.max(0, parseNumber(inputs.boosts));
            return this.calculateMaxPoints(params);
        } else {
            params.targetScore = Math.max(0, parseNumber(inputs.goal));
            return this.calculateGoalStrategy(params);
        }
    }

    /**
     * Resets settings to default values
     */
    resetSettings() {
        this.settings = { ...DEFAULT_SETTINGS };
    }
}

// Export singleton instance
const calculator = new EventCalculator();
export default calculator;

// Re-export utility functions for convenience
export { parseNumber, formatNumber };
