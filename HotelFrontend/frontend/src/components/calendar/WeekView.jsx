export default function WeekView({
  weekStart,
  rooms,
  getWeekDays,
  formatDate,
  getBookingForRoomOnDate,
  onRoomDateClick,
}) {
  const weekDays = getWeekDays(weekStart);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="p-6">
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((date, dayIdx) => {
          const dateStr = formatDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

          const bookedRooms = rooms.filter(room => getBookingForRoomOnDate(room, dateStr));
          const availableRooms = rooms.filter(room => !getBookingForRoomOnDate(room, dateStr));

          return (
            <div
              key={`week-day-${dayIdx}`}
              className={`group relative border-2 rounded-2xl p-3 min-h-full flex flex-col transition-all duration-300 hover:shadow-xl ${
                isWeekend ? "bg-gradient-to-br from-purple-50/50 to-pink-50/50" : "bg-white"
              } ${
                isToday
                  ? "border-blue-500 shadow-lg ring-4 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300"
              } ${isPast && !isToday ? "opacity-60" : ""}`}
            >
              {/* Day header */}
              <div className="flex flex-col items-center gap-0.5 mb-4 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
                <span className={`text-xs font-semibold uppercase tracking-wide leading-none ${
                  isToday ? "text-blue-500" : isWeekend ? "text-purple-500" : "text-blue-400"
                }`}>
                  {dayNames[date.getDay()]}
                </span>
                <span className={`text-2xl font-bold leading-tight ${
                  isToday ? "text-blue-700" : isWeekend ? "text-purple-700" : "text-gray-800"
                }`}>
                  {date.getDate()}
                </span>
                <span className={`text-xs leading-none ${isToday ? "text-blue-500" : "text-gray-400"}`}>
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </span>
                {isToday && (
                  <span className="text-[10px] font-semibold bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full mt-1 leading-none">
                    Today
                  </span>
                )}
              </div>

              {/* Room status summary */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                  <span className="text-xs font-semibold text-green-700 leading-none">
                    {availableRooms.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  <span className="text-xs font-semibold text-red-700 leading-none">
                    {bookedRooms.length}
                  </span>
                </div>
              </div>

              {/* Room buttons */}
              <div className="flex flex-wrap gap-1.5 content-start overflow-y-auto flex-1 justify-center">
                {rooms.map((room) => {
                  const booking = getBookingForRoomOnDate(room, dateStr);
                  const isBooked = !!booking;

                  return (
                    <button
                      key={room.id}
                      onClick={() => onRoomDateClick(room, date)}
                      title={`Room ${room.room_number} - ${isBooked ? "Booked" : "Available"}`}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg text-white shrink-0
                        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                          isBooked
                            ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                            : "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                        }`}
                    >
                      {room.room_number}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}