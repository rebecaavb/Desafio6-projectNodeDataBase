import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions: Transaction[] = await this.find();

    const { income, outcome } = transactions.reduce(
      (accumulator: Balance, transaction: Transaction) => {
        const value = Number(
          transaction.value.toString().replace(/[^0-9.-]+/g, ''),
        );
        if (transaction.type === 'income') {
          accumulator.income += value;
        } else {
          accumulator.outcome += value;
        }

        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
