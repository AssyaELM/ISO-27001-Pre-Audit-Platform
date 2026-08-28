(() => {
  const app = document.querySelector("#app");
  const screens = [...document.querySelectorAll("[data-screen]")];
  const modalLayer = document.querySelector("#modal-layer");
  const toastLayer = document.querySelector("#toast-layer");
  const params = new URLSearchParams(window.location.search);
  const initialScreen = params.get("screen") || "dashboard";
  let activeScreen = screens.some((screen) => screen.dataset.screen === initialScreen) ? initialScreen : "dashboard";

  const modalCopy = {
    delete: {
      title: "Delete Organization?",
      copy: "This will permanently remove Aster Cloud from the NormCore workspace, including its activation record and aggregate progress history.",
      warning: "This action is irreversible. Make sure you have reviewed the organization record before continuing.",
      button: "Delete Organization",
      icon: "danger",
      buttonClass: "btn-danger",
    },
    suspend: {
      title: "Suspend Organization?",
      copy: "Aster Cloud will lose access to its NormCore workspace until a Super Admin reactivates the organization.",
      warning: "Existing records are kept. The organization can be reactivated later.",
      button: "Suspend Organization",
      icon: "warning",
      buttonClass: "btn-danger-outline",
    },
    reactivate: {
      title: "Reactivate Organization?",
      copy: "Aster Cloud will regain access to its NormCore workspace and continue from its current aggregate onboarding status.",
      warning: "The current activation and onboarding history will be preserved.",
      button: "Reactivate Organization",
      icon: "success",
      buttonClass: "btn-primary",
    },
    archive: {
      title: "Archive Organization?",
      copy: "Aster Cloud will be removed from active organization views and retained as an archived record.",
      warning: "Archived organizations are not available for new activation flows.",
      button: "Archive Organization",
      icon: "warning",
      buttonClass: "btn-secondary",
    },
  };

  function setScreen(nextScreen, replace = false) {
    activeScreen = screens.some((screen) => screen.dataset.screen === nextScreen) ? nextScreen : "dashboard";
    screens.forEach((screen) => {
      screen.classList.toggle("active", screen.dataset.screen === activeScreen);
    });
    app.classList.toggle("is-login", activeScreen === "login");
    document.body.classList.toggle("login-body", activeScreen === "login");
    document.querySelector("[data-app-header]")?.classList.toggle("hidden", activeScreen === "login");
    document.querySelectorAll("[data-screen-link]").forEach((link) => {
      link.classList.toggle("active", link.dataset.screenLink === activeScreen);
    });
    document.querySelectorAll("[data-screen-select]").forEach((select) => {
      select.value = activeScreen;
    });
    if (!replace) {
      const nextUrl = window.location.pathname + "?screen=" + encodeURIComponent(activeScreen);
      window.history.pushState({ screen: activeScreen }, "", nextUrl);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function showToast(title, message, tone = "success") {
    const color = tone === "error" ? "danger" : tone;
    const icon = color === "danger" ? "!" : "✓";
    const background = color === "danger" ? "var(--danger-bg)" : "var(--teal-100)";
    const foreground = color === "danger" ? "var(--danger)" : "var(--teal-700)";
    toastLayer.innerHTML =
      '<div class="modal-backdrop" style="background:transparent;backdrop-filter:none;place-items:end end;padding:24px;pointer-events:none">' +
        '<div class="toast" style="pointer-events:auto;background:#fff;color:var(--text);border:1px solid var(--line);box-shadow:var(--shadow-md);min-width:310px;max-width:390px;margin:0">' +
          '<span class="toast-check" style="background:' + background + ';color:' + foreground + '">' + icon + '</span>' +
          '<div><h3 style="color:var(--text)">' + title + '</h3><p style="color:var(--muted)">' + message + '</p></div>' +
        '</div>' +
      '</div>';
    window.setTimeout(() => {
      toastLayer.innerHTML = "";
    }, 3200);
  }

  function closeModal() {
    modalLayer.innerHTML = "";
  }

  function openActionModal(action) {
    const copy = modalCopy[action] || modalCopy.delete;
    const iconClass = copy.icon === "danger" ? "danger" : copy.icon === "success" ? "success" : "";
    const iconText = copy.icon === "success" ? "✓" : "!";
    modalLayer.innerHTML =
      '<div class="modal-backdrop" data-modal-backdrop>' +
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">' +
          '<div class="modal-icon ' + iconClass + '">' + iconText + '</div>' +
          '<h2 id="action-modal-title">' + copy.title + '</h2>' +
          '<p>' + copy.copy + '</p>' +
          '<div class="modal-warning">' + copy.warning + '</div>' +
          '<div class="modal-actions"><button class="btn btn-secondary" data-close-modal>Cancel</button><button class="btn ' + copy.buttonClass + '" data-modal-confirm>' + copy.button + '</button></div>' +
        '</div>' +
      '</div>';
    modalLayer.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
    modalLayer.querySelector("[data-modal-backdrop]")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeModal();
    });
    modalLayer.querySelector("[data-modal-confirm]")?.addEventListener("click", () => {
      closeModal();
      const result = action === "delete" ? "deleted" : action === "reactivate" ? "reactivated" : action + "d";
      showToast(copy.button.replace("?", "") + " complete", "Aster Cloud is now marked as " + result + ".");
    });
  }

  function copyToken(button) {
    const token = document.querySelector("[data-copy-token]")?.textContent?.trim() || "NMX4K7F82QA9";
    const done = () => {
      if (!button) return;
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = original; }, 1600);
      showToast("Token copied", "The activation token is ready to share securely.");
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(token).then(done).catch(done);
    } else {
      done();
    }
  }

  function regenerateToken(button) {
    const tokenNode = document.querySelector("[data-copy-token]");
    if (tokenNode) tokenNode.textContent = "NMX8P4D71ZQ2";
    if (button) {
      const original = button.textContent;
      button.textContent = "Regenerated";
      window.setTimeout(() => { button.textContent = original; }, 1600);
    }
    showToast("Token regenerated", "The previous activation token is no longer valid.");
  }

  function updateConfirmationPreview(action) {
    const copy = modalCopy[action] || modalCopy.delete;
    const title = document.querySelector("[data-modal-title]");
    const body = document.querySelector("[data-modal-copy]");
    const warning = document.querySelector("[data-modal-warning]");
    const icon = document.querySelector("[data-modal-icon]");
    const confirm = document.querySelector("[data-modal-confirm]");
    if (!title || !body || !warning || !icon || !confirm) return;
    title.textContent = copy.title;
    body.textContent = copy.copy;
    warning.textContent = copy.warning;
    icon.className = "modal-icon " + (copy.icon === "danger" ? "danger" : copy.icon === "success" ? "success" : "");
    icon.textContent = copy.icon === "success" ? "✓" : "!";
    confirm.textContent = copy.button;
    confirm.className = "btn " + copy.buttonClass;
    document.querySelectorAll("[data-modal-switch]").forEach((button) => {
      button.classList.toggle("active", button.dataset.modalSwitch === action);
    });
  }

  function applySearch(input) {
    const tableId = input.dataset.tableSearch;
    const table = document.querySelector('[data-filterable-table="' + tableId + '"]');
    if (!table) return;
    const query = input.value.toLowerCase().trim();
    table.querySelectorAll("[data-search-row]").forEach((row) => {
      row.hidden = query.length > 0 && !row.dataset.searchRow.toLowerCase().includes(query);
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-screen-link]");
    if (link) {
      event.preventDefault();
      setScreen(link.dataset.screenLink);
      return;
    }
    const confirmAction = event.target.closest("[data-confirm-action]");
    if (confirmAction) {
      event.preventDefault();
      openActionModal(confirmAction.dataset.confirmAction);
      return;
    }
    if (event.target.closest("[data-close-modal]")) {
      closeModal();
      return;
    }
    const copyButton = event.target.closest("[data-copy-button]");
    if (copyButton) {
      copyToken(copyButton);
      return;
    }
    const regenerateButton = event.target.closest("[data-regenerate-button]");
    if (regenerateButton) {
      regenerateToken(regenerateButton);
      return;
    }
    const sendInvite = event.target.closest("[data-send-invite]");
    if (sendInvite) {
      showToast("Invitation sent", "The invitation email was sent to the primary contact.");
      return;
    }
    const viewToken = event.target.closest("[data-view-token]");
    if (viewToken) {
      openActionModal("reactivate");
      const modal = modalLayer.querySelector(".modal");
      if (modal) {
        modal.querySelector(".modal-icon").className = "modal-icon success";
        modal.querySelector(".modal-icon").textContent = "▣";
        modal.querySelector("h2").textContent = "View activation token";
        modal.querySelector("p").textContent = "This token is protected and only visible to authorized Super Admins.";
        modal.querySelector(".modal-warning").textContent = "NMX4K7F82QA9 · 12 characters · expires Sep 03, 2026";
        modal.querySelector("[data-modal-confirm]").textContent = "Copy Token";
        modal.querySelector("[data-modal-confirm]").className = "btn btn-primary";
        modal.querySelector("[data-modal-confirm]").addEventListener("click", () => {
          closeModal();
          showToast("Token copied", "The activation token is ready to share securely.");
        });
      }
      return;
    }
    const modalSwitch = event.target.closest("[data-modal-switch]");
    if (modalSwitch) {
      updateConfirmationPreview(modalSwitch.dataset.modalSwitch);
    }
  });

  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-table-search]");
    if (input) applySearch(input);
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-screen-select]");
    if (select) setScreen(select.value);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-add-organization-form]");
    if (form) {
      event.preventDefault();
      setScreen("token-generated");
      showToast("Organization created", "A secure activation token was generated.");
      return;
    }
    const loginForm = event.target.closest("[data-login-form]");
    if (loginForm) {
      event.preventDefault();
      showToast("Signed in", "Welcome back, Alex.");
      window.setTimeout(() => setScreen("dashboard"), 500);
    }
  });

  document.addEventListener("click", (event) => {
    const passwordToggle = event.target.closest("[data-toggle-password]");
    if (!passwordToggle) return;
    const input = passwordToggle.parentElement.querySelector("input");
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
    passwordToggle.textContent = input.type === "password" ? "◉" : "○";
  });

  window.addEventListener("popstate", () => {
    const nextScreen = new URLSearchParams(window.location.search).get("screen") || "dashboard";
    setScreen(nextScreen, true);
  });

  setScreen(activeScreen, true);
  updateConfirmationPreview("delete");
})();
