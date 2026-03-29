export default function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  emoji,
  showProgress,
  progressValue,
}) {
  const colorMap = {
    blue: { gradient: "from-blue-500 to-blue-600", bg: "from-blue-400/20 to-blue-600/20" },
    green: { gradient: "from-green-500 to-green-600", bg: "from-green-400/20 to-green-600/20" },
    red: { gradient: "from-red-500 to-red-600", bg: "from-red-400/20 to-red-600/20" },
    purple: { gradient: "from-purple-500 to-purple-600", bg: "from-purple-400/20 to-purple-600/20" },
  };

  const colorClass = colorMap[color];

  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass.bg} rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br ${colorClass.gradient} rounded-xl shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl">{emoji}</div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-4xl font-bold bg-gradient-to-r ${colorClass.gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        {showProgress && (
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colorClass.gradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}