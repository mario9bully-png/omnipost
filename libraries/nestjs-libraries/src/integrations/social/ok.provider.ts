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

export class OkProvider extends PlaywrightAbstract implements SocialProvider {
  identifier = 'ok';
  name = 'Одноклассники';
  isBetweenSteps = false;
  scopes: string[] = [];
  override maxConcurrentJob = 1;
  editor = 'normal' as const;

  constructor() {
    super({
      identifier: 'ok',
      name: 'Одноклассники',
      loginUrl: 'https://ok.ru/',
      headless: true,
    });
  }

  maxLength() {
    return 4096;
  }

  async generateAuthUrl(): Promise<GenerateAuthUrlResponse> {
    return {
      url: 'https://ok.ru/',
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
      if (!isLoggedIn) return 'OK login failed — check credentials';
      await page.close();
      await this.closeBrowser();
      return {
        id: `ok-${makeId(8)}`,
        name: 'Одноклассники',
        accessToken: 'playwright-session',
        refreshToken: 'playwright-session',
        expiresIn: 86400 * 30,
        picture: '',
        username: 'ok-user',
      };
    } catch (err: any) {
      await page.close();
      await this.closeBrowser();
      return `OK auth error: ${err.message}`;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenDetails> {
    return {
      id: `ok-${makeId(8)}`,
      name: 'Одноклассники',
      accessToken: 'playwright-session',
      refreshToken: 'playwright-session',
      expiresIn: 86400 * 30,
      picture: '',
      username: 'ok-user',
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
      await page.goto('https://ok.ru/feed', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      return !page.url().includes('/dk?') && !page.url().includes('st.cmd=anonymMain');
    } catch {
      return false;
    }
  }

  async performLogin(page: Page, credentials: string): Promise<void> {
    // credentials format: "email:password"
    const [email, password] = credentials.split(':');
    await page.goto('https://ok.ru/', { waitUntil: 'domcontentloaded' });
    await this.humanDelay();
    await this.humanType(page, '#field_email', email);
    await this.humanDelay(300, 800);
    if (password) {
      await this.humanType(page, '#field_password', password);
    }
    await this.humanDelay(300, 800);
    await page.click('input[type="submit"], button[data-l="t,sign_in"]');
    await page.waitForURL('**/*', { timeout: 30000 });
    await this.humanDelay(1000, 2000);
  }

  async uploadVideo(
    page: Page,
    videoPath: string,
    metadata: { title: string; description: string; tags: string[] }
  ): Promise<PlaywrightPostResult> {
    try {
      await page.goto('https://ok.ru/video/manager', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await this.humanDelay();

      const uploadBtn = await page.$('button:has-text("Загрузить"), a:has-text("Загрузить")');
      if (uploadBtn) await uploadBtn.click();
      await this.humanDelay();

      const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 });
      await fileInput!.setInputFiles(videoPath);
      await this.humanDelay(3000, 5000);

      const titleInput = await page.$('input[name="title"], input[placeholder*="название"]');
      if (titleInput) {
        await titleInput.fill('');
        await titleInput.fill(metadata.title);
      }
      await this.humanDelay();

      const descInput = await page.$('textarea[name="description"], textarea[placeholder*="описание"]');
      if (descInput) {
        await descInput.fill(metadata.description);
      }
      await this.humanDelay();

      await page.waitForSelector(
        'button:has-text("Опубликовать"):not([disabled]), button:has-text("Сохранить"):not([disabled])',
        { timeout: 300000 }
      );
      await this.humanDelay(1000, 2000);
      await page.click('button:has-text("Опубликовать"), button:has-text("Сохранить")');
      await this.humanDelay(3000, 5000);

      return { success: true, url: page.url() };
    } catch (err: any) {
      return { success: false, error: `OK upload failed: ${err.message}` };
    }
  }
}
