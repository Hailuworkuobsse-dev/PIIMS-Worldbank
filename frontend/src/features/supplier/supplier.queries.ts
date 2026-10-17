import { useQuery } from "@tanstack/react-query";
import { supplierApi } from "./supplier.api";

export const supplierKeys = {
  all: ["supplier"] as const,
  me: () => [...supplierKeys.all, "me"] as const,
  dashboard: () => [...supplierKeys.all, "dashboard"] as const,
  contracts: () => [...supplierKeys.all, "contracts"] as const,
  deliveries: (contractId?: string) =>
    [...supplierKeys.all, "deliveries", contractId ?? "all"] as const,
  invoices: () => [...supplierKeys.all, "invoices"] as const,
  warranties: () => [...supplierKeys.all, "warranties"] as const,
  payments: () => [...supplierKeys.all, "payments"] as const,
};

export function useSupplierProfile() {
  return useQuery({
    queryKey: supplierKeys.me(),
    queryFn: () => supplierApi.me(),
  });
}
export function useSupplierDashboard() {
  return useQuery({
    queryKey: supplierKeys.dashboard(),
    queryFn: () => supplierApi.dashboard(),
  });
}
export function useSupplierContracts() {
  return useQuery({
    queryKey: supplierKeys.contracts(),
    queryFn: () => supplierApi.contracts(),
  });
}
export function useSupplierDeliveries(contractId?: string) {
  return useQuery({
    queryKey: supplierKeys.deliveries(contractId),
    queryFn: () => supplierApi.deliveries(contractId),
  });
}
export function useSupplierInvoices() {
  return useQuery({
    queryKey: supplierKeys.invoices(),
    queryFn: () => supplierApi.invoices(),
  });
}
export function useSupplierWarranties() {
  return useQuery({
    queryKey: supplierKeys.warranties(),
    queryFn: () => supplierApi.warranties(),
  });
}
export function useSupplierPayments() {
  return useQuery({
    queryKey: supplierKeys.payments(),
    queryFn: () => supplierApi.payments(),
  });
}