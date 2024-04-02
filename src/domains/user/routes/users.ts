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
import { JwtPayload } from '$src/infra/authorization';

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
          'email',
          'phoneNumber',
        ]),
        filter: Filter({
          firstName: Searchable(),
          lastName: Searchable(),
          fullName: Searchable(),
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
        'email',
        'phoneNumber',
        'password',
        'isActive',
      ]),
    },
    async handler(req) {
      const role = await Roles.findOneByOrFail({ id: req.body.role }); // validating role

      req.body.email &&= req.body.email.toLowerCase(); // make email lowercase

      return await Users.save({
        ...req.body,
        role,
        password: await bcrypt.hash(req.body.password, 10),
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['user@user::update'],
        },
      ],
      body: Type.Partial(
        Type.Pick(UserSchema, [
          'firstName',
          'lastName',
          'role',
          'email',
          'phoneNumber',
          'password',
          'isActive',
        ]),
      ),
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { id } = await Users.findOneByOrFail({ id: req.params.id }); // validating user

      const role =
        req.body.role && (await Roles.findOneByOrFail({ id: req.body.role })); // validating role

      const password =
        req.body.password && (await bcrypt.hash(req.body.password, 10)); // hashing password

      req.body.email &&= req.body.email.toLowerCase(); // make email lowercase

      // updating user
      await Users.update(
        { id },
        {
          ...req.body,
          role: {},
          ...(role && { role }),
          ...(password && { password }),
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
        id: Type.Integer(),
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
        id: Type.Integer(),
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
        id: Type.Integer(),
      }),
      body: Type.Pick(UserSchema, ['isActive']),
    },
    async handler(req) {
      const { id } = await Users.findOneByOrFail({ id: req.params.id });
      const { isActive } = req.body;
      await Users.update({ id }, { isActive });
    },
  });

  //made by mehdi. this part till down was not in the main structure by Erfan.

  app.route({
    method: 'POST',
    url: '/login',
    schema: {
      body: Type.Pick(UserSchema, ['email', 'password']),
    },
    async handler(req, reply) {
      const user = await Users.findOneBy({ email: req.body.email });
      if (!user) throw new Error('Invalid data');
      if (user.password !== req.body.password) throw new Error('Invalid data');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const token = app.jwt.sign({ user });
      reply.code(200).send({ token });
    },
  });
};

export default plugin;
