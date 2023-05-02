import { DataSource, EntityManager, Repository } from 'typeorm';
import { Document } from './models/Document';

export class DocumentService {
  #Documents: Repository<Document>;
  #userId: number;

  constructor(dataSource: DataSource | EntityManager, userId: number) {
    this.#Documents = dataSource.getRepository(Document);
    this.#userId = userId;
  }

  create({ type, typeId }: Pick<Document, 'type' | 'typeId'>) {
    return this.#Documents.save({
      type,
      typeId,
      creator: {
        id: this.#userId,
      },
    });
  }
}
