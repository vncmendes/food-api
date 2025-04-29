import { restaurants, users, authLinks } from "@/database/schema";
import { database } from "@/database/seedsConnection";
import { env } from "@/env";
import { createId } from "@paralleldrive/cuid2";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "./auth";

const app = new Elysia()
  .use(auth)

  .get("/", () => { 
    return new Response("Hello World !");
  })

  .get("/me", async ({ userAuthenticated }) => { 
    console.log("entrei");
    
    const { userId } = await userAuthenticated();
    console.log(userId);

    const [userInfo] = await database.select().from(users).where(eq(users.id, userId));
    console.log(userInfo);

    if (!userInfo) {
      throw new Error("User not found !");
    }

    return userInfo;
  })

  .post("/users", () => {})

  .post("/authenticate", async ({ body }) => {
    const { email } = body;
    const [userExists] = await database.select().from(users).where(eq(users.email, email));
    
    if (!userExists) {
      throw new Error("User not found !");
    }
    const authLinkCode = createId();
    
    await database.insert(authLinks).values({
      code: authLinkCode,
      userId: userExists.id
    });
    // enviar um email
    const authLink = new URL("/auth-links/authenticate", env.API_BASE_URL);
    // generate link
    authLink.searchParams.set("code", authLinkCode);
    // redirect
    authLink.searchParams.set("redirect", env.AUTH_REDIRECT_URL);
    console.log(authLink.toString());
  }, {
    body: t.Object({
      email: t.String({ format: "email" }),
    })
  })

  .get("/auth-links/authenticate", async ({ query, signUser }) => {
    const { code, redirect } = query;

    const [authLinkFromCode] = await database.select().from(authLinks).where(eq(authLinks.code, code));
    // const authLinkFromCode = await database.query.authLinks.findFirst({where(fields, { eq }) { return eq(fields.code, code); }, });

    if (!authLinkFromCode) {
      throw new Error("Unauthorized !");
    }

    const daysSinceAuthLinkWasCreated = dayjs().diff(
      authLinkFromCode.createdAt, 
      "days"
    );

    if (daysSinceAuthLinkWasCreated > 7) {
      throw new Error("Authorization Token Expired. Please, generate a new one !");
    }

    const [managerRestaurant] = await database.select()
      .from(restaurants)
      .where(eq(restaurants.managerId, authLinkFromCode.userId)
    );

    await signUser({
      sub: authLinkFromCode.userId,
      restaurantId: managerRestaurant?.id
    });

    await database.delete(authLinks).where(eq(authLinks.code, code));

    // set.redirect = redirect; deprecated !!!
    return redirect;
  }, {
    query: t.Object({
      code: t.String(),
      redirect: t.String()
    })
  })

  .get("/sign-out", async ({signOut}) => {
    signOut();
  })

	.post("/restaurants", async ({ body, set }) => {
    const { restaurantName, managerName, email, phone } = body;
    
    const [manager] = await database.insert(users).values({
        name: managerName,
        email: email,
        phone: phone,
        role: "manager"
      }
    ).returning({
      id: users.id
    });

    await database.insert(restaurants).values({
      name: restaurantName,
      managerId: manager.id
    });

    set.status = 204;
  }, {
    body: t.Object({
      restaurantName: t.String(),
      managerName: t.String(),
      email: t.String({ format: "email"}),
      phone: t.String()
    })
    // [t] from Elysia is the same of [d] from zod
  });

  app.listen(3333, () => {
    console.log(`HTTP Server is Running on Port: ${app.server?.port}`);
  });
	