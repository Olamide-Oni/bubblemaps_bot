import { Bot } from "grammy";
import env from "dotenv";

env.config();

// Create an instance of the `Bot` class and pass your bot token to it.
if (!process.env.TELEGRAM_TOKEN) {
  throw new Error("TELEGRAM_TOKEN is not defined in environment variables");
}
const bot = new Bot(process.env.TELEGRAM_TOKEN);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome slime! Up and running."));
// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
bot.start();