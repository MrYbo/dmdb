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
      const s = getSelect('t1', criteria.select);
      this.query.select(s);
    };

    const where = appendQueryFilters({and: []}, this.criteria.where);
    where.and.forEach(condition => {
      this.getWhere('t1', condition);
    });

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


 

  getWhere (alias, condition, parentField, useOr = false) {
    let [operator, value] = _.toPairs(condition)[0];
    let method = useOr ? 'orWhere' : 'where';
    if (!_.isObject(value)) {
      if (parentField) {
        const column = `${alias}."${parentField}"`;
        if (value === null) {
          operator === '!='
          ? this.query[`${method}NotNull`](column)
          : this.query[`${method}Null`](column);
          return;
        }
        switch (operator) {
          case 'contains':
            this.query[method](column, 'like', `%${value}%`);
            break;
          default:
            this.query[method](column, operator, value);
        }
        return;
      }
      this.query[method](`${alias}."${operator}"`, value);
      return;
    }

    if (_.isArray(value) && operator.toLowerCase() !== 'or') {
      query.whereIn(`${alias}."${operator}"`, value);
      return;
    }
    if (_.isObject(value)) {
      this.getWhere(alias, value, operator);
    }
  }


}

module.exports = QueryBuilder;

/**
 * 将查询条件转为and
 * @param {*} obj 
 * @returns 
 */
function objToArray(obj) {
  let arr = [];
  if (obj.and) {
    arr.push(...obj.and);
  }
  obj = _.omit(obj, 'and');
  Object.entries(obj).map(([k, v]) => arr.push({[k]: v}));
  return arr;
};

/**
 * 合并查询条件
 * @param {*} current 
 * @param {*} filters 
 * @returns 
 */
function appendQueryFilters(current = {}, filters = {}) {
  if (current.and || filters.and) {
    const and = [...objToArray(current), ...objToArray(filters)];
    return {and};
  }
  const and = [];
  for (const [key, value] of Object.entries(filters)) {
    const curr = current[key];
    if (curr && curr !== value) {
      and.push({[key]: value});
      and.push({[key]: curr});
    }
    current[key] = value;
  }
  return and.length ? {...current, and} : current;
}

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