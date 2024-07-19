import { DMQueryBuilder, Criteria } from '../private/QueryBuilder';

export function Delete(tablesplace: string, table: string, criteria: Criteria, caseSensitive?: boolean): string {
  const queryBuilder = new DMQueryBuilder(tablesplace, table, criteria, { caseSensitive });
  const keywords = ['DELETE'];
  const fromClause = queryBuilder.buildFrom();
  const joinClause = queryBuilder.buildJoinClause();
  const whereClause = queryBuilder.buildWhereClause();
  keywords.push(fromClause, joinClause, whereClause);
  return keywords.join(' ') + ';';
}
