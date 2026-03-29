import React from "react";

export default function CreateOrderForm({
    orderMode,
    selectedIdentifier,
    setSelectedIdentifier,
    selectedItem,
    setSelectedItem,
    quantity,
    setQuantity,
    rooms,
    tableNumbers,
    menuItems,
    createOrder,
    creatingOrder,
}) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">➕</span>
                Create New {orderMode === "restaurant" ? "Restaurant" : "Kitchen"} Order
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* TABLE / ROOM DROPDOWN */}
                <div>
                    <label className="block text-sm text-gray-700 mb-2 font-medium">
                        {orderMode === "restaurant"
                            ? "Table Number"
                            : "Room / Guest / Booking"}
                    </label>
                    <select
                        value={selectedIdentifier}
                        onChange={(e) => {
                            if (orderMode === "restaurant") {
                                setSelectedIdentifier(e.target.value);
                            } else {
                                const bookingCode = e.target.value;
                                const booking = rooms.find(
                                    (r) => String(r.booking_code) === bookingCode
                                );
                                if (booking) {
                                    setSelectedIdentifier(String(booking.booking_code));
                                } else {
                                    setSelectedIdentifier("");
                                }
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">
                            {orderMode === "restaurant" ? "Select Table" : "Select Room"}
                        </option>
                        {orderMode === "restaurant"
                            ? tableNumbers.map((t) => (
                                <option key={t} value={t}>
                                    Table {t}
                                </option>
                            ))
                            : rooms.map((r) => (
                                <option
                                    key={`${r.booking_code}-${r.customer_name}`}
                                    value={String(r.booking_code)}
                                >
                                    Room {r.room_number} — {r.customer_name} (Booking #
                                    {r.booking_code})
                                </option>
                            ))}
                    </select>
                </div>

                {/* MENU ITEM */}
                <div>
                    <label className="block text-sm text-gray-700 mb-2 font-medium">
                        Menu Item
                    </label>
                    <select
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Select Item</option>
                        {menuItems.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.name} - ₹{i.price} ({i.stock} in stock)
                            </option>
                        ))}
                    </select>
                </div>

                {/* QUANTITY */}
                <div>
                    <label className="block text-sm text-gray-700 mb-2 font-medium">
                        Quantity
                    </label>
                    <input
                        type="number"
                        value={quantity}
                        min={1}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* CREATE ORDER BUTTON */}
                <div>
                    <button
                        onClick={createOrder}
                        disabled={creatingOrder}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                    >
                        {creatingOrder ? "Creating..." : "Add Order"}
                    </button>
                </div>
            </div>
        </div>
    );
}
