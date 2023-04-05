export default function (items: string[], in_: any) {
  const res = JSON.parse(JSON.stringify(in_));
  for (const index in items) {
    delete res[items[index]];
  }
  return res;
}
