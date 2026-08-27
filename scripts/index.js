// Initialize Lenis Smooth Scroll
const lenis = new Lenis({
  autoRaf: true,
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom premium feel easing
});

const root = document.documentElement;
const header = document.querySelector('.site-header');
let lastScrollPosition = 0;
let lastDirection = 'down';

const setScrollDirection = (direction) => {
  root.classList.toggle('is-scrolling-down', direction === 'down');
  root.classList.toggle('is-scrolling-up', direction === 'up');
  root.style.setProperty('--scroll-direction', direction === 'down' ? '1' : '-1');
};

setScrollDirection(lastDirection);

// Handle Scroll Events
lenis.on('scroll', ({ scroll, limit, velocity }) => {
  // Update overall scroll progress CSS custom variable
  const progress = limit > 0 ? scroll / limit : 0;
  root.style.setProperty('--scroll-progress', progress);

  // Track scroll direction and speed for directional animations.
  const delta = scroll - lastScrollPosition;
  if (Math.abs(delta) > 0.4) {
    lastDirection = delta > 0 ? 'down' : 'up';
    setScrollDirection(lastDirection);
  }

  const speedValue = typeof velocity === 'number' ? velocity : delta;
  const normalizedSpeed = Math.min(1, Math.abs(speedValue) / 2.5);
  root.style.setProperty('--scroll-speed', normalizedSpeed.toFixed(3));
  root.style.setProperty('--parallax-duration', `${Math.max(85, 150 - normalizedSpeed * 60)}ms`);
  lastScrollPosition = scroll;

  // Toggle Sticky Header visual state (blurred bg, subtle border)
  if (header) {
    if (scroll > 50) {
      header.classList.add('scrolled', 'bg-surface/90', 'shadow-[0_4px_30px_rgba(10,10,10,0.03)]', 'border-b', 'border-ink/5');
      header.classList.remove('bg-surface/70');
    } else {
      header.classList.remove('scrolled', 'bg-surface/90', 'shadow-[0_4px_30px_rgba(10,10,10,0.03)]', 'border-b', 'border-ink/5');
      header.classList.add('bg-surface/70');
    }
  }

  // Update Parallax Elements
  updateParallax();
});

// 1. Mobile Menu Navigation Logic (Floating Side Drawer)
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

if (menuToggle && mobileMenu) {
  const closeMenu = () => {
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.add('translate-x-[120%]', 'opacity-0');
    mobileMenu.classList.remove('translate-x-0', 'opacity-100');
    lenis.start();
  };

  const openMenu = () => {
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.remove('translate-x-[120%]', 'opacity-0');
    mobileMenu.classList.add('translate-x-0', 'opacity-100');
    lenis.stop();
  };

  const toggleMenu = () => {
    const isOpen = menuToggle.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  menuToggle.setAttribute('aria-expanded', 'false');

  menuToggle.addEventListener('click', toggleMenu);

  // Close menu and start scroll when clicking a navigation link
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // If viewport switches to desktop while menu is open, reset state and scroll lock.
  const desktopBreakpoint = window.matchMedia('(min-width: 768px)');
  const handleBreakpointChange = (event) => {
    if (event.matches) {
      closeMenu();
    }
  };

  if (typeof desktopBreakpoint.addEventListener === 'function') {
    desktopBreakpoint.addEventListener('change', handleBreakpointChange);
  } else {
    desktopBreakpoint.addListener(handleBreakpointChange);
  }

  handleBreakpointChange(desktopBreakpoint);
}

// 2. Hero Text Split Reveal on Window Load
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const reveal1 = document.querySelector('.hero-reveal-1');
    const reveal2 = document.querySelector('.hero-reveal-2');
    if (reveal1) {
      reveal1.classList.remove('translate-y-full', 'opacity-0');
      reveal1.classList.add('translate-y-0', 'opacity-100');
    }
    if (reveal2) {
      reveal2.classList.remove('translate-y-full', 'opacity-0');
      reveal2.classList.add('translate-y-0', 'opacity-100');
    }
  }, 100);
});

