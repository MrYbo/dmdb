export function insertParamsFormat (data: Record<string, any>) {
  let keys: string[] = [];
  let placeholders: number[] = [];
  let values: any[] = [];
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
    values,
  };
}