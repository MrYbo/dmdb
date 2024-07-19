import { DMDB, DmConfig } from '../../src/lib/DmdbDriver';

(async () => {
  const config: DmConfig = {
    connection: {
      user: 'SYSDBA',
      password: 'SYSDBA001',
      host: '127.0.0.1',
      port: '30236',
    },
    tablespace: 'HUI',
    options: {
      caseSensitive: true,
    },
  };
  //初始化
  const dmdb = new DMDB(config);

  const data = {
    username: 'fwRGqnRZU6S5fjf/YZC==',
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
  console.log(res);
  process.exit(0);
})();
