(function (global) {
  "use strict";

  const CLERK_CDN = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";

  let available = false;
  let clerk = null;
  let userBtnUnmount = null;
  const listeners = [];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (global.Clerk) return resolve(global.Clerk);
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = () => resolve(global.Clerk);
      s.onerror = () => reject(new Error("clerk script failed"));
      document.head.appendChild(s);
    });
  }

  function isSignedIn() {
    return !!(available && clerk && clerk.session);
  }

  async function getToken() {
    if (!isSignedIn()) return null;
    try {
      return await clerk.session.getToken();
    } catch {
      return null;
    }
  }

  function userId() {
    return isSignedIn() ? (clerk.user ? clerk.user.id : null) : null;
  }

  function onAuthChange(cb) {
    listeners.push(cb);
  }

  function emit() {
    listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        /* ignore */
      }
    });
  }

  function renderAuth() {
    const root = document.getElementById("auth-root");
    if (!root) return;
    if (userBtnUnmount) {
      try {
        userBtnUnmount();
      } catch {
        /* ignore */
      }
      userBtnUnmount = null;
    }
    root.innerHTML = "";
    if (isSignedIn()) {
      userBtnUnmount = clerk.mountUserButton(root, { afterSignOutUrl: global.location.href });
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-ghost btn-sm";
      btn.textContent = "Sign in";
      btn.addEventListener("click", () => {
        try {
          clerk.openSignIn();
        } catch {
          /* ignore */
        }
      });
      root.appendChild(btn);
    }
  }

  async function init() {
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      if (!res.ok) return;
      const cfg = await res.json();
      if (!cfg.clerkPublishableKey) return;
      clerk = await loadScript(CLERK_CDN);
      if (!clerk) return;
      await clerk.load({ publishableKey: cfg.clerkPublishableKey });
      available = true;
      clerk.addListener(() => {
        renderAuth();
        emit();
      });
      renderAuth();
      emit();
    } catch {
      available = false;
    }
  }

  global.Auth = {
    init,
    isSignedIn,
    getToken,
    userId,
    onAuthChange,
    isAvailable: () => available
  };
})(window);
