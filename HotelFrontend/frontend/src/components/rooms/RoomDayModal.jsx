import {
  X,
  Calendar,
  LogIn,
  LogOut,
  Hash,
  User,
  Edit2,
  ExternalLink,
} from "lucide-react";

const formatDateTime = (str) => {
  if (!str) return "—";
  const d = new Date(str);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function RoomDayModal({ data, onClose, onEdit, onViewBookings }) {
  const { room, booking, date, status } = data;

  const handleEdit = () => {
    onClose();
    onEdit?.(booking);
  };

  const handleViewBookings = () => {
    onClose();
    onViewBookings?.();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                Room {room?.room_number}
              </h3>
              <p className="text-slate-300 text-sm mt-0.5">{date}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-3 ${
              status === "Booked"
                ? "bg-red-500/20 text-red-200"
                : "bg-emerald-500/20 text-emerald-200"
            }`}
          >
            {status}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {booking ? (
            <>
              {booking.customer_name && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Guest
                    </p>
                    <p className="font-semibold text-gray-900">
                      {booking.customer_name}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Check-in
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(booking.check_in)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Check-out
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(booking.check_out) || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Booking ID
                  </p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {booking.booking_id}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 py-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Room is available for booking
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Click on an available slot to create a new booking.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
          {booking && onEdit && (
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Booking
            </button>
          )}
          {onViewBookings && (
            <button
              onClick={handleViewBookings}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View in Bookings
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
