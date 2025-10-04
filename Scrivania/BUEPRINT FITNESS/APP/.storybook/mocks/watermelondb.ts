// Mock implementation for WatermelonDB to prevent Node.js dependency issues in Storybook

export class Model {
  id: string = 'mock-id';
  _raw: any = {};

  constructor() {}

  observe() {
    return {
      subscribe: () => ({ unsubscribe: () => {} })
    };
  }
}

export class Database {
  constructor() {}

  get() {
    return {
      query: () => ({
        observe: () => ({
          subscribe: () => ({ unsubscribe: () => {} })
        }),
        fetch: () => Promise.resolve([])
      })
    };
  }
}

export class Collection {
  constructor() {}

  query() {
    return {
      observe: () => ({
        subscribe: () => ({ unsubscribe: () => {} })
      }),
      fetch: () => Promise.resolve([])
    };
  }

  find() {
    return Promise.resolve(new Model());
  }

  create() {
    return Promise.resolve(new Model());
  }
}

export const Q = {
  where: () => ({}),
  and: () => ({}),
  or: () => ({}),
  sortBy: () => ({}),
  take: () => ({}),
  skip: () => ({}),
};

export function appSchema() {
  return {};
}

export function tableSchema() {
  return {};
}

// Decorators
export function field() {
  return function(target: any, propertyKey: string) {};
}

export function date() {
  return function(target: any, propertyKey: string) {};
}

export function readonly() {
  return function(target: any, propertyKey: string) {};
}

export function text() {
  return function(target: any, propertyKey: string) {};
}

export function json() {
  return function(target: any, propertyKey: string) {};
}

export function relation() {
  return function(target: any, propertyKey: string) {};
}

export function children() {
  return function(target: any, propertyKey: string) {};
}

// SQLite Adapter Mock
export class SQLiteAdapter {
  constructor() {}
}

export const mockAdapter = SQLiteAdapter;

export default {
  Model,
  Database,
  Collection,
  Q,
  appSchema,
  tableSchema,
  field,
  date,
  readonly,
  text,
  json,
  relation,
  children,
  SQLiteAdapter,
};