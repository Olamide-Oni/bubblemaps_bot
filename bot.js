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
// Load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
const grammy_1 = require("grammy");
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
}
// Initialize the bot with the token from environment variables
const bot = new grammy_1.Bot(process.env.TELEGRAM_BOT_TOKEN);
// Define supported blockchain networks
const supportedNetworks = {
    ethereum: { name: 'Ethereum', id: 'ethereum', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    bsc: { name: 'Binance Smart Chain', id: 'binance-smart-chain', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    ftm: { name: 'Fantom', id: 'fantom', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    avax: { name: 'Avalanche', id: 'avalanche', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    cro: { name: 'Cronos', id: 'cronos', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    arbitrum: { name: 'Arbitrum', id: 'arbitrum-one', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    polygon: { name: 'Polygon', id: 'polygon-pos', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    base: { name: 'Base', id: 'base', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    solana: { name: 'Solana', id: 'solana', addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
    sonic: { name: 'Sonic', id: 'sonic', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
};
// Helper function to detect the network from an address
function detectNetwork(address) {
    // First check Solana which has a different address format
    if (supportedNetworks.solana.addressRegex.test(address)) {
        return supportedNetworks.solana;
    }
    // For EVM compatible chains, we need to ask the user which network it's on
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return null; // Will handle this with a network selection menu
    }
    return null; // Unsupported address format
}
// Helper function to format numbers with commas
function formatNumber(num) {
    return num.toLocaleString('en-US');
}
// Function to get network selection keyboard
function getNetworkSelectionKeyboard(address) {
    const keyboard = new grammy_1.InlineKeyboard();
    // Store only the first 10 and last 10 characters of the address to stay within Telegram's 64-byte limit
    const shortAddress = `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
    // Add buttons for EVM networks in rows of 2
    let evmNetworks = Object.values(supportedNetworks).filter(network => network.id !== 'solana');
    for (let i = 0; i < evmNetworks.length; i += 2) {
        const row = [];
        if (i < evmNetworks.length) {
            row.push(grammy_1.InlineKeyboard.text(evmNetworks[i].name, `n:${evmNetworks[i].id}:${shortAddress}`));
        }
        if (i + 1 < evmNetworks.length) {
            row.push(grammy_1.InlineKeyboard.text(evmNetworks[i + 1].name, `n:${evmNetworks[i + 1].id}:${shortAddress}`));
        }
        keyboard.row(...row);
    }
    return keyboard;
}
// Function to fetch token information using CoinGecko API
function getTokenInfo(contractAddress, networkId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Get token data from contract address for the specified network
            const tokenDataResponse = yield axios_1.default.get(`${process.env.COINGECKO_API_URL}/coins/${networkId}/contract/${contractAddress}`);
            const tokenData = tokenDataResponse.data;
            // Extract relevant information
            const tokenInfo = {
                name: tokenData.name,
                symbol: tokenData.symbol,
                price: tokenData.market_data.current_price.usd,
                marketCap: tokenData.market_data.market_cap.usd,
                priceChangePercentage24h: tokenData.market_data.price_change_percentage_24h || 0,
                image: tokenData.image.small,
                networkId: networkId,
                networkName: ((_a = Object.values(supportedNetworks).find(n => n.id === networkId)) === null || _a === void 0 ? void 0 : _a.name) || networkId
            };
            return tokenInfo;
        }
        catch (error) {
            console.error('Error fetching token information:', error instanceof Error ? error.message : String(error));
            throw new Error('Failed to fetch token information. The contract address might be invalid or the token is not listed on CoinGecko for this network.');
        }
    });
}
// Store addresses temporarily during selection process
const addressCache = {};
// Handle the /start command
bot.command('start', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Welcome to the Multi-Chain Token Info Bot! 🚀\n\n' +
        'Send me a token contract address from any of these networks, and I will fetch information about it:\n' +
        '• Ethereum\n• Binance Smart Chain\n• Fantom\n• Avalanche\n• Cronos\n• Arbitrum\n• Polygon\n• Base\n• Solana\n• Sonic\n\n' +
        'Example (Ethereum): 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984 (UNI token)\n' +
        'Example (Solana): EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC token)');
}));
// Handle the /help command
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
        const networkId = parts[1];
        const shortAddress = parts[2];
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
            const tokenInfo = yield getTokenInfo(address, networkId);
            // Create a message with the token information
            const message = `
🪙 *${tokenInfo.name} (${tokenInfo.symbol.toUpperCase()})*
🔗 *Network:* ${tokenInfo.networkName}

💰 *Price:* $${tokenInfo.price.toFixed(6)}
📊 *Market Cap:* $${formatNumber(tokenInfo.marketCap)}
📈 *24h Change:* ${tokenInfo.priceChangePercentage24h.toFixed(2)}%

Data provided by CoinGecko
      `;
            // Create an inline keyboard with a link to view on CoinGecko
            const keyboard = new grammy_1.InlineKeyboard()
                .url('View on CoinGecko', `https://www.coingecko.com/en/coins/${networkId}/contract/${address}`);
            // Send the message with the inline keyboard
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
// Handle text messages (assuming they are contract addresses)
bot.on('message:text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const text = ctx.message.text.trim();
    // Detect network from address
    const network = detectNetwork(text);
    // If it's a Solana address
    if (network && network.id === 'solana') {
        // Send a "typing" action to show the bot is processing
        yield ctx.replyWithChatAction('typing');
        try {
            // Fetch token information for Solana
            const tokenInfo = yield getTokenInfo(text, network.id);
            // Create a message with the token information
            const message = `
🪙 *${tokenInfo.name} (${tokenInfo.symbol.toUpperCase()})*
🔗 *Network:* ${tokenInfo.networkName}

💰 *Price:* $${tokenInfo.price.toFixed(6)}
📊 *Market Cap:* $${formatNumber(tokenInfo.marketCap)}
📈 *24h Change:* ${tokenInfo.priceChangePercentage24h.toFixed(2)}%

Data provided by CoinGecko
      `;
            // Create an inline keyboard with a link to view on CoinGecko
            const keyboard = new grammy_1.InlineKeyboard()
                .url('View on CoinGecko', `https://www.coingecko.com/en/coins/${network.id}/contract/${text}`);
            // Send the message with the inline keyboard
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
            const keyboard = getNetworkSelectionKeyboard(text);
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
// Add global error handler
bot.catch((err) => {
    console.error('Bot error:', err);
});
// Start the bot
bot.start();
console.log('Multi-chain token bot started successfully!');
