import { DMDB, DmConfig } from '../../src/lib/DmdbDriver';
import { Knex } from 'knex';
const dmconfig: DmConfig = {
  connection: {
    user: 'SYSDBA',
    password: 'SYSDBA001',
    host: '127.0.0.1',
    port: '30236',
  },
  tablespace: 'HUI',
  options: {
    caseSensitive: true,
  },
};

const sqlconfig: Knex.Config = {
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'hui',
  },
};

(async () => {
  const dmdb = new DMDB(dmconfig);
  const table = 'event';
  await dmdb.asynMySQLTable(sqlconfig, table, table);
})();
