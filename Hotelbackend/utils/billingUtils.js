/**
 * Billing utilities and constants for backend
 */

// Hotel GST Number
const HOTEL_GST_NUMBER = "33AMQPK7880E1ZP";

// Default GST rates
const DEFAULT_GST_RATES = {
  room: {
    low: 0.05, // 5% for room price <= 7500
    high: 0.18, // 18% for room price > 7500
    threshold: 7500, // Threshold for applying higher rate
  },
  kitchen: 0.05, // 5% fixed
  addon: 0.05, // 5% fixed
};

module.exports = {
  HOTEL_GST_NUMBER,
  DEFAULT_GST_RATES,
};
