import csvParse from 'csv-parse';
import fs from 'fs';

interface CsvTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface ResponseCSV {
  transactions: CsvTransaction[];
  categories: string[];
}

export default async function loadCSV(filePath: string): Promise<ResponseCSV> {
  // lendo arquivo .csv
  const readCSVStream = fs.createReadStream(filePath);

  // especificando onde começar a ler o arquivo e removendo espaçamento da esquerda e direita
  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  // sempre que tiver uma informação disponível, deve enviá-la para a nossa outra stream (parseStream)
  const parseCSV = readCSVStream.pipe(parseStream);

  const transactions: CsvTransaction[] = [];
  const categories: string[] = [];

  // nessa linha estamos ouvindo as novas informações obtidas do arquivo CSV
  parseCSV.on('data', line => {
    const [title, type, value, category] = line.map((cell: string) =>
      cell.trim(),
    );

    // se algum deles não existir
    if (!title || !type || !value) return;

    categories.push(category);
    transactions.push({ title, type, value, category });
  });

  // quando o evento end for emitido, exibir resultados
  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  // verificando final da leitura
  // parseCSV.on('end', () => {
  //   console.log('Leitura do CSV finalizada!');
  // });

  return {
    transactions,
    categories,
  };
}

/**
 * 1. Criamos uma função chamada `loadCSV` pois assim podemos transforma-la em uma função assíncrona `async`
 * para conseguir usar o `await`;
 * 2. Criamos um array que armazenará os dados das linhas ao invés de utiliza-los assim que disponíveis
 * dentro do método `parseCSV.on('data', () => { ... })`;
 * 3. Criamos uma Promise e a marcamos como resolvida (finalizada com sucesso) assim que recebermos
 * o evento `end` do `parseCSV` que indica que a leitura foi finalizada. A criação dessa Promise nos permitiu utilizar
 * o método `await` para aguardar a leitura completa antes de retornar os dados lidos no final da função.
 * */
