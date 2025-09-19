import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user) {
      const savedTransactions = localStorage.getItem(`moneymind_transactions_${user.id}`);
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    }
  }, [user]);

  const addTransaction = (transactionData) => {
    const { months, ...baseTransaction } = transactionData;
    const isRecurring = baseTransaction.type === 'receita_continua' || baseTransaction.type === 'debito_automatico';
    const newTransactions = [];
    const group_id = Date.now().toString();

    if (isRecurring && months > 1) {
      for (let i = 0; i < months; i++) {
        const transactionDate = new Date();
        transactionDate.setMonth(transactionDate.getMonth() + i);
        
        newTransactions.push({
          id: `${group_id}-${i}`,
          userId: user.id,
          ...baseTransaction,
          createdAt: transactionDate.toISOString(),
          group_id: group_id,
          installment: `${i + 1}/${months}`
        });
      }
    } else {
      newTransactions.push({
        id: group_id,
        userId: user.id,
        ...baseTransaction,
        createdAt: new Date().toISOString(),
        group_id: group_id,
      });
    }

    const updatedTransactions = [...transactions, ...newTransactions];
    setTransactions(updatedTransactions);
    localStorage.setItem(`moneymind_transactions_${user.id}`, JSON.stringify(updatedTransactions));

    return newTransactions;
  };

  const deleteTransaction = (id) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    let updatedTransactions;

    if (transactionToDelete && transactionToDelete.group_id) {
      updatedTransactions = transactions.filter(t => t.group_id !== transactionToDelete.group_id);
    } else {
      updatedTransactions = transactions.filter(t => t.id !== id);
    }
    
    setTransactions(updatedTransactions);
    localStorage.setItem(`moneymind_transactions_${user.id}`, JSON.stringify(updatedTransactions));
  };

  const getBalance = () => {
    const now = new Date();
    return transactions
      .filter(t => new Date(t.createdAt) <= now)
      .reduce((total, transaction) => {
        if (transaction.type === 'receita' || transaction.type === 'receita_continua') {
          return total + transaction.amount;
        } else {
          return total - transaction.amount;
        }
      }, 0);
  };

  const getTransactionsByType = (type) => {
    return transactions.filter(t => t.type === type);
  };

  const getTransactionsByCategory = () => {
    const categories = {};
    transactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = {
          name: transaction.category,
          income: 0,
          expense: 0
        };
      }

      if (transaction.type === 'receita' || transaction.type === 'receita_continua') {
        categories[transaction.category].income += transaction.amount;
      } else {
        categories[transaction.category].expense += transaction.amount;
      }
    });

    return Object.values(categories);
  };

  const getRecurringTransactions = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    return transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return (t.type === 'receita_continua' || t.type === 'debito_automatico') &&
             transactionDate >= nextMonth && transactionDate <= endOfNextMonth;
    });
  };

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    getBalance,
    getTransactionsByType,
    getTransactionsByCategory,
    getRecurringTransactions
  };
};

