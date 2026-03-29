export default function MonthView({
  year,
  month,
  rooms,
  getDaysInMonth,
  formatDate,
  getBookingForRoomOnDate,
  onRoomDateClick,
}) {
  const days = getDaysInMonth(year, month);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="p-6">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-3 mb-4">
        {dayNames.map((day, idx) => (
          <div
            key={`month-day-${idx}-${day}`}
            className={`text-center font-bold py-3 rounded-xl text-sm ${
              idx === 0 || idx === 6
                ? "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700"
                : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-3 auto-rows-fr">
        {weeks.map((week, weekIdx) =>
          week.map((date, dateIdx) => {
            const dateStr = formatDate(date);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const bookedRooms = rooms.filter((room) =>
              getBookingForRoomOnDate(room, dateStr),
            );
            const availableRooms = rooms.filter(
              (room) => !getBookingForRoomOnDate(room, dateStr),
            );

            return (
             <div
  key={`${weekIdx}-${dateIdx}`}
  className={`group relative border-2 rounded-2xl p-3 min-h-40 flex flex-col transition-all duration-300 hover:shadow-xl ${
    isCurrentMonth
      ? isWeekend
        ? "bg-gradient-to-br from-purple-50/50 to-pink-50/50"
        : "bg-white"
      : "bg-gray-50/50"
  } ${
    isToday
      ? "border-blue-500 shadow-lg ring-4 ring-blue-200"
      : "border-gray-200 hover:border-blue-300"
  } ${isPast && !isToday ? "opacity-60" : ""}`}
>
  {/* Date header */}
  <div className="flex items-center justify-between mb-2">
    <div
      className={`text-sm font-bold rounded-lg px-2 py-0.5 ${
        isToday
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
          : isWeekend
            ? "text-purple-600"
            : "text-gray-700"
      }`}
    >
      {date.getDate()}
    </div>
    {isToday && (
      <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full leading-none">
        Today
      </span>
    )}
  </div>

  {/* Room status summary */}
  <div className="flex items-center gap-2 mb-2">
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

  {/* Room boxes */}
  <div className="flex flex-wrap gap-1 content-start overflow-y-auto flex-1">
    {rooms.map((room) => {
      const booking = getBookingForRoomOnDate(room, dateStr);
      const isBooked = !!booking;

      return (
        <button
          key={room.id}
          onClick={() => onRoomDateClick(room, date)}
          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg text-white transition-all duration-200 hover:shadow-lg shrink-0 transform hover:-translate-y-0.5 ${
            isBooked
              ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              : "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          }`}
          title={`Room ${room.room_number} - ${isBooked ? "Booked" : "Available"}`}
        >
          {room.room_number}
        </button>
      );
    })}
  </div>
</div>
            );
          }),
        )}
      </div>
    </div>
  );
}
