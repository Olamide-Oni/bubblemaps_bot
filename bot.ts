import { Bot } from "grammy";
import env from "dotenv";
import { captureBubblemapsScreenshot } from './screenshot'; 
import { InputFile } from "grammy";
import axios from "axios"

env.config();

// Create an instance of the `Bot` class and pass your bot token to it.
if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_TOKEN is not defined in environment variables");
}
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome slime! Up and running."));

bot.command('bubblemaps', async (ctx) => {
  const args = ctx.message?.text?.split(' ');
  if (!args || args.length < 2) {
    await ctx.reply('Please provide a token address. Usage: /bubblemaps <token_address> [chain]');
    return;
  }

  const tokenAddress = args[1];
  const chain = args[2] || 'eth';

  try {
    await ctx.reply('Generating bubble map screenshot, please wait...');
    const screenshotBuffer = await captureBubblemapsScreenshot(tokenAddress, chain);
    await ctx.replyWithPhoto(new InputFile(screenshotBuffer));
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    await ctx.reply('Failed to capture the bubble map screenshot. Please try again later.');
  }
});

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