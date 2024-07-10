
/**
 * 对需要插入达梦数据库的数据进行初始化转译
 * @param {Object} data 
 * @returns {Object}
 *    - keys: 插入到数据库的键
 *    - placeholder: 占位符
 *    - values: 数据
 */
exports.insertParamsFormat = function (data) {
  const keys = [];
  const placeholders = [];
  const values = [];
  // 对键进行排序，防止批量插入时键顺序不通导致错误
  const dkeys = Object.keys(data).sort();
  dkeys.map((k, index) => {
    keys.push(`"${k}"`);
    placeholders.push(index + 1);
    values.push({val: data[k]});
  });
  return {
    keys: keys.join(','),
    placeholder: `:${placeholders.join(', :')}`,
    values
  };
}



exports.initInsertSql = function (tablespace, table, data) {
  const keywords = ['insert', 'into'];
  const {keys, placeholder, values} = this.insertParamsFormat(data);
  const tableName = this.getTableName(tablespace, table);
  keywords.push(tableName, `(${keys})`, 'values',  `(${placeholder})`);
  const sql = keywords.join(' ');
  return {sql, values};
}

exports.getTableName = function (tablespace, table) {
  const _table = `"${table}"`;
  return tablespace ? tablespace + '.' + _table : _table;;
}