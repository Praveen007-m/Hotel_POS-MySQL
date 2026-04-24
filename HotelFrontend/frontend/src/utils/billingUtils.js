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
    addon: 0,        // add-ons are non-taxable
};

/**
 * Format date/time string to IST (India Standard Time)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatIST = (dateStr) => {
    if (!dateStr) return "-";

    const clean = String(dateStr)
        .replace("T", " ")
        .split(".")[0];

    const [datePart, timePart] = clean.split(" ");
    if (!datePart || !timePart) return dateStr;

    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");

    // Convert to 12-hour format
    let h = Number(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;

    const formattedDate = `${day} ${getMonthName(month)} ${year}`;
    const formattedTime = `${String(h).padStart(2, "0")}:${minute} ${ampm}`;

    return `${formattedDate}, ${formattedTime}`;
};

const getMonthName = (month) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[Number(month) - 1] || month;
};

// Hotel GST Number
export const HOTEL_GST_NUMBER = "33AMQPK7880E1ZP";
