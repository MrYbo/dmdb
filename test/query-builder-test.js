
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

/*
select 
  t1."a", t1."b" 
from 
  test."admin" t1 
where 
  t1."a" = 1 
  and ((t1."a" > 2) 
  and (t1."b" = 3)) or ((t1."d" = 1) or (t1."e" <= 2)) 
  and t1."f" > 3 
  and t1."createdAt" > TO_TIMESTAMP('2024-07-11 03:02:55.000', 'YYYY-MM-DD HH24:MI:SS') 
  and t1."dd" like '%ssd%' 
limit 10 offset 20；
*/