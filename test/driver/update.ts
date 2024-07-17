import { DMDB, DmConfig } from '../../src/lib/DmdbDriver';
import { Criteria } from "../../src/query";
(async () => {
  const config: DmConfig = {
    connection: {
      user: "SYSDBA",
      password: "SYSDBA001",
      host: "127.0.0.1",
      port: "30236",
    },
    tablespace: "HUI",
    options: {
      caseSensitive: true
    }
  };
  //初始化
  const dmdb = new DMDB(config);

  const criteria: Criteria = {
    where: {id: 148}
  };
  const data = {nickname: "zjamg"}
  // 插入
  const res = await dmdb.update('admin', criteria, data);
  console.log(res);
})();