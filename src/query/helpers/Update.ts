import { DMQueryBuilder, Criteria } from '../private/QueryBuilder';

interface ReturnData {
  sql: string;
  values: Record<string, any>;
}
export function Update(
  tablesplace: string,
  table: string,
  criteria: Criteria,
  data: Record<string, any>,
  caseSensitive: boolean = true
): ReturnData {
  const queryBuilder = new DMQueryBuilder(tablesplace, table, criteria, { caseSensitive });
  const tableName = queryBuilder.getTableName(table);
  const whereClause = queryBuilder.buildWhereClause();
  const { placeholders, values } = queryBuilder.formatPlaceholders('update', data);
  const keywords = ['UPDATE', tableName, 'SET', placeholders, whereClause];

  return { sql: keywords.join(' ') + ';', values };
}
