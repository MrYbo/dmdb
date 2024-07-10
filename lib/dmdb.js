'use strict';

const dmdb = require('dmdb');
const _ = require('lodash');
const utils = require('./utils');
const QueryBuilder = require('./utils/query-builder');
class DMDB {
  constructor(config) {
    this.config = config;
    if (!config.client && !config.clients) {
      throw new Error('no client config set');
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
        const {user, pwd, host, port} = this.config.client;
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

  const datas = _.chunk(data, 10);
  const {sql} = utils.initInsertSql(this.tablespace, table, data[0]);
  const result = await Promise.all(data.map(async (v) => {
    const values = datas.map(d => {
      const {values} = utils.insertParamsFormat(d);
      return values;
    })
    try {
      res = await client.execute(sql, values, {autoCommit: true});
    } catch (error) {
      throw new Error("bulkCreate error: " + error.message);
    }
    return res;
  }));
  return result;
};


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



module.exports = DMDB;