import dmdb, { Connection } from "dmdb";
import * as query from '../query';
import { Criteria } from "../query/private/QueryBuilder";
import { Knex } from "knex";
import { MySQLDriver } from "./mysqlDriver";

interface DMOPtions {
  caseSensitive?: boolean,
  debug?: boolean
}

interface ConnectionConfig {
  user: string
  password: string
  host: string
  port: string
}

export interface DmConfig {
  connection: ConnectionConfig
  tablespace: string,
  options?: DMOPtions
}

const executeDefaultOptions = {
  autoCommit: true,
  compatibleMode: 'mysql',
  extendedMetaData: true,
  outFormat: dmdb.OUT_FORMAT_OBJECT,
}

export class DMDB {
  private connection: ConnectionConfig
  private tablespace: string
  private caseSensitive: boolean
  private debug: boolean
  private pool: dmdb.Pool | null
  private conn: Promise<Connection> | null
  constructor(config: DmConfig) {
    this.connection = config.connection;
    this.tablespace = config.tablespace;
    this.caseSensitive = config?.options?.caseSensitive ?? true
    this.debug = config?.options?.debug ?? true
    this.pool = null
    this.conn = null
  }

  private async init() {
    if (!this.pool) {
      const { user, password, host, port } = this.connection;
      this.pool = await dmdb.createPool({
        connectString: `dm://${user}:${password}@${host}:${port}?autoCommit=false&loginEncrypt=false`,
        poolMax: 10,
        poolMin: 1,
      });
    }
    if (!this.conn) {
      this.conn = this.pool.getConnection()
    }
  }

  async getClient() {
    await this.init();
    return this.conn;
  }

  async readLob(lob: any) {
    if (!lob) return lob;

    return new Promise((resolve, reject) => {
      let blobData = Buffer.alloc(0);
      let totalLength = 0;
      lob.on('data',( chunk: any) => {
        totalLength += chunk.length;
        blobData = Buffer.concat([blobData, chunk], totalLength);
      })
      lob.on('error', (err: any) => reject(err));
      lob.on('end', () => resolve(blobData.toString()));
    }).finally(() => lob.close())
  }

  async create(table: string, data: Record<string, any>) {
    try {
      const client = await this.getClient();
      const { sql, values } = query.Create(this.tablespace, table, data, this.caseSensitive);
      if (this.debug) {
        console.info('--debug info sql--: ', sql);
        console.info('--debug info values--: ', values);
      }
      const result = await client!.execute(sql, values);
      await client!.execute(`commit;`);
      return result;
    } catch (error: any) {
      throw new Error("insert data error: " + error.message);
    }
  }

  async bulkCreate(table: string, data: Record<string, any>[]) {
    const errorsData: any[] = [];
    let result: any[] = [];
    let client;
    try {
      client = await this.getClient();
      const tableName = query.getTableName(this.tablespace, table, this.caseSensitive);
      // 达梦数据库。默认自增列无法赋值，如果需要对自增列赋值，需要指定和设置 `indentity_insert` 参数
      await client!.execute(`SET IDENTITY_INSERT ${tableName} on;`);
      await client!.execute(`commit;`);
      // 这里可以使用批量创建，就是execute的第二个参数可以传递一个二维数组，但是如果批量同步mysql的数据的时候，错误的数据没同步过去的就没办法记录下来。
      result = await Promise.all(data.map(async (v) => {
        try {
          const { sql, values } = query.Create(this.tablespace, table, v, this.caseSensitive);
          if (this.debug) {
            console.info('--debug info sql--: ', sql);
            console.info('--debug info values--: ', values);
          }
          const res = await client!.execute(sql, values, {autoCommit: true});
          return res;
        } catch (error: any) {
          errorsData.push({error: error.message, rows: v})
        }
      }));
    } catch (error: any) {
      throw new Error("bulk create data error: " + error.message);
    }
    return {success: result.length, errorsData};
  };

  async find(table: string, criteria: Criteria) {
    const sql = query.Find(this.tablespace, table, criteria, this.caseSensitive);
    if (this.debug) {
      console.info('--debug info sql--: ', sql);
    }
    try {
      const client = await this.getClient();
      const data = await client!.execute(sql, [], executeDefaultOptions);
      let rows: any[] = data.rows as any[];
      if (!rows.length) return [];

      const metaData: any[] = data.metaData as any[];
      // 对于text类型的数据，达梦数据库返回的是一个lob对象，需要特殊处理才能转变成字符串
      const lobProperties = metaData!.filter(v => v.dbTypeName === 'TEXT').map(v => v.name);
      const result = await Promise.all(rows!.map(async (v: any) => {
        await Promise.all(lobProperties.map(async (lp) => {
          var data = await this.readLob(v[lp]);
          v[lp] = data;
        }));
        return v;
      }));
      return result;
    } catch (error: any) {
      throw new Error("select data error: " + error.message);
    }
  }

  async update(table: string, criteria: Criteria, data: Record<string, any>) {
    try {
      const client = await this.getClient();
      const { sql, values } = query.Update(this.tablespace, table, criteria, data, this.caseSensitive);
      if (this.debug) {
        console.info('--debug info sql--: ', sql);
        console.info('--debug info values--: ', values);
      }
      const result = await client!.execute(sql, values);
      await client!.execute('commit;')
      return result;
    } catch (error: any) {
      throw new Error("update data error: " + error.message);
    }
  }

  async delete(table: string, criteria: Criteria) {
    try {
      const client = await this.getClient();
      const sql = query.Delete(this.tablespace, table, criteria);
      if (this.debug) {
        console.info('--debug info sql--: ', sql);
      }
      const result = await client!.execute(sql);
      await client!.execute(`commit;`);
      return result;
    } catch (error: any) {
      throw new Error("delete data error: " + error.message);
    }
  }

  async sendNativeQuery(sql: string, values: any[] = []) {
    try {
      const client = await this.getClient();
      const result = await client!.execute(sql, values, executeDefaultOptions);
      return result;
    } catch (error: any) {
      throw new Error("sendNativeQuery error: " + error.message);
    }
  }

  async asynMySQLTable (mysqlConfig: Knex.Config, mysqlTable: string, dmTable: string) {
    let limit = 100;
    let offset = 0;
    let count = 10;
    let mysqlTotal = 0;
    let asyncSuccessTotal = 0;
    let errs = [];
    
    const mysqlDriver = new MySQLDriver(mysqlConfig);
    do {
      const data = await mysqlDriver.select(mysqlTable, {}, limit, offset);
      const {success, errorsData = []} = await this.bulkCreate(dmTable, data);
      count = data.length;
      offset += limit;
      mysqlTotal += count;
      asyncSuccessTotal = asyncSuccessTotal + success - errorsData.length;
      if (errorsData.length) {
        errs.push(...errorsData);
      }
    } while (count !== 0);
    console.log(`-------mysql数据总共: ${mysqlTotal}条, 同步成功: ${asyncSuccessTotal}条----`);
    console.log(errs);
    return {mysqlTotal, asyncSuccessTotal, errs}
  }
}