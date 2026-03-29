// pages/Customers.jsx
import React from "react";
import Container from "../components/layout/Container";
import CustomerList from "../components/customers/CustomerList";

export default function Customers() {
  return (
    <Container title="Customers" subtitle="Guest records & bookings">
      <CustomerList />
    </Container>
  );
}
