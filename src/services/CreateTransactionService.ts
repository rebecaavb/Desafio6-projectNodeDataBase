import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError(`O tipo '${type}' é inválido!`);
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError(
        'Não é possível realizar uma transação de saída com valor maior que o total disponível',
      );
    }

    const categoriesRepository = getRepository(Category);

    let categoryEntity = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryEntity) {
      categoryEntity = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(categoryEntity);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryEntity,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
