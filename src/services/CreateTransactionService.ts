import { getRepository, getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (!transactionsRepository.typeValid(type)) {
      throw new AppError('This type is invalid');
    }

    const categoriesRepository = getRepository(Category);

    let categoryExists = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categoryExists) {
      categoryExists = categoriesRepository.create({ title: category });

      await categoriesRepository.save(categoryExists);
    }

    // const category_id = categoryExists.id;

    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('Insufficient funds for this operation');
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: categoryExists,
      // category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
