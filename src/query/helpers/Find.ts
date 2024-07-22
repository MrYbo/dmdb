import { Criteria, DMQueryBuilder } from '../private/QueryBuilder';

export function Find(tablesplace: string, table: string, criteria: Criteria, caseSensitive?: boolean): any {
  const queryBuilder = new DMQueryBuilder(tablesplace, table, criteria, { caseSensitive });
  const selectClause = queryBuilder.buildSelectColoum();
  const fromClause = queryBuilder.buildFrom();
  const joinClause = queryBuilder.buildJoinClause();
  const whereClause = queryBuilder.buildWhereClause();
  const limitClause = queryBuilder.buildLimit();
  const offsetClause = queryBuilder.buildOffset();
  const sortClause = queryBuilder.buildSort();
  const arr = [selectClause, fromClause, joinClause, whereClause, sortClause, limitClause, offsetClause].filter(
    v => v !== ''
  );
  const sql = arr.join(' ') + ';';
  return sql;
}
