import dayjs from 'dayjs';

interface tableMata {
  //用于区别是主表还是从表
  role: 'Master' | 'Slave';
  // 当前表的名字
  tableName: string;

  tableNameAlias: string;
  // 表字段的别名
  alias: string;
  // 表的查询条件
  where: Record<string, any> | undefined;
  // 需要查询的字段
  select: string | string[];
  // 排序规则
  sort?: string;
  // 主表和从表对应的字段关系, 键为主表的，key则为对应的从表的属性
  relation?: Record<string, string>;

  joinType?: 'inner' | 'left' | 'right' | undefined;
}

export interface Criteria {
  select?: string | string[];
  include?: JoinDetail[];
  where?: Record<string, any>;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface JoinDetail {
  model: string;
  on: Record<string, string>;
  type?: 'inner' | 'left' | 'right' | undefined;
  select?: string[];
  where?: Record<string, any>;
  sort?: string;
}

export interface QueryOptions {
  caseSensitive?: boolean;
}
export class DMQueryBuilder {
  private tablespace: string;
  private table: string;
  private criteria: Criteria;
  private caseSensitive: boolean;
  private allTableMata: tableMata[];
  private options: QueryOptions;

  constructor(tablespace: string, table: string, criteria: Criteria, options?: QueryOptions) {
    this.tablespace = tablespace;
    this.table = table;
    this.criteria = criteria;
    this.options = options || {};
    this.caseSensitive = this.options?.caseSensitive ?? true;

    this.allTableMata = this.__init();
  }

  /**
   * 将传递的表信息初始化，形成数组，到时候只需要处理每个数组的信息就好了
   * @returns
   */
  private __init(): tableMata[] {
    const allTableMata: tableMata[] = [];
    const include = this.criteria?.include;
    // 初始化主表的信息
    const masterTableMata: tableMata = {
      role: 'Master',
      tableName: this.table,
      tableNameAlias: '',
      alias: '',
      where: this.criteria?.where || {},
      select: this.criteria?.select || ['*'],
      sort: this.criteria.sort,
    };
    allTableMata.push(masterTableMata);

    // 初始化从表的信息
    if (include && include.length > 0) {
      masterTableMata.tableNameAlias = 't0';
      masterTableMata.alias = 't0.';

      include.forEach((v, index) => {
        index += 1;
        const tableNameAlias = 't' + index;
        const alias = tableNameAlias + '.';
        const slaveTableMata: tableMata = {
          role: 'Slave',
          tableName: v.model,
          joinType: v.type ?? 'inner',
          alias,
          tableNameAlias,
          where: v.where || {},
          select: v.select || [],
          relation: v.on,
          sort: v.sort,
        };
        allTableMata.push(slaveTableMata);
      });
    }
    return allTableMata;
  }

  private quoteIdentifier(identifier: string): string {
    return this.caseSensitive ? `"${identifier}"` : identifier;
  }

  private generateWhereStr(where: Record<string, any> | undefined, alias: string): string {
    if (!where) return '';
    const buildCondition = (condition: any, alias: string) => {
      if (typeof condition === 'object' && !Array.isArray(condition)) {
        const whereArray = Object.entries(condition).map(([key, value]: any) => {
          const column = `${alias}${this.quoteIdentifier(key)}`;

          if (typeof value === 'string') {
            return `${column} = '${condition[key]}'`;
          }

          // NULL值
          if (value === null) {
            return `${column} IS NULL`;
          }

          // 数组
          if (Array.isArray(value)) {
            const values = condition[key].map((v: any) => (typeof v === 'string' ? `'${v}'` : v)).join(',');
            return `${column} IN (${values})`;
          }

          if (typeof value === 'object') {
            const arr = Object.entries(value)[0];
            const operator = arr[0].toLowerCase();
            const val = arr[1];
            if (!['<', '>', '<=', '>=', '<>', '!=', 'like', 'contains', 'in', 'between'].includes(operator)) {
              throw Error('操作符错误');
            }
            if (['like', 'contains'].includes(operator)) {
              return `${column} LIKE '%${val}%'`;
            }
            if (['in', 'between'].includes(operator)) {
              if (!Array.isArray(val)) {
                throw Error(`${operator}操作符查询值必须为数组`);
              }
              const values = condition[key].map((v: any) => (typeof v === 'string' ? `'${v}'` : v));
              if (operator === 'in') {
                return `${column} IN (${values.join(',')})`;
              }
              return `${column} BETWEEN ${val[0]} AND ${val[1]}`;
            }

            if (val === null) {
              return `${column} ${operator === '!=' ? 'IS NOT NULL' : 'IS NULL'}`;
            }

            if (typeof val === 'string') {
              if (dayjs(val).isValid()) {
                return `${column} ${operator} TIMESTAMP '${formatDateToTimestamp(val)}'`;
              }
              return `${column} ${operator} '${val}'`;
            }
            return `${column} ${operator} ${val}`;
          }
          return `${column}=${value}`;
        });
        return whereArray.join(' AND ');
      }
      return '';
    };

    const whereClauses = [];
    for (const key in where) {
      if (key === 'and' || key === 'or') {
        const conditions = where[key].map((cond: any) => buildCondition(cond, alias));
        const relation = '(' + conditions.join(` ${key.toUpperCase()} `) + ')';
        whereClauses.push(relation);
      } else {
        whereClauses.push(buildCondition({ [key]: where[key] }, alias));
      }
    }
    return `${whereClauses.join(' AND ')}`;
  }

