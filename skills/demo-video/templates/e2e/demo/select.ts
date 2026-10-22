import type { Page } from '@playwright/test';

/**
 * Select a run of elements as text, when a mouse drag won't.
 *
 * Elements rendered as `role="button"` spans (transcript words, tokens, chips) don't
 * drag-select. If your app reads `window.getSelection()`, build the Range directly and
 * dispatch `mouseup`: the app gets a real selection and its popover appears.
 *
 *   await selectRange(page, '.word', 6, 34);
 */
export async function selectRange(page: Page, selector: string, from: number, to: number): Promise<string> {
  const text = await page.evaluate(({ selector, from, to }) => {
    const els = [...document.querySelectorAll(selector)];
    const a = els[from], b = els[to];
    if (!a || !b) throw new Error(`selectRange: ${from}..${to} out of range (${els.length} matches for ${selector})`);
    const range = document.createRange();
    range.setStartBefore(a.firstChild ?? a);
    range.setEndAfter(b.lastChild ?? b);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // addRange fires selectionchange; most selection hooks also wait for mouseup.
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return sel?.toString() ?? '';
  }, { selector, from, to });
  await page.waitForTimeout(600);
  return text;
}
