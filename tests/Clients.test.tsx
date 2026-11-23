import { fireEvent, render } from "@testing-library/react-native";
import { ClientsModal } from "@/features/clients/components/ClientsModal";
import { clientSchema } from "@/features/clients/schemas/client";
import { useClientStore } from "@/features/clients/store";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("Clients Module (Figma 37:786, 81:542, 81:586)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("validates clientSchema with valid and invalid inputs", () => {
    const valid = clientSchema.safeParse({
      name: "Acme Innovations",
      email: "hello@acme.co",
      phone: "(555) 123-4567",
      billingAddress: "123 Main St, New York, NY",
      currency: "USD",
    });
    expect(valid.success).toBe(true);

    const invalidEmail = clientSchema.safeParse({
      name: "Acme Innovations",
      email: "not-an-email",
      phone: "(555) 123-4567",
      billingAddress: "123 Main St",
    });
    expect(invalidEmail.success).toBe(false);

    const missingName = clientSchema.safeParse({
      name: "",
      email: "test@example.com",
      phone: "555-1234",
      billingAddress: "123 Main St",
    });
    expect(missingName.success).toBe(false);
  });

  test("renders client directory, filters by search, and shows client detail", () => {
    const handleClose = jest.fn();
    const view = render(
      <ThemeProvider>
        <ClientsModal
          visible={true}
          businessId="biz-1"
          businessName="Acme Services LLC"
          onClose={handleClose}
        />
      </ThemeProvider>,
    );

    expect(view.getByText("Clients")).toBeTruthy();
    expect(view.getByText("Riverbend Creative LLC")).toBeTruthy();
    expect(view.getByText("Jackson Studio")).toBeTruthy();
    expect(view.getByText("Metro Media Co.")).toBeTruthy();

    // Search filter
    const searchInput = view.getByPlaceholderText("Search name or company...");
    fireEvent.changeText(searchInput, "Riverbend");
    expect(view.getByText("Riverbend Creative LLC")).toBeTruthy();
    expect(view.queryByText("Jackson Studio")).toBeNull();

    // Clear search
    fireEvent.changeText(searchInput, "");
    expect(view.getByText("Jackson Studio")).toBeTruthy();

    // Open client detail
    const riverbendCard = view.getByText("Riverbend Creative LLC");
    fireEvent.press(riverbendCard);

    expect(view.getByText("Client profile")).toBeTruthy();
    expect(
      view.getAllByText("accounts@riverbend.co").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      view.getByText("Client records belong to the active business."),
    ).toBeTruthy();
  });

  test("adds a new client to the store", () => {
    const { addClient, getClientsByBusiness } = useClientStore.getState();
    const newClient = addClient("biz-1", {
      name: "Design Studio One",
      email: "studio@one.co",
      phone: "(555) 999-0000",
      billingAddress: "San Francisco, CA",
    });

    expect(newClient.name).toBe("Design Studio One");
    const bizClients = getClientsByBusiness("biz-1");
    expect(bizClients.some((c) => c.id === newClient.id)).toBe(true);
  });
});
