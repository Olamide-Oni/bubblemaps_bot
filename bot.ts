import { Bot, InputFile, InlineKeyboard } from "grammy";
import env from "dotenv";
import { captureBubblemapsScreenshot } from './src/screenshot';
import { supportedNetworks, detectNetwork, getTokenInfo, formatNumber, getNetworkSelectionKeyboard, getTokenDataAndSCreenshot } from './src/controller';


env.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_TOKEN is not defined in environment variables");
}

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
// Store addresses temporarily during selection process
const addressCache: Record<string, string> = {};



bot.command('start', async (ctx) => {
  await ctx.reply(
    'Welcome to the Multi-Chain Token Info Bot! 🚀\n\n' +
    'Send me a token contract address from any of these networks, and I will fetch information about it:\n' +
    '• Ethereum\n• Binance Smart Chain\n• Fantom\n• Avalanche\n• Cronos\n• Arbitrum\n• Polygon\n• Base\n• Solana\n• Sonic\n\n' +
    'Example (Ethereum): 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984 (UNI token)\n' +
    'Example (Solana): EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC token)'
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'How to use this bot:\n\n' +
    '1. Send a token contract address from any supported network\n' +
    '2. For EVM addresses (starting with 0x), select the network from the menu\n' +
    '3. I will fetch and display current price, market cap, and other info\n\n' +
    'Supported networks:\n' +
    '• Ethereum\n• Binance Smart Chain\n• Fantom\n• Avalanche\n• Cronos\n• Arbitrum\n• Polygon\n• Base\n• Solana\n• Sonic\n\n' +
    'Example (Ethereum): 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984\n' +
    'Example (Solana): EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  );
});


// Handle callback queries (for network selection)
bot.on('callback_query:data', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  
  // Parse callback data (format: n:networkId:shortAddress)
  if (callbackData.startsWith('n:')) {
    const parts = callbackData.split(':');
    if (parts.length !== 3) {
      await ctx.answerCallbackQuery('Invalid selection. Please try again.');
      return;
    }
    const [n, networkId, shortAddress] = parts;
    // Find the network entry where the id matches networkId
    const network = Object.values(supportedNetworks).find(n => n.id === networkId);
    if (!network) {
      await ctx.answerCallbackQuery('Invalid network selected. Please try again.');
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
      await ctx.answerCallbackQuery('Session expired. Please send the address again.');
      await ctx.reply('Sorry, I couldn\'t find your address. Please send it again.');
      return;
    }
    
    // Delete the network selection message
    try {
      await ctx.deleteMessage();
    } catch (error) {
      // Ignore error if message can't be deleted
    }
    
    // Show typing indicator
    await ctx.replyWithChatAction('typing');
    
    try {
      // Fetch token information for the selected network
      const { tokenInfo, screenshot } = await getTokenDataAndSCreenshot(address, networkId, bubblemapsId);
      
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
      const keyboard = new InlineKeyboard()
        .url('View on Bubblemaps', `https://app.bubblemaps.io/${bubblemapsId}/token/${address}`);
      
      // Send the message with the inline keyboard
      await ctx.replyWithPhoto(new InputFile(screenshot));
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      // Clean up the cache
      delete addressCache[cacheKey];
    } catch (error) {
      await ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Answer the callback query
    await ctx.answerCallbackQuery();
  }
});

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

// Handle text messages (assuming they are contract addresses)
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  
  // Detect network from address
  const network = detectNetwork(text);
  
  // If it's a Solana address
  if (network && network.id === 'solana') {
    // Send a "typing" action to show the bot is processing
    await ctx.replyWithChatAction('typing');
    
    try {
      // Fetch token information for Solana
      const { tokenInfo, screenshot } = await getTokenDataAndSCreenshot(text, network.id, 'sol');
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
      const keyboard = new InlineKeyboard()
        .url('View on Bubblemaps', `https://app.bubblemaps.io/sol/token/${text}`);
      // Send the message with the inline keyboard
      await ctx.replyWithPhoto(new InputFile(screenshot));
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      await ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
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
      await ctx.reply(
        'Please select the network for this token address:',
        { reply_markup: keyboard }
      );
    } catch (error) {
      console.error('Error creating network selection:', error);
      await ctx.reply('Sorry, there was an error processing your request. Please try again.');
    }
    return;
  }
  
  // If not a valid address format
  await ctx.reply(
    'That doesn\'t look like a valid token address. 🧐\n\n' +
    'Please send a valid contract address:\n' +
    '• For EVM chains (ETH, BSC, etc.): 0x followed by 40 hex characters\n' +
    '• For Solana: Base58 encoded address (32-44 characters)\n\n' +
    'Type /help for more information.'
  );
});

bot.catch((err) => {
  console.error('Bot error:', err);
});

bot.start();
console.log('Multi-chain token bot started successfully!'); 