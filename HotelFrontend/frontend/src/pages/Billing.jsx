import React from "react";
import Container from "../components/layout/Container";
import BillingList from "../components/billing/BillingList";

export default function Billing() {
  return (
    <Container title="Billing" subtitle="All guest bills & receipts">
      <BillingList />
    </Container>
  );
}
