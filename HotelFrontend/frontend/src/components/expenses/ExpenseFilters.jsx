const ExpenseFilters = ({ activeFilter, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {["all", "today", "This week", "month"].map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition
            ${activeFilter === filter
              ? "bg-[#09172A] text-white"
              : "bg-gray-100 hover:bg-gray-200"
            }`}
        >
          {filter.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default ExpenseFilters;
