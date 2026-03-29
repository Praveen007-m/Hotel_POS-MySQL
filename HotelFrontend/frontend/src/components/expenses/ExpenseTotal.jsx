const ExpenseTotal = ({ total }) => {
  return (
    <div className="flex justify-end mb-4">
      <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700">
        Total:&nbsp;
        <span className="text-black">₹{total}</span>
      </div>
    </div>
  );
};

export default ExpenseTotal;

