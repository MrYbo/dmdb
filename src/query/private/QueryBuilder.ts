import dayjs from 'dayjs';

interface tableMata {
  //用于区别是主表还是从表
  role: 'Master' | 'Slave',
  // 当前表的名字
  tableName: string,
  // 表的别名
  alias: string
  // 表的查询条件
  where: Record<string, any> | undefined;
  // 需要查询的字段
  select: string | string[],
  // 排序规则
  sort?: string
  // 主表和从表对应的字段关系, 键为主表的，key则为对应的从表的属性
  relation?: Record<string, string>,

  joinType?: 'inner' | 'left' | 'right' | undefined
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

const defaultOptions: QueryOptions = {
  caseSensitive: true  // 这里设置默认值
};


export class DMQueryBuilder {
  private tablespace: string
  private table: string
  private criteria: Criteria;
  private caseSensitive: boolean;
  private allTableMata: tableMata[]
  private options: QueryOptions

  constructor(tablespace: string, table: string, criteria: Criteria, options?: QueryOptions) {
    this.tablespace = tablespace;
    this.table = table;
    this.criteria = criteria;
    this.options = options || {}
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
      alias: '',
      where: this.criteria?.where || {},
      select: this.criteria?.select || ['*'],
      sort: this.criteria.sort
    };
    allTableMata.push(masterTableMata);

    // 初始化从表的信息
    if (include && include.length > 0) {
      masterTableMata.alias = 't0';
      
      include.forEach((v, index) => {
        index += 1;
        const alias = 't' + index;
        const slaveTableMata: tableMata = {
          role: 'Slave',
          tableName: v.model,
          joinType: v.type ?? 'inner',
          alias,
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
  
  getTableName(tableName: string, alias?: string) {
    const _tName = this.quoteIdentifier(tableName);
    if (!alias) {
      alias = this.allTableMata[0].alias;
    }
    return this.tablespace
      ? `${this.tablespace}.${_tName} ${alias}`
      : `${_tName} ${alias}`;
  }

  private generateWhereStr(where: Record<string, any> | undefined, alias: string) {
    if (!where) return '';
    const buildCondition = (condition: any, alias: string) => {
      if (typeof condition === 'object' && !Array.isArray(condition)) {
        const keys = Object.keys(condition);
        return keys.map(key => {
          const column = `${alias ? alias + '.' : ''}${this.quoteIdentifier(key)}`;

          if (Array.isArray(condition[key])) {
            const values = condition[key].map((v: any) => {
              return typeof v === 'string' ? `'${v}'` : v
            });
            return `${column} IN (${values.join(', ')})`;
          }
          if (typeof condition[key] === 'object') {
            const operator = Object.keys(condition[key])[0];
            const value = condition[key][operator];
            // 模糊查询
            if (operator.toLowerCase() === 'like' || operator.toLowerCase() === 'contains') {
              return `${column} LIKE '%${value}%'`;
            }
            // 字符串处理
            if (typeof value === 'string') {
              if (dayjs(value).isValid()) {
                return `${column} ${operator} TIMESTAMP '${formatDateToTimestamp(value)}'`;
              }
              return `${column} ${operator} '${value}'`;
            }
            return `${column} ${operator} ${value}`;
          } else if (typeof condition[key] === 'string') {
            return `${column} = '${condition[key]}'`;
          } else {
            return `${column} = ${condition[key]}`;
          }
        }).join(' AND ');
      }
      return '';
    };

    const whereClauses = [];
    for (const key in where) {
      if (key === 'and' || key === 'or') {
        const conditions = where[key].map((cond: any) => buildCondition(cond, alias));
        whereClauses.push(`(${conditions.join(` ${key.toUpperCase()} `)})`);
      } else {
        whereClauses.push(buildCondition({ [key]: where[key] }, alias));
      }
    }

    return `${whereClauses.join(' AND ')}`;
  }

  buildSelectColoum(): string {
    let selectClauses: string[] = [];
    this.allTableMata.forEach((table) => {
      const { select, alias } = table;
      if (!Array.isArray(select)) {
        throw new Error('查询字段请放置在数组中');
      }
      const sc = select.map(col => alias ? `${alias}.${this.quoteIdentifier(col)}` : this.quoteIdentifier(col));
      selectClauses.push(...sc);
    })
    return `SELECT ${selectClauses.join(', ')}`;
  }

  buildSelectCountColoum(): string {
    const select = this.allTableMata[0].select;
    if (typeof select !== 'string' || !(select.startsWith('count') || select.startsWith('COUNT'))) {
      throw new Error('count查询请使用count(*) || COUNT(*) || count(column)');
    }
    return `SELECT ${select} as "total"`;
  }


  buildFrom(): string {
    const { tableName, alias } = this.allTableMata[0];
    const _tName = this.getTableName(tableName, alias);
    return `FROM ${_tName}`;
  }


  buildWhereClause(): string {
    const wheres: string[] = [];
    this.allTableMata.forEach((table) => {
      const { where, alias, role } = table;
      const data = this.generateWhereStr(where, alias);
      if (role === 'Master') {
        wheres.push('WHERE', data)
      } else {
        wheres.push('AND', data)
      }
    })
    return wheres.length ? wheres.join(' ') : '';
  }

  buildJoinClause(): string {
    const masterTableMata = this.allTableMata[0];
    const slaveTableMata = this.allTableMata.slice(1);
    const joins: string[] = [];
    if (!slaveTableMata.length) {
      return '';
    }
    slaveTableMata.forEach(((stable, index) => {
      const { tableName, alias, relation } = stable;
      const joinType = stable.joinType!.toUpperCase();
      const slaveTableName = this.getTableName(tableName, alias);
      const [key, value] = Object.entries(relation!)[0];

      const right = `${alias}.${this.quoteIdentifier(value)}`;
      const left = `${masterTableMata.alias}.${this.quoteIdentifier(key)}`;
      const relations = `${left} = ${right}`;
      joins.push(joinType, 'JOIN', slaveTableName, 'ON', relations);
    }))
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
        let _sort = sort.split(' ');
        const column = this.quoteIdentifier(_sort[0]);
        const role = _sort[1].toUpperCase();
        sorts.push(`${alias}.${column}`, role);
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
        placeholder = `${key}=${placeholder}`
      }
      values.push({ val: v })
      placeholders.push(placeholder);
      keys.push(key)
    });
    return {keys: keys.join(', '), values, placeholders: placeholders.join(', ')}
  }
}

function formatDateToTimestamp (dateString: string) {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}