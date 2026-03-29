// components/customers/CustomerDetails.jsx
import React from "react";
import { API_BASE_URL } from "../../config";

export default function CustomerDetails({ customer, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm z-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {customer.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {customer.contact}
              {customer.email ? ` • ${customer.email}` : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">

          {/* ID Proof Type */}
          <div>
            <div className="text-sm text-gray-500">ID Proof Type</div>
            <div className="font-medium">{customer.id_type || "—"}</div>
          </div>

          {/* ID Number */}
          <div>
            <div className="text-sm text-gray-500">ID Number</div>
            <div className="font-medium">{customer.id_number || "—"}</div>
          </div>

          {/* Date of Birth */}
          <div>
            <div className="text-sm text-gray-500">Date of Birth</div>
            <div className="font-medium">
              {customer.dob || "—"}
            </div>
          </div>

          {/* Vehicle Number */}
          <div>
            <div className="text-sm text-gray-500">Vehicle Number</div>
            <div className="font-medium">
              {customer.vehicle_no || "—"}
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <div className="text-sm text-gray-500">Address</div>
            <div className="font-medium">
              {customer.address || "—"}
            </div>
          </div>

          {/* ID Proof Document */}
          <div className="sm:col-span-2">
            <div className="text-sm text-gray-500 mb-1">
              ID Proof Document
            </div>

            {customer.document ? (
              <a
                href={`${API_BASE_URL}/${customer.document}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A1B4D] text-white rounded-lg hover:bg-[#091642]"
              >
                📄 View / Download Document
              </a>
            ) : (
              <p className="text-sm text-gray-400">
                No document uploaded
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
