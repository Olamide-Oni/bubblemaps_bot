// Load environment variables
import env from "dotenv";
import { InlineKeyboard } from "grammy";
import axios from "axios";
import { captureBubblemapsScreenshot } from './screenshot';

env.config()

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

// Helper function to detect the network from an address
function detectNetwork(address: string) {
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

async function getTokenDataAndSCreenshot(address: string, network: string, bubblemapsId: string) {
  try {
    // Try to get both token info and screenshot in parallel
    const [tokenInfo, screenshot] = await Promise.all([
      getTokenInfo(address, network).catch(error => {
        console.log('Token info fetch failed:', error);
        // Return null instead of throwing to continue with screenshot
        return null;
      }),
      captureBubblemapsScreenshot(address, bubblemapsId).catch(error => {
        console.log('Screenshot capture failed:', error);
        // Return null instead of throwing
        return null;
      })
    ]);
    
    // If both failed, throw an error
    if (!tokenInfo && !screenshot) {
      throw new Error('Could not fetch token data or generate visualization');
    }
    
    return { tokenInfo, screenshot };
  } catch (error) {
    console.error('Error in getTokenDataAndSCreenshot:', error);
    throw error;
  }
}

// Helper function to format numbers with commas
function formatNumber(num: number) {
  return num.toLocaleString('en-US');
}

// Function to get network selection keyboard
function getNetworkSelectionKeyboard(address: string) {
  const keyboard = new InlineKeyboard();
  
  // Store only the first 10 and last 10 characters of the address to stay within Telegram's 64-byte limit
  const shortAddress = `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  
  // Add buttons for EVM networks in rows of 2
  let evmNetworks = Object.values(supportedNetworks).filter(
    network => network.id !== 'solana'
  );
  
  for (let i = 0; i < evmNetworks.length; i += 2) {
    const row = [];
    if (i < evmNetworks.length) {
      row.push(InlineKeyboard.text(
        evmNetworks[i].name, 
        `n:${evmNetworks[i].id}:${shortAddress}`
      ));
    }
    if (i + 1 < evmNetworks.length) {
      row.push(InlineKeyboard.text(
        evmNetworks[i + 1].name, 
        `n:${evmNetworks[i + 1].id}:${shortAddress}`
      ));
    }
    keyboard.row(...row);
  }
  return keyboard;
}

// Function to fetch token information using CoinGecko API
async function getTokenInfo(contractAddress: string, networkId: string) {
  try {
    // Get token data from contract address for the specified network
    const tokenDataResponse = await axios.get(
      `${process.env.COINGECKO_API_URL}/coins/${networkId}/contract/${contractAddress}`
    );

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
      networkName: Object.values(supportedNetworks).find(n => n.id === networkId)?.name || networkId
    };
    
    return tokenInfo;
  } catch (error) {
    console.error('Error fetching token information:', error instanceof Error ? error.message : String(error));
    throw new Error('Failed to fetch token information. The contract address might be invalid or the token is not listed on CoinGecko for this network.');
  }
}

// Store addresses temporarily during selection process
const addressCache: Record<string, string> = {};


// Start the bot


export { supportedNetworks, detectNetwork, getTokenInfo, formatNumber, getNetworkSelectionKeyboard, getTokenDataAndSCreenshot };

