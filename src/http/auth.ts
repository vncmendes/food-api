import { env } from "@/env";
import cookie from "@elysiajs/cookie";
import jwt from "@elysiajs/jwt";
import { Elysia,  Static,  t } from "elysia";

const jwtPayload = t.Object({
  sub: t.String(),
  restaurantId: t.Optional(t.String())
});

export const auth = new Elysia()
  .use(
    jwt({
      secret: env.JWT_SECRET_KEY,
      schema: jwtPayload
  }))
  .use(cookie())
  // .derive() -> allow sharing information by context
  // Static<> is to create an TS OBJ from Typebox OBJ
  .derive({ as: "scoped" }, ({ jwt, cookie: { auth }}) => {
    return {
      signUser: async (payload: Static<typeof jwtPayload>) => {
        const token = await jwt.sign(payload);
    
        auth.value = token;
        auth.httpOnly = true;
        auth.maxAge = 60 * 60 * 24 * 7; // 7 dias
        auth.path = "/";
      },
      
      signOut: async () => {
        auth.remove();
      },

      userAuthenticated: async () => {
       const payload = await jwt.verify(auth.value);

       if (!payload) {
        throw new Error("Unauthorized !");
       }

       return {
        userId: payload.sub,
        restaurantId: payload.restaurantId
       };
      },

      managerRestaurant: async () => {
       const payload = await jwt.verify(auth.value);

       if (!payload) {
        throw new Error("Sorry, restaurant not found !");
       }

       return {
        userId: payload.sub,
        restaurantId: payload.restaurantId
       };
      }
    };
  });

  