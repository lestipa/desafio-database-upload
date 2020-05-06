import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

import CreateTransactionService from './CreateTransactionService';
import Transaction from '../models/Transaction';

interface File {
  csvFilename: string;
}

interface TransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

async function loadCSV(csvFilePath: string): Promise<TransactionCSV[]> {
  try {
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: TransactionCSV[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      lines.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  } catch (error) {
    throw new AppError(error.message);
  }
}

class ImportTransactionsService {
  public async execute({ csvFilename }: File): Promise<Transaction[]> {
    const csvFile = path.join(uploadConfig.directory, csvFilename);

    const transactions = await loadCSV(csvFile);

    if (!transactions) throw new AppError('CSV file is empty!');

    const createTransaction = new CreateTransactionService();

    const transactionsDB: Transaction[] = [];

    await Promise.all(
      transactions.map(async (transaction: TransactionCSV) => {
        const { title, type, value, category } = transaction;

        const newTransaction = await createTransaction.execute({
          title,
          type,
          value,
          category,
        });

        transactionsDB.push(newTransaction);
      }),
    );

    await fs.promises.unlink(csvFile);

    return transactionsDB;
  }
}

export default ImportTransactionsService;
