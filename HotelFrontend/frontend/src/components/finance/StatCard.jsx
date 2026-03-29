const StatCard = ({ label, value, color = "blue", icon }) => {
  const palette = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      dot: "bg-blue-500",
      icon: "bg-blue-100 text-blue-600",
    },
    green: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      dot: "bg-emerald-500",
      icon: "bg-emerald-100 text-emerald-600",
    },
    yellow: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      dot: "bg-amber-400",
      icon: "bg-amber-100 text-amber-600",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      dot: "bg-red-500",
      icon: "bg-red-100 text-red-500",
    },
    purple: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      dot: "bg-violet-500",
      icon: "bg-violet-100 text-violet-600",
    },
  };

  const c = palette[color] || palette.blue;

  return (
    <div className={`relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* Subtle color blob */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${c.bg} opacity-60`} />

      <div className="relative flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            {label}
          </p>
          <p className={`text-3xl font-bold ${c.text}`}>
            {value}
          </p>
        </div>

        {/* Icon */}
        {icon && (
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;