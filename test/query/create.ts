import { Create } from "../../src/query";

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

const da = Create('HUI', 'admin', data, false);
console.log(da);