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
const screenshot_1 = require("./src/screenshot");
const controller_1 = require("./src/controller");
dotenv_1.default.config();
if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_TOKEN is not defined in environment variables");
}
const bot = new grammy_1.Bot(process.env.TELEGRAM_BOT_TOKEN);
// Store addresses temporarily during selection process
const addressCache = {};
bot.command('start', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Welcome to the Multi-Chain Token Info Bot! 🚀\n\n' +
        'Send me a token contract address from any of these networks, and I will fetch information about it:\n' +
        '• Ethereum\n• Binance Smart Chain\n• Fantom\n• Avalanche\n• Cronos\n• Arbitrum\n• Polygon\n• Base\n• Solana\n• Sonic\n\n' +
        'Example (Ethereum): 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984 (UNI token)\n' +
        'Example (Solana): EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC token)');
}));
bot.command('help', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('How to use this bot:\n\n' +
        '1. Send a token contract address from any supported network\n' +
        '2. For EVM addresses (starting with 0x), select the network from the menu\n' +
        '3. I will fetch and display current price, market cap, and other info\n\n' +
        'Supported networks:\n' +
        '• Ethereum\n• Binance Smart Chain\n• Fantom\n• Avalanche\n• Cronos\n• Arbitrum\n• Polygon\n• Base\n• Solana\n• Sonic\n\n' +
        'Example (Ethereum): 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984\n' +
        'Example (Solana): EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
}));
// Handle callback queries (for network selection)
bot.on('callback_query:data', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = ctx.callbackQuery.data;
    // Parse callback data (format: n:networkId:shortAddress)
    if (callbackData.startsWith('n:')) {
        const parts = callbackData.split(':');
        if (parts.length !== 3) {
            yield ctx.answerCallbackQuery('Invalid selection. Please try again.');
            return;
        }
        const [n, networkId, shortAddress] = parts;
        // Find the network entry where the id matches networkId
        const network = Object.values(controller_1.supportedNetworks).find(n => n.id === networkId);
        if (!network) {
            yield ctx.answerCallbackQuery('Invalid network selected. Please try again.');
            return;
        }
        const bubblemapsId = network.bubblemapsId;
        // Get the user's chat ID for retrieving the full address
        const chatId = ctx.callbackQuery.from.id.toString();
        const userId = ctx.callbackQuery.from.id.toString();
        const cacheKey = `${userId}:${shortAddress}`;
        // Get full address from cache
        const address = addressCache[cacheKey];
        if (!address) {
            yield ctx.answerCallbackQuery('Session expired. Please send the address again.');
            yield ctx.reply('Sorry, I couldn\'t find your address. Please send it again.');
            return;
        }
        // Delete the network selection message
        try {
            yield ctx.deleteMessage();
        }
        catch (error) {
            // Ignore error if message can't be deleted
        }
        // Show typing indicator
        yield ctx.replyWithChatAction('typing');
        try {
            // Fetch token information for the selected network
            const { tokenInfo, screenshot } = yield (0, controller_1.getTokenDataAndSCreenshot)(address, networkId, bubblemapsId);
            // Create a message with the token information
            const message = `
🪙 *${tokenInfo.name} (${tokenInfo.symbol.toUpperCase()})*
🔗 *Network:* ${tokenInfo.networkName}

💰 *Price:* $${tokenInfo.price.toFixed(6)}
📊 *Market Cap:* $${(0, controller_1.formatNumber)(tokenInfo.marketCap)}
📈 *24h Change:* ${tokenInfo.priceChangePercentage24h.toFixed(2)}%

Data provided by CoinGecko
      `;
            // Create an inline keyboard with a link to view on CoinGecko
            const keyboard = new grammy_1.InlineKeyboard()
                .url('View on Bubblemaps', `https://app.bubblemaps.io/${bubblemapsId}/token/${address}`);
            // Send the message with the inline keyboard
            yield ctx.replyWithPhoto(new grammy_1.InputFile(screenshot));
            yield ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            // Clean up the cache
            delete addressCache[cacheKey];
        }
        catch (error) {
            yield ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Answer the callback query
        yield ctx.answerCallbackQuery();
    }
}));
bot.command('bubblemaps', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const args = (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.split(' ');
    if (!args || args.length < 2) {
        yield ctx.reply('Please provide a token address. Usage: /bubblemaps <token_address> [chain]');
        return;
    }
    const tokenAddress = args[1];
    const chain = args[2] || 'eth';
    try {
        yield ctx.reply('Generating bubble map screenshot, please wait...');
        const screenshotBuffer = yield (0, screenshot_1.captureBubblemapsScreenshot)(tokenAddress, chain);
        yield ctx.replyWithPhoto(new grammy_1.InputFile(screenshotBuffer));
    }
    catch (error) {
        console.error('Error capturing screenshot:', error);
        yield ctx.reply('Failed to capture the bubble map screenshot. Please try again later.');
    }
}));
// Handle text messages (assuming they are contract addresses)
bot.on('message:text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.message.text.trim();
    // Detect network from address
    const network = (0, controller_1.detectNetwork)(text);
    // If it's a Solana address
    if (network && network.id === 'solana') {
        // Send a "typing" action to show the bot is processing
        yield ctx.replyWithChatAction('typing');
        try {
            // Fetch token information for Solana
            const { tokenInfo, screenshot } = yield (0, controller_1.getTokenDataAndSCreenshot)(text, network.id, 'sol');
            // Create a message with the token information
            const message = `
🪙 *${tokenInfo.name} (${tokenInfo.symbol.toUpperCase()})*
🔗 *Network:* ${tokenInfo.networkName}

💰 *Price:* $${tokenInfo.price.toFixed(6)}
📊 *Market Cap:* $${(0, controller_1.formatNumber)(tokenInfo.marketCap)}
📈 *24h Change:* ${tokenInfo.priceChangePercentage24h.toFixed(2)}%

Data provided by CoinGecko
      `;
            // Create an inline keyboard with a link to view on CoinGecko
            const keyboard = new grammy_1.InlineKeyboard()
                .url('View on Bubblemaps', `https://app.bubblemaps.io/sol/token/${text}`);
            // Send the message with the inline keyboard
            yield ctx.replyWithPhoto(new grammy_1.InputFile(screenshot));
            yield ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
        catch (error) {
            yield ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
    }
    // For EVM addresses (0x...), ask for network selection
    if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
        try {
            // Store the address in the cache with a short reference
            const userId = ctx.from.id.toString();
            const shortAddress = `${text.substring(0, 10)}...${text.substring(text.length - 10)}`;
            const cacheKey = `${userId}:${shortAddress}`;
            addressCache[cacheKey] = text;
            const keyboard = (0, controller_1.getNetworkSelectionKeyboard)(text);
            yield ctx.reply('Please select the network for this token address:', { reply_markup: keyboard });
        }
        catch (error) {
            console.error('Error creating network selection:', error);
            yield ctx.reply('Sorry, there was an error processing your request. Please try again.');
        }
        return;
    }
    // If not a valid address format
    yield ctx.reply('That doesn\'t look like a valid token address. 🧐\n\n' +
        'Please send a valid contract address:\n' +
        '• For EVM chains (ETH, BSC, etc.): 0x followed by 40 hex characters\n' +
        '• For Solana: Base58 encoded address (32-44 characters)\n\n' +
        'Type /help for more information.');
}));
bot.catch((err) => {
    console.error('Bot error:', err);
});
bot.start();
console.log('Multi-chain token bot started successfully!');
