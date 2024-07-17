
import { DMQueryBuilder } from '../private/QueryBuilder';

export function getTableName(tablesplace: string, table: string, caseSensitive: boolean = true): string{
  const queryBuilder = new DMQueryBuilder(tablesplace, table, {}, { caseSensitive });
  return queryBuilder.getTableName(table);
}
