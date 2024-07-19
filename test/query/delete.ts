import { Delete, Criteria } from '../../src/query';

const criteria: Criteria = {
  select: ['a', 'b'],
  where: {
    a: 1,
    and: [{ aa: { '>': 2 } }, { bb: 3 }],
    createdAt: { '>': '2024-07-11T11:02:55+08:00' },
    bbb: { like: 'ssd' },
  },
  // include: [
  //   {
  //     select: ['c', 'd'],
  //     model: 'another_table',
  //     type: 'left',
  //     on: { 'another_id': 'id'},
  //     where: { c: 'fdsf', d: 'sddf' },
  //   },
  //   {
  //     select: ['e', 'f'],
  //     type: 'inner',
  //     model: 'another_table',
  //     on: { id: 'another_id' },
  //     where: { e: 'fdsf', f: 'sddf' },
  //   }
  // ]
};
const da = Delete('HUI', 'admin', criteria, false);
console.log(da);

/*
DELETE FROM HUI.admin   WHERE a = 1 AND (aa > 2 AND bb = 3) AND createdAt > TIMESTAMP '2024-07-11 11:02:55' AND bbb LIKE '%ssd%';
*/
