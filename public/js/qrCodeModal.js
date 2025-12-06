// QR Code Modal Handler
let currentQRCode = null;

document.addEventListener("DOMContentLoaded", () => {
  const qrBtn = document.getElementById("qr-code-btn");
  const qrModal = document.getElementById("qr-modal");
  const closeQrModal = document.getElementById("close-qr-modal");
  const downloadQrBtn = document.getElementById("download-qr-btn");
  const copyQrLinkBtn = document.getElementById("copy-qr-link-btn");
  const qrCodeContainer = document.getElementById("qr-code-container");
  const qrUidDisplay = document.getElementById("qr-uid-display");

  // Open QR Modal
  if (qrBtn) {
    qrBtn.addEventListener("click", () => {
      if (!window.reyalAydi) {
        alert("❌ No UID available. Please select a tab first.");
        return;
      }

      // Generate QR code URL
      const baseUrl = "https://group-payment-tracker.web.app/LandingPage.html";
      const qrUrl = `${baseUrl}?searchuid=${encodeURIComponent(window.reyalAydi)}`;

      // Display UID
      qrUidDisplay.textContent = window.reyalAydi;

      // Clear previous QR code
      qrCodeContainer.innerHTML = "";

      // Generate new QR code
      try {
        currentQRCode = new QRCode(qrCodeContainer, {
          text: qrUrl,
          width: 256,
          height: 256,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });

        // Show modal
        qrModal.classList.remove("hidden");
        document.body.classList.add("qr-modal-open");
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        alert("❌ Failed to generate QR code. Please try again.");
      }
    });
  }

  // Close QR Modal
  const closeModal = () => {
    qrModal.classList.add("hidden");
    document.body.classList.remove("qr-modal-open");
  };

  if (closeQrModal) {
    closeQrModal.addEventListener("click", closeModal);
  }

  // Close on overlay click
  if (qrModal) {
    qrModal.addEventListener("click", (e) => {
      if (e.target === qrModal) {
        closeModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !qrModal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Download QR Code
  if (downloadQrBtn) {
    downloadQrBtn.addEventListener("click", () => {
      const canvas = qrCodeContainer.querySelector("canvas");
      if (!canvas) {
        alert("❌ No QR code to download.");
        return;
      }

      try {
        // Create a safe filename (remove special characters)
        const safeUid = window.reyalAydi.replace(/[^a-zA-Z0-9]/g, '_');
        const link = document.createElement("a");
        link.download = `GPTracker-QR-${safeUid}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Visual feedback on button
        const originalText = downloadQrBtn.textContent;
        downloadQrBtn.textContent = "✓ Downloaded!";
        downloadQrBtn.classList.add("bg-green-600");
        downloadQrBtn.classList.remove("bg-blue-600");

        setTimeout(() => {
          downloadQrBtn.textContent = originalText;
          downloadQrBtn.classList.remove("bg-green-600");
          downloadQrBtn.classList.add("bg-blue-600");
        }, 2000);

        tryShowNotification("QR code downloaded successfully", "success");
      } catch (error) {
        console.error("Failed to download QR code:", error);
        alert("❌ Failed to download QR code. Error: " + error.message);
      }
    });
  }

  // Copy QR Link
  if (copyQrLinkBtn) {
    copyQrLinkBtn.addEventListener("click", async () => {
      if (!window.reyalAydi) {
        alert("❌ No UID available.");
        return;
      }

      const baseUrl = "https://group-payment-tracker.web.app/LandingPage.html";
      const qrUrl = `${baseUrl}?searchuid=${window.reyalAydi}`;

      try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(qrUrl);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea");
          textArea.value = qrUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        // Visual feedback
        const originalText = copyQrLinkBtn.textContent;
        copyQrLinkBtn.textContent = "✓ Copied!";
        copyQrLinkBtn.classList.add("bg-green-500", "text-white");
        copyQrLinkBtn.classList.remove("bg-gray-200", "text-gray-700");

        setTimeout(() => {
          copyQrLinkBtn.textContent = originalText;
          copyQrLinkBtn.classList.remove("bg-green-500", "text-white");
          copyQrLinkBtn.classList.add("bg-gray-200", "text-gray-700");
        }, 2000);

        tryShowNotification("Link copied to clipboard", "success");
      } catch (error) {
        console.error("Failed to copy link:", error);
        
        // Show the URL in a prompt as fallback
        prompt("Copy this link manually:", qrUrl);
      }
    });
  }
});

// Helper function for notifications (if not already defined)
function tryShowNotification(msg, type = 'info') {
  try {
    if (typeof window.showNotification === 'function') {
      window.showNotification(msg, type);
    } else {
      // Create a simple notification if the main one isn't available
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-[10000] ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' : 
        'bg-blue-500 text-white'
      }`;
      notification.textContent = msg;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }
  } catch (error) {
    console.log(`[${type.toUpperCase()}] ${msg}`);
  }
}
