import React from "react";

export default function BillModal({
    showBillModal,
    selectedBill,
    orderMode,
    downloadBill,
    onDownload,
    onClose,
}) {
    if (!showBillModal || !selectedBill) return null;

    const handleDownload = () => {
        downloadBill();
        if (onDownload) {
            onDownload(selectedBill.identifier);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Bill Content */}
                <div className="p-8">
                    {/* Header */}
                    <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">BILL</h1>
                        <p className="text-sm text-gray-600 mt-2">
                            {orderMode === "restaurant"
                                ? "Restaurant Order"
                                : "Hotel Friday Inn Management System"}
                        </p>
                    </div>

                    {/* Table/Customer Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">
                                {orderMode === "restaurant" ? "Table Number" : "Guest Name"}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                {selectedBill.customer_name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 font-semibold uppercase">
                                {orderMode === "restaurant" ? "Order ID" : "Booking ID"}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                #{selectedBill.identifier}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-6 text-sm">
                        <thead>
                            <tr className="border-t-2 border-b-2 border-gray-400">
                                <th className="text-left py-3 font-bold text-gray-900">Item</th>
                                <th className="text-center py-3 font-bold text-gray-900">Qty</th>
                                <th className="text-right py-3 font-bold text-gray-900">Rate</th>
                                <th className="text-right py-3 font-bold text-gray-900">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedBill.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="py-3 text-gray-700">{item.item_name}</td>
                                    <td className="text-center py-3 text-gray-700">
                                        {item.quantity}
                                    </td>
                                    <td className="text-right py-3 text-gray-700">
                                        ₹{item.price.toFixed(2)}
                                    </td>
                                    <td className="text-right py-3 font-semibold text-gray-900">
                                        ₹{item.total.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded space-y-2 mb-6 border border-gray-200">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Subtotal</span>
                            <span className="font-semibold text-gray-900">
                                ₹{selectedBill.subtotal.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Tax (5%)</span>
                            <span className="font-semibold text-gray-900">
                                ₹{selectedBill.tax.toFixed(2)}
                            </span>
                        </div>
                        <div className="border-t border-gray-300 pt-2 flex justify-between">
                            <span className="font-bold text-gray-900">Total Amount</span>
                            <span className="font-bold text-lg text-blue-600">
                                ₹{selectedBill.total.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-600 border-t border-gray-200 pt-4 mb-6">
                        <p>
                            {orderMode === "restaurant"
                                ? "Thank you for dining with us!"
                                : "Thank you for your stay at Hotel Friday Inn!"}
                        </p>
                        <p>
                            Please pay at the{" "}
                            {orderMode === "restaurant" ? "counter" : "reception desk"}
                        </p>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="bg-gray-100 p-4 border-t border-gray-200 flex gap-3 justify-end print:hidden">
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition text-sm"
                    >
                        Download Bill
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded transition text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
