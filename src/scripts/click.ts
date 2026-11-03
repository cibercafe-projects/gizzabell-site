/** Registra o clique no post, sem identificador de visitante. */
for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-post]')) {
  link.addEventListener(
    'click',
    () => {
      const slug = link.dataset.post;
      if (!slug) return;
      const corpo = JSON.stringify({ post: slug });
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/click', new Blob([corpo], { type: 'application/json' }));
          return;
        }
      } catch {}
      void fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: corpo,
        keepalive: true,
      }).catch(() => {});
    },
    { passive: true },
  );
}

export {};
