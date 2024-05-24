import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<
    Transaction[]
  > | null>(null)
  const [transactionStates, setTransactionStates] = useState<{ [id: string]: boolean }>({});

  const [hasMorePages, setHasMorePages] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!hasMorePages) return;

    const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
      "paginatedTransactions",
      {
        page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
      }
    )

    setPaginatedTransactions((previousResponse) => {
      if (response === null) {
        return previousResponse;
      }

      if (previousResponse === null) {
        return response;
      }

      const mergedData = {
        data: [...previousResponse.data, ...response.data],
        nextPage: response.nextPage,
      };

      if (response.nextPage === null) setHasMorePages(false);

      return mergedData;
    })
  }, [fetchWithCache, paginatedTransactions, hasMorePages])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
    setHasMorePages(true)
  }, []);

  const toggleApproval = useCallback((transactionId: string, newValue: boolean) => {
    setTransactionStates((previousStates) => ({
      ...previousStates,
      [transactionId]: newValue,
    }));
    
    setPaginatedTransactions((previousResponse) => {
      if (!previousResponse) return previousResponse;

      const updatedData = previousResponse.data.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, approved: !transaction.approved } : transaction
      );

      return { ...previousResponse, data: updatedData };
    });
  }, []);

  return { data: paginatedTransactions, loading, fetchAll, invalidateData, hasMorePages, toggleApproval, transactionStates }
}
