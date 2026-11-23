import { create } from "zustand";
import {
  sampleAiMessages,
  sampleSuggestions,
} from "./data/sampleAiConversations";
import type { AiMessage, AiSuggestion } from "./types";

interface AiStoreState {
  messages: AiMessage[];
  suggestions: AiSuggestion[];
  isThinking: boolean;
  sendMessage: (text: string) => void;
  clearConversation: () => void;
}

export const useAiStore = create<AiStoreState>((set, _get) => ({
  messages: sampleAiMessages,
  suggestions: sampleSuggestions,
  isThinking: false,

  sendMessage: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: AiMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      text: trimmed,
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isThinking: true,
    }));

    // Simulate AI financial analysis response
    setTimeout(() => {
      let replyText = "I analyzed your ledger records for this inquiry.";
      let card: AiMessage["insightCard"] | undefined;

      const lower = trimmed.toLowerCase();
      if (lower.includes("vendor") || lower.includes("expense")) {
        replyText =
          "Here are your highest vendor expense categories for the current period:";
        card = {
          title: "Top 3 Vendor Expenses",
          metrics: [
            { label: "1. AWS Cloud Infrastructure", value: "$4,210.00" },
            { label: "2. Office Depot Supplies", value: "$1,840.50" },
            { label: "3. Delta Air Travel", value: "$1,120.00" },
          ],
          actionLabel: "View All Vendors",
        };
      } else if (lower.includes("invoice") || lower.includes("overdue")) {
        replyText = "You currently have 2 invoices awaiting customer payment:";
        card = {
          title: "Outstanding Invoices",
          metrics: [
            {
              label: "INV-0239 (Acme Retail Co)",
              value: "$2,450.00 (Due today)",
            },
            {
              label: "INV-0240 (Jackson Creative)",
              value: "$1,850.00 (Due in 4 days)",
            },
          ],
          actionLabel: "Send Reminders",
        };
      } else if (lower.includes("tax") || lower.includes("liability")) {
        replyText =
          "Based on $48,920 quarterly net revenue and current deductions, your estimated tax breakdown is:";
        card = {
          title: "Estimated Q4 Tax Reserve",
          metrics: [
            { label: "Federal Estimated Tax", value: "$6,840.00" },
            { label: "State Estimated Tax (CA)", value: "$2,210.00" },
            { label: "Total Recommended Reserve", value: "$9,050.00" },
          ],
          actionLabel: "Download Tax Schedule",
        };
      } else {
        replyText = `Analysis complete for: "${trimmed}". All accounting ledgers and tax records have been cross-checked with 0 discrepancy warnings.`;
      }

      const botMsg: AiMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: replyText,
        insightCard: card,
      };

      set((state) => ({
        messages: [...state.messages, botMsg],
        isThinking: false,
      }));
    }, 1000);
  },

  clearConversation: () => {
    set({
      messages: sampleAiMessages.slice(0, 1) as AiMessage[],
      isThinking: false,
    });
  },
}));
