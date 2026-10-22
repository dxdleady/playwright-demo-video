import type { Page } from '@playwright/test';

/**
 * The camera: the three things Playwright won't give you.
 *
 *  - A cursor. Playwright dispatches synthetic events and never moves the real pointer,
 *    so a raw recording shows buttons clicking themselves. We draw one.
 *  - A zoom. We scale the page in the DOM rather than cropping the video in post, so
 *    text stays sharp at any zoom level.
 *  - A narrator. Coach-mark captions, so the viewer knows what they're looking at.
 *
 * The cursor, caption and spotlight live on <html>, outside the element we scale.
 * Otherwise the zoom would drag them along with the page.
 */

const STAGE = '__demo';

export interface CameraOptions {
  /** Brand colour for the cursor, spotlight and key terms. */
  accent?: string;
  /** Caption font. Use your product's onboarding font so captions feel native. */
  font?: string;
  /**
   * The element to zoom. `body` works for most apps. If your app shell carries its own
   * transform (some responsive layouts do), the framework may overwrite ours on the next
   * render, so stay on `body`.
   */
  root?: string;
  /** Where the caption sits. */
  captionPosition?: 'bottom' | 'top';
}

let ROOT = 'body';

export async function mountCursor(page: Page, opts: CameraOptions = {}): Promise<void> {
  const accent = opts.accent ?? '#6C5CE7';
  const font = opts.font ?? 'Inter, ui-sans-serif, system-ui, sans-serif';
  const edge = opts.captionPosition === 'top' ? 'top: 44px;' : 'bottom: 44px;';
  ROOT = opts.root ?? 'body';

  await page.addStyleTag({
    content: `
      :root { --demo-accent: ${accent}; }
      #${STAGE}-cursor {
        position: fixed; top: 0; left: 0; z-index: 2147483647;
        width: 26px; height: 26px; margin: -13px 0 0 -13px;
        border-radius: 50%; pointer-events: none;
        background: color-mix(in srgb, var(--demo-accent) 30%, transparent);
        border: 2.5px solid var(--demo-accent);
        box-shadow: 0 2px 12px rgba(17,17,20,.3);
        transition: transform .55s cubic-bezier(.22,.61,.36,1), opacity .3s ease;
        will-change: transform;
      }
      /* While zoomed, the cursor's screen position no longer matches the page under it,
       * so it steps aside instead of pointing at the wrong thing. */
      #${STAGE}-cursor.__away { opacity: 0; }
      #${STAGE}-cursor.__click { animation: ${STAGE}-ripple .45s ease-out; }
      @keyframes ${STAGE}-ripple {
        0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--demo-accent) 55%, transparent); }
        100% { box-shadow: 0 0 0 26px transparent; }
      }
      #${STAGE}-cap {
        position: fixed; left: 50%; ${edge} z-index: 2147483647;
        transform: translate(-50%, 14px);
        max-width: 460px; padding: 18px 20px;
        border-radius: 14px; pointer-events: none; text-align: left;
        background: #fff; color: #14141F; border: 1px solid #E6E4EF;
        box-shadow: 0 18px 44px rgba(20,16,40,.24);
        font-family: ${font};
        opacity: 0; transition: opacity .35s ease, transform .35s ease;
      }
      #${STAGE}-cap.__on { opacity: 1; transform: translate(-50%, 0); }
      #${STAGE}-cap .__eyebrow {
        display: block; margin-bottom: 7px; color: var(--demo-accent);
        font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
      }
      #${STAGE}-cap .__title { display: block; font-size: 17px; font-weight: 750; line-height: 1.3; }
      #${STAGE}-cap .__note { display: block; margin-top: 6px; font-size: 15px; line-height: 1.6; color: #3A3A47; }
      #${STAGE}-cap b {
        color: var(--demo-accent); font-weight: 750; text-decoration: underline;
        text-decoration-color: color-mix(in srgb, var(--demo-accent) 35%, transparent);
        text-decoration-thickness: 2px; text-underline-offset: 3px;
      }
      #${STAGE}-spot {
        position: fixed; z-index: 2147483646; pointer-events: none; border-radius: 12px;
        border: 2px solid var(--demo-accent);
        box-shadow: 0 0 0 9999px rgba(17,17,20,.45);
        opacity: 0; transition: opacity .4s ease, all .5s cubic-bezier(.4,0,.2,1);
      }
      #${STAGE}-spot.__on { opacity: 1; }
      ${ROOT} { transition: transform .85s cubic-bezier(.4,0,.2,1); will-change: transform; }
    `,
  });

  await page.evaluate(({ stage }) => {
    for (const id of ['cursor', 'cap', 'spot']) {
      if (document.getElementById(`${stage}-${id}`)) continue;
      const el = document.createElement('div');
      el.id = `${stage}-${id}`;
      document.documentElement.appendChild(el);
    }
  }, { stage: STAGE });
}

