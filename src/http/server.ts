import { restaurants, users } from "@/database/schema";
import { database } from "@/database/seedsConnection";
import { Elysia, t } from "elysia";

const app = new Elysia()
	.post("/restaurants", async ({ body, set}) => {
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
	