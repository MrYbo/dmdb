import { Find, Criteria } from "../../src/query";

const criteria: Criteria = {
  select: ['a', 'b'],
  where: {
    a: 1,
    and: [{ aa: { '>': 2 } }, { bb: 3 }],
    or: [{ aa: { '>': 2 } }, { bb: 3 }],
    createdAt: { '>': '2024-07-11T11:02:55+08:00' },
    bb: { 'like': 'ssd' },
    bbv: {'!=': null}
  },
  include: [
    {
      select: ['c', 'd'],
      model: 'another_table',
      type: 'left',
      on: { 'another_id': 'id'},
      where: { c: 'fdsf', d: 'sddf' },
    },
    {
      select: ['e', 'f'],
      type: 'inner',
      model: 'another_table',
      on: { id: 'another_id' },
      where: { e: 'fdsf', f: 'sddf' },
    }
  ]
};

const da = Find('HUI', 'admin', criteria, true);
console.log(da);

/*
SELECT 
t0."a", t0."b", t1."c", t1."d", t2."e", t2."f" 
FROM 
HUI."admin" t0 
LEFT JOIN HUI."another_table" t1 ON t0."another_id" = t1."id" 
INNER JOIN HUI."another_table" t2 ON t0."id" = t2."another_id" 
WHERE 
t0."a" = 1 AND (t0."aa" > 2 AND t0."bb" = 3) AND t0."createdAt" > TIMESTAMP '2024-07-11 11:02:55' AND t0."bbb" LIKE '%ssd%' AND t1."c" = 'fdsf' AND t1."d" = 'sddf' AND t2."e" = 'fdsf' AND t2."f" = 'sddf';
*/