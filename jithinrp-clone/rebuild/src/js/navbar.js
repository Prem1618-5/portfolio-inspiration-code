// Fixed navbar: compact, frosted state once scrolled; the spacer holds the resting height
export function setupNavbar() {
  const bar = document.querySelector('.navbar');
  const spacer = document.querySelector('.navbar-spacer');
  if (!bar) return { compactHeight: () => 0 };
  let scrolled = false;

  const measure = () => {
    const was = bar.classList.contains('is-scrolled');
    bar.style.transition = 'none';
    bar.classList.remove('is-scrolled');
    if (spacer) spacer.style.height = bar.offsetHeight + 'px';
    bar.classList.toggle('is-scrolled', was);
    void bar.offsetHeight; // flush before restoring the transition
    bar.style.transition = '';
  };
  const update = () => {
    const next = window.scrollY > 12;
    if (next === scrolled) return;
    scrolled = next;
    bar.classList.toggle('is-scrolled', scrolled);
  };
  measure();
  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', measure);
  document.fonts.ready.then(measure);
  addEventListener('load', measure, { once: true });
  new ResizeObserver(measure).observe(bar); // the stylesheet can land after the first measure

  // height once compacted (anchor offsets): 16px top + nav row + 16px bottom
  return { compactHeight: () => 32 + (bar.querySelector('.nav') || bar).offsetHeight };
}
