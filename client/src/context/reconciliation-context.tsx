import { createContext, useContext, useReducer, ReactNode } from "react";
import { type ReconciliationData, type CashBoxFormData } from "@shared/schema";

type ReconciliationAction =
  | { type: "SET_TOTAL_CASH_BOXES"; payload: number }
  | { type: "ADD_CASH_BOX"; payload: CashBoxFormData }
  | { type: "UPDATE_CASH_BOX"; payload: { index: number; data: CashBoxFormData } }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_CURRENT_CASH_BOX_INDEX"; payload: number }
  | { type: "RESET" };

const initialState: ReconciliationData = {
  totalCashBoxes: 0,
  cashBoxes: [],
  currentStep: 1,
  currentCashBoxIndex: 0,
};

function reconciliationReducer(state: ReconciliationData, action: ReconciliationAction): ReconciliationData {
  switch (action.type) {
    case "SET_TOTAL_CASH_BOXES":
      return {
        ...state,
        totalCashBoxes: action.payload,
        cashBoxes: Array(action.payload).fill(null).map(() => ({
          date: "",
          workerName: "",
          shift: 1,
          valeAmount: 0,
          breakdown: {
            "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0,
            "5": 0, "2": 0, "1": 0, "0.50": 0, "0.20": 0, "0.10": 0,
            "0.05": 0, "0.02": 0, "0.01": 0
          }
        }))
      };
    case "ADD_CASH_BOX":
      return {
        ...state,
        cashBoxes: [...state.cashBoxes, action.payload]
      };
    case "UPDATE_CASH_BOX":
      return {
        ...state,
        cashBoxes: state.cashBoxes.map((cashBox, index) =>
          index === action.payload.index ? action.payload.data : cashBox
        )
      };
    case "SET_CURRENT_STEP":
      return {
        ...state,
        currentStep: action.payload
      };
    case "SET_CURRENT_CASH_BOX_INDEX":
      return {
        ...state,
        currentCashBoxIndex: action.payload
      };

    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const ReconciliationContext = createContext<{
  state: ReconciliationData;
  dispatch: React.Dispatch<ReconciliationAction>;
} | null>(null);

export function ReconciliationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reconciliationReducer, initialState);

  return (
    <ReconciliationContext.Provider value={{ state, dispatch }}>
      {children}
    </ReconciliationContext.Provider>
  );
}

export function useReconciliation() {
  const context = useContext(ReconciliationContext);
  if (!context) {
    throw new Error("useReconciliation must be used within a ReconciliationProvider");
  }
  return context;
}
