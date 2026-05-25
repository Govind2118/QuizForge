type DocData = Record<string, unknown>;

export class MockDocSnapshot {
  constructor(
    readonly id: string,
    readonly exists: boolean,
    private readonly docData?: DocData,
  ) {}

  data() {
    return this.docData;
  }

  get(field: string) {
    return this.docData?.[field];
  }
}

export class MockDocRef {
  constructor(
    private readonly store: MockFirestore,
    readonly collectionName: string,
    readonly id: string,
  ) {}

  async get() {
    return this.store.getDoc(this.collectionName, this.id);
  }

  async set(data: DocData) {
    this.store.setDoc(this.collectionName, this.id, data);
  }

  async delete() {
    this.store.deleteDoc(this.collectionName, this.id);
  }
}

class MockQuery {
  private orderByField?: string;
  private orderDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private readonly store: MockFirestore,
    private readonly collectionName: string,
    private readonly filters: Array<{ field: string; op: string; value: unknown }>,
  ) {}

  orderBy(field: string, direction: 'asc' | 'desc' = 'desc') {
    this.orderByField = field;
    this.orderDirection = direction;
    return this;
  }

  async get() {
    return this.store.query(this.collectionName, this.filters, this.orderByField, this.orderDirection);
  }
}

class MockCollectionRef {
  constructor(
    private readonly store: MockFirestore,
    private readonly name: string,
  ) {}

  doc(id?: string) {
    const docId = id ?? this.store.generateId();
    return new MockDocRef(this.store, this.name, docId);
  }

  where(field: string, op: string, value: unknown) {
    return new MockQuery(this.store, this.name, [{ field, op, value }]);
  }
}

export class MockTransaction {
  private readonly writes: Array<() => void> = [];

  constructor(private readonly store: MockFirestore) {}

  async get(ref: MockDocRef) {
    return ref.get();
  }

  set(ref: MockDocRef, data: DocData) {
    this.writes.push(() => this.store.setDoc(ref.collectionName, ref.id, data));
  }

  create(ref: MockDocRef, data: DocData) {
    this.writes.push(() => {
      const existing = this.store.getDoc(ref.collectionName, ref.id);
      if (existing.exists) throw new Error(`Document ${ref.collectionName}/${ref.id} already exists.`);
      this.store.setDoc(ref.collectionName, ref.id, data);
    });
  }

  delete(ref: MockDocRef) {
    this.writes.push(() => this.store.deleteDoc(ref.collectionName, ref.id));
  }

  commit() {
    for (const write of this.writes) write();
  }
}

export class MockFirestore {
  private readonly data = new Map<string, Map<string, DocData>>();
  private idCounter = 0;

  collection(name: string) {
    return new MockCollectionRef(this, name);
  }

  generateId() {
    this.idCounter += 1;
    return `quiz-${this.idCounter}`;
  }

  getDoc(collection: string, id: string) {
    const docData = this.data.get(collection)?.get(id);
    if (!docData) return new MockDocSnapshot(id, false);
    return new MockDocSnapshot(id, true, { ...docData });
  }

  setDoc(collection: string, id: string, data: DocData) {
    if (!this.data.has(collection)) this.data.set(collection, new Map());
    this.data.get(collection)!.set(id, { ...data });
  }

  deleteDoc(collection: string, id: string) {
    this.data.get(collection)?.delete(id);
  }

  query(
    collection: string,
    filters: Array<{ field: string; op: string; value: unknown }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
  ) {
    const col = this.data.get(collection) ?? new Map<string, DocData>();
    let docs = [...col.entries()].map(([id, data]) => new MockDocSnapshot(id, true, { ...data }));

    for (const { field, op, value } of filters) {
      if (op === '==') docs = docs.filter((doc) => doc.data()?.[field] === value);
    }

    if (orderByField) {
      docs.sort((left, right) => {
        const leftValue = String(left.data()?.[orderByField] ?? '');
        const rightValue = String(right.data()?.[orderByField] ?? '');
        const result = leftValue.localeCompare(rightValue);
        return orderDirection === 'asc' ? result : -result;
      });
    }

    return { docs };
  }

  async runTransaction<T>(fn: (tx: MockTransaction) => Promise<T>) {
    const tx = new MockTransaction(this);
    const result = await fn(tx);
    tx.commit();
    return result;
  }

  clear() {
    this.data.clear();
    this.idCounter = 0;
  }
}

export function createMockFirestore() {
  return new MockFirestore();
}

export const mockDb = createMockFirestore();

export function resetMockDb() {
  mockDb.clear();
}
