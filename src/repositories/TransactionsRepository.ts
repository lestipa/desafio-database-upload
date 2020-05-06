import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionWithBalance {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async all(): Promise<TransactionWithBalance> {
    const transactions = await this.find({ relations: ['category'] });

    const transactionsWithBalance = {
      transactions,
      balance: await this.getBalance(),
    };

    return transactionsWithBalance;
  }

  public typeValid(type: string): boolean {
    const typeValid = type === 'income' || type === 'outcome';

    return typeValid;
  }

  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const incomesTotal: number = transactions.reduce(
      (total, elemento): number => {
        if (elemento.type === 'income') {
          const parcial = total + Number(elemento.value);
          return parcial;
        }
        return total;
      },
      0,
    );

    const outcomesTotal: number = transactions.reduce((total, elemento) => {
      if (elemento.type === 'outcome') {
        const parcial = total + Number(elemento.value);
        return parcial;
      }
      return total;
    }, 0);

    const balance = {
      income: incomesTotal,
      outcome: outcomesTotal,
      total: incomesTotal - outcomesTotal,
    };

    return balance;
  }
}

export default TransactionsRepository;
