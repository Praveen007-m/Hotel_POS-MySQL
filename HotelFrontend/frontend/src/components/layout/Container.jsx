export default function Container({ children }) {
  return (
    <div className="md:ml-64 pt-24 md:pt-32 p-4 md:p-8 min-h-screen bg-[#F5F6FA]">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border border-gray-100">
        {children}
      </div>
    </div>
  );
}
