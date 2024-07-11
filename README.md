## 一个简单封装的达梦数据库脚手架

已实现的功能
- [x] 增加
- [x] 批量增加
- [x] 同步mysql指定的表到达梦数据库
- [x] 按条件查找
- [ ] 更新
- [ ] 删除


## 用法
```js
'use strict';
const DMDB = require('dmdbms');

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
  //初始化
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
  // 插入
  const res = await dmdb.create('admin', data);
  // 查找
  const d = await dmdb.select('admin', {where: {username: data.username}});
  console.log(d);
  console.log(res);
})();
```

### 同步mysql到dm
```js
const dmconfig = {
    connection: {
      user: "SYSDBA",
      pwd: "SYSDBA001",
      host: "127.0.0.1",
      port: "30236",
    },
    tablespace: "HUI"
  };
  

  const sqlconfig = {
    connection: {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '12345678',
      database: 'hui',
    },
  }

  const dmdb = new DMDB(dmconfig);
  const table = 'event';
  await dmdb.asynMySQLTable(sqlconfig, table, table);
```