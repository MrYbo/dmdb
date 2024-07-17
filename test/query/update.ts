import { Update, Criteria } from "../../src/query";

const criteria: Criteria = {
  select: ['a', 'b'],
  where: {
    a: 1,
    and: [{ aa: { '>': 2 } }, { bb: 3 }],
    createdAt: { '>': '2024-07-11T11:02:55+08:00' },
    bbb: { 'like': 'ssd' }
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