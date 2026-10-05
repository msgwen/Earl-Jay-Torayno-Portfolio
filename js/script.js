(function () {
  const doc = document.documentElement;
  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const cpuCores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const lowPowerDevice = prefersReducedMotion || isCoarsePointer || cpuCores <= 4 || memory <= 4;
  const enableCursor = isFinePointer && !prefersReducedMotion && !lowPowerDevice;
  const enableOceanMotion = isFinePointer && !prefersReducedMotion && !lowPowerDevice;

  const state = {
    scrolling: false,
    modalData: null,
    roleIndex: 0,
    roleTimer: null,
    toastTimer: null,
    booted: false,
    lastOceanProgress: -1,
    surfaceFrame: null,
  };

  doc.classList.toggle('ocean-lite', lowPowerDevice);

  const roles = ['Software Developer', 'Aspiring Game Developer', 'Computer Science Graduate'];
  const roleOutput = document.querySelector('[data-role-output]');
  const yearOutput = document.querySelector('[data-year]');
  const progressFill = document.querySelector('.progress-bar__fill');
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav__toggle');
  const navMenu = document.querySelector('.nav__menu');
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const projectCards = Array.from(document.querySelectorAll('.project-card'));
  const filterButtons = Array.from(document.querySelectorAll('.filter-chip'));
  const projectCarousel = document.querySelector('[data-project-carousel]');
  const projectCarouselTrack = projectCarousel?.querySelector('.project-list');
  const projectCarouselStatus = projectCarousel?.querySelector('[data-project-status]');
  const projectPreviousButton = projectCarousel?.querySelector('[data-project-previous]');
  const projectNextButton = projectCarousel?.querySelector('[data-project-next]');
  let activeProjectIndex = 0;
  const cursor = document.querySelector('.cursor');
  const cursorGlow = document.querySelector('.cursor-glow');
  const timelineLine = document.querySelector('.timeline__line span');
  const oceanSurface = document.querySelector('.ocean-surface');
  const oceanRays = Array.from(document.querySelectorAll('.ocean-surface__ray'));
  const modal = document.querySelector('.modal');
  const modalTitle = document.querySelector('[data-modal-title]');
  const modalSummary = document.querySelector('[data-modal-summary]');
  const modalList = document.querySelector('[data-modal-list]');
  const modalEyebrow = document.querySelector('[data-modal-eyebrow]');
  const modalPrimary = document.querySelector('[data-modal-primary]');
  const modalSecondary = document.querySelector('[data-modal-secondary]');
  const toast = document.querySelector('.toast');
  const contactForm = document.querySelector('.contact-form');
  const counters = Array.from(document.querySelectorAll('[data-counter]'));
  const timelineItems = Array.from(document.querySelectorAll('.timeline__item'));
  const hero = document.querySelector('.hero');
  const oceanDepthMap = {
    shallow: {
      fish: ['#b7fbff', '#91e9ff', '#ffffff'],
      bubble: ['rgba(255,255,255,.42)', 'rgba(210,248,255,.30)'],
    },
    mid: {
      fish: ['#7debd6', '#8bdcff', '#d9ffff'],
      bubble: ['rgba(255,255,255,.26)', 'rgba(173,245,255,.24)'],
    },
    deep: {
      fish: ['#6cc7ff', '#54f0d2', '#a8f7ff'],
      bubble: ['rgba(204,244,255,.18)', 'rgba(125,233,255,.18)'],
    },
    trench: {
      fish: ['#79b8ff', '#5fd4ff', '#95fff0'],
      bubble: ['rgba(255,255,255,.12)', 'rgba(125,233,255,.12)'],
    },
  };

  const projectData = {
    'Fish Farm Management System': {
      eyebrow: 'Project details',
      summary: 'A real-time management system designed to reduce manual tracking and keep operational data in one place.',
      bullets: [
        'Tracks cages, feeds, mortality, inventory, expenses, employees, and daily reports.',
        'Built to improve visibility and reduce duplicate record-keeping.',
        'Designed with a clean operational workflow for fast day-to-day use.',
      ],
      primaryLabel: 'Discuss the system',
      secondaryLabel: 'View contact options',
    },
    'Point of Sale and Order Management System': {
      eyebrow: 'Business system',
      summary: 'A structured order and payment workflow that supports daily business operations and admin tasks.',
      bullets: [
        'Handles products, customer orders, items, and payments.',
        'Uses a database-first approach to keep records consistent.',
        'Built to scale into a client-ready business dashboard.',
      ],
      primaryLabel: 'Talk about the project',
      secondaryLabel: 'Review the workflow',
    },
    'Airport Boarding Management System': {
      eyebrow: 'Desktop application',
      summary: 'A Java-based record management app built around prioritization, seating, and file handling.',
      bullets: [
        'Organizes boarding with prioritization logic and passenger records.',
        'Uses Swing for a practical desktop interface.',
        'Created to demonstrate structured problem-solving in Java.',
      ],
      primaryLabel: 'Request a walkthrough',
      secondaryLabel: 'Discuss Java details',
    },
    'Business and E-Commerce Projects': {
      eyebrow: 'Client solutions',
      summary: 'A collection of business-facing web systems that connect product presentation, ordering, and service workflows.',
      bullets: [
        'Supports online presentation and order handling.',
        'Includes engraving and custom service flow ideas.',
        'Focuses on practical structure and maintainable frontends.',
      ],
      primaryLabel: 'See similar work',
      secondaryLabel: 'Contact for collaboration',
    },
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.dataset.open = 'false';
    modal.removeAttribute('data-open');
    document.body.style.overflow = '';
  };

  const openModal = (projectName, action) => {
    const data = projectData[projectName];
    if (!data) return;

    modalEyebrow.textContent = action === 'code' ? 'Code placeholder' : data.eyebrow;
    modalTitle.textContent = projectName;
    modalSummary.textContent =
      action === 'code'
        ? 'The source code for this project is not publicly available. Please reach out to discuss the project or request a walkthrough.'
        : data.summary;
    modalList.innerHTML = '';

    const items = action === 'code'
      ? [
          'The source code for this project is not publicly available.',
        ]
      : data.bullets;

    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      modalList.appendChild(li);
    });

    modalPrimary.textContent = data.primaryLabel;
    modalPrimary.href = '#contact';
    modalSecondary.textContent = data.secondaryLabel;
    modalSecondary.href = '#contact';
    modal.hidden = false;
    modal.dataset.open = 'true';
    document.body.style.overflow = 'hidden';

    if (window.gsap) {
      gsap.fromTo('.modal__dialog', { y: 20, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
    }
  };

  const showToast = (message) => {
    clearTimeout(state.toastTimer);
    toast.hidden = false;
    toast.innerHTML = `<div class="toast__message">${message}</div>`;

    if (window.gsap) {
      gsap.fromTo('.toast__message', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
    }

    state.toastTimer = window.setTimeout(() => {
      if (window.gsap) {
        gsap.to('.toast__message', {
          y: 12,
          opacity: 0,
          duration: 0.22,
          ease: 'power2.in',
          onComplete: () => {
            toast.hidden = true;
            toast.innerHTML = '';
          },
        });
      } else {
        toast.hidden = true;
        toast.innerHTML = '';
      }
    }, 3200);
  };

  const animateCounter = (el, target) => {
    const obj = { value: 0 };
    const update = () => {
      el.textContent = String(Math.round(obj.value)).padStart(2, '0');
    };

    if (window.gsap && !prefersReducedMotion) {
      gsap.to(obj, {
        value: target,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: update,
      });
      return;
    }

    obj.value = target;
    update();
  };

  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? (scrollTop / max) * 100 : 0;
    progressFill.style.width = `${value}%`;
  };

  const updateOceanLight = () => {
    if (!oceanSurface) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(Math.max(scrollTop / max, 0), 1) : 0;
    if (Math.abs(progress - state.lastOceanProgress) < 0.004) return;
    state.lastOceanProgress = progress;

    const raysOpacity = Math.max(0.03, 1 - progress * 1.35);
    const activeRays = Math.max(1, Math.round(oceanRays.length * (1 - progress * 0.82)));

    oceanSurface.style.setProperty('--rays-opacity', raysOpacity.toFixed(3));
    oceanSurface.style.opacity = Math.max(0.18, 0.95 - progress * 0.78).toFixed(3);

    oceanRays.forEach((ray, index) => {
      const active = index < activeRays;
      const fade = Math.max(0.03, raysOpacity * (1 - index * 0.12));
      ray.style.opacity = active ? fade.toFixed(3) : '0';
    });
  };

  const setActiveNav = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  };

  const setupSectionObserver = () => {
    if (!('IntersectionObserver' in window)) return;

    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setActiveNav(entry.target.id);
      });
    }, { threshold: 0.55 });

    sections.forEach((section) => observer.observe(section));
  };

  const setupHeroRoleRotation = () => {
    const setRole = (index) => {
      const next = roles[index % roles.length];
      if (window.gsap && !prefersReducedMotion) {
        gsap.to(roleOutput, {
          opacity: 0,
          y: -10,
          duration: 0.18,
          ease: 'power2.in',
          onComplete: () => {
            roleOutput.textContent = next;
            gsap.fromTo(roleOutput, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' });
          },
        });
      } else {
        roleOutput.textContent = next;
      }
    };

    state.roleTimer = window.setInterval(() => {
      state.roleIndex = (state.roleIndex + 1) % roles.length;
      setRole(state.roleIndex);
    }, 2800);
  };

  const setupCursor = () => {
    if (!enableCursor) {
      if (cursor) cursor.remove();
      if (cursorGlow) cursorGlow.remove();
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let targetX = x;
    let targetY = y;

    const render = () => {
      x += (targetX - x) * 0.15;
      y += (targetY - y) * 0.15;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      cursorGlow.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });

    render();
  };

  const setupOceanSurface = () => {
    if (!oceanSurface || !enableOceanMotion) return;

    oceanRays.forEach((ray, index) => {
      const widths = ['13%', '12%', '15%', '11%', '14%', '10%', '12%'];
      const lefts = ['4%', '14%', '28%', '42%', '56%', '70%', '84%'];
      const skews = ['-6deg', '-2deg', '3deg', '-8deg', '2deg', '-4deg', '6deg'];
      const speeds = ['9s', '11s', '13s', '10s', '12s', '14s', '11.5s'];
      const blurs = ['0px', '.4px', '.8px', '1px', '.5px', '1.2px', '.7px'];

      ray.style.setProperty('--ray-width', widths[index % widths.length]);
      ray.style.setProperty('--ray-left', lefts[index % lefts.length]);
      ray.style.setProperty('--ray-skew', skews[index % skews.length]);
      ray.style.setProperty('--ray-speed', speeds[index % speeds.length]);
      ray.style.setProperty('--ray-blur', blurs[index % blurs.length]);
      ray.style.setProperty('--ray-opacity', (0.88 - index * 0.1).toFixed(2));
    });

    if (lowPowerDevice || !enableCursor) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    const render = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      oceanSurface.style.setProperty('--surface-x', `${x}px`);
      oceanSurface.style.setProperty('--surface-y', `${y}px`);
      state.surfaceFrame = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', (event) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 18;
      targetY = (event.clientY / window.innerHeight - 0.5) * 10;
    }, { passive: true });

    state.surfaceFrame = requestAnimationFrame(render);
  };

  const setupOceanLife = () => {
    const sections = Array.from(document.querySelectorAll('main section[data-ocean-depth]'));
    const lifeObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle('is-life-visible', entry.isIntersecting);
          });
        }, { rootMargin: '18% 0px 18% 0px', threshold: 0.01 })
      : null;

    sections.forEach((section, sectionIndex) => {
      const depth = section.dataset.oceanDepth || 'mid';
      const palette = oceanDepthMap[depth] || oceanDepthMap.mid;
      const layer = document.createElement('div');
      layer.className = 'section-life';
      layer.setAttribute('aria-hidden', 'true');

      const fishCount = lowPowerDevice
        ? (depth === 'shallow' ? 1 : 1)
        : (depth === 'shallow' ? 1 : depth === 'mid' ? 2 : depth === 'deep' ? 2 : 2);
      const bubbleCount = lowPowerDevice
        ? (depth === 'shallow' ? 2 : depth === 'mid' ? 2 : 3)
        : (depth === 'shallow' ? 3 : depth === 'mid' ? 4 : depth === 'deep' ? 5 : 5);

      for (let i = 0; i < fishCount; i += 1) {
        const fish = document.createElement('span');
        fish.className = `section-life__fish ${i % 2 === 0 ? 'section-life__fish--left' : ''}`;
        if (i === fishCount - 1 && depth !== 'shallow') {
          fish.classList.add('section-life__fish--up');
        }

        const fishWidth = depth === 'trench' ? 64 : depth === 'deep' ? 72 : 84;
        const fishHeight = Math.round(fishWidth * 0.46);
        fish.style.setProperty('--fish-w', `${fishWidth}px`);
        fish.style.setProperty('--fish-h', `${fishHeight}px`);
        fish.style.setProperty('--fish-scale', (0.72 + Math.random() * 0.42).toFixed(2));
        fish.style.setProperty('--fish-time', `${12 + Math.random() * 14}s`);
        fish.style.setProperty('--fish-color', palette.fish[i % palette.fish.length]);
        fish.style.left = `${8 + Math.random() * 78}%`;
        fish.style.top = `${12 + Math.random() * 64}%`;
        fish.style.animationDelay = `${-(Math.random() * 18)}s`;

        const eye = document.createElement('span');
        fish.appendChild(eye);
        layer.appendChild(fish);
      }

      for (let i = 0; i < bubbleCount; i += 1) {
        const bubble = document.createElement('span');
        bubble.className = 'section-life__bubble';
        const size = 14 + Math.random() * (depth === 'shallow' ? 26 : depth === 'deep' ? 34 : 28);
        const tint = palette.bubble[i % palette.bubble.length];
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 96}%`;
        bubble.style.top = `${18 + Math.random() * 72}%`;
        bubble.style.setProperty('--bubble-time', `${10 + Math.random() * 16}s`);
        bubble.style.animationDelay = `${-(Math.random() * 18 + sectionIndex * 1.2)}s`;
        bubble.style.opacity = depth === 'trench' ? '.22' : '.38';
        bubble.style.background = `radial-gradient(circle at 28% 28%, rgba(255,255,255,.94), ${tint} 22%, rgba(255,255,255,.08) 54%, transparent 100%)`;
        bubble.style.boxShadow = `inset 0 0 14px rgba(255,255,255,.10), 0 8px 18px ${tint}`;
        layer.appendChild(bubble);
      }

      section.prepend(layer);
      if (!lifeObserver || sectionIndex === 0) section.classList.add('is-life-visible');
      lifeObserver?.observe(section);
    });
  };

  const setupNavigation = () => {
    navToggle?.addEventListener('click', () => {
      const open = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (event) => {
      if (!navMenu.classList.contains('is-open')) return;
      if (navMenu.contains(event.target) || navToggle.contains(event.target)) return;
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });

  };

  const setupFilters = () => {
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        filterButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));

        projectCards.forEach((card) => {
          const categories = card.dataset.category.split(' ');
          const show = filter === 'all' || categories.includes(filter);
          card.dataset.hidden = show ? 'false' : 'true';
        });
        activeProjectIndex = 0;
        updateProjectCarousel();
      });
    });
  };

  const updateProjectCarousel = () => {
    if (!projectCarouselTrack) return;

    const visibleCards = projectCards.filter((card) => card.dataset.hidden !== 'true');
    activeProjectIndex = Math.min(activeProjectIndex, Math.max(visibleCards.length - 1, 0));
    projectCarouselTrack.style.transform = `translateX(-${activeProjectIndex * 100}%)`;

    projectCards.forEach((card) => {
      const isActive = visibleCards[activeProjectIndex] === card;
      card.setAttribute('aria-hidden', String(!isActive));
      card.inert = !isActive;
    });

    if (projectCarouselStatus) {
      projectCarouselStatus.textContent = visibleCards.length
        ? `${activeProjectIndex + 1} / ${visibleCards.length}`
        : '0 / 0';
    }
    if (projectPreviousButton) projectPreviousButton.disabled = activeProjectIndex === 0;
    if (projectNextButton) projectNextButton.disabled = activeProjectIndex >= visibleCards.length - 1;
  };

  const setupProjectCarousel = () => {
    projectPreviousButton?.addEventListener('click', () => {
      activeProjectIndex -= 1;
      updateProjectCarousel();
    });
    projectNextButton?.addEventListener('click', () => {
      activeProjectIndex += 1;
      updateProjectCarousel();
    });
    updateProjectCarousel();
  };

  const setupProjects = () => {
    projectCards.forEach((card) => {
      const projectName = card.dataset.project;
      card.querySelectorAll('.project-action').forEach((button) => {
        button.addEventListener('click', () => openModal(projectName, button.dataset.action));
      });
    });

    modal?.addEventListener('click', (event) => {
      if (event.target.matches('[data-close-modal]')) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  };

  const setupForm = () => {
    if (!contactForm) return;

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const subject = String(formData.get('subject') || '').trim();
      const message = String(formData.get('message') || '').trim();
      const status = contactForm.querySelector('.form-status');

      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !email || !subject || !message || !emailValid) {
        status.textContent = 'Please complete all fields with a valid email address.';
        status.classList.add('is-error');
        return;
      }

      status.classList.remove('is-error');
      status.textContent = '';
      contactForm.reset();
      showToast('Thanks for reaching out. Your message has been queued as a placeholder submission.');
    });
  };

  const setupTechBadgeCursorRepulsion = () => {
    if (!isFinePointer || lowPowerDevice) return;

    const techBadges = Array.from(document.querySelectorAll('.tech-badge'));
    if (!techBadges.length) return;

    const badgeStates = techBadges.map(() => ({ x: 0, y: 0, targetX: 0, targetY: 0 }));
    let mouseX = 0;
    let mouseY = 0;
    let isAnimating = false;

    const repulsionRadius = 120;
    const maxRepulsion = 16;
    const smoothing = 0.15; // Lower = smoother, higher = snappier

    const updateRepulsion = () => {
      let needsUpdate = false;

      techBadges.forEach((badge, index) => {
        const state = badgeStates[index];
        const rect = badge.getBoundingClientRect();
        const badgeCenterX = rect.left + rect.width / 2;
        const badgeCenterY = rect.top + rect.height / 2;

        const deltaX = badgeCenterX - mouseX;
        const deltaY = badgeCenterY - mouseY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < repulsionRadius) {
          const angle = Math.atan2(deltaY, deltaX);
          const force = Math.max(0, 1 - distance / repulsionRadius);
          state.targetX = Math.cos(angle) * force * maxRepulsion;
          state.targetY = Math.sin(angle) * force * maxRepulsion;
        } else {
          state.targetX = 0;
          state.targetY = 0;
        }

        // Smooth interpolation
        state.x += (state.targetX - state.x) * smoothing;
        state.y += (state.targetY - state.y) * smoothing;

        // Apply with rounding to prevent micro-movements
        const roundedX = Math.round(state.x * 100) / 100;
        const roundedY = Math.round(state.y * 100) / 100;
        badge.style.translate = `${roundedX}px ${roundedY}px`;

        if (Math.abs(state.targetX - state.x) > 0.1 || Math.abs(state.targetY - state.y) > 0.1) {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        requestAnimationFrame(updateRepulsion);
      } else {
        isAnimating = false;
      }
    };

    document.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(updateRepulsion);
      }
    }, { passive: true });
  };

  const setupReducedMotion = () => {
    if (!prefersReducedMotion) return false;

    revealEls.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    counters.forEach((counter, index) => {
      animateCounter(counter, index + 1);
    });
    timelineLine.style.height = '100%';
    return true;
  };

  const animateSectionContent = () => {
    if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) {
      revealEls.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const revealInFlow = (selector, options = {}) => {
      gsap.utils.toArray(selector).forEach((el, index) => {
      gsap.fromTo(el, {
        opacity: 0,
        y: options.y ?? 20,
      }, {
        opacity: 1,
        y: 0,
        duration: lowPowerDevice ? (options.duration ?? 0.85) * 0.72 : (options.duration ?? 0.85),
        delay: options.stagger ? index * (options.stagger / 6) : 0,
        ease: 'power3.out',
        force3D: true,
        scrollTrigger: {
          trigger: el,
          start: options.start ?? 'top 96%',
          end: options.end ?? 'top 78%',
          toggleActions: 'play none none none',
          once: options.once ?? true,
        },
      });
      });
    };

    revealInFlow('.section__heading', { y: 18, duration: 0.72, start: 'top 96%' });
    revealInFlow('.about__sticky', { y: 22, duration: 0.8, start: 'top 95%' });
    revealInFlow('.skill-group', { y: 18, duration: 0.76, start: 'top 96%' });
    revealInFlow('.project-card', { y: 24, duration: 0.86, start: 'top 96%' });
    revealInFlow('.timeline__item', { y: 18, duration: 0.76, start: 'top 96%' });
    revealInFlow('.achievement-card, .mini-card, .value-card, .contact__panel, .contact-card', { y: 18, duration: 0.76, start: 'top 96%' });
    revealInFlow('.hero__copy .reveal', { y: 22, duration: 0.7, start: 'top 98%' });
    revealInFlow('.hero__panel', { y: 22, duration: 0.78, start: 'top 98%' });

    gsap.to('.orb', {
      yPercent: -10,
      xPercent: 4,
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: lowPowerDevice ? false : 0.7,
      },
    });

    gsap.to(hero, {
      scale: 0.98,
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: lowPowerDevice ? false : 1,
      },
    });

    counters.forEach((counter, index) => {
      const value = index + 1;
      ScrollTrigger.create({
        trigger: counter,
        start: 'top 85%',
        once: true,
        onEnter: () => animateCounter(counter, value),
      });
    });

    gsap.to(timelineLine, {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 70%',
        end: 'bottom 70%',
        scrub: 0.8,
      },
    });
  };

  const setupScrollProgress = () => {
    const tick = () => {
      if (state.scrolling) return;
      state.scrolling = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 20;
        header?.classList.toggle('is-scrolled', scrolled);
        updateProgress();
        updateOceanLight();
        state.scrolling = false;
      });
    };

    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick, { passive: true });
    tick();
  };

  const boot = () => {
    if (state.booted) return;
    state.booted = true;
    doc.classList.add('app-ready');

    yearOutput.textContent = String(new Date().getFullYear());

    setupCursor();
    setupOceanSurface();
    setupOceanLife();
    setupNavigation();
    setupSectionObserver();
    setupHeroRoleRotation();
    setupFilters();
    setupProjectCarousel();
    setupProjects();
    setupForm();
    setupTechBadgeCursorRepulsion();
    setupScrollProgress();
    setupReducedMotion();
    animateSectionContent();

    navLinks[0]?.classList.add('is-active');
  };


  window.addEventListener('load', () => {
    boot();

    window.setTimeout(() => {
      const loader = document.querySelector('.loader');
      if (!loader) return;
      if (window.gsap && !prefersReducedMotion) {
        gsap.to(loader, {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.inOut',
          onComplete: () => {
            loader.style.display = 'none';
            doc.classList.remove('preload');
          },
        });
      } else {
        loader.style.display = 'none';
        doc.classList.remove('preload');
      }
    }, 900);
  });

  // Ensure content stays visible if the page is already loaded before this script runs.
  if (document.readyState === 'complete') {
    boot();
  }
})();