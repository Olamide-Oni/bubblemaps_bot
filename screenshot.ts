/*import { chromium } from 'playwright';

export async function captureBubblemapsScreenshot(tokenAddress: string, chain: string = 'eth'): Promise<Buffer> {
  const url = `https://app.bubblemaps.io/${chain}/token/${tokenAddress}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(url, {  waitUntil: 'domcontentloaded', timeout: 60000 });
  const screenshot = await page.screenshot();
  await browser.close();
  return screenshot;
} */

import puppeteer from 'puppeteer';

export async function captureBubblemapsScreenshot(tokenAddress: string, chain: string = 'eth'): Promise<Buffer> {
  const url = `https://app.bubblemaps.io/${chain}/token/${tokenAddress}`;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.setViewport({ width: 1920, height: 1080 });
  page.setDefaultTimeout(120000); // Wait for the page to fully load
  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();
  return Buffer.from(screenshot);
}

