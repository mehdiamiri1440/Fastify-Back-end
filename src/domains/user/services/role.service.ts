import {
  DataSource,
  DeepPartial,
  Driver,
  EntityManager,
  Repository,
} from 'typeorm';
import { Role } from '$src/domains/user/models/Role';
import { RolePermission } from '$src/domains/user/models/RolePermission';
import systemPermissions from '$src/permissions';
import { INVALID_PERMISSION } from '$src/domains/user/errors';
export class RoleService {
  private roleRepo: Repository<Role>;
  private rolePermissionRepo: Repository<RolePermission>;
  #userId: number;

  constructor(dataSource: DataSource | EntityManager, userId: number) {
    this.roleRepo = dataSource.getRepository(Role);
    this.rolePermissionRepo = dataSource.getRepository(RolePermission);
    this.#userId = userId;
  }
  async createRole(newRole: DeepPartial<Role>) {
    return await this.roleRepo.save({
      ...newRole,
      creator: { id: this.#userId },
    });
  }
  async updateRole(roleId: number, newRole: DeepPartial<Role>) {
    const { id } = await this.roleRepo.findOneByOrFail({ id: roleId });
    await this.roleRepo.update({ id }, newRole);
  }
  async updateActivityRole(roleId: number, isActive: boolean) {
    const { id } = await this.roleRepo.findOneByOrFail({ id: roleId });
    await this.roleRepo.update({ id }, { isActive });
  }
  async updatePermissionsOfRole(roleId: number, permissions: string[]) {
    // create list that new permissions assigned to role
    const newRolePermissions: DeepPartial<RolePermission>[] = [];
    for (const permission of permissions) {
      if (!(permission in systemPermissions)) throw new INVALID_PERMISSION(); // check if we have this permission or not
      newRolePermissions.push({
        role: { id: roleId },
        permission,
        creator: { id: this.#userId },
      });
    }

    // delete old permissions
    await this.rolePermissionRepo.softDelete({
      role: { id: roleId },
    });

    // saving new permissions
    await this.rolePermissionRepo.save(newRolePermissions);
  }
}
