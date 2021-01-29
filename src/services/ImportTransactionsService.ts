import path from 'path';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import loadCSV from '../imports/ImportCSV';
import uploadConfig from '../config/upload';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    // montando caminho da possível imagem do usuário
    const csvFilePath = path.join(uploadConfig.directory, filename);

    // verificando se o arquivo existe no projeto
    const csvFileExists = await fs.promises.stat(csvFilePath);

    if (csvFileExists) {
      const { transactions, categories } = await loadCSV(csvFilePath);
      const categoriesRepository = getRepository(Category);
      const transactionsRepository = getCustomRepository(
        TransactionsRepository,
      );

      const existentCategories = await categoriesRepository.find({
        where: {
          title: In(categories),
        },
      });

      const newCategoriesTitles = categories
        .filter(
          category =>
            // filtrando pelos títulos de categorias novas e filtrando pelos registros dubplicados
            !existentCategories
              .map(categoryEntity => categoryEntity.title)
              .includes(category),
        )
        .filter((value, index, self) => self.indexOf(value) === index);

      const newCategories = categoriesRepository.create(
        newCategoriesTitles.map(title => ({
          title,
        })),
      );

      await categoriesRepository.save(newCategories);

      const finalCategories = [...newCategories, ...existentCategories];

      const createdTransactions = transactionsRepository.create(
        transactions.map(transaction => ({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: finalCategories.find(
            category => category.title === transaction.category,
          ),
        })),
      );

      await transactionsRepository.save(createdTransactions);

      await fs.promises.unlink(csvFilePath);

      return createdTransactions;
    }

    return [];
  }
}

export default ImportTransactionsService;
