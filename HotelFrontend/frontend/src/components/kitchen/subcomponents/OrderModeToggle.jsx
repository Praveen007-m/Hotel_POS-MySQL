import React from "react";

export default function OrderModeToggle({ orderMode, onModeSwitch }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-6">
                <label className="text-sm font-semibold text-gray-700">
                    Order Mode:
                </label>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="orderMode"
                            value="hotel"
                            checked={orderMode === "hotel"}
                            onChange={(e) => onModeSwitch(e.target.value)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                            🏨 Hotel Room Orders
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="orderMode"
                            value="restaurant"
                            checked={orderMode === "restaurant"}
                            onChange={(e) => onModeSwitch(e.target.value)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                            🍽️ Restaurant Orders
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}
