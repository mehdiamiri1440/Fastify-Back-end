import { UserSchema } from '$src/domains/user/schemas/user.schema';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import bcrypt from 'bcrypt';
import { Role } from '../../user/models/Role';
import { User } from '../../user/models/User';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const Users = repo(User);
  const Roles = repo(Role);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['user@user::list'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy([
          'id',
          'firstName',
          'lastName',
          'nif',
          'email',
          'phoneNumber',
        ]),
        filter: Filter({
          firstName: Searchable(),
          lastName: Searchable(),
          nif: Searchable(),
          email: Searchable(),
          phoneNumber: Searchable(),
        }),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Users, req).relation({ role: true }).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['user@role::create'],
        },
      ],
      body: Type.Pick(UserSchema, [
        'firstName',
        'lastName',
        'role',
        'nif',
        'email',
        'phoneNumber',
        'password',
        'position',
        'isActive',
      ]),
    },
    async handler(req) {
      // validating role
      const role = await Roles.findOneByOrFail({ id: req.body.role });

      return await Users.save({
        ...req.body,
        role,
        password: await bcrypt.hash(req.body.password, 10),
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['user@user::update'],
        },
      ],
      body: Type.Pick(UserSchema, [
        'firstName',
        'lastName',
        'role',
        'nif',
        'email',
        'phoneNumber',
        'password',
        'position',
        'isActive',
      ]),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating role
      const role = await Roles.findOneByOrFail({ id: req.body.role });

      const { id } = await Users.findOneByOrFail({ id: req.params.id });
      await Users.update(
        { id },
        {
          ...req.body,
          role,
          password: await bcrypt.hash(req.body.password, 10),
        },
      );
    },
  });
  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['user@user::list'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      return await Users.findOneOrFail({
        where: { id: req.params.id },
        relations: { role: true },
      });
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['user@user::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const user = await Users.findOneByOrFail({ id: req.params.id });
      await Users.softRemove(user);
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/is-active',
    schema: {
      security: [
        {
          OAuth2: ['user@user::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Pick(UserSchema, ['isActive']),
    },
    async handler(req) {
      const { id } = await Users.findOneByOrFail({ id: req.params.id });
      const { isActive } = req.body;
      await Users.update({ id }, { isActive });
    },
  });
};

export default plugin;
