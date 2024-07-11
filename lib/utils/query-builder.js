const _ = require('lodash');
const knex = require('knex')({
  client: 'mysql2', // 选择MySQL客户端
  connection: {},
  useNullAsDefault: true
});

class QueryBuilder {
  constructor(tablespace, table, criteria) {
    this.tableName = getTableName(tablespace, table);
    this.criteria = criteria;
    this.query = knex(`${this.tableName} t1`);
  }

  getQueryString () {
    this.query.select();
    if (this.criteria.select) {
      const s = getSelect('t1', this.criteria.select);
      this.query.select(s);
    };

    if (this.criteria.where) {
      buildWhereClause(this.query, 't1', this.criteria.where);
    }

    if (this.criteria.limit) {
      this.query.limit(this.criteria.limit);
    }
    if (this.criteria.offset) {
      this.query.offset(this.criteria.offset);
    }

    let sql = this.query.toQuery();
    sql = sql.replaceAll('`', '');
    console.log(sql);
    return sql;
  }

}

module.exports = QueryBuilder;



/**
 * 初始化查询字段
 * @param {*} alias 
 * @param {*} select 
 * @returns 
 */
function getSelect (alias, select) {
  let _select = `${alias}.*`;
  if (select && _.isArray(select)) {
    _select = select.map(v => `${alias}."${v}"`);
  }
  return _select;
}

function getTableName (tablespace, table) {
  const _table = `"${table}"`;
  return tablespace ? tablespace + '.' + _table : _table;;
}

function buildWhereClause(knexQuery, alias, where) {
  Object.keys(where).forEach(key => {
    const value = where[key];
    if (key === 'and' && Array.isArray(value)) {
      knexQuery.andWhere(function() {
        value.forEach(condition => {
          this.andWhere(function() {
            buildWhereClause(this, alias, condition);
          });
        });
      });
    } else if (key === 'or' && Array.isArray(value)) {
      knexQuery.orWhere(function() {
        value.forEach(condition => {
          this.orWhere(function() {
            buildWhereClause(this, alias, condition);
          });
        });
      });
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(operator => {
        if (operator === 'contains') {
          knexQuery.whereLike(`${alias}."${key}"`, `%${value[operator]}%`)
        }else if (isTimestampString(value[operator])) {
          const formattedDate = formatDateToTimestamp(value[operator]);
          knexQuery.whereRaw(`${alias}."${key}" ${operator} ${formattedDate}`);
        } else {
          knexQuery.where(`${alias}."${key}"`, operator, value[operator]);
        }
      });
    } else {
      if (isTimestampString(value)) {
        const formattedDate = formatDateToTimestamp(value);
        knexQuery.whereRaw(`${alias}."${key}" = ${formattedDate}`);
      } else {
        knexQuery.where(`${alias}."${key}"`, value);
      }
    }
  });
}

function isTimestampString(value) {
  // 验证字符串是否为时间戳格式 YYYY-MM-DD HH:MM:SS 或 ISO 8601 格式
  return typeof value === 'string' && 
         (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ||
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)?$/.test(value));
}

function formatDateToTimestamp(dateString) {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
    // 普通日期时间格式
    return `TO_TIMESTAMP('${dateString}', 'YYYY-MM-DD HH24:MI:SS')`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)?$/.test(dateString)) {
    // ISO 8601 格式
    const date = new Date(dateString);
    const formattedDate = date.toISOString().replace('T', ' ').replace('Z', '');
    return `TO_TIMESTAMP('${formattedDate}', 'YYYY-MM-DD HH24:MI:SS')`;
  } else {
    throw new Error('Invalid date format');
  }
}