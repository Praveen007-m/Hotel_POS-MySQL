import { Edit2, Trash2, Users, Wifi, Wind, Tv, Coffee, Star } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const STATUS = {
  Available:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  Occupied:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
  Cleaning:    { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400"   },
  Maintenance: { bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-200",    dot: "bg-gray-400"    },
};

const AMENITY_ICONS = {
  WiFi:   <Wifi  className="w-3 h-3" />,
  AC:     <Wind  className="w-3 h-3" />,
  TV:     <Tv    className="w-3 h-3" />,
  Coffee: <Coffee className="w-3 h-3" />,
};

export default function RoomCard({ room, onEdit, onDelete }) {
  const { user } = useAuth();
  const cfg = STATUS[room.status] || STATUS.Available;

  const amenities = room.amenities
    ? Object.keys(room.amenities).filter((k) => room.amenities[k])
    : [];

  const addOns = room.add_ons
    ? Object.keys(room.add_ons).filter((k) => room.add_ons[k])
    : [];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105">

      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

      {/* Decorative blob */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 opacity-20 rounded-full group-hover:scale-150 transition-transform duration-700" />

      <div className="relative z-10 p-6 flex flex-col gap-4">

        {/* ── Row 1: Room identity + status ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg">
              {room.room_number}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Room {room.room_number}</h2>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{room.category}</p>
            </div>
          </div>

          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {room.status}
          </span>
        </div>

        {/* ── Row 2: Price ── */}
        <div className="flex items-baseline gap-1.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ₹{room.price_per_night}
          </span>
          <span className="text-sm text-gray-400 font-medium">/ night</span>
        </div>

        {/* ── Row 3: Capacity + Occupancy ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3 h-3" /> Capacity
            </span>
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {room.capacity} <span className="text-xs font-normal text-gray-400">people</span>
            </span>
          </div>
          <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3 h-3" /> Occupied
            </span>
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {room.current_occupancy}/{room.capacity}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Row 4: Amenities ── */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Star className="w-3 h-3" /> Amenities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {amenities.length ? amenities.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                {AMENITY_ICONS[a] || <Star className="w-3 h-3" />}
                {a}
              </span>
            )) : (
              <span className="text-xs text-gray-300 italic">No amenities</span>
            )}
          </div>
        </div>

        {/* ── Row 5: Add-ons (conditional) ── */}
        {addOns.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Coffee className="w-3 h-3" /> Add-ons
            </p>
            <div className="flex flex-wrap gap-1.5">
              {addOns.map((a, i) => (
                <span key={i} className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Row 6: Actions ── */}
        {user?.role === "admin" && (
          <>
            <div className="border-t border-gray-100" />
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(room)}
                className="group/btn flex-1 relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0A1A2F] to-[#14273F] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                <Edit2 className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Edit</span>
              </button>

              <button
                onClick={() => onDelete(room.id)}
                className="group/del relative overflow-hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-700 opacity-0 group-hover/del:opacity-100 transition-opacity duration-300" />
                <Trash2 className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Delete</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}