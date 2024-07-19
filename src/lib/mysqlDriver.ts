import knex, { Knex } from 'knex';

export class MySQLDriver {
  private config: Knex.Config;
  constructor(config: Knex.Config) {
    this.config = config;
    this.config.client = 'mysql2';
  }

  async select(table: string, where?: Record<string, any>, limit?: number, offset?: number) {
    const db = knex(this.config);
    const query = db.select().from(table);
    if (where) query.where(where);
    if (limit) query.limit(limit);
    if (offset) query.offset(offset);
    return await query;
  }
}
