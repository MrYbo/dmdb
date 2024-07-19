import { Criteria, DMQueryBuilder } from '../private/QueryBuilder';

export function Count(tablesplace: string, table: string, criteria: Criteria, caseSensitive?: boolean): any {
  const queryBuilder = new DMQueryBuilder(tablesplace, table, criteria, { caseSensitive });
  const selectClause = queryBuilder.buildSelectCountColoum();
  const fromClause = queryBuilder.buildFrom();
  const joinClause = queryBuilder.buildJoinClause();
  const whereClause = queryBuilder.buildWhereClause();
  const arr = [selectClause, fromClause, joinClause, whereClause].filter(v => v !== '');
  const sql = arr.join(' ') + ';';
  return sql;
}
