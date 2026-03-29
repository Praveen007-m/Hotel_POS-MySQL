import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { generateKitchenBillPDF } from "../../utils/hotelbill";
import { generateRestaurantBillPDF } from "../../utils/restaurant.jsx";
import { toast } from 'react-toastify';

// Subcomponents
import OrderModeToggle from "./subcomponents/OrderModeToggle";
import CreateOrderForm from "./subcomponents/CreateOrderForm";
import LiveOrdersTable from "./subcomponents/LiveOrdersTable";
import ServedOrdersTable from "./subcomponents/ServedOrdersTable";
import BillModal from "./subcomponents/BillModal";

export default function RestaurantOrderList({ user }) {
  const [orderMode, setOrderMode] = useState("hotel"); // "hotel" or "restaurant"
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [generatingBill, setGeneratingBill] = useState(false);

  // Form states
  const [rooms, setRooms] = useState([]); // For hotel
  const [tableNumbers, setTableNumbers] = useState([]); // For restaurant
  const [menuItems, setMenuItems] = useState([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState(""); // table_number or booking_code
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [downloadedBills, setDownloadedBills] = useState(new Set());

  const handleBillDownload = (identifier) => {
    setDownloadedBills((prev) => new Set([...prev, identifier]));
  };

  // Pagination states
  const rowsPerPage = 10;
  const [livePage, setLivePage] = useState(1);
  const [prevPage, setPrevPage] = useState(1);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const url =
        orderMode === "restaurant"
          ? `${API_BASE_URL}/api/restaurant/orders`
          : `${API_BASE_URL}/api/kitchen/orders`;

      const res = await axios.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [orderMode]);

  // Fetch form data
  const fetchFormData = useCallback(async () => {
    try {
      const itemsRes = await axios.get(`${API_BASE_URL}/api/kitchen/items`);
      setMenuItems(itemsRes.data);

      if (orderMode === "restaurant") {
        setTableNumbers(Array.from({ length: 20 }, (_, i) => i + 1));
      } else {
        const roomsRes = await axios.get(`${API_BASE_URL}/api/rooms/active`);
        setRooms(roomsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch form data");
    }
  }, [orderMode]);

  useEffect(() => {
    fetchOrders();
    fetchFormData();
  }, [fetchOrders, fetchFormData]);

  // Handle mode switch
  const handleModeSwitch = (newMode) => {
    setOrderMode(newMode);
    setSelectedIdentifier("");
    setSelectedItem("");
    setQuantity(1);
    setLivePage(1);
    setPrevPage(1);
    setLoading(true);
  };

  // Update order status
  const updateStatus = async (id, status) => {
    try {
      const url =
        orderMode === "restaurant"
          ? `${API_BASE_URL}/api/restaurant/orders/${id}`
          : `${API_BASE_URL}/api/kitchen/orders/${id}`;

      await axios.put(url, { status });

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  // Create new order
  const createOrder = async () => {
    if (!selectedIdentifier) {
      toast.warning(orderMode === "restaurant" ? "Select Table" : "Select Room");
      return;
    }
    if (!selectedItem) {
      toast.warning("Select Menu Item");
      return;
    }

    try {
      setCreatingOrder(true);

      if (orderMode === "restaurant") {
        await axios.post(`${API_BASE_URL}/api/restaurant/orders`, {
          table_number: Number(selectedIdentifier),
          item_id: Number(selectedItem),
          quantity: Number(quantity),
        });
      } else {
        const booking = rooms.find(
          (r) => String(r.booking_code) === selectedIdentifier,
        );

        await axios.post(`${API_BASE_URL}/api/kitchen/orders`, {
          room_id: booking.room_id,
          booking_id: selectedIdentifier,
          item_id: Number(selectedItem),
          quantity: Number(quantity),
        });
      }

      await fetchOrders();
      setSelectedIdentifier("");
      setSelectedItem("");
      setQuantity(1);
      toast.success("Order added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  // Generate bill
  const generateBill = async (identifier, group) => {
    try {
      setGeneratingBill(true);

      const url =
        orderMode === "restaurant"
          ? `${API_BASE_URL}/api/restaurant/generate-bill`
          : `${API_BASE_URL}/api/kitchen/generate-bill`;

      const payload =
        orderMode === "restaurant"
          ? { table_number: identifier }
          : { booking_id: identifier };

      // âœ… Only prepare bill data
      setShowBillModal(true)


      // âœ… THEN prepare bill data
      const subtotal = group.orders.reduce(
        (sum, o) => sum + o.quantity * o.price,
        0
      );

      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      setSelectedBill({
        identifier,
        customer_name:
          group.orders[0]?.customer_name || `Table ${identifier}`,
        items: group.orders.map((o) => ({
          item_name: o.item_name,
          quantity: o.quantity,
          price: o.price,
          total: o.quantity * o.price,
        })),
        subtotal,
        tax,
        total,
      });

      setShowBillModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate bill");
    } finally {
      setGeneratingBill(false);
    }
  };


  const formatIST = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Download bill
  const downloadBill = () => {
    if (!selectedBill) return;

    if (orderMode === "restaurant") {
      generateRestaurantBillPDF({
        restaurantName: "Hotel Friday Inn",
        tableNo: selectedBill.identifier,
        billNo: selectedBill.identifier,
        orders: selectedBill.items,
        gstRate: 0.05,
        gstIncluded: true,
        formatIST,
      });
    } else {
      generateKitchenBillPDF({
        selectedBill: {
          bill_id: selectedBill.identifier,
          booking_id: selectedBill.identifier,
          room_id: selectedBill.customer_name,
        },
        kitchenOrders: selectedBill.items,
        formatIST,
      });
    }
  };

  const handleDelete = async (identifier) => {
    try {
      const url =
        orderMode === "restaurant"
          ? `${API_BASE_URL}/api/restaurant/orders/table/${identifier}`
          : `${API_BASE_URL}/api/kitchen/orders/booking/${identifier}`;

      await axios.delete(url);

      toast.success("Orders deleted successfully");
      fetchOrders();
    } catch (err) {
      toast.error("Delete failed");
    }
  };




  // Filter orders
  const liveOrders = orders.filter(
    (o) => o.status?.toLowerCase() !== "served"
  );

  const servedOrders = orders.filter(
    (o) => o.status?.toLowerCase() === "served"
  );


  // Group served orders
  const servedOrdersGrouped = Object.values(
    servedOrders.reduce((acc, order) => {
      const key = orderMode === "restaurant" ? order.table_number : order.booking_id;
      if (!acc[key]) {
        acc[key] = { identifier: key, orders: [] };
      }
      acc[key].orders.push(order);
      return acc;
    }, {}),
  );

  // Pagination helper
  const paginate = (data, page) => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };

  const totalLivePages = Math.ceil(liveOrders.length / rowsPerPage);
  const totalServedPages = Math.ceil(servedOrdersGrouped.length / rowsPerPage);

  return (
    <div className="space-y-6">
      <OrderModeToggle
        orderMode={orderMode}
        onModeSwitch={handleModeSwitch}
      />

      <CreateOrderForm
        orderMode={orderMode}
        selectedIdentifier={selectedIdentifier}
        setSelectedIdentifier={setSelectedIdentifier}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        quantity={quantity}
        setQuantity={setQuantity}
        rooms={rooms}
        tableNumbers={tableNumbers}
        menuItems={menuItems}
        createOrder={createOrder}
        creatingOrder={creatingOrder}
      />

      <LiveOrdersTable
        orderMode={orderMode}
        liveOrders={liveOrders}
        loading={loading}
        livePage={livePage}
        setLivePage={setLivePage}
        totalLivePages={totalLivePages}
        updateStatus={updateStatus}
        paginate={paginate}
      />

      {servedOrdersGrouped.length > 0 && (
        <ServedOrdersTable
          orderMode={orderMode}
          servedOrdersGrouped={servedOrdersGrouped}
          handleDelete={handleDelete}
          prevPage={prevPage}
          setPrevPage={setPrevPage}
          totalServedPages={totalServedPages}
          generatingBill={generatingBill}
          generateBill={generateBill}
          paginate={paginate}
          downloadedBills={downloadedBills}
          user={user}
        />
      )}

      <BillModal
        showBillModal={showBillModal}
        selectedBill={selectedBill}
        orderMode={orderMode}
        downloadBill={downloadBill}
        onDownload={handleBillDownload}
        onClose={() => {
          setShowBillModal(false);
          fetchOrders();
        }}
      />
    </div>
  );
}

