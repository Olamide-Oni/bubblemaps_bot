"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
// Create an instance of the `Bot` class and pass your bot token to it.
if (!process.env.TELEGRAM_TOKEN) {
    throw new Error("TELEGRAM_TOKEN is not defined in environment variables");
}
const bot = new grammy_1.Bot(process.env.TELEGRAM_TOKEN);
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.
// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome slime! Up and running."));
bot.on("message", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const address = ctx.message.text;
    try {
        const { data } = yield axios_1.default.get(`https://api.coingecko.com/api/v3/coins/solana/contract/${address}`);
        const market_cap = data.market_data.market_cap.usd;
        const price = data.market_data.current_price.usd;
        const volume = data.market_data.total_volume.usd;
        const liquidity = data.market_data.liquidity_score;
        const holders = data.market_data.holders;
        const holders_count = data.market_data.holders_count;
        ctx.reply(`Market Cap: ${market_cap}\nPrice: ${price}\nVolume: ${volume}\nLiquidity: ${liquidity}\nHolders: ${holders}\nHolders Count: ${holders_count}`);
    }
    catch (error) {
        ctx.reply("invalid address");
    }
}));
bot.hears("search", () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get("https://api.coingecko.com/api/v3/coins/solana/contract/6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN", {
        headers: {
            "x-cg-api-key": process.env.COIN_API_KEY
        }
    });
    const result = response.data;
    const { market_cap } = result;
    console.log(result);
}));
// Handle other messages.
bot.on("message", (ctx) => ctx.reply("Got another message!"));
// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.
// Start the bot.
bot.start();
