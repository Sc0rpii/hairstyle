const lenis = new Lenis({
  autoRaf: true,
});

const root = document.documentElement;

lenis.on('scroll', ({ scroll, limit }) => {
  const progress = limit > 0 ? scroll / limit : 0;
  root.style.setProperty('--scroll-progress', progress);
});

const comparison = document.querySelector('.comparison-slider');
const comparisonRange = document.querySelector('.comparison-slider__range');

if (comparison && comparisonRange) {
  const updateComparison = () => {
    comparison.style.setProperty('--comparison-position', `${comparisonRange.value}%`);
  };

  comparisonRange.addEventListener('input', updateComparison);
  updateComparison();
}
