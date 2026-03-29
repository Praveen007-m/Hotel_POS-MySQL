import Container from "../components/layout/Container";
import StaffList from "../components/staffManagement/StaffList";
import { useState } from "react";
import StaffModal from "../components/staffManagement/StaffModal";
import auth from "../auth/axiosInstance";
import { toast } from 'react-toastify';

export default function StaffManagement() {
  const [open, setOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDeleteStaff = async (id) => {
    try {
      await auth.delete(`/staff/${id}`);
      setRefreshTrigger((prev) => prev + 1); // Refresh list
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff");
    }
  };

  return (
    <Container>
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Staff Management</h1>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-[#0A1A2F] text-white rounded"
        >
          Add Staff
        </button>
      </div>

      <StaffList refreshKey={open + refreshTrigger} onDelete={handleDeleteStaff} />
      {open && <StaffModal onClose={() => setOpen(false)} />}
    </Container>
  );
}
