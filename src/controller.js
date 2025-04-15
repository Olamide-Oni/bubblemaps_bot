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
exports.supportedNetworks = void 0;
exports.detectNetwork = detectNetwork;
exports.getTokenInfo = getTokenInfo;
exports.formatNumber = formatNumber;
exports.getNetworkSelectionKeyboard = getNetworkSelectionKeyboard;
exports.getTokenDataAndSCreenshot = getTokenDataAndSCreenshot;
// Load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
const grammy_1 = require("grammy");
const axios_1 = __importDefault(require("axios"));
const screenshot_1 = require("./screenshot");
dotenv_1.default.config();
// Define supported blockchain networks
const supportedNetworks = {
    ethereum: { name: 'Ethereum', bubblemapsId: 'eth', id: 'ethereum', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    bsc: { name: 'Binance Smart Chain', bubblemapsId: 'bsc', id: 'binance-smart-chain', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    ftm: { name: 'Fantom', bubblemapsId: 'ftm', id: 'fantom', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    avax: { name: 'Avalanche', bubblemapsId: 'avax', id: 'avalanche', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    cro: { name: 'Cronos', bubblemapsId: 'cro', id: 'cronos', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    arbitrum: { name: 'Arbitrum', bubblemapsId: 'arb', id: 'arbitrum-one', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    polygon: { name: 'Polygon', bubblemapsId: 'poly', id: 'polygon-pos', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    base: { name: 'Base', bubblemapsId: 'base', id: 'base', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
    solana: { name: 'Solana', bubblemapsId: 'sol', id: 'solana', addressRegex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
    sonic: { name: 'Sonic', bubblemapsId: 'sonic', id: 'sonic', addressRegex: /^0x[a-fA-F0-9]{40}$/ },
};
exports.supportedNetworks = supportedNetworks;
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
function getTokenDataAndSCreenshot(address, network, bubblemapsId) {
    return __awaiter(this, void 0, void 0, function* () {
        const [tokenInfo, screenshot] = yield Promise.all([
            getTokenInfo(address, network),
            (0, screenshot_1.captureBubblemapsScreenshot)(address, bubblemapsId)
        ]);
        return { tokenInfo, screenshot };
    });
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
