/**
 * Centralized billing constants and utility functions
 */

// Default GST rates (no API call needed)
export const DEFAULT_GST_RATES = {
    room: {
        low: 0.05,      // 5% for room price <= 7500
        high: 0.18,     // 18% for room price > 7500
        threshold: 7500, // Threshold for applying higher rate
    },
    kitchen: 0.05,   // 5% fixed
    addon: 0.05,     // 5% fixed
};

/**
 * Format date/time string to IST (India Standard Time)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatIST = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

// Hotel GST Number
export const HOTEL_GST_NUMBER = "33AMQPK7880E1ZP";
