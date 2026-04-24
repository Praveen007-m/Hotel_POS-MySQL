const FILTER_OPTIONS = [
  { value: "all", label: "ALL" },
  { value: "today", label: "TODAY" },
  { value: "week", label: "LAST 7 DAYS" },
  { value: "month", label: "MONTH" },
];

const ExpenseFilters = ({ activeFilter, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition
            ${activeFilter === filter.value
              ? "bg-[#09172A] text-white"
              : "bg-gray-100 hover:bg-gray-200"
            }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default ExpenseFilters;