  getTableName(tableName: string, tableNameAlias?: string) {
    const _tName = this.quoteIdentifier(tableName);
    if (!tableNameAlias) {
      tableNameAlias = this.allTableMata[0].tableNameAlias;
    }
    const tName = this.tablespace ? `${this.tablespace}.${_tName} ${tableNameAlias}` : `${_tName} ${tableNameAlias}`;
    return tName.trim();
  }

  buildSelectColoum(): string {
    const selectClauses: string[] = [];
    this.allTableMata.forEach(table => {
      const { select, alias } = table;
      if (!Array.isArray(select)) {
        throw new Error('查询字段请放置在数组中');
      }
      const sc = select.map(col => {
        return col === '*' ? `${alias}*` : `${alias}${this.quoteIdentifier(col)}`;
      });
      selectClauses.push(...sc);
    });
    return `SELECT ${selectClauses.join(',')}`;
  }

  buildSelectCountColoum(): string {
    const select = this.allTableMata[0].select;
    if (typeof select !== 'string' || !(select.startsWith('count') || select.startsWith('COUNT'))) {
      throw new Error('count查询请使用count(*) || COUNT(*) || count(column)');
    }
    return `SELECT ${select} AS "total"`;
  }

  buildFrom(): string {
    const { tableName } = this.allTableMata[0];
    const _tName = this.getTableName(tableName);
    return `FROM ${_tName}`;
  }

  buildWhereClause(): string {
    const wheres: string[] = [];
    this.allTableMata.forEach(table => {
      const { where, alias, role } = table;
      const data = this.generateWhereStr(where, alias);
      if (data) {
        if (role === 'Master') {
          wheres.push('WHERE', data);
        } else {
          wheres.push('AND', data);
        }
      }
    });
    return wheres.length ? wheres.join(' ') : '';
  }

  buildJoinClause(): string {
    const masterTableMata = this.allTableMata[0];
    const slaveTableMata = this.allTableMata.slice(1);
    const joins: string[] = [];
    if (!slaveTableMata.length) {
      return '';
    }
    slaveTableMata.forEach(stable => {
      const { tableName, tableNameAlias, alias, relation } = stable;
      const joinType = stable.joinType!.toUpperCase();
      const slaveTableName = this.getTableName(tableName, tableNameAlias);
      const [key, value] = Object.entries(relation!)[0];

      const right = `${alias}${this.quoteIdentifier(value)}`;
      const left = `${masterTableMata.alias}${this.quoteIdentifier(key)}`;
      const relations = `${left} = ${right}`;
      joins.push(joinType, 'JOIN', slaveTableName, 'ON', relations);
    });
    return joins.join(' ');
  }

  buildLimit() {
    const limit = this.criteria?.limit;
    if (limit) {
      return `LIMIT ${limit}`;
    }
    return '';
  }

  buildOffset() {
    const offset = this.criteria?.offset;
    if (offset) {
      return `OFFSET ${offset}`;
    }
    return '';
  }

  buildSort() {
    let sorts: string[] = [];
    this.allTableMata.forEach(table => {
      const { alias, sort } = table;
      if (sort) {
        const _sort = sort.split(' ');
        const column = this.quoteIdentifier(_sort[0]);
        const role = _sort[1].toUpperCase();
        sorts.push(`${alias}${column}`, role);
      }
    });
    if (sorts.length > 0) {
      sorts = ['ORDER BY', ...sorts];
    }
    return sorts.join(' ');
  }

  formatPlaceholders(action: 'create' | 'update', data: Record<string, any>) {
    const values: any[] = [];
    const placeholders: string[] = [];
    const keys: string[] = [];
    Object.entries(data).map(([k, v], index) => {
      let placeholder = ':' + (index + 1);
      const key = this.caseSensitive ? `"${k}"` : k;
      if (action === 'update') {
        placeholder = `${key}=${placeholder}`;
      }
      values.push({ val: v });
      placeholders.push(placeholder);
      keys.push(key);
    });
    return { keys: keys.join(', '), values, placeholders: placeholders.join(', ') };
  }
}

function formatDateToTimestamp(dateString: string) {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
}
