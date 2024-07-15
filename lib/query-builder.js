const dayjs = require('dayjs');
class DMQueryBuilder {
  constructor(tablespace, table, criteria, caseSensitive = true) {
    this.tablespace = tablespace;
    this.table = table;
    this.criteria = criteria;
    this.tableAlias = null;
    this.caseSensitive = caseSensitive;
    this.aliasCounter = 1;
    if (!this.table) {
      throw new Error('table is required');
    }
  }

  quoteIdentifier(identifier) {
    return this.caseSensitive ? `"${identifier}"` : identifier;
  }

  generateTableAlias () {
    const include = this.criteria?.include
    if (include && include.length > 0) {
      this.tableAlias = `t${this.aliasCounter}`;
      this.aliasCounter++;
      // 如果存在连表查询，则给每个表设置一个别名
      include.forEach((v, index) => {
        const alias = `t${this.aliasCounter + index}`;
        this.criteria.include[index]['_alias'] = alias;
      });
    }
  }

  buildSelect () {
    const select = this.criteria?.select;
    const include = this.criteria?.include;
    let selectClauses = [];
    
    if (select && select.length > 0) {
      if (this.tableAlias) {
        selectClauses = select.map(col => `${this.tableAlias}.${this.quoteIdentifier(col)}`);
      } else {
        selectClauses = select.map(col => this.quoteIdentifier(col));
      }
    } else {
      selectClauses.push('*');
    }

    if (include && include.length > 0) {
      include.forEach((join) => {
        if (join.select && join.select.length > 0) {
          selectClauses = selectClauses.concat(
            join.select.map(col => `${join._alias}.${this.quoteIdentifier(col)}`)
          );
        }
      });
    }
    return `SELECT ${selectClauses.join(', ')}`;
  }

  buildFrom () {
    const tableName = this.table;
    const tName = this.quoteIdentifier(tableName);
    if (this.tablespace) {
      if (this.tableAlias) {
        return `FROM ${this.tablespace}.${tName} ${this.tableAlias}`;
      } else {
        return `FROM ${this.tablespace}.${tName}`;
      }
    }
    return this.tableAlias ? `FROM ${tableName} ${this.tableAlias}` : `FROM ${tableName}`;
  }

  buildJoinClause() {
    const include = this.criteria?.include;
    if (!include || include.length === 0) return '';
    const joinClauses = include.map((join, index) => {
      const joinType = join.type ? join.type.toUpperCase() : 'INNER';
      const table = this.quoteIdentifier(join.model);
      const alias = join._alias;
      const on = join.on;

      const onClause = Object.keys(on).map(key => {
        const right = `${alias}.${this.quoteIdentifier(on[key])}`;
        const left = `${this.tableAlias}.${this.quoteIdentifier(key)}`;
        return `${left} = ${right}`;
      }).join(' AND ');

      const tName = this.tablespace ? `${this.tablespace}.${table}` : table;
      const joinArr = [joinType, 'JOIN', tName, alias, 'ON', onClause];
      return joinArr.join(' ');
    });

    this.aliasCounter += include.length;
    return joinClauses.join(' ');
  }

  buildWhereClause(where, connect = 'WHERE', alias = this.tableAlias) {
    if (!where) return '';
    
    const buildCondition = (condition, alias) => {
      if (typeof condition === 'object' && !Array.isArray(condition)) {
        const keys = Object.keys(condition);
        return keys.map(key => {
          const column = alias ? `${alias}.${this.quoteIdentifier(key)}` : this.quoteIdentifier(key);
          if (typeof condition[key] === 'object') {
            const operator = Object.keys(condition[key])[0];
            const value = condition[key][operator];
            if (operator.toLowerCase() === 'like' || operator.toLowerCase() === 'contains') {
              return `${column} LIKE '%${value}%'`;
            }
            if (typeof value === 'string') {
              if (dayjs(value).isValid()) {
                return `${column} ${operator} TIMESTAMP '${formatDateToTimestamp(value)}'`;
              }
              return `${column} ${operator} '${value}'`;
            }
            return `${column} ${operator} ${value}`;
          }
          return `${column} = ${condition[key]}`;
        }).join(' AND ');
      }
      return '';
    };

    const whereClauses = [];
    for (const key in where) {
      if (key === 'and' || key === 'or') {
        const conditions = where[key].map(cond => buildCondition(cond, alias));
        whereClauses.push(`(${conditions.join(` ${key.toUpperCase()} `)})`);
      } else {
        whereClauses.push(buildCondition({ [key]: where[key] }, alias));
      }
    }

    return `${connect} ${whereClauses.join(' AND ')}`;
  }

  buildInnerTableWhere () {
    let joinWhere = [];
    const include = this.criteria?.include;
    if (include && include.length > 0) {
      include.forEach((join, index) => {
        if (join?.where) {
          const whereStr = this.buildWhereClause(join.where, 'AND', join._alias);
          joinWhere.push(whereStr)
        }
      });
    };
    return joinWhere.join(' ');
  }

  buildLimit() {
    const limit = this.criteria?.limit;
    if (limit) {
      return `LIMIT ${limit}`;
    }
    return '';
  }

  buildOffset () {
    const offset = this.criteria?.offset;
    if (offset) {
      return `OFFSET ${offset}`;
    }
    return '';
  }

  toQuery() {
    this.generateTableAlias();
    const selectClause = this.buildSelect();
    const fromClause = this.buildFrom();
    const joinClause = this.buildJoinClause();
    const whereClause = this.buildWhereClause(this.criteria?.where);
    const joinWhereClause = this.buildInnerTableWhere();
    const limitClause = this.buildLimit();
    const offsetClause = this.buildOffset();
    const arr = [selectClause, fromClause, joinClause, whereClause, joinWhereClause, limitClause, offsetClause];
    const sql = arr.join(' ') + ';'
    console.log(sql);
    return sql;
  }
}

module.exports = DMQueryBuilder;


function formatDateToTimestamp (dateString) {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}