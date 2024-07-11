
const QueryBuilder = require('../lib/utils/query-builder');

const criteria = {
  select: ['a', 'b'],
  where: {
    a: 1,
    and: [{ a: { '>': 2 } }, { b: 3 }],
    or: [{ d: 1 }, { e: { '<=': 2 } }],
    f: { '>': 3 },
    createdAt: {'>': '2024-07-11T11:02:55+08:00'}, // 时间字符串
    dd: {contains: 'ssd'}
  },
  limit: 10,
  offset: 20,
}
const queryBuilder = new QueryBuilder('test', 'admin', criteria);
const sql = queryBuilder.getQueryString();
console.log(sql);