import {DMQueryBuilder} from "../private/QueryBuilder";

interface ReturnData {
  sql: string
  values: Record<string, any>
}
export function Create(tablesplace: string, table: string, data: Record<string, any>, caseSensitive?: boolean): ReturnData {
  const queryBuilder = new DMQueryBuilder(tablesplace, table, {}, { caseSensitive });

  
  // 对键进行排序，防止批量插入时键顺序不通导致错误
  const sortedKeys: string[] = Object.keys(data).sort();
  const sortedObj: Record<string, any> = {};
  sortedKeys.forEach((key: string) => sortedObj[key] = data[key]);
  const {keys, placeholders, values} = queryBuilder.formatPlaceholders('create', sortedObj)
    
  const keywords = ['INSERT', 'INTO'];
  const tableName = queryBuilder.getTableName(table);

  keywords.push(tableName, `(${keys})`, 'VALUES',  `(${placeholders})`);
  return {sql: keywords.join(' ') + ';', values};
}


