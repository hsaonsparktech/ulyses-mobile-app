import { create } from "zustand";
import { sampleTransactions } from "./data/sampleTransactions";
import type { Transaction } from "./types";

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, "id" | "formattedAmount">) => void;
  archiveTransaction: (id: string) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: sampleTransactions,
  addTransaction: (data) => {
    const id = `tx-${Date.now()}`;
    const sign = data.type === "Income" ? "+" : "−";
    const formattedAmount = `${sign}$${data.amount.toFixed(2)}`;
    const newTx: Transaction = {
      id,
      formattedAmount,
      ...data,
      archived: false,
    };
    set((state) => ({
      transactions: [newTx, ...state.transactions],
    }));
  },
  archiveTransaction: (id: string) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, archived: true } : tx,
      ),
    }));
  },
}));