// Prepare gallery reveal on cards instead of the masonry container itself.
const galleryGrid = document.getElementById('gallery-grid');

if (galleryGrid) {
  galleryGrid.classList.add('is-visible');

  const galleryCards = galleryGrid.querySelectorAll('.break-inside-avoid');
  galleryCards.forEach((card, index) => {
    card.classList.add('reveal-on-scroll', 'reveal-on-scroll--scale', 'gallery-reveal-item');
    card.style.setProperty('--gallery-reveal-delay', `${(index % 3) * 70}ms`);
    card.dataset.revealed = 'false';
  });
}

// 3. Bidirectional Scroll Reveal Engine (IntersectionObserver)
const revealElements = document.querySelectorAll('.reveal-on-scroll');

if (revealElements.length > 0) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        if (entry.target.classList.contains('gallery-reveal-item')) {
          entry.target.dataset.revealed = 'true';
        }
      } else {
        // Reversible reveal both when the element moves above and below the viewport.
        const rect = entry.boundingClientRect;
        const isGalleryRevealItem = entry.target.classList.contains('gallery-reveal-item');

        // Keep gallery cards visible after first reveal to avoid masonry flicker/gaps.
        if (isGalleryRevealItem && entry.target.dataset.revealed === 'true') {
          return;
        }

        const isOutBelow = rect.top > window.innerHeight * (isGalleryRevealItem ? 1.1 : 0.95);
        const isOutAbove = rect.bottom < (isGalleryRevealItem ? -80 : 0);

        if (isOutBelow || isOutAbove) {
          entry.target.classList.remove('is-visible');
        }
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px', // Trigger slightly inside viewport for a premium, deliberate feel
    threshold: 0.01
  });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
}

// 4. Continuous Bidirectional Scroll Parallax
const parallaxBgElements = document.querySelectorAll('.parallax-bg');
const parallaxElements = document.querySelectorAll('.parallax-element');

function updateParallax() {
  const viewportHeight = window.innerHeight;

  // Background Parallax scale and subtle slide
  parallaxBgElements.forEach(el => {
    const parent = el.closest('section') || el.parentElement;
    const parentRect = parent.getBoundingClientRect();
    
    // Total scrollable range of the parent section through the viewport
    const totalDistance = viewportHeight + parentRect.height;
    // Current distance from the bottom of viewport to the bottom of the section
    const currentDistance = viewportHeight - parentRect.top;
    
    let progress = currentDistance / totalDistance;
    progress = Math.max(0, Math.min(1, progress)); // Normalize [0, 1]
    
    // Scale progress into [-1, 1] range to have symmetric direction offset
    const parallaxProgress = (progress - 0.5) * 2;
    el.style.setProperty('--parallax-progress', parallaxProgress);
  });

  // Layered Float Parallax (e.g. Floating Badges)
  parallaxElements.forEach(el => {
    const parent = el.closest('section') || el.parentElement;
    const parentRect = parent.getBoundingClientRect();
    
    const totalDistance = viewportHeight + parentRect.height;
    const currentDistance = viewportHeight - parentRect.top;
    
    let progress = currentDistance / totalDistance;
    progress = Math.max(0, Math.min(1, progress));
    
    const parallaxProgress = (progress - 0.5) * 2;
    el.style.setProperty('--parallax-progress', parallaxProgress);
  });
}

// Initial calculation of parallax offsets
window.addEventListener('resize', updateParallax);
updateParallax();

// 5. Interactive Before/After Image Comparison Slider
const comparison = document.querySelector('.comparison-slider');
const comparisonRange = document.querySelector('.comparison-slider__range');

if (comparison && comparisonRange) {
  const updateComparison = () => {
    comparison.style.setProperty('--comparison-position', `${comparisonRange.value}%`);
  };

  comparisonRange.addEventListener('input', updateComparison);
  updateComparison();
}
