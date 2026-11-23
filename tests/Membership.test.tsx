import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { CancelSubscriptionModal } from "@/features/membership/components/CancelSubscriptionModal";
import { FullDataExportModal } from "@/features/membership/components/FullDataExportModal";
import { ManagePlanModal } from "@/features/membership/components/ManagePlanModal";
import { SubscriptionModal } from "@/features/membership/components/SubscriptionModal";
import { useMembershipStore } from "@/features/membership/store";

describe("Sprint 06 Membership, Subscription & Data Export", () => {
  beforeEach(() => {
    useMembershipStore.getState().resetExport();
    useMembershipStore.getState().setCycle("monthly");
  });

  describe("SubscriptionModal (Figma 37:911)", () => {
    it("renders active subscription details, price, and included features", () => {
      render(<SubscriptionModal visible={true} onClose={() => {}} />);

      expect(screen.getByText("Subscription")).toBeTruthy();
      expect(screen.getByText("Active plan and renewal settings")).toBeTruthy();
      expect(screen.getByText(/Plan · Pro plan/i)).toBeTruthy();
      expect(screen.getByText("ACTIVE")).toBeTruthy();
      expect(screen.getByText("$20/mo")).toBeTruthy();
      expect(
        screen.getByText("Unlimited invoices, estimates, and client billing"),
      ).toBeTruthy();
      expect(
        screen.getByText("Smart receipt scanning & OCR auto-reconciliation"),
      ).toBeTruthy();
      expect(
        screen.getByText("Multi-seat team and accountant workspace access"),
      ).toBeTruthy();
      expect(screen.getByLabelText("Manage plan")).toBeTruthy();
      expect(screen.getByLabelText("Close subscription details")).toBeTruthy();
    });

    it("displays retention and export window guarantees", () => {
      render(<SubscriptionModal visible={true} onClose={() => {}} />);

      expect(screen.getByText("Data Retention & Export")).toBeTruthy();
      expect(
        screen.getByText(/Business data is securely retained for 60–90 days/),
      ).toBeTruthy();
    });
  });

  describe("ManagePlanModal (Figma 81:1174)", () => {
    it("renders annual vs monthly billing choices and next billing date", () => {
      render(<ManagePlanModal visible={true} onClose={() => {}} />);

      expect(screen.getByText("Manage plan")).toBeTruthy();
      expect(screen.getByText("Annual plan · save $40/yr")).toBeTruthy();
      expect(screen.getByText("$200/yr · billed annually")).toBeTruthy();
      expect(screen.getByText("Monthly plan")).toBeTruthy();
      expect(screen.getByText("Multi-business plan")).toBeTruthy();
      expect(screen.getByText("Next billing date")).toBeTruthy();
      expect(screen.getByLabelText("Cancel subscription action")).toBeTruthy();
    });

    it("allows selecting annual billing and saving cycle change", () => {
      render(<ManagePlanModal visible={true} onClose={() => {}} />);

      const annualOption = screen.getByLabelText("Select annual plan");
      fireEvent.press(annualOption);

      const changeCycleBtn = screen.getByLabelText("Change billing cycle");
      fireEvent.press(changeCycleBtn);

      expect(useMembershipStore.getState().subscription.cycle).toBe("annual");
      expect(useMembershipStore.getState().subscription.priceFormatted).toBe(
        "$200/yr",
      );
    });
  });

  describe("CancelSubscriptionModal (Figma 81:1218)", () => {
    it("renders cancellation terms, 60-90 days retention, and 30-day export window", () => {
      render(<CancelSubscriptionModal visible={true} onClose={() => {}} />);

      expect(screen.getByText("Cancel subscription")).toBeTruthy();
      expect(screen.getByText("CANCELLATION · PREVIEW")).toBeTruthy();
      expect(screen.getByText("Cancel anytime · no refunds")).toBeTruthy();
      expect(screen.getByText("Read-only data")).toBeTruthy();
      expect(screen.getByText("60–90 days")).toBeTruthy();
      expect(screen.getByText("Full export")).toBeTruthy();
      expect(screen.getByText("30 days")).toBeTruthy();
      expect(screen.getByText("Refunds")).toBeTruthy();
      expect(screen.getByText("Not available")).toBeTruthy();
      expect(screen.getByLabelText("Review terms")).toBeTruthy();
      expect(screen.getByLabelText("Export data")).toBeTruthy();
    });
  });

  describe("FullDataExportModal (Figma 86:596)", () => {
    it("renders export parameters: report, period, business, and format", () => {
      render(<FullDataExportModal visible={true} onClose={() => {}} />);

      expect(screen.getByText("Export your data")).toBeTruthy();
      expect(
        screen.getByText("Include all bookkeeping documents and records"),
      ).toBeTruthy();
      expect(screen.getByText("All records and attachments")).toBeTruthy();
      expect(screen.getByText("All dates")).toBeTruthy();
      expect(screen.getByText("Acme Services LLC")).toBeTruthy();
      expect(screen.getByText("PDF / CSV")).toBeTruthy();
      expect(screen.getByLabelText("Prepare full export")).toBeTruthy();
    });

    it("triggers export preparation and displays success state", async () => {
      render(<FullDataExportModal visible={true} onClose={() => {}} />);

      const prepareBtn = screen.getByLabelText("Prepare full export");
      fireEvent.press(prepareBtn);

      await waitFor(() => {
        expect(screen.getByText("Export Bundle Ready")).toBeTruthy();
        expect(
          screen.getByText("Archive: libros-export-acme-all.zip"),
        ).toBeTruthy();
      });
    });
  });
});
