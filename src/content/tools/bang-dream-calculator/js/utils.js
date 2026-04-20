/**
 * Utility functions for number parsing and formatting
 * @module utils
 */

/**
 * Parses a string or number into an integer, removing all whitespace
 * Handles various input formats including space-separated numbers
 * @param {string|number} str - The value to parse
 * @returns {number} The parsed integer, or 0 if parsing fails
 * @example
 * parseNumber('1 000 000') // returns 1000000
 * parseNumber('123') // returns 123
 * parseNumber('') // returns 0
 */
export function parseNumber(str) {
    if (str === null || str === undefined) return 0;

    const cleaned = str.toString().replace(/\s/g, '');
    const parsed = parseInt(cleaned, 10);

    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number with space separators for thousands
 * @param {number} num - The number to format
 * @returns {string} The formatted number string
 * @example
 * formatNumber(1000000) // returns '1 000 000'
 * formatNumber(123) // returns '123'
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';

    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
