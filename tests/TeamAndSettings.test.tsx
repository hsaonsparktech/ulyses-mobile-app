import { render, screen } from "@testing-library/react-native";
import { NotificationsModal } from "@/features/notifications/components/NotificationsModal";
import { SettingsModal } from "@/features/settings/components/SettingsModal";
import { RolePermissionsModal } from "@/features/team/components/RolePermissionsModal";
import { TeamModal } from "@/features/team/components/TeamModal";

describe("Team, Notifications & Settings (Figma 37:830, 81:1034, 37:953, 37:873)", () => {
  it("renders team access modal with members and invite button", () => {
    render(<TeamModal visible={true} onClose={() => {}} />);

    expect(screen.getByText("Team Access")).toBeTruthy();
    expect(screen.getByText("Invite Member")).toBeTruthy();
    expect(screen.getByText("Alex Morgan")).toBeTruthy();
    expect(screen.getByText("Sarah Chen, CPA")).toBeTruthy();
  });

  it("renders role permissions matrix", () => {
    render(<RolePermissionsModal visible={true} onClose={() => {}} />);

    expect(screen.getByText("Role Permissions")).toBeTruthy();
    expect(screen.getByText("View Financial Reports & P&L")).toBeTruthy();
    expect(screen.getByText("Create & Issue Invoices")).toBeTruthy();
  });

  it("renders notifications modal", () => {
    render(<NotificationsModal visible={true} onClose={() => {}} />);

    expect(screen.getByText("Notifications")).toBeTruthy();
    expect(screen.getByText("Mark all as read")).toBeTruthy();
  });

  it("renders business settings modal", () => {
    render(<SettingsModal visible={true} onClose={() => {}} />);

    expect(screen.getByText("Business Settings")).toBeTruthy();
    expect(screen.getByText("Team Access & Roles")).toBeTruthy();
    expect(screen.getByText("Cash Basis")).toBeTruthy();
    expect(screen.getByText("Accrual Basis")).toBeTruthy();
  });
});
