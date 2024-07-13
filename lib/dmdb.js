'use strict';

const dmdb = require('dmdb');
const _ = require('lodash');
const utils = require('./utils');
const QueryBuilder = require('./query-builder');
class DMDB {
  constructor(config) {
    this.config = config;
    if (!config.connection && !config.connection) {
      throw new Error('no connection config set');
    }
    this.executeDefaultOptions = {
      autoCommit: true,
      compatibleMode: 'mysql',
      extendedMetaData: true,
      outFormat: dmdb.OUT_FORMAT_OBJECT,
    }
    this.pool = null;
    this.conn = null;
    this.tablespace = this.config.tablespace || '';
  }

  async init () {
    if (!this.pool) {
      try {
        const {user, pwd, host, port} = this.config.connection;
        this.pool = await dmdb.createPool({
          connectString: `dm://${user}:${pwd}@${host}:${port}?autoCommit=false&loginEncrypt=false`,
          poolMax: 10,
          poolMin: 1,
        });
      } catch (err) {
        throw new Error("createPool error: " + err.message);
      }
    }

    if (!this.conn) {
      try {
        this.conn = await this.pool.getConnection();
      } catch (err) {
        throw new Error("getConnection error: " + err.message);
      }
    }
  }

  async client () {
    await this.init();
    return this.conn;
  }
}

DMDB.prototype.readLob = async function (lob) {
  if (!lob) {
    return lob;
  }
	const data = await new Promise(function (resolve, reject) {
		var blobData = Buffer.alloc(0);
    var totalLength = 0;
		lob.on('data', function (chunk) {
			totalLength += chunk.length;
			blobData = Buffer.concat([blobData, chunk], totalLength);
		});
		lob.on('error', function (err) {
			reject(err);
		});
    lob.on('end', function () {
      const str = blobData.toString();
			resolve(str);
		});
  });
  lob.close();
  return data;
}


DMDB.prototype.create = async function (table, data) {
  try {
    const client = await this.client();
    const {sql, values} = utils.initInsertSql(this.tablespace, table, data); 
    const res = await client.execute(sql, values, {autoCommit: true});
    return res;
  } catch (error) {
    throw new Error("insert data error: " + error.message);
  }
}

DMDB.prototype.bulkCreate = async function (table, data) {
  const client = await this.client();
  const tableName = utils.getTableName(this.tablespace, table);
  // 达梦数据库。默认自增列无法赋值，如果需要对自增列赋值，需要指定和设置 `indentity_insert` 参数
  await client.execute(`SET IDENTITY_INSERT ${tableName} on;`);
  await client.execute(`commit;`);
  // // 清空达梦的数据表
  // await client.execute(`truncate table ${tableName};`);
  // await client.execute(`commit;`);

  const errors = [];
  const result = await Promise.all(data.map(async (v) => {
    const {sql, values} = utils.initInsertSql(this.tablespace, table, v);
    try {
      const res = await this.conn.execute(sql, values, {autoCommit: true});
      return res;
    } catch (error) {
      errors.push({error: error.message, rows: v})
    }
  }));
  return {success: result.length, err: errors};
};

DMDB.prototype.asynMySQLTable = async function (mysqlConfig, mysqlTable, dmTable) {
  let limit = 100;
  let offset = 0;
  let count = 10;
  let mysqlTotal = 0;
  let asyncSuccessTotal = 0;
  let errs = [];
  do {
    const data = await getMySQLData(mysqlConfig, mysqlTable, limit, offset);
    const {success, errors = []} = await this.bulkCreate(dmTable, data);
    count = data.length;
    offset += limit;
    mysqlTotal += count;
    asyncSuccessTotal = asyncSuccessTotal + success - errors.length;
    if (errors.length) {
      errs.push(...errors);
    }
  } while (count !== 0);
  console.log(`-------mysql数据总共: ${mysqlTotal}条, 同步成功: ${asyncSuccessTotal}条----`);
  console.log(errs);
  return {mysqlTotal, asyncSuccessTotal, errs}
}


DMDB.prototype.select = async function (table, criteria) {
  const queryBuilder = new QueryBuilder(this.tablespace, table, criteria);
  const sql = queryBuilder.getQueryString();
  try {
    const client = await this.client();
    const {metaData, rows} = await client.execute(sql, [], this.executeDefaultOptions);
    const lobProperties = metaData.filter(v => v.dbTypeName === 'TEXT').map(v => v.name);
    const result = await Promise.all(rows.map(async (v) => {
      await Promise.all(lobProperties.map(async (lp) => {
        var data = await this.readLob(v[lp]);
        v[lp] = data;
      }));
      return v;
    }));
    return result;
  } catch (error) {
    throw new Error("select data error: " + error.message);
  }
};

DMDB.prototype.sendNativeQuery = async function (sql, values) {
  try {
    const client = await this.client();
    const result = await client.execute(sql, values, this.executeDefaultOptions);
    return result;
  } catch (error) {
    throw new Error("sendNativeQuery error: " + error.message);
  }
}

async function getMySQLData (mysqlConfig, table, limit = 10, offset = 0) {
  const knex = require('knex')({client: 'mysql2', ...mysqlConfig});
  const query = knex.select().from(table);
  if (limit) query.limit(limit);
  if (offset) query.offset(offset);
  return await query;
}

module.exports = DMDB;