export default (permission: string, scope: string) => {
  const permissions: string[] = scope.split(' ');
  for (const index in permissions) {
    if (permission === permissions[index]) return true;
  }
  return false;
};
