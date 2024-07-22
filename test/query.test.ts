import { describe } from 'node:test';
import { DMQueryBuilder, Criteria, QueryOptions } from '../src/query/private/QueryBuilder';
import * as query from '../src/query';

describe('DMQueryBuilder', () => {
  const baseCriteria: Criteria = {
    select: ['name', 'age'],
    where: {
      and: [{ age: { '<': 10 } }, { age: { '>': 30 } }],
      name: { like: 'zs' },
      sex: { '!=': null },
    },
    sort: 'name asc',
    limit: 10,
    offset: 5,
    include: [
      {
        model: 'employees',
        on: { id: 'manager_id' },
        type: 'inner',
      },
    ],
  };
  const options: QueryOptions = { caseSensitive: true };
  const tablespace = 'PUB';
  const table = 'users';

  let queryBuilder: DMQueryBuilder;

  beforeEach(() => {
    queryBuilder = new DMQueryBuilder(tablespace, table, baseCriteria, options);
  });
  test('getTableName constructs a valid tableName', () => {
    const hopeName = 'PUB."users"';
    const tbName = query.getTableName(tablespace, table, options.caseSensitive);
    expect(tbName).toEqual(hopeName);
  });
  test('buildSelectColumn constructs a valid SELECT query', () => {
    const expectedSelect = 'SELECT t0."name",t0."age"';
    expect(queryBuilder.buildSelectColoum()).toEqual(expectedSelect);
  });

  test('buildWhereClause constructs correct WHERE clause', () => {
    const whereClause = `WHERE (t0."age" < 10 AND t0."age" > 30) AND t0."name" LIKE '%zs%' AND t0."sex" IS NOT NULL`;
    expect(queryBuilder.buildWhereClause()).toEqual(whereClause);
  });

  test('buildJoinClause constructs JOINs correctly', () => {
    const expectedJoin = 'INNER JOIN PUB."employees" t1 ON t0."id" = t1."manager_id"';
    expect(queryBuilder.buildJoinClause()).toContain(expectedJoin);
  });

  test('buildLimit and buildOffset constructs correct clauses', () => {
    expect(queryBuilder.buildLimit()).toEqual('LIMIT 10');
    expect(queryBuilder.buildOffset()).toEqual('OFFSET 5');
  });

  test('buildSort constructs a valid ORDER BY clause', () => {
    const expectedSort = 'ORDER BY t0."name" ASC';
    expect(queryBuilder.buildSort()).toEqual(expectedSort);
  });

  test('Create Build create statement', () => {
    const data = {
      username: 'fwRGqnRZU6S5fjf/YZA==',
      password: 'B4+RjcJEwySgLWJEezTx==',
      nickname: '刘晨璞',
      address: null,
      phone: 'fwRGqnRZU6S5fjf/YZAaPA==',
    };

    const da = query.Create(tablespace, table, data, options.caseSensitive);
    const sql =
      'INSERT INTO PUB."users" ("address", "nickname", "password", "phone", "username") VALUES (:1, :2, :3, :4, :5);';
    expect(da.sql).toEqual(sql);
    expect(da.values[0]).toEqual({ val: null });
    expect(da.values[1]).toEqual({ val: '刘晨璞' });
    expect(da.values[2]).toEqual({ val: 'B4+RjcJEwySgLWJEezTx==' });
    expect(da.values[3]).toEqual({ val: 'fwRGqnRZU6S5fjf/YZAaPA==' });
    expect(da.values[4]).toEqual({ val: 'fwRGqnRZU6S5fjf/YZA==' });
  });

  test('Update Build update statement', () => {
    const data = {
      username: 'fwRGqnRZU6S5fjf/YZA==',
      password: 'B4+RjcJEwySgLWJEezTx==',
    };
    const da = query.Update(tablespace, table, baseCriteria, data, options.caseSensitive);
    const sql = `UPDATE PUB."users" t0 SET "username"=:1, "password"=:2 WHERE (t0."age" < 10 AND t0."age" > 30) AND t0."name" LIKE '%zs%' AND t0."sex" IS NOT NULL;`;
    expect(da.sql).toEqual(sql);
    expect(da.values).toContainEqual({ val: 'fwRGqnRZU6S5fjf/YZA==' });
    expect(da.values).toContainEqual({ val: 'B4+RjcJEwySgLWJEezTx==' });
  });

  test('Find Build find statement', () => {
    const findSql = query.Find(tablespace, table, baseCriteria, options.caseSensitive);
    const sql = `SELECT t0."name",t0."age" FROM PUB."users" t0 INNER JOIN PUB."employees" t1 ON t0."id" = t1."manager_id" WHERE (t0."age" < 10 AND t0."age" > 30) AND t0."name" LIKE '%zs%' AND t0."sex" IS NOT NULL ORDER BY t0."name" ASC LIMIT 10 OFFSET 5;`;
    expect(findSql).toEqual(sql);
  });

  test('Count Build Count statement', () => {
    baseCriteria.select = 'COUNT(*)';
    const countSql = query.Count(tablespace, table, baseCriteria, options.caseSensitive);
    const sql = `SELECT COUNT(*) AS "total" FROM PUB."users" t0 INNER JOIN PUB."employees" t1 ON t0."id" = t1."manager_id" WHERE (t0."age" < 10 AND t0."age" > 30) AND t0."name" LIKE '%zs%' AND t0."sex" IS NOT NULL;`;
    expect(countSql).toEqual(sql);
  });

  test('Delete Build delete statement', () => {
    const delSql = query.Delete(tablespace, table, baseCriteria, options.caseSensitive);
    const sql = `DELETE FROM PUB."users" t0 INNER JOIN PUB."employees" t1 ON t0."id" = t1."manager_id" WHERE (t0."age" < 10 AND t0."age" > 30) AND t0."name" LIKE '%zs%' AND t0."sex" IS NOT NULL;`;
    expect(delSql).toEqual(sql);
  });
});
