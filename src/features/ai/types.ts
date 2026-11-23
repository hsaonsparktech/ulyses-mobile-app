export interface AiMessage {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  text: string;
  insightCard?: {
    title: string;
    metrics: { label: string; value: string; change?: string }[];
    actionLabel?: string;
  };
}

export interface AiSuggestion {
  id: string;
  prompt: string;
  category: "tax" | "vendors" | "invoices" | "cashflow";
}
