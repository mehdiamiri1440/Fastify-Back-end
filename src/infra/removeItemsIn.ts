export default function (items: string[], in_: any) {
  for (const index in items) {
    delete in_[items[index]];
  }
  return in_;
}
