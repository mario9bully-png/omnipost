import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PlaywrightProviderConfig {
  identifier: string;
  name: string;
  loginUrl: string;
  headless: boolean;
}

export interface PlaywrightPostResult {
  success: boolean;
  url?: string;
  error?: string;
}

const CONTEXTS_DIR = process.env.PLAYWRIGHT_CONTEXTS_DIR || '/data/browser-contexts';

export abstract class PlaywrightAbstract extends SocialAbstract {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected config: PlaywrightProviderConfig;

  constructor(config: PlaywrightProviderConfig) {
    super();
    this.config = config;
  }

  protected async initBrowser(): Promise<BrowserContext> {
    if (this.context) return this.context;

    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const statePath = path.join(CONTEXTS_DIR, this.config.identifier, 'state.json');
    const storageState = await this.loadStorageState(statePath);

    this.context = await this.browser.newContext({
      ...(storageState ? { storageState } : {}),
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'ru-RU',
    });

    return this.context;
  }

  protected async closeBrowser(): Promise<void> {
    if (this.context) {
      await this.saveCurrentState();
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async saveCurrentState(): Promise<void> {
    if (!this.context) return;
    const dir = path.join(CONTEXTS_DIR, this.config.identifier);
    await fs.mkdir(dir, { recursive: true });
    const state = await this.context.storageState();
    await fs.writeFile(path.join(dir, 'state.json'), JSON.stringify(state));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const ctx = await this.initBrowser();
      const page = await ctx.newPage();
      await page.goto(this.config.loginUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const isLoggedIn = await this.checkLoginStatus(page);
      await page.close();
      return isLoggedIn;
    } catch {
      return false;
    } finally {
      await this.closeBrowser();
    }
  }

  protected async humanDelay(min = 300, max = 1500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  protected async humanType(page: Page, selector: string, text: string): Promise<void> {
    const el = await page.waitForSelector(selector, { timeout: 10000 });
    if (!el) return;
    await el.click();
    await el.fill('');
    for (const char of text) {
      await page.keyboard.type(char, { delay: Math.random() * 80 + 30 });
    }
  }

  private async loadStorageState(statePath: string): Promise<any | undefined> {
    try {
      const data = await fs.readFile(statePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }

  // Each Playwright provider must implement these
  abstract checkLoginStatus(page: Page): Promise<boolean>;
  abstract performLogin(page: Page, credentials: string): Promise<void>;
  abstract uploadVideo(
    page: Page,
    videoPath: string,
    metadata: { title: string; description: string; tags: string[] }
  ): Promise<PlaywrightPostResult>;
}
