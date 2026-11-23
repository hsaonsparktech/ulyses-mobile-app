import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useBusinessStore } from "@/features/businesses/store";
import { ClientsModal } from "@/features/clients/components/ClientsModal";
import type { Client } from "@/features/clients/types";
import { EstimatesModal } from "@/features/estimates/components/EstimatesModal";
import { CreateInvoiceModal } from "../components/CreateInvoiceModal";
import { InvoiceCard } from "../components/InvoiceCard";
import { InvoiceDetailModal } from "../components/InvoiceDetailModal";
import { InvoicePreviewModal } from "../components/InvoicePreviewModal";
import { SendInvoiceModal } from "../components/SendInvoiceModal";
import { useInvoiceStore } from "../store";
import type { Invoice } from "../types";

type FilterTab = "All" | "Unpaid" | "Paid" | "Overdue";

export function InvoicesScreen() {
  const activeBusiness = useBusinessStore((s) => s.activeBusiness());
  const allInvoices = useInvoiceStore((s) => s.invoices);
  const invoices = useMemo(
    () => allInvoices.filter((inv) => inv.businessId === activeBusiness.id),
    [allInvoices, activeBusiness.id],
  );

  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [sendInvoice, setSendInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInitialClient, setCreateInitialClient] = useState<Client | null>(
    null,
  );
  const [showEstimatesModal, setShowEstimatesModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (activeFilter === "All") return invoices;
    return invoices.filter((inv) => inv.status === activeFilter);
  }, [invoices, activeFilter]);

  // KPIs
  const outstandingAmount = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "Unpaid" || inv.status === "Overdue")
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  const paidThisMonthAmount = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1 px-4 pt-6"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Screen Header Figma 36:573 */}
        <View className="mb-4">
          <Text
            variant="Title"
            className="font-semibold text-text text-[22px] leading-[30px]"
          >
            Invoices
          </Text>
          <Text variant="Caption" tone="muted" className="mt-0.5">
            {activeBusiness.name} · {invoices.length}{" "}
            {invoices.length === 1 ? "invoice" : "invoices"}
          </Text>
        </View>

        {/* Filters Responsive Row Figma 207:967 */}
        <View className="flex-row gap-2 mb-4">
          {(["All", "Unpaid", "Paid", "Overdue"] as const).map((tab) => {
            const isSelected = activeFilter === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                accessibilityLabel={`Filter invoices: ${tab}`}
                onPress={() => setActiveFilter(tab)}
                className={`flex-1 h-[32px] items-center justify-center rounded-[15px] ${
                  isSelected
                    ? "bg-primarySoft border border-primary/20"
                    : "bg-surface border border-border"
                }`}
              >
                <Text
                  variant="Caption"
                  tone={isSelected ? "primary" : "muted"}
                  className={isSelected ? "font-semibold" : ""}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Invoice KPIs Responsive Row Figma 199:1878 */}
        <View className="flex-row gap-3.5 mb-6">
          {/* Card OUTSTANDING Figma 36:602 */}
          <View className="flex-1 bg-surface border border-border rounded-[14px] p-3 h-[91px] justify-between">
            <Text
              variant="Caption"
              tone="muted"
              className="uppercase text-[12px]"
            >
              OUTSTANDING
            </Text>
            <Text
              variant="Heading"
              className="font-semibold text-text text-[18px]"
            >
              $
              {outstandingAmount.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>

          {/* Card PAID THIS MONTH Figma 36:605 */}
          <View className="flex-1 bg-surface border border-border rounded-[14px] p-3 h-[91px] justify-between">
            <Text
              variant="Caption"
              tone="muted"
              className="uppercase text-[12px]"
            >
              PAID THIS MONTH
            </Text>
            <Text
              variant="Heading"
              className="font-semibold text-text text-[18px]"
            >
              $
              {paidThisMonthAmount.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
        </View>

        {/* Section Title Figma 36:608 */}
        <Text
          variant="Heading"
          className="font-semibold text-text text-[18px] mb-3"
        >
          Recent invoices
        </Text>

        {/* Invoice List */}
        <View className="gap-2.5 mb-6">
          {filteredInvoices.map((inv) => (
            <InvoiceCard
              key={inv.id}
              invoice={inv}
              onPress={() => setSelectedInvoice(inv)}
            />
          ))}

          {filteredInvoices.length === 0 && (
            <View className="bg-surface border border-border rounded-[14px] p-6 items-center">
              <Text variant="Body" tone="muted" className="text-center">
                No {activeFilter === "All" ? "" : activeFilter.toLowerCase()}{" "}
                invoices found.
              </Text>
            </View>
          )}
        </View>

        {/* Secondary Actions Responsive Row Figma 201:935 */}
        <View className="flex-row gap-3.5 mb-6">
          {/* Action / Estimates Figma 50:796 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Estimates management"
            onPress={() => setShowEstimatesModal(true)}
            className="flex-1 bg-surface border border-border rounded-[12px] p-3 justify-between h-[64px]"
          >
            <Text
              variant="Body"
              tone="primary"
              className="font-semibold text-[13px]"
            >
              Estimates ›
            </Text>
            <Text
              variant="Caption"
              tone="muted"
              className="text-[12px]"
              numberOfLines={1}
            >
              Draft and manage quotations
            </Text>
          </Pressable>

          {/* Action / Clients Figma 50:799 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Clients directory"
            onPress={() => setShowClientsModal(true)}
            className="flex-1 bg-surface border border-border rounded-[12px] p-3 justify-between h-[64px]"
          >
            <Text
              variant="Body"
              tone="primary"
              className="font-semibold text-[13px]"
            >
              Clients ›
            </Text>
            <Text
              variant="Caption"
              tone="muted"
              className="text-[12px]"
              numberOfLines={1}
            >
              Contacts and history
            </Text>
          </Pressable>
        </View>

        {/* Create Invoice Primary Button Figma 36:624 */}
        <Button
          title="Create invoice"
          variant="primary"
          onPress={() => {
            setCreateInitialClient(null);
            setShowCreateModal(true);
          }}
        />
      </ScrollView>

      {/* Modals */}
      <CreateInvoiceModal
        visible={showCreateModal}
        businessId={activeBusiness.id}
        initialClient={createInitialClient}
        onClose={() => setShowCreateModal(false)}
        onInvoiceCreated={(newInv) => {
          setPreviewInvoice(newInv);
        }}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        visible={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
        onPreview={(inv) => {
          setSelectedInvoice(null);
          setPreviewInvoice(inv);
        }}
      />

      <InvoicePreviewModal
        invoice={previewInvoice}
        businessName={activeBusiness.name}
        visible={previewInvoice !== null}
        onClose={() => setPreviewInvoice(null)}
        onOpenSend={(inv) => {
          setPreviewInvoice(null);
          setSendInvoice(inv);
        }}
      />

      <SendInvoiceModal
        invoice={sendInvoice}
        businessName={activeBusiness.name}
        visible={sendInvoice !== null}
        onClose={() => setSendInvoice(null)}
        onViewInvoice={(inv) => {
          setSendInvoice(null);
          setSelectedInvoice(inv);
        }}
      />

      <EstimatesModal
        visible={showEstimatesModal}
        businessId={activeBusiness.id}
        businessName={activeBusiness.name}
        onClose={() => setShowEstimatesModal(false)}
        onConvertedToInvoice={(invoiceId) => {
          const inv = invoices.find((i) => i.id === invoiceId);
          if (inv) setSelectedInvoice(inv);
        }}
      />

      <ClientsModal
        visible={showClientsModal}
        businessId={activeBusiness.id}
        businessName={activeBusiness.name}
        onClose={() => setShowClientsModal(false)}
        onCreateInvoiceForClient={(client) => {
          setShowClientsModal(false);
          setCreateInitialClient(client);
          setShowCreateModal(true);
        }}
      />
    </View>
  );
}
