import { useState, useCallback } from "react";
import MenuList from "../components/kitchen/MenuList";
import MenuForm from "../components/kitchen/MenuForm";
import CategoryList from "../components/kitchen/CategoryList";
import KitchenOrderList from "../components/kitchen/KitchenOrderList";
import { useAuth } from "../hooks/useAuth";
import Container from "../components/layout/Container";


export default function Kitchen() {
  const [activeTab, setActiveTab] = useState("orders");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);
  const { user } = useAuth();

  /**
   * Close modal and trigger menu refresh
   * Pass refreshKey to force MenuList to refetch
   */
  const handleFormSubmit = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
    // Force MenuList to refetch by changing key
    setMenuRefreshKey((prev) => prev + 1);
  }, []);

  /**
   * Close modal without refreshing
   */
  const handleFormCancel = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
  }, []);

  /**
   * Open modal for editing
   */
  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  /**
   * Open modal for adding new item
   */
  const handleAddItem = useCallback(() => {
    setEditingItem(null);
    setModalOpen(true);
  }, []);

  /**
   * Close modal on backdrop click
   */
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleFormCancel();
    }
  }, [handleFormCancel]);

  const content = (
    <>
      <h1 className="mb-6 text-xl font-bold text-[#0A1A2F] sm:text-2xl md:mb-8 md:text-3xl">
        Kitchen / Restaurant Management
      </h1>

      {/* Tabs */}
      <div className="mb-6 grid grid-cols-3 gap-3 md:mb-8 md:flex md:flex-wrap md:gap-4">
        {["orders", "menu", "categories"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-h-11 rounded-xl px-3 py-2 text-sm font-semibold transition-all sm:text-base ${activeTab === tab
              ? "bg-[#0A1B4D] text-white shadow-lg"
              : "border border-gray-200 bg-white text-[#0A1B4D] hover:shadow-sm"
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "menu" && (
          <>
            <div className="flex justify-end">
              {user?.role === "admin" && (
                <button
                  onClick={handleAddItem}
                  className="px-6 py-2 bg-[#0A1B4D] text-white rounded-xl shadow-md hover:bg-[#091642] transition-all font-medium"
                >
                  Add Menu Item
                </button>
              )}
            </div>
            <MenuList
              key={menuRefreshKey}
              onEdit={handleEditItem}
            />
          </>
        )}

        {activeTab === "orders" && <KitchenOrderList user={user} />}
        {activeTab === "categories" && <CategoryList />}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
        >
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleFormCancel}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <MenuForm
              initialData={editingItem}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </>
  );

  if (user?.role === "admin" || user?.role === "staff") {
    return <Container>{content}</Container>;
  }

  return (
    <div className="p-12 mt-24">
      {content}
    </div>
  );
}
