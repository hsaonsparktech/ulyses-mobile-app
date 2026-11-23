import { fireEvent, render } from "@testing-library/react-native";
import { AiExtractionReview } from "@/components/ui/AiExtractionReview";
import { BusinessSwitcher } from "@/components/ui/BusinessSwitcher";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { FeedbackIcon, Icon, NavIcon, UtilityIcon } from "@/components/ui/Icon";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TransactionRow } from "@/components/ui/TransactionRow";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("Sprint 00B Shared Components", () => {
  test("StatusBadge renders all 5 verified Figma status variants", () => {
    const statuses = [
      "Paid",
      "Unpaid",
      "Overdue",
      "Draft",
      "AI Review",
    ] as const;

    for (const status of statuses) {
      const view = render(
        <ThemeProvider>
          <StatusBadge status={status} />
        </ThemeProvider>,
      );
      expect(view.getByText(status)).toBeTruthy();
      expect(view.getByRole("text")).toBeTruthy();
    }
  });

  test("MetricCard renders metric, formatted value and period", () => {
    const view = render(
      <ThemeProvider>
        <MetricCard metric="Income" value="$12,480" period="November · USD" />
      </ThemeProvider>,
    );
    expect(view.getByText("Income")).toBeTruthy();
    expect(view.getByText("$12,480")).toBeTruthy();
    expect(view.getByText("November · USD")).toBeTruthy();
  });

  test("TransactionRow renders expense and income rows with correct amount", () => {
    const onPress = jest.fn();
    const view = render(
      <ThemeProvider>
        <TransactionRow
          type="Expense"
          amount="−$128.40"
          merchant="Oak Street Supply"
          categoryDate="Office supplies · Nov 6"
          onPress={onPress}
        />
      </ThemeProvider>,
    );
    expect(view.getByText("Oak Street Supply")).toBeTruthy();
    expect(view.getByText("−$128.40")).toBeTruthy();
    expect(view.getByText("Office supplies · Nov 6")).toBeTruthy();
    fireEvent.press(view.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);

    view.rerender(
      <ThemeProvider>
        <TransactionRow
          type="Income"
          amount="+$4,200.00"
          merchant="Client Retainer"
          categoryDate="Client payment · Nov 5"
        />
      </ThemeProvider>,
    );
    expect(view.getByText("Client Retainer")).toBeTruthy();
    expect(view.getByText("+$4,200.00")).toBeTruthy();
  });

  test("BusinessSwitcher renders avatar initial, active label and toggles expanded", () => {
    const onPress = jest.fn();
    const view = render(
      <ThemeProvider>
        <BusinessSwitcher
          business="Acme Services"
          state="Closed"
          onPress={onPress}
        />
      </ThemeProvider>,
    );
    expect(view.getByText("A")).toBeTruthy();
    expect(view.getByText("Acme Services")).toBeTruthy();
    expect(view.getByText("ACTIVE BUSINESS")).toBeTruthy();
    expect(view.getByRole("button").props.accessibilityState.expanded).toBe(
      false,
    );

    fireEvent.press(view.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);

    view.rerender(
      <ThemeProvider>
        <BusinessSwitcher
          business="Acme Services"
          state="Expanded"
          onPress={onPress}
        />
      </ThemeProvider>,
    );
    expect(view.getByRole("button").props.accessibilityState.expanded).toBe(
      true,
    );
  });

  test("DocumentCard renders file type, filename and metadata", () => {
    const onPress = jest.fn();
    const view = render(
      <ThemeProvider>
        <DocumentCard
          filename="receipt_nov06.pdf"
          type="Receipt"
          status="Ready"
          date="Nov 6"
          onPress={onPress}
        />
      </ThemeProvider>,
    );
    expect(view.getByText("PDF")).toBeTruthy();
    expect(view.getByText("receipt_nov06.pdf")).toBeTruthy();
    expect(view.getByText("Receipt · Ready · Nov 6")).toBeTruthy();
    fireEvent.press(view.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("AiExtractionReview renders Needs Review and Confirmed states", () => {
    const view = render(
      <ThemeProvider>
        <AiExtractionReview state="Needs Review" />
      </ThemeProvider>,
    );
    expect(view.getByText("Review extraction")).toBeTruthy();
    expect(view.getByText("Vendor · Date · Amount · Category")).toBeTruthy();
    expect(
      view.getByText("Confirm before adding to your records."),
    ).toBeTruthy();

    view.rerender(
      <ThemeProvider>
        <AiExtractionReview state="Confirmed" businessName="Acme Services" />
      </ThemeProvider>,
    );
    expect(view.getByText("Extraction saved")).toBeTruthy();
    expect(view.getByText("Saved to Acme Services.")).toBeTruthy();
  });

  test("Icon components render vector SVGs correctly", () => {
    const view = render(
      <ThemeProvider>
        <Icon name="feedback/success" />
        <FeedbackIcon variant="success" />
        <FeedbackIcon variant="warning" />
        <FeedbackIcon variant="information" />
        <FeedbackIcon variant="processing" />
        <UtilityIcon name="chevron-down" />
        <UtilityIcon name="add" />
        <NavIcon destination="Home" state="Selected" />
        <NavIcon destination="Home" state="Default" />
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Feedback success")).toBeTruthy();
    expect(view.getByLabelText("Feedback warning")).toBeTruthy();
    expect(view.getByLabelText("Feedback information")).toBeTruthy();
    expect(view.getByLabelText("Feedback processing")).toBeTruthy();
    expect(view.getByLabelText("Utility chevron-down")).toBeTruthy();
    expect(view.getByLabelText("Utility add")).toBeTruthy();
    expect(view.getAllByLabelText("Home navigation icon")).toHaveLength(2);
  });
});
