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

export class RutubeProvider extends PlaywrightAbstract implements SocialProvider {
  identifier = 'rutube';
  name = 'Rutube';
  isBetweenSteps = false;
  scopes: string[] = [];
  override maxConcurrentJob = 1;
  editor = 'normal' as const;

  constructor() {
    super({
      identifier: 'rutube',
      name: 'Rutube',
      loginUrl: 'https://rutube.ru/',
      headless: true,
    });
  }

  maxLength() {
    return 5000;
  }

  async generateAuthUrl(): Promise<GenerateAuthUrlResponse> {
    return {
      url: 'https://rutube.ru/accounts/login/',
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
      if (!isLoggedIn) return 'Rutube login failed — check credentials';
      await page.close();
      await this.closeBrowser();
      return {
        id: `rutube-${makeId(8)}`,
        name: 'Rutube',
        accessToken: 'playwright-session',
        refreshToken: 'playwright-session',
        expiresIn: 86400 * 30,
        picture: '',
        username: 'rutube-user',
      };
    } catch (err: any) {
      await page.close();
      await this.closeBrowser();
      return `Rutube auth error: ${err.message}`;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenDetails> {
    return {
      id: `rutube-${makeId(8)}`,
      name: 'Rutube',
      accessToken: 'playwright-session',
      refreshToken: 'playwright-session',
      expiresIn: 86400 * 30,
      picture: '',
      username: 'rutube-user',
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
        results.push({
          id: detail.id,
          postId: '',
          releaseURL: '',
          status: 'error',
        });
      } finally {
        await page.close();
        await this.closeBrowser();
      }
    }
    return results;
  }

  async checkLoginStatus(page: Page): Promise<boolean> {
    try {
      await page.goto('https://studio.rutube.ru/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      return !page.url().includes('/accounts/login');
    } catch {
      return false;
    }
  }

  async performLogin(page: Page, credentials: string): Promise<void> {
    await page.goto('https://rutube.ru/accounts/login/', {
      waitUntil: 'domcontentloaded',
    });
    await this.humanDelay();
    await this.humanType(page, 'input[name="login"], input[type="text"]', credentials);
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
      await page.goto('https://studio.rutube.ru/videos/upload/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await this.humanDelay();

      const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 });
      await fileInput!.setInputFiles(videoPath);
      await this.humanDelay(3000, 5000);

      const titleInput = await page.$('input[name="title"], textarea[name="title"]');
      if (titleInput) {
        await titleInput.fill('');
        await titleInput.fill(metadata.title);
      }
      await this.humanDelay();

      const descInput = await page.$('textarea[name="description"]');
      if (descInput) {
        await descInput.fill(metadata.description);
      }
      await this.humanDelay();

      // Wait for upload completion and publish
      await page.waitForSelector(
        'button:has-text("Опубликовать"):not([disabled])',
        { timeout: 300000 }
      );
      await this.humanDelay(1000, 2000);
      await page.click('button:has-text("Опубликовать")');
      await this.humanDelay(3000, 5000);

      return { success: true, url: page.url() };
    } catch (err: any) {
      return { success: false, error: `Rutube upload failed: ${err.message}` };
    }
  }
}
