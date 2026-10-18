// the home page opens on a "Draw a Z on the water / press Enter" gate; pass it, then wait for the intro to settle
export async function enter(page) {
  if (!(await page.locator('.loader').count())) return false;
  await page.waitForTimeout(3500);
  for (let i = 0; i < 12; i++) {
    if (!(await page.locator('.loader').count())) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
  }
  await page.waitForFunction(() => !document.documentElement.classList.contains('is-loading') && !document.querySelector('.loader'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3500);
  return true;
}
