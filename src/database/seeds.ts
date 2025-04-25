import { faker } from "@faker-js/faker";
import { users, restaurants} from "./schema";

import { database } from "./seedsConnection";
import chalk from "chalk";

// Reset Database
await database.delete(users);
await database.delete(restaurants);

console.log(chalk.greenBright("Database Reseted Successfully ✔ "));


// Create Customer
await database.insert(users).values([
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "customer"
  },
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "customer"
  },
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "customer"
  }
]);

console.log(chalk.yellow("Customers Created ! ✔ "));

// Create Manager
const [manager] = await database.insert(users).values([
  {
    name: faker.company.name(),
    email: "admin@admin.com",
    role: "manager",    
  }
]).returning({
  id: users.id
});

console.log(chalk.yellow("Managers Created ! ✔ "));


await database.insert(restaurants).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    managerId: manager.id
  }
]);

console.log(chalk.yellow("Restaurants Created ! ✔ "));

console.log(chalk.greenBright("Database Sedded Successfully ✔ "));

process.exit();




