import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { accessState, homeForRole } from "@/navigation/access";
import { RoleGuard } from "@/navigation/RoleGuard";

let mockSession: {
  userId: string;
  role: "owner" | "employee" | "accountant";
  businessId: string;
} | null = null;
let mockLoading = false;

jest.mock("@/providers/SessionProvider", () => ({
  useSession: () => ({
    session: mockSession,
    loading: mockLoading,
    signOut: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe("Role Security & Navigation Access (Figma 81:1450, 84:116, 84:188)", () => {
  describe("homeForRole routing contract", () => {
    it("maps owner to /owner", () => {
      expect(homeForRole("owner")).toBe("/owner");
    });

    it("maps employee to /employee", () => {
      expect(homeForRole("employee")).toBe("/employee");
    });

    it("maps accountant to /accountant", () => {
      expect(homeForRole("accountant")).toBe("/accountant");
    });
  });

  describe("accessState evaluation", () => {
    it("evaluates loading state", () => {
      expect(accessState(true, null, "employee")).toBe("loading");
    });

    it("evaluates unauthenticated state when session is null", () => {
      expect(accessState(false, null, "employee")).toBe("unauthenticated");
    });

    it("evaluates authorized state when session role matches", () => {
      const session = {
        userId: "u1",
        role: "employee" as const,
        businessId: "b1",
      };
      expect(accessState(false, session, "employee")).toBe("authorized");
    });

    it("evaluates forbidden state when employee attempts to access owner route", () => {
      const session = {
        userId: "u1",
        role: "employee" as const,
        businessId: "b1",
      };
      expect(accessState(false, session, "owner")).toBe("forbidden");
    });

    it("evaluates forbidden state when accountant attempts to access owner route", () => {
      const session = {
        userId: "u2",
        role: "accountant" as const,
        businessId: "b1",
      };
      expect(accessState(false, session, "owner")).toBe("forbidden");
    });

    it("evaluates forbidden state when employee attempts to access accountant route", () => {
      const session = {
        userId: "u1",
        role: "employee" as const,
        businessId: "b1",
      };
      expect(accessState(false, session, "accountant")).toBe("forbidden");
    });
  });

  describe("RoleGuard component isolation", () => {
    it("renders protected child content when role matches", () => {
      mockSession = {
        userId: "emp-1",
        role: "employee",
        businessId: "b1",
      };
      mockLoading = false;

      render(
        <RoleGuard requiredRole="employee">
          <Text>Protected Employee Workspace Content</Text>
        </RoleGuard>,
      );

      expect(
        screen.getByText("Protected Employee Workspace Content"),
      ).toBeTruthy();
    });

    it("renders Restricted Access screen (Figma 81:1450) when role does not match", () => {
      mockSession = {
        userId: "emp-1",
        role: "employee",
        businessId: "b1",
      };
      mockLoading = false;

      render(
        <RoleGuard requiredRole="owner">
          <Text>Secret Owner Executive Data</Text>
        </RoleGuard>,
      );

      // Child should NOT be rendered
      expect(screen.queryByText("Secret Owner Executive Data")).toBeNull();

      // Canonical Figma restricted access screen
      expect(screen.getByText("Permission required")).toBeTruthy();
      expect(
        screen.getByText(
          "This action is not authorized for your current role.",
        ),
      ).toBeTruthy();
      expect(screen.getByText("Assigned role: employee")).toBeTruthy();
      expect(screen.getByText("Sign out")).toBeTruthy();
    });
  });
});
