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
  // Get the user's name if available
  const userName = ctx.from?.first_name || 'there';
  
  // Create a welcome keyboard with helpful commands
  const welcomeKeyboard = new InlineKeyboard()
    .text('💰 Token Examples', 'guide:examples')
    .text('🔍 Commands', 'guide:commands')
    .row()
    .text('📊 Popular Tokens', 'guide:popular')
    .text('❓ Help', 'guide:help');
  
  // Send the welcome message with the keyboard
  await ctx.reply(
    `*Welcome, ${userName}!* 🚀\n\n` +
    `I'm your Multi-Chain Token Info Bot, designed to provide real-time data and visualizations for crypto tokens across multiple blockchains.\n\n` +
    
    `*✨ What I can do:*\n` +
    `• Get token prices, market caps & 24h changes\n` +
    `• Generate token holder visualizations\n` +
    `• Support 10 different blockchains\n` +
    `• Provide CoinGecko data integration\n\n` +
    
    `*🔎 How to use me:*\n` +
    `1️⃣ Simply paste any token contract address directly in chat\n` +
    `2️⃣ For EVM chains (0x...), select the network when prompted\n` +
    `3️⃣ I'll automatically fetch data and generate visualizations\n\n` +
    
    `*No commands needed!* Just copy & paste any token address.\n\n` +
    
    `*Additional commands:*\n` +
    `/start - Show this guide\n` +
    `/help - Detailed usage instructions\n\n` +
    
    `*Supported networks:*\n` +
    `ETH • BSC • FTM • AVAX • CRO • ARB • POLY • BASE • SOL • SONIC\n\n` +
    
    `Select an option below to learn more:`,
    {
      parse_mode: 'Markdown',
      reply_markup: welcomeKeyboard
    }
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
  
  // Guide menu handler
  if (callbackData.startsWith('guide:')) {
    const guideType = callbackData.split(':')[1];
    
    if (guideType === 'examples') {
      // Create keyboard with copyable addresses
      const addressKeyboard = new InlineKeyboard()
        /*.text('Copy UNI', 'copy:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984')
        .text('Copy SHIB', 'copy:0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce')
        .row()
        .text('Copy CAKE', 'copy:0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82')
        .text('Copy FLOKI', 'copy:0xfb5b838b6cfeedc2873ab27866079ac55363d37e')
        .row()
        .text('Copy USDC (SOL)', 'copy:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
        .row()
        .text('Copy BONK (SOL)', 'copy:DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263')
        .row() */
        .text('« Back to Main Menu', 'guide:back');
      
        await ctx.editMessageText(
          '<b>📝 Token Address Examples:</b>\n\n' +
        
          'Simply click a button below to copy an address to clipboard, or tap on an address to use it:\n\n' +
        
          '<b>Ethereum (ETH):</b>\n' +
          '• UNI: <code>0x1f9840a85d5af5bf1d1762f925bdaddc4201f984</code> (tap to copy)\n' +
          '• SHIB: <code>0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce</code> (tap to copy)\n\n' +
        
          '<b>Binance Smart Chain (BSC):</b>\n' +
          '• CAKE: <code>0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82</code> (tap to copy)\n' +
          '• FLOKI: <code>0xfb5b838b6cfeedc2873ab27866079ac55363d37e</code> (tap to copy)\n\n' +
        
          '<b>Solana (SOL):</b>\n' +
          '• USDC: <code>EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v</code> (tap to copy)\n' +
          '• BONK: <code>DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263</code> (tap to copy)\n\n' +
        
          '<i>No commands needed - just paste the address!</i>',
          {
            parse_mode: 'HTML',
            reply_markup: addressKeyboard
          }
        );
        
        
    } 
    else if (guideType === 'commands') {
      await ctx.editMessageText(
        '*🔍 Available Commands:*\n\n' +
        
        '`/start` - Show welcome guide\n' +
        '`/help` - Display usage instructions\n\n' +
        
        '*⭐ Main Usage - No Commands Needed:*\n' +
        '• *Simply paste any token address directly in chat*\n' +
        '• The bot will automatically detect and process it\n' +
        '• For EVM addresses (0x...), you\'ll get a network selection menu\n' +
        '• Solana addresses are auto-detected\n\n' +
        
        '*Each result includes:*\n' +
        '• Current price and market cap\n' +
        '• 24-hour price change\n' +
        '• Token holder visualization\n' +
        '• Link to view more details',
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('« Back to Main Menu', 'guide:back')
        }
      );
    }
    else if (guideType === 'popular') {
      await ctx.editMessageText(
        '*📊 Popular Tokens by Network:*\n\n' +
        
        '*Ethereum Top Tokens:*\n' +
        '• ETH - Ethereum\n' +
        '• USDT - Tether\n' +
        '• USDC - USD Coin\n' +
        '• BNB - Binance Coin\n' +
        '• SHIB - Shiba Inu\n\n' +
        
        '*BSC Top Tokens:*\n' +
        '• CAKE - PancakeSwap\n' +
        '• FLOKI - Floki\n' +
        '• BABYDOGE - Baby Doge Coin\n\n' +
        
        '*Solana Top Tokens:*\n' +
        '• BONK - Bonk\n' +
        '• JTO - Jito\n' +
        '• RENDER - Render Token\n\n' +
        
        'Want to check any of these? Just ask!',
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('« Back to Main Menu', 'guide:back')
        }
      );
    }
    else if (guideType === 'help') {
      await ctx.editMessageText(
        '*❓ Help & Troubleshooting:*\n\n' +
        
        '*Common Issues:*\n' +
        '• *Token not found* - The token might not be listed on CoinGecko\n' +
        '• *Timeout errors* - Try again, network might be congested\n' +
        '• *No visualization* - Some tokens may not have Bubblemaps data\n\n' +
        
        '*Usage Tips:*\n' +
        '• Simply paste any token address directly in chat\n' +
        '• Make sure to use the correct contract address\n' +
        '• Patience please! Visualizations can take a moment to generate\n\n' +
        
        '*Data Sources:*\n' +
        '• Token data: CoinGecko API\n' +
        '• Visualizations: Bubblemaps\n\n' +
        
        'Need more help? Contact @Amin99199',
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().text('« Back to Main Menu', 'guide:back')
        }
      );
    }
    else if (guideType === 'back') {
      // Return to main menu
      const userName = ctx.from?.first_name || 'there';
      const welcomeKeyboard = new InlineKeyboard()
        .text('💰 Token Examples', 'guide:examples')
        .text('🔍 Commands', 'guide:commands')
        .row()
        .text('📊 Popular Tokens', 'guide:popular')
        .text('❓ Help', 'guide:help');
      
      await ctx.editMessageText(
        `*Welcome, ${userName}!* 🚀\n\n` +
        `I'm your Multi-Chain Token Info Bot, designed to provide real-time data and visualizations for crypto tokens across multiple blockchains.\n\n` +
        
        `*✨ What I can do:*\n` +
        `• Get token prices, market caps & 24h changes\n` +
        `• Generate token holder visualizations\n` +
        `• Support 10 different blockchains\n` +
        `• Provide CoinGecko data integration\n\n` +
        
        `*🔎 How to use me:*\n` +
        `1️⃣ Simply paste any token contract address directly in chat\n` +
        `2️⃣ For EVM chains (0x...), select the network when prompted\n` +
        `3️⃣ I'll automatically fetch data and generate visualizations\n\n` +
        
        `*No commands needed!* Just copy & paste any token address.\n\n` +
        
        `*Additional commands:*\n` +
        `/start - Show this guide\n` +
        `/help - Detailed usage instructions\n\n` +
        
        `*Supported networks:*\n` +
        `ETH • BSC • FTM • AVAX • CRO • ARB • POLY • BASE • SOL • SONIC\n\n` +
        
        `Select an option below to learn more:`,
        {
          parse_mode: 'Markdown',
          reply_markup: welcomeKeyboard
        }
      );
    }
    
    // Answer the callback query
    await ctx.answerCallbackQuery();
    return;
  }
  
  // Handle existing network selection callback (n:networkId:shortAddress)
  if (callbackData.startsWith('n:')) {
    const parts = callbackData.split(':');
    if (parts.length !== 3) {
      await ctx.answerCallbackQuery('Invalid selection. Please try again.');
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
    
    // Send status message
    const statusMessage = await ctx.reply('🔍 Fetching token data and generating visualization...');
    
    try {
      // Get bubblemaps chain ID
      const networkKey = getNetworkKeyById(networkId);
      if (!networkKey) {
        throw new Error(`Unknown network ID: ${networkId}`);
      }
      const networkDetails = supportedNetworks[networkKey]; // Get full network details
      const bubblemapsId = networkDetails.bubblemapsId;
      
      // Fetch token information, Bubblemaps score, and screenshot for the selected network
      const { tokenInfo, bubblemapsInfo, screenshot } = await getTokenDataAndSCreenshot(address, networkId, bubblemapsId);
      
      // Delete status message
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, statusMessage.message_id);
      } catch (error) {
        console.log('Could not delete status message', error);
      }
      
      // --- Start Building Response ---
      let message = '';
      let keyboard = new InlineKeyboard();
      const networkName = tokenInfo?.networkName || networkDetails.name;
      
      // Add Token Header (if available)
      if (tokenInfo) {
        message += `🪙 *${tokenInfo.name} (${tokenInfo.symbol.toUpperCase()})*\n`;
      } else {
        // Use address if name is missing
        message += `🪙 *Token:* \`${address.substring(0, 6)}...${address.substring(address.length - 4)}\`\n`;
      }
      message += `🔗 *Network:* ${networkName}\n\n`;
      
      // Add CoinGecko Data (if available)
      if (tokenInfo) {
        message += `*CoinGecko Data:*\n💰 *Price:* $${tokenInfo.price.toFixed(6)}\n📊 *Market Cap:* $${formatNumber(tokenInfo.marketCap)}\n📈 *24h Change:* ${tokenInfo.priceChangePercentage24h.toFixed(2)}%\n\n`;
        keyboard = keyboard.url('View on CoinGecko', `https://www.coingecko.com/en/coins/${networkId}/contract/${address}`);
      } else {
        message += `*CoinGecko Data:* Not available for this token.\n\n`;
      }
      
      // Add Bubblemaps Supply Analysis (if available)
      if (bubblemapsInfo) {
        message += `*Supply Analysis (Bubblemaps):*\n💯 *Decentralization Score:* ${bubblemapsInfo.decentralizationScore !== undefined && bubblemapsInfo.decentralizationScore !== null ? bubblemapsInfo.decentralizationScore.toFixed(2) : 'N/A'}\n📦 *In CEXs:* ${bubblemapsInfo.percentInCexs !== undefined ? bubblemapsInfo.percentInCexs.toFixed(2) + '%' : 'N/A'}\n📜 *In Contracts:* ${bubblemapsInfo.percentInContracts !== undefined ? bubblemapsInfo.percentInContracts.toFixed(2) + '%' : 'N/A'}\n\n`;
        // Add Bubblemaps link if we have this data or the screenshot
        keyboard = keyboard.url('View on Bubblemaps', `https://app.bubblemaps.io/${bubblemapsId}/token/${address}`);
      } else {
        message += `*Supply Analysis (Bubblemaps):* Not available for this token.\n\n`;
      }
      
      // Add Screenshot note (if missing but other data exists)
      if (!screenshot && (tokenInfo || bubblemapsInfo)) {
        message += `\n⚠️ Visualization could not be generated.`;
      }
      // Add general data note (if screenshot exists but nothing else)
      else if (screenshot && !tokenInfo && !bubblemapsInfo) {
         message = `*Token Visualization*\n🔗 *Network:* ${networkName}\n\nℹ️ Token data not available from CoinGecko or Bubblemaps metadata, but visualization was generated successfully.`
         keyboard = keyboard.url('View on Bubblemaps', `https://app.bubblemaps.io/${bubblemapsId}/token/${address}`);
      }

      // Add "Powered by Bubblemaps" if Bubblemaps data or screenshot is present
      if (bubblemapsInfo || screenshot) {
          message += `\n\nPowered by [Bubblemaps](https://bubblemaps.io/) 📊`;
      }
      
      // --- Send Response ---
      if (screenshot) {
        // Send photo first, then the text message with keyboard
        await ctx.replyWithPhoto(new InputFile(screenshot), {
          caption: message.trim(), // Use caption for photo
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else if (tokenInfo || bubblemapsInfo) {
        // Send text message only if no screenshot but we have some data
        await ctx.reply(message.trim(), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        // This case should be caught by getTokenDataAndSCreenshot, but as a fallback:
        await ctx.reply("Couldn't fetch any information or visualization for this token.");
      }
      
      // Clean up the cache
      delete addressCache[cacheKey];
    } catch (error) {
      // Delete status message even on error
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, statusMessage.message_id);
      } catch (err) {
        console.log('Could not delete status message', err);
      }
      
      await ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Answer the callback query
    await ctx.answerCallbackQuery();
  }

  // Handle copy button click to send the contract address
  if (callbackData.startsWith('copy:')) {
    const address = callbackData.substring(5); // Remove 'copy:' prefix
    
    // Answer the callback query
    await ctx.answerCallbackQuery('Address copied! Paste it in a new message.');
    
    // Send the address in a new message that the user can easily copy
    await ctx.reply(
      `\`${address}\`\n\nYou can copy this address and send it back to analyze this token.`,
      { parse_mode: 'Markdown' }
    );
    
    return;
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
    
    // Send status message
    const statusMessage = await ctx.reply('🔍 Fetching token data and generating visualization...');
    
    try {
      // Fetch token information, Bubblemaps score, and screenshot for Solana
      const { tokenInfo, bubblemapsInfo, screenshot } = await getTokenDataAndSCreenshot(text, network.id, 'sol');
      
      // Delete status message
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, statusMessage.message_id);
      } catch (error) {
        console.log('Could not delete status message', error);
      }
      
      // --- Start Building Response (Solana) ---
      let message = '';
      let keyboard = new InlineKeyboard();
      const networkName = tokenInfo?.networkName || network.name;
      
      // Add Token Header (if available)
      if (tokenInfo) {
        message += `🪙 *${tokenInfo.name} (${tokenInfo.symbol.toUpperCase()})*\n`;
      } else {
        message += `🪙 *Token:* \`${text.substring(0, 4)}...${text.substring(text.length - 4)}\`\n`; // Solana address format
      }
      message += `🔗 *Network:* ${networkName}\n\n`;
      
      // Add CoinGecko Data (if available)
      if (tokenInfo) {
        message += `*CoinGecko Data:*\n💰 *Price:* $${tokenInfo.price.toFixed(6)}\n📊 *Market Cap:* $${formatNumber(tokenInfo.marketCap)}\n📈 *24h Change:* ${tokenInfo.priceChangePercentage24h.toFixed(2)}%\n\n`;
        keyboard = keyboard.url('View on CoinGecko', `https://www.coingecko.com/en/coins/${network.id}/contract/${text}`);
      } else {
        message += `*CoinGecko Data:* Not available for this token.\n\n`;
      }
      
      // Add Bubblemaps Supply Analysis (if available)
      if (bubblemapsInfo) {
        message += `*Supply Analysis (Bubblemaps):*\n💯 *Decentralization Score:* ${bubblemapsInfo.decentralizationScore !== undefined && bubblemapsInfo.decentralizationScore !== null ? bubblemapsInfo.decentralizationScore.toFixed(2) : 'N/A'}\n📦 *In CEXs:* ${bubblemapsInfo.percentInCexs !== undefined ? bubblemapsInfo.percentInCexs.toFixed(2) + '%' : 'N/A'}\n📜 *In Contracts:* ${bubblemapsInfo.percentInContracts !== undefined ? bubblemapsInfo.percentInContracts.toFixed(2) + '%' : 'N/A'}\n\n`;
        keyboard = keyboard.url('View on Bubblemaps', `https://app.bubblemaps.io/sol/token/${text}`);
      } else {
        message += `*Supply Analysis (Bubblemaps):* Not available for this token.\n\n`;
      }
      
      // Add Screenshot note (if missing but other data exists)
      if (!screenshot && (tokenInfo || bubblemapsInfo)) {
        message += `\n⚠️ Visualization could not be generated.`;
      }
       // Add general data note (if screenshot exists but nothing else)
      else if (screenshot && !tokenInfo && !bubblemapsInfo) {
         message = `*Token Visualization*\n🔗 *Network:* ${networkName}\n\nℹ️ Token data not available from CoinGecko or Bubblemaps metadata, but visualization was generated successfully.`
         keyboard = keyboard.url('View on Bubblemaps', `https://app.bubblemaps.io/sol/token/${text}`);
      }

      // Add "Powered by Bubblemaps" if Bubblemaps data or screenshot is present
      if (bubblemapsInfo || screenshot) {
          message += `\n\nPowered by [Bubblemaps](https://bubblemaps.io/)`;
      }
      
      // --- Send Response (Solana) ---
       if (screenshot) {
        // Send photo first, then the text message with keyboard
        await ctx.replyWithPhoto(new InputFile(screenshot), {
          caption: message.trim(), // Use caption for photo
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else if (tokenInfo || bubblemapsInfo) {
        // Send text message only if no screenshot but we have some data
        await ctx.reply(message.trim(), {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        // Fallback error
        await ctx.reply("Couldn't fetch any information or visualization for this token.");
      }
    } catch (error) {
      // Delete status message even on error
      try {
        await ctx.api.deleteMessage(ctx.chat!.id, statusMessage.message_id);
      } catch (err) {
        console.log('Could not delete status message', err);
      }
      
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

// Add a helper function to convert network IDs to keys
function getNetworkKeyById(networkId: string): keyof typeof supportedNetworks | undefined {
  // First check if it's a direct key match (like 'ethereum')
  if (networkId in supportedNetworks) {
    return networkId as keyof typeof supportedNetworks;
  }
  
  // Otherwise search for the network by its ID property
  for (const [key, network] of Object.entries(supportedNetworks)) {
    if (network.id === networkId) {
      return key as keyof typeof supportedNetworks;
    }
  }
  
  // Not found
  console.error(`No network found with ID: ${networkId}`);
  return undefined;
}

bot.catch((err) => {
  console.error('Bot error:', err);
});

bot.start();
console.log('Multi-chain token bot started successfully!'); 