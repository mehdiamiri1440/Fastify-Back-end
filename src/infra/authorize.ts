export default (permission: string, scope: string) => {
  const permissions: string[] = scope.split(' ');
  return permissions.includes(permission);
};
