import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import chalk from "chalk";


const connection = postgres(env.DATABASE_URL, {max: 1});
const database = drizzle(connection);

await migrate(database, { migrationsFolder: "drizzle" });

console.log(chalk.greenBright("Migrations Applied Successfully !"));


await connection.end();

process.exit();
