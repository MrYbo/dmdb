import { Update, Criteria } from '../../src/query';

const criteria: Criteria = {
  select: ['a', 'b'],
  where: {
    a: 1,
    and: [{ aa: { '>': 2 } }, { bb: 3 }],
    createdAt: { '>': '2024-07-11T11:02:55+08:00' },
    bbb: { like: 'ssd' },
  },
  include: [
    {
      select: ['c', 'd'],
      model: 'another_table',
      type: 'left',
      on: { another_id: 'id' },
      where: { c: 'fdsf', d: 'sddf' },
    },
    {
      select: ['e', 'f'],
      type: 'inner',
      model: 'another_table',
      on: { id: 'another_id' },
      where: { e: 'fdsf', f: 'sddf' },
    },
  ],
};

const data = {
  username: 'fwRGqnRZU6S5fjf/YZA==',
  password: 'B4+RjcJEwySgLWJEezTx==',
  nickname: '刘晨璞',
  address: null,
  phone: 'fwRGqnRZU6S5fjf/YZAaPA==',
  region: 4,
  subRegion: null,
  hmac: 'FUj+hIIt0w/7Sbbd1DCTuzmPyuGUt9YdAx/OcW1fjd4=',
};
const da = Update('HUI', 'admin', criteria, data, true);
console.log(da);

/*
{
  sql: `UPDATE HUI."admin" t0 SET "username"=:1, "password"=:2, "nickname"=:3, "address"=:4, "phone"=:5, "region"=:6, "subRegion"=:7, "hmac"=:8 WHERE t0."a" = 1 AND (t0."aa" > 2 AND t0."bb" = 3) AND t0."createdAt" > TIMESTAMP '2024-07-11 11:02:55' AND t0."bbb" LIKE '%ssd%' AND t1."c" = 'fdsf' AND t1."d" = 'sddf' AND t2."e" = 'fdsf' AND t2."f" = 'sddf';`,
  values: [
    { val: 'fwRGqnRZU6S5fjf/YZA==' },
    { val: 'B4+RjcJEwySgLWJEezTx==' },
    { val: '刘晨璞' },
    { val: null },
    { val: 'fwRGqnRZU6S5fjf/YZAaPA==' },
    { val: 4 },
    { val: null },
    { val: 'FUj+hIIt0w/7Sbbd1DCTuzmPyuGUt9YdAx/OcW1fjd4=' }
  ]
}
  */
