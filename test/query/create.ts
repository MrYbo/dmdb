import { Create } from '../../src/query';

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

const da = Create('HUI', 'admin', data, true);
console.log(da);

/**
{
  sql: 'INSERT INTO HUI."admin"  ("address", "hmac", "nickname", "password", "phone", "region", "subRegion", "username") VALUES (:1, :2, :3, :4, :5, :6, :7, :8);',
  values: [
    { val: null },
    { val: 'FUj+hIIt0w/7Sbbd1DCTuzmPyuGUt9YdAx/OcW1fjd4=' },
    { val: '刘晨璞' },
    { val: 'B4+RjcJEwySgLWJEezTx==' },
    { val: 'fwRGqnRZU6S5fjf/YZAaPA==' },
    { val: 4 },
    { val: null },
    { val: 'fwRGqnRZU6S5fjf/YZA==' }
  ]
}
*/
