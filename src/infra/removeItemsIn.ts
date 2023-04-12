export default function (items: string[], input: any) {
  const res = structuredClone(input);
  for (const item of items) {
    delete res[item];
  }
  return res;
}
