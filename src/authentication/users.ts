/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; scope: string }; // payload type is used for signing and verifying
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * common swagger Bearer config
 */
export const Bearer = {
  Bearer: [],
};

export const usersAuth: any = async (
  req: { jwtVerify: () => any },
  rep: { send: (arg0: unknown) => void },
) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    rep.send(err);
  }
};
