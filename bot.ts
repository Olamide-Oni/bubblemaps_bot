import { Bot } from "grammy";
import env from "dotenv";
import axios from "axios"

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

bot.on("message", async (ctx) => {
  const address = ctx.message.text
  try {
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/solana/contract/${address}`)
    const market_cap = data.market_data.market_cap.usd
    const price = data.market_data.current_price.usd
    const volume = data.market_data.total_volume.usd
    const liquidity = data.market_data.liquidity_score
    const holders = data.market_data.holders
    const holders_count = data.market_data.holders_count
    ctx.reply(`Market Cap: ${market_cap}\nPrice: ${price}\nVolume: ${volume}\nLiquidity: ${liquidity}\nHolders: ${holders}\nHolders Count: ${holders_count}`)
  } catch (error) {
    ctx.reply("invalid address")
  }
});

bot.hears("search", async () => {
  const response = await axios.get("https://api.coingecko.com/api/v3/coins/solana/contract/6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN", {
    headers: {
      "x-cg-api-key": process.env.COIN_API_KEY
    }
  })
  const result = response.data
  const {market_cap} = result
  console.log(result)

})
// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));


// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
bot.start();