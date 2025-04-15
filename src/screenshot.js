"use strict";
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
exports.captureBubblemapsScreenshot = captureBubblemapsScreenshot;
const puppeteer_1 = __importDefault(require("puppeteer"));
function captureBubblemapsScreenshot(tokenAddress, chain) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://app.bubblemaps.io/${chain}/token/${tokenAddress}`;
        const browser = yield puppeteer_1.default.launch();
        const page = yield browser.newPage();
        yield page.goto(url, { waitUntil: 'networkidle2' });
        yield page.setViewport({ width: 1920, height: 1080 });
        page.setDefaultTimeout(120000); // Wait for the page to fully load
        const screenshot = yield page.screenshot({ type: 'png' });
        yield browser.close();
        return Buffer.from(screenshot);
    });
}
