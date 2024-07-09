## 达梦数据库

```js
'use strict';
const DMDB = require('./lib/dmdb');

(async () => {
  const config = {
    client: {
      user: "SYSDBA",
      pwd: "SYSDBA001",
      host: "127.0.0.1",
      port: "30236",
    },
    tablespace: "HUI"
  }
  const dmdb = new DMDB(config);

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
  const res = await dmdb.create('admin', data);
  const d = await dmdb.select('admin', {where: {username: data.username}});
  console.log(d);
  console.log(res);
})();
```
