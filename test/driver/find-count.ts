import { DMDB, DmConfig } from '../../src/lib/DmdbDriver';
import { Criteria } from '../../src/query';
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

  const criteria: Criteria = {
    select: ['id', 'title', 'cover'],
    where: {
      publishAt: { '>': '2022-07-11T11:02:55+08:00' },
      title: { like: '同心' },
    },
    include: [
      {
        model: 'organization',
        type: 'inner',
        on: { organization: 'id' },
        where: { region: 1 },
      },
    ],
    offset: 0,
    limit: 5,
    sort: 'id DESC',
  };
  // 查找并返回条数
  const { items, total } = await dmdb.findAllAndCount('event', criteria);
  console.log(items, total);
})();
