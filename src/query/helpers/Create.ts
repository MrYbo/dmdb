import {DMQueryBuilder} from "../private/QueryBuilder";

interface ReturnData {
  sql: string
  values: Record<string, any>
}
export function Create(tablesplace: string, table: string, data: Record<string, any>, caseSensitive?: boolean): ReturnData {
  const queryBuilder = new DMQueryBuilder(tablesplace, table, {}, { caseSensitive });
  let _keys: string[] = [];
  let _placeholders: number[] = [];
  let values: any[] = [];
  
    // 对键进行排序，防止批量插入时键顺序不通导致错误
    const dkeys = Object.keys(data).sort();
    dkeys.map((k, index) => {
      _keys.push(`"${k}"`);
      _placeholders.push(index + 1);
      values.push({val: data[k]});
    });
    
    const keywords = ['INSERT', 'INTO'];
    const tableName = queryBuilder.getTableName(table);
    const keys = _keys.join(', ');
    const placeholder = `:${_placeholders.join(', :')}`;
    keywords.push(tableName, `(${keys})`, 'VALUES',  `(${placeholder})`);
    return {sql: keywords.join(' ') + ';', values};
}


