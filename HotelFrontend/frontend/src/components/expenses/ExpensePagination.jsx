const ExpensePagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => onChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
      >
        Prev
      </button>

      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          className={`px-3 py-1 rounded text-sm font-semibold
            ${
              currentPage === i + 1
                ? "bg-[#09172A] text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
        >
          {i + 1}
        </button>
      ))}

      <button
        onClick={() => onChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default ExpensePagination;
