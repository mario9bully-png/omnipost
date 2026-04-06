import { Page } from 'playwright';
import { PlaywrightAbstract, PlaywrightPostResult } from './playwright.abstract';
import {
  AuthTokenDetails,
  GenerateAuthUrlResponse,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { Integration } from '@prisma/client';

export class YappyProvider extends PlaywrightAbstract implements SocialProvider {
  identifier = 'yappy';
  name = 'Yappy';
  isBetweenSteps = false;
  scopes: string[] = [];
  override maxConcurrentJob = 1;
  editor = 'normal' as const;

  constructor() {
    super({
      identifier: 'yappy',
      name: 'Yappy',
      loginUrl: 'https://yappy.media/',
      headless: true,
    });
  }

  maxLength() {
    return 2200;
  }

  async generateAuthUrl(): Promise<GenerateAuthUrlResponse> {
    return {
      url: 'https://yappy.media/',
      codeVerifier: makeId(10),
      state: makeId(17),
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }): Promise<AuthTokenDetails | string> {
    const ctx = await this.initBrowser();
    const page = await ctx.newPage();
    try {
      await this.performLogin(page, params.code);
      const isLoggedIn = await this.checkLoginStatus(page);
      if (!isLoggedIn) return 'Yappy login failed — check phone number';
      await page.close();
      await this.closeBrowser();
      return {
        id: `yappy-${makeId(8)}`,
        name: 'Yappy',
        accessToken: 'playwright-session',
        refreshToken: 'playwright-session',
        expiresIn: 86400 * 30,
        picture: '',
        username: 'yappy-user',
      };
    } catch (err: any) {
      await page.close();
      await this.closeBrowser();
      return `Yappy auth error: ${err.message}`;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenDetails> {
    return {
      id: `yappy-${makeId(8)}`,
      name: 'Yappy',
      accessToken: 'playwright-session',
      refreshToken: 'playwright-session',
      expiresIn: 86400 * 30,
      picture: '',
      username: 'yappy-user',
    };
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration
  ): Promise<PostResponse[]> {
    const results: PostResponse[] = [];
    for (const detail of postDetails) {
      const ctx = await this.initBrowser();
      const page = await ctx.newPage();
      try {
        const videoPath = detail.media?.[0]?.path;
        if (!videoPath) throw new Error('No video file provided');
        const result = await this.uploadVideo(page, videoPath, {
          title: (detail.message || 'Video').substring(0, 100),
          description: detail.message || '',
          tags: [],
        });
        results.push({
          id: detail.id,
          postId: result.url || detail.id,
          releaseURL: result.url || '',
          status: result.success ? 'completed' : 'error',
        });
      } catch (err: any) {
        results.push({ id: detail.id, postId: '', releaseURL: '', status: 'error' });
      } finally {
        await page.close();
        await this.closeBrowser();
      }
    }
    return results;
  }

  async checkLoginStatus(page: Page): Promise<boolean> {
    try {
      await page.goto('https://yappy.media/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const profileIndicator = await page.$('a[href*="profile"], [data-testid="user-avatar"], .user-menu');
      return !!profileIndicator;
    } catch {
      return false;
    }
  }

  async performLogin(page: Page, credentials: string): Promise<void> {
    // credentials = phone number
    await page.goto('https://yappy.media/', { waitUntil: 'domcontentloaded' });
    await this.humanDelay();
    const loginBtn = await page.$('button:has-text("Войти"), a:has-text("Войти")');
    if (loginBtn) await loginBtn.click();
    await this.humanDelay();
    await this.humanType(page, 'input[type="tel"], input[name="phone"]', credentials);
    await this.humanDelay(500, 1000);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/*', { timeout: 30000 });
    await this.humanDelay(1000, 2000);
  }

  async uploadVideo(
    page: Page,
    videoPath: string,
    metadata: { title: string; description: string; tags: string[] }
  ): Promise<PlaywrightPostResult> {
    try {
      await page.goto('https://yappy.media/upload', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await this.humanDelay();

      const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 });
      await fileInput!.setInputFiles(videoPath);
      await this.humanDelay(3000, 5000);

      const descInput = await page.$('textarea, input[placeholder*="описание"]');
      if (descInput) {
        let text = metadata.description;
        if (metadata.tags.length > 0) {
          text += ' ' + metadata.tags.map((t) => `#${t}`).join(' ');
        }
        await descInput.fill(text);
      }
      await this.humanDelay();

      await page.waitForSelector(
        'button:has-text("Опубликовать"):not([disabled]), button:has-text("Загрузить"):not([disabled])',
        { timeout: 120000 }
      );
      await this.humanDelay(1000, 2000);
      await page.click('button:has-text("Опубликовать"), button:has-text("Загрузить")');
      await this.humanDelay(3000, 5000);

      return { success: true, url: page.url() };
    } catch (err: any) {
      return { success: false, error: `Yappy upload failed: ${err.message}` };
    }
  }
}
