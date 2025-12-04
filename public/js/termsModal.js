// Terms of Service Modal Handler
document.addEventListener('DOMContentLoaded', function() {
  const termsModal = document.getElementById('terms-modal');
  const termsLink = document.getElementById('terms-of-service-link');
  const agreeBtn = document.getElementById('agree-terms-btn');
  const declineBtn = document.getElementById('decline-terms-btn');
  const modalBody = termsModal ? termsModal.querySelector('.terms-modal-body') : null;
  // Privacy modal elements
  const privacyModal = document.getElementById('privacy-modal');
  const privacyLink = document.getElementById('privacy-policy-link');
  const privacyAgreeBtn = document.getElementById('agree-privacy-btn');
  const privacyDeclineBtn = document.getElementById('decline-privacy-btn');
  const privacyModalBody = privacyModal ? privacyModal.querySelector('.terms-modal-body') : null;
  // Help modal elements
  const helpModal = document.getElementById('help-modal');
  const helpLink = document.getElementById('help-center-link');
  const helpCloseIcon = document.getElementById('close-help-modal');
  const helpCloseBtn = document.getElementById('close-help-btn');
  const contactSupportBtn = document.getElementById('contact-support-btn');
  // Support modal elements
  const supportModal = document.getElementById('support-modal');
  const supportForm = document.getElementById('support-form');
  const supportEmail = document.getElementById('support-email');
  const supportEmailGroup = document.getElementById('support-email-group');
  const supportPhone = document.getElementById('support-phone');
  const supportSubject = document.getElementById('support-subject');
  const supportMessage = document.getElementById('support-message');
  const supportSendBtn = document.getElementById('support-send');
  const supportCancelBtn = document.getElementById('support-cancel');
  const supportCloseIcon = document.getElementById('close-support-modal');
  const supportAccountInfo = document.getElementById('support-account-info');
  const supportAccountId = document.getElementById('support-account-id');
  const helpModalBody = helpModal ? helpModal.querySelector('.terms-modal-body') : null;

  // Open modal when Terms of Service link is clicked
  if (termsLink) {
    termsLink.addEventListener('click', function(e) {
      e.preventDefault();
      openTermsModal();
    });
  }

  // Initialize agree button state
  if (agreeBtn) {
    // store original button text so we don't build up multiple countdown labels
    agreeBtn.dataset.origText = (agreeBtn.textContent || 'I Agree').trim();
    agreeBtn.style.display = 'none';
    agreeBtn.disabled = true;
  }

  // Close modal when agree button is clicked
  if (agreeBtn) {
    agreeBtn.addEventListener('click', function() {
      console.log('User agreed to Terms of Service');
      closeTermsModal();
    });
  }

  // Decline behavior: if user is logged in, sign them out automatically
  if (declineBtn) {
    declineBtn.addEventListener('click', function() {
      console.log('User declined Terms of Service');
      handleDecline();
    });
  }

  // Privacy modal wiring
  if (privacyLink) {
    privacyLink.addEventListener('click', function(e) {
      e.preventDefault();
      openPrivacyModal();
    });
  }

  // Initialize privacy agree button state
  if (privacyAgreeBtn) {
    privacyAgreeBtn.dataset.origText = (privacyAgreeBtn.textContent || 'I Understand').trim();
    privacyAgreeBtn.style.display = 'none';
    privacyAgreeBtn.disabled = true;
  }

  if (privacyAgreeBtn) {
    privacyAgreeBtn.addEventListener('click', function() {
      console.log('User acknowledged Privacy Policy');
      closePrivacyModal();
    });
  }

  if (privacyDeclineBtn) {
    privacyDeclineBtn.addEventListener('click', function() {
      console.log('User declined Privacy Policy');
      handlePrivacyDecline();
    });
  }

  // Help modal wiring
  if (helpLink) {
    helpLink.addEventListener('click', function(e) {
      e.preventDefault();
      openHelpModal();
    });
  }

  if (helpCloseIcon) {
    helpCloseIcon.addEventListener('click', closeHelpModal);
  }
  if (helpCloseBtn) {
    helpCloseBtn.addEventListener('click', closeHelpModal);
  }

  if (contactSupportBtn) {
    contactSupportBtn.addEventListener('click', function() {
      openSupportModal();
    });
  }

  // Support modal wiring
  if (supportCloseIcon) supportCloseIcon.addEventListener('click', closeSupportModal);
  if (supportCancelBtn) supportCancelBtn.addEventListener('click', closeSupportModal);

  if (supportSendBtn) {
    supportSendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      submitSupportForm();
    });
  }

  // Allow overlay click to close support modal
  if (supportModal) {
    supportModal.addEventListener('click', function(e) {
      if (e.target === supportModal) closeSupportModal();
    });
  }

  // Close support modal on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && supportModal && !supportModal.classList.contains('hidden')) {
      closeSupportModal();
    }
  });

  // NOTE: Intentionally do NOT allow closing via background click or Escape
  // to force the user to either Agree or Decline.

  // Scroll detection: show "I Agree" only when user reaches bottom
  let revealTimer = null;
  let countdownInterval = null;
  let hasRevealed = false;
  // Privacy modal state
  let privacyCountdownInterval = null;
  let privacyHasRevealed = false;

  function startRevealCountdown(seconds = 8) {
    if (!agreeBtn) return;
    // clear any previous countdown to avoid multiple intervals
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    agreeBtn.style.display = 'inline-block';
    agreeBtn.disabled = true;
    let remaining = seconds;
    const originalText = agreeBtn.dataset.origText || 'I Agree';
    agreeBtn.textContent = `${originalText} (${remaining})`;

    countdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        agreeBtn.textContent = originalText;
        agreeBtn.disabled = false;
      } else {
        agreeBtn.textContent = `${originalText} (${remaining})`;
      }
    }, 1000);
  }

  function onModalScroll() {
    if (!modalBody || hasRevealed) return;
    const atBottom = modalBody.scrollTop + modalBody.clientHeight >= modalBody.scrollHeight - 5;
    if (atBottom) {
      hasRevealed = true;
      // start the 8-second enable countdown
      startRevealCountdown(8);
    }
  }

  function startPrivacyRevealCountdown(seconds = 8) {
    if (!privacyAgreeBtn) return;
    if (privacyCountdownInterval) {
      clearInterval(privacyCountdownInterval);
      privacyCountdownInterval = null;
    }
    privacyAgreeBtn.style.display = 'inline-block';
    privacyAgreeBtn.disabled = true;
    let remaining = seconds;
    const originalText = privacyAgreeBtn.dataset.origText || 'I Understand';
    privacyAgreeBtn.textContent = `${originalText} (${remaining})`;

    privacyCountdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(privacyCountdownInterval);
        privacyCountdownInterval = null;
        privacyAgreeBtn.textContent = originalText;
        privacyAgreeBtn.disabled = false;
      } else {
        privacyAgreeBtn.textContent = `${originalText} (${remaining})`;
      }
    }, 1000);
  }

  function onPrivacyScroll() {
    if (!privacyModalBody || privacyHasRevealed) return;
    const atBottom = privacyModalBody.scrollTop + privacyModalBody.clientHeight >= privacyModalBody.scrollHeight - 5;
    if (atBottom) {
      privacyHasRevealed = true;
      startPrivacyRevealCountdown(8);
    }
  }

  if (modalBody) {
    // ensure any existing scroll position is reset on open
    modalBody.addEventListener('scroll', onModalScroll);
  }
  if (privacyModalBody) {
    privacyModalBody.addEventListener('scroll', onPrivacyScroll);
  }
  if (helpModalBody) {
    // help modal doesn't require reveal; but allow other behaviors if needed
    // no-op for now
  }

  // Function to open modal and focus on it
  function openTermsModal() {
    if (!termsModal) return;

    // reset reveal state
    hasRevealed = false;
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }

    if (agreeBtn) {
      agreeBtn.style.display = 'none';
      agreeBtn.disabled = true;
    }

    termsModal.classList.remove('hidden');

    // Scroll to modal smoothly and center it
    setTimeout(() => {
      const modalContent = document.querySelector('.terms-modal-content');
      if (modalContent) {
        modalContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // reset modal body scroll
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }, 10);
  }

  // Privacy modal open
  function openPrivacyModal() {
    if (!privacyModal) return;
    // reset state
    privacyHasRevealed = false;
    if (privacyCountdownInterval) {
      clearInterval(privacyCountdownInterval);
      privacyCountdownInterval = null;
    }
    if (privacyAgreeBtn) {
      privacyAgreeBtn.style.display = 'none';
      privacyAgreeBtn.disabled = true;
    }
    privacyModal.classList.remove('hidden');
    setTimeout(() => {
      const modalContent = privacyModal.querySelector('.terms-modal-content');
      if (modalContent) modalContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.body.style.overflow = 'hidden';
      if (privacyModalBody) privacyModalBody.scrollTop = 0;
    }, 10);
  }

  // Support modal functions
  function openSupportModal() {
    if (!supportModal) return;
    // reset form
    if (supportForm) supportForm.reset();

    // detect signed-in state via auth button text
    const authBtnHeader = document.querySelector('#auth-btn-header');
    const authBtnModal = document.querySelector('#auth-btn-modal');
    let signedIn = false;
    let userLabel = '';
    [authBtnHeader, authBtnModal].forEach((btn) => {
      if (!btn) return;
      const textEl = btn.querySelector('.gsi-material-button-contents');
      if (textEl && /Sign\s*Out/i.test(textEl.textContent)) {
        signedIn = true;
      }
    });
    const userIdEl = document.getElementById('user-id');
    if (userIdEl) userLabel = userIdEl.textContent || '';

    if (signedIn) {
      // hide email input group and show account info
      if (supportEmailGroup) supportEmailGroup.style.display = 'none';
      if (supportEmail) supportEmail.style.display = 'none';
      if (supportAccountInfo) {
        supportAccountInfo.style.display = 'block';
        supportAccountId.textContent = userLabel || 'Signed-in user';
      }
      if (supportEmail) supportEmail.required = false;
    } else {
      if (supportEmailGroup) supportEmailGroup.style.display = 'block';
      if (supportEmail) supportEmail.style.display = 'block';
      if (supportAccountInfo) supportAccountInfo.style.display = 'none';
      if (supportEmail) supportEmail.required = true;
    }

    supportModal.classList.remove('hidden');
    setTimeout(() => {
      const modalContent = supportModal.querySelector('.terms-modal-content');
      if (modalContent) modalContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.body.style.overflow = 'hidden';
    }, 10);
  }

  function closeSupportModal() {
    if (!supportModal) return;
    supportModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  function submitSupportForm() {
    // validate
    const authBtnHeader = document.querySelector('#auth-btn-header');
    const authBtnModal = document.querySelector('#auth-btn-modal');
    let signedIn = false;
    [authBtnHeader, authBtnModal].forEach((btn) => {
      if (!btn) return;
      const textEl = btn.querySelector('.gsi-material-button-contents');
      if (textEl && /Sign\s*Out/i.test(textEl.textContent)) signedIn = true;
    });

    const emailVal = supportEmail ? supportEmail.value.trim() : '';
    const phoneVal = supportPhone ? supportPhone.value.trim() : '';
    const subjectVal = supportSubject ? supportSubject.value.trim() : '';
    const messageVal = supportMessage ? supportMessage.value.trim() : '';

    if (!subjectVal) { alert('Please provide a subject.'); return; }
    if (!messageVal) { alert('Please provide a message.'); return; }

    if (!signedIn) {
      if (!emailVal) { alert('Please enter your Gmail address.'); return; }
      // simple Gmail validation
      if (!/@gmail\.com\s*$/i.test(emailVal)) { alert('Please provide a valid @gmail.com address.'); return; }
    }

    // Prepare mailto with form contents
    const to = 'support@gptracker.com';
    const userIdEl = document.getElementById('user-id');
    const userEmailData = userIdEl && userIdEl.dataset && userIdEl.dataset.email ? userIdEl.dataset.email : '';
    const fromText = signedIn ? (userIdEl ? (userIdEl.textContent || 'Signed-in user') : 'Signed-in user') : emailVal;
    const bodyLines = [];
    bodyLines.push(`From: ${fromText}`);
    if (phoneVal) bodyLines.push(`Phone: ${phoneVal}`);
    bodyLines.push('');
    bodyLines.push(messageVal);
    const body = encodeURIComponent(bodyLines.join('\n'));
    // include cc to user's email when available or to the guest email
    let mailto = `mailto:${to}?subject=${encodeURIComponent(subjectVal)}&body=${body}`;
    const ccEmail = signedIn ? userEmailData : (emailVal || '');
    if (ccEmail) {
      mailto += `&cc=${encodeURIComponent(ccEmail)}`;
    }

    // open mail client
    window.location.href = mailto;

    // close modal after short delay
    setTimeout(() => {
      closeSupportModal();
      alert('Support message prepared in your mail client.');
    }, 200);
  }

  // Help modal open
  function openHelpModal() {
    if (!helpModal) return;
    helpModal.classList.remove('hidden');
    // allow background click to close help modal
    setTimeout(() => {
      const modalContent = helpModal.querySelector('.terms-modal-content');
      if (modalContent) modalContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.body.style.overflow = 'hidden';
    }, 10);
    // close on overlay click for help modal
    helpModal.addEventListener('click', function onOverlayClick(e) {
      if (e.target === helpModal) {
        closeHelpModal();
        helpModal.removeEventListener('click', onOverlayClick);
      }
    });
    // close on Escape
    function onHelpEsc(e) {
      if (e.key === 'Escape') {
        closeHelpModal();
        document.removeEventListener('keydown', onHelpEsc);
      }
    }
    document.addEventListener('keydown', onHelpEsc);
  }

  // Function to close modal
  function closeTermsModal() {
    if (!termsModal) return;
    termsModal.classList.add('hidden');
    // Re-enable body scroll
    document.body.style.overflow = 'auto';
    // cleanup timers
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
    hasRevealed = false;
    // reset agree button to original state
    if (agreeBtn) {
      const orig = agreeBtn.dataset && agreeBtn.dataset.origText ? agreeBtn.dataset.origText : 'I Agree';
      agreeBtn.textContent = orig;
      agreeBtn.style.display = 'none';
      agreeBtn.disabled = true;
    }
  }

  function closePrivacyModal() {
    if (!privacyModal) return;
    privacyModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (privacyCountdownInterval) {
      clearInterval(privacyCountdownInterval);
      privacyCountdownInterval = null;
    }
    privacyHasRevealed = false;
    if (privacyAgreeBtn) {
      const orig = privacyAgreeBtn.dataset && privacyAgreeBtn.dataset.origText ? privacyAgreeBtn.dataset.origText : 'I Understand';
      privacyAgreeBtn.textContent = orig;
      privacyAgreeBtn.style.display = 'none';
      privacyAgreeBtn.disabled = true;
    }
  }

  function closeHelpModal() {
    if (!helpModal) return;
    helpModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  // Handle decline: if user is signed-in, sign them out automatically
  function handleDecline() {
    // Find auth buttons used by googleAuth.js
    const authBtnHeader = document.querySelector('#auth-btn-header');
    const authBtnModal = document.querySelector('#auth-btn-modal');
    let signedIn = false;
    let buttonToClick = null;

    [authBtnHeader, authBtnModal].forEach((btn) => {
      if (!btn) return;
      const textEl = btn.querySelector('.gsi-material-button-contents');
      if (textEl && /Sign\s*Out/i.test(textEl.textContent)) {
        signedIn = true;
        buttonToClick = btn;
      }
    });

    if (signedIn && buttonToClick) {
      // trigger the existing sign-out flow
      try {
        buttonToClick.click();
      } catch (e) {
        console.warn('Failed to trigger sign out button click', e);
        // fallback to clearing local state
        localStorage.clear();
        location.reload();
      }
    } else {
      // Not signed-in (guest) — no need to sign out, simply close modal
      // If somehow there is an auth token, clear it as a fallback
      // (do not assume more than this)
    }

    // Close modal after handling
    closeTermsModal();
  }

  function handlePrivacyDecline() {
    // reuse same sign-out handling
    handleDecline();
    // ensure privacy modal closed as well
    closePrivacyModal();
  }

  // Expose functions globally for potential external use
  window.openTermsModal = openTermsModal;
  window.closeTermsModal = closeTermsModal;
});
