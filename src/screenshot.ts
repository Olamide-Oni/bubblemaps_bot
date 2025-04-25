import puppeteer from 'puppeteer';

export async function captureBubblemapsScreenshot(tokenAddress: string, chain: string): Promise<Buffer> {
  let url;
  url = `https://app.bubblemaps.io/${chain}/token/${tokenAddress}`;
  if (chain === "arb") url = `https://app.bubblemaps.io/arbi/token/${tokenAddress}`
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    // Set reasonable timeout
    page.setDefaultTimeout(30000);
    
    // Navigate to the page with a shorter waiting condition
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',  // Faster than networkidle2
      timeout: 20000  // 20 second timeout for page load
    });
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Simplified wait strategy - one element check with shorter timeout
    try {
      // Wait for any visualization elements (first one found)
      await page.waitForSelector('svg, canvas, .bubble-map-container, g, circle', { 
        visible: true, 
        timeout: 10000 
      });
    } catch (error) {
      console.log('Visualization elements not found, continuing with delay');
    }
    
    // Shorter fixed delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take the screenshot
    const screenshot = await page.screenshot({ type: 'png' });
    return Buffer.from(screenshot);
  } catch (error) {
    console.error('Error capturing Bubblemaps screenshot:', error);
    throw error;
  } finally {
    // Always close the browser to prevent resource leaks
    await browser.close();
  }
}

