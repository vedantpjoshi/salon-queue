declare module 'sql.js' {
  export interface Database {
    prepare(sql: string): Statement;
    run(sql: string, params?: unknown[]): void;
    exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
    export(): Uint8Array;
  }

  interface Statement {
    bind(values?: unknown): void;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }

  interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export default function initSqlJs(): Promise<SqlJsStatic>;
}