export interface Coach {
  /** Small uppercase label, e.g. "Step 2 of 4". */
  step?: string;
  title: string;
  /** Optional second line. `*asterisks*` mark the key term. */
  note?: string;
}

/** Show a coach-mark caption and hold it for `hold` ms. Pass `null` to hide it. */
export async function say(page: Page, coach: Coach | null, hold = 0): Promise<void> {
  await page.evaluate(({ stage, coach }) => {
    const cap = document.getElementById(`${stage}-cap`);
    if (!cap) return;
    if (coach === null) { cap.classList.remove('__on'); return; }
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*(.+?)\*/g, '<b>$1</b>');
    cap.innerHTML =
      (coach.step ? `<span class="__eyebrow">${esc(coach.step)}</span>` : '') +
      `<span class="__title">${esc(coach.title)}</span>` +
      (coach.note ? `<span class="__note">${esc(coach.note)}</span>` : '');
    cap.classList.add('__on');
  }, { stage: STAGE, coach });
  await page.waitForTimeout(hold || 400);
}

/** Ring an element and dim everything else. Pass `null` to clear it. */
export async function spotlight(page: Page, selector: string | null): Promise<void> {
  if (selector === null) {
    await page.evaluate(({ stage }) => document.getElementById(`${stage}-spot`)?.classList.remove('__on'), { stage: STAGE });
    await page.waitForTimeout(400);
    return;
  }
  const box = await boxOf(page, selector);
  await page.evaluate(({ stage, box }) => {
    const el = document.getElementById(`${stage}-spot`);
    if (!el) return;
    const pad = 8;
    Object.assign(el.style, {
      left: `${box.x - pad}px`, top: `${box.y - pad}px`,
      width: `${box.width + pad * 2}px`, height: `${box.height + pad * 2}px`,
    });
    el.classList.add('__on');
  }, { stage: STAGE, box });
  await page.waitForTimeout(500);
}

/** Resolve a selector fast: a typo should fail in seconds, not eat the whole test timeout. */
async function boxOf(page: Page, selector: string) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 8000 });
  const b = await el.boundingBox();
  if (!b) throw new Error(`no bounding box for ${selector}`);
  return b;
}

/** Ease the cursor to the centre of an element. */
export async function glideTo(page: Page, selector: string): Promise<void> {
  const box = await boxOf(page, selector);
  await page.evaluate(({ stage, x, y }) => {
    const el = document.getElementById(`${stage}-cursor`);
    if (el) el.style.transform = `translate(${x}px, ${y}px)`;
  }, { stage: STAGE, x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await page.waitForTimeout(620);
}

/** Glide to an element, show a click ripple, then really click it. */
export async function glideAndClick(page: Page, selector: string): Promise<void> {
  await glideTo(page, selector);
  await page.evaluate(({ stage }) => {
    const el = document.getElementById(`${stage}-cursor`);
    if (!el) return;
    el.classList.remove('__click');
    void el.offsetWidth;
    el.classList.add('__click');
  }, { stage: STAGE });
  await page.waitForTimeout(180);
  await page.locator(selector).first().click();
  await page.waitForTimeout(450);
}

/** Glide to an input and type into it at a human pace. */
export async function glideAndType(page: Page, selector: string, text: string, delay = 55): Promise<void> {
  await glideAndClick(page, selector);
  await page.locator(selector).first().pressSequentially(text, { delay });
  await page.waitForTimeout(300);
}

/** Zoom toward an element. The DOM is scaled, not the video, so text stays crisp. */
export async function zoomTo(page: Page, selector: string, scale = 1.5): Promise<void> {
  const box = await boxOf(page, selector);
  await page.evaluate(({ root, stage, x, y, scale }) => {
    const app = document.querySelector(root) as HTMLElement | null;
    if (!app) return;
    document.getElementById(`${stage}-cursor`)?.classList.add('__away');
    app.style.transformOrigin = `${x}px ${y}px`;
    app.style.transform = `scale(${scale})`;
  }, { root: ROOT, stage: STAGE, x: box.x + box.width / 2, y: box.y + box.height / 2, scale });
  await page.waitForTimeout(950);
}

export async function zoomOut(page: Page): Promise<void> {
  await page.evaluate(({ root, stage }) => {
    const app = document.querySelector(root) as HTMLElement | null;
    if (app) app.style.transform = 'scale(1)';
    document.getElementById(`${stage}-cursor`)?.classList.remove('__away');
  }, { root: ROOT, stage: STAGE });
  await page.waitForTimeout(950);
}

/** A held pause, so the viewer can read what just happened. Resist the urge to skip these. */
export async function beat(page: Page, ms = 900): Promise<void> {
  await page.waitForTimeout(ms);
}
