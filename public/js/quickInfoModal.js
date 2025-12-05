// Quick Info Modal Handler

class QuickInfoModal {
  constructor() {
    this.modal = null;
    this.init();
  }

  init() {
    // Create modal HTML
    this.createModal();
    
    // Attach event listeners
    this.attachEventListeners();
    
    // Attach listeners to existing quick info rows
    this.attachExistingRowListeners();
  }
  
  attachExistingRowListeners() {
    // Use event delegation on the info-content container
    const infoContent = document.getElementById('info-content');
    
    if (!infoContent) {
      console.log('Info content not found yet, will attach later');
      return;
    }
    
    // Use event delegation for clicks
    infoContent.addEventListener('click', (e) => {
      const labelElement = e.target.closest('.info-label.qi-editable');
      const valueElement = e.target.closest('.info-value.qi-editable');
      
      if (labelElement) {
        this.handleClickOnElement(labelElement, 'label', e);
      } else if (valueElement) {
        this.handleClickOnElement(valueElement, 'value', e);
      }
    });
    
    // Use event delegation for double-clicks
    infoContent.addEventListener('dblclick', (e) => {
      const labelElement = e.target.closest('.info-label.qi-editable');
      const valueElement = e.target.closest('.info-value.qi-editable');
      
      if (labelElement || valueElement) {
        const row = e.target.closest('.info-row');
        const label = row.querySelector('.info-label')?.textContent.trim() || '';
        const value = row.querySelector('.info-value')?.textContent.trim() || '';
        const id = row.getAttribute('data-qi-id');
        
        if (labelElement) labelElement.dataset.doubleClick = "true";
        if (valueElement) valueElement.dataset.doubleClick = "true";
        
        this.handleDelete(row, id, label, value);
      }
    });
  }
  
  handleClickOnElement(element, type, e) {
    if (e.detail === 1) {
      setTimeout(() => {
        if (!element.dataset.doubleClick) {
          const row = element.closest('.info-row');
          const label = row.querySelector('.info-label')?.textContent.trim() || '';
          const value = row.querySelector('.info-value')?.textContent.trim() || '';
          const id = row.getAttribute('data-qi-id');
          
          this.handleEdit(element, type, id, label, value);
        }
        delete element.dataset.doubleClick;
      }, 300);
    }
  }

  createModal() {
    const modalHTML = `
      <div id="qi-modal" class="qi-modal-overlay">
        <div class="qi-modal-content">
          <div class="qi-modal-header">
            <h2 class="qi-modal-title">Add Quick Info</h2>
            <button class="qi-modal-close" id="qi-modal-close">&times;</button>
          </div>
          
          <div class="qi-modal-body">
            <form id="qi-form">
              <div class="qi-form-group">
                <label class="qi-form-label" for="qi-label">Label</label>
                <input 
                  type="text" 
                  id="qi-label" 
                  class="qi-form-input" 
                  placeholder="e.g., Monthly Fee"
                  required
                />
              </div>
              
              <div class="qi-form-group">
                <label class="qi-form-label" for="qi-value">Value</label>
                <input 
                  type="text" 
                  id="qi-value" 
                  class="qi-form-input" 
                  placeholder="e.g., ₱130.00"
                  required
                />
              </div>
            </form>
          </div>
          
          <div class="qi-modal-footer">
            <button class="qi-btn qi-btn-secondary" id="qi-cancel">Cancel</button>
            <button class="qi-btn qi-btn-primary" id="qi-submit">Add Info</button>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('qi-modal');
  }

  attachEventListeners() {
    const plusButton = document.getElementById('QI-plusButton');
    const closeButton = document.getElementById('qi-modal-close');
    const cancelButton = document.getElementById('qi-cancel');
    const submitButton = document.getElementById('qi-submit');
    const form = document.getElementById('qi-form');

    // Open modal
    if (plusButton) {
      plusButton.addEventListener('click', () => this.openModal());
    }

    // Close modal
    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeModal());
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.closeModal());
    }

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Handle form submission
    if (submitButton) {
      submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Handle Enter key in form
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  openModal() {
    // Scroll to top of page first to ensure modal appears centered
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;
    
    // Focus on first input
    setTimeout(() => {
      document.getElementById('qi-label').focus();
    }, 100);
  }

  closeModal() {
    this.modal.classList.remove('active');
    
    // Restore scroll position
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
    
    // Reset form
    document.getElementById('qi-form').reset();
  }

  handleSubmit() {
    const labelInput = document.getElementById('qi-label');
    const valueInput = document.getElementById('qi-value');

    const label = labelInput.value.trim();
    const value = valueInput.value.trim();

    if (!label || !value) {
      alert('Please fill in all fields');
      return;
    }

    // Add the info to Quick Info section
    this.addQuickInfo(label, value);

    // Close modal
    this.closeModal();
  }

  addQuickInfo(label, value) {
    // If the main module exposes an addQuickInfo function, use it so the
    // item is stored/persisted there (Firestore / app blob). Otherwise
    // fall back to local-only rendering.
    if (window && typeof window.addQuickInfo === 'function') {
      try {
        window.addQuickInfo(label, value);
        return;
      } catch (err) {
        console.warn('window.addQuickInfo failed, falling back to local UI:', err);
      }
    }

    const infoContent = document.getElementById('info-content');
    
    if (!infoContent) {
      console.error('Quick Info content area not found');
      return;
    }

    // Create new info row with editable elements (fallback)
    const infoRow = document.createElement('div');
    infoRow.className = 'info-row';
    const uniqueId = `qi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    infoRow.setAttribute('data-qi-id', uniqueId);
    
    infoRow.innerHTML = `
      <div class="flex-1">
        <span class="info-label qi-editable" data-type="label">${label}</span>
      </div>
      <div class="flex-1 text-right">
        <span class="info-value qi-editable" data-type="value">${value}</span>
      </div>
    `;

    // Append to content
    infoContent.appendChild(infoRow);

    // Optional: Show success notification
    this.showNotification('Info added successfully!');
  }

  addEditListeners(row, id, currentLabel, currentValue) {
    // Event listeners are now handled by event delegation in attachExistingRowListeners()
    // No need to attach individual listeners to each row
  }

  async handleEdit(element, type, id, currentLabel, currentValue) {
    const currentText = element.textContent.trim();
    const fieldName = type === 'label' ? 'Label' : 'Value';

    const newText = prompt(`Enter new ${fieldName.toLowerCase()}:`, currentText);

    if (!newText || newText.trim() === "" || newText === currentText) {
      return;
    }

    const trimmedNewText = newText.trim();

    // Validate input
    if (trimmedNewText.length < (type === 'label' ? 3 : 1)) {
      alert(`${fieldName} must be at least ${type === 'label' ? 3 : 1} characters`);
      return;
    }

    // Update the element in the UI
    element.textContent = trimmedNewText;

    // After editing, try to persist the change via the main module if available
    try {
      const row = element.closest('.info-row');
      const idAttr = row ? (row.getAttribute('data-qi-id') || row.dataset.qiId) : id;
      const newLabel = row ? (row.querySelector('.info-label')?.textContent.trim() || '') : (type === 'label' ? trimmedNewText : currentLabel);
      const newValue = row ? (row.querySelector('.info-value')?.textContent.trim() || '') : (type === 'value' ? trimmedNewText : currentValue);

      if (window && typeof window.updateQuickInfoItem === 'function') {
        await window.updateQuickInfoItem(idAttr, newLabel, newValue);
      }
    } catch (err) {
      console.warn('Failed to persist quick info edit:', err);
    }

    this.showNotification(`${fieldName} updated successfully!`);
  }

  async handleDelete(row, id, label, value) {
    if (!confirm(`Are you sure you want to delete "${label}: ${value}"?`)) {
      return;
    }

    // Try to delete from persistence first if available
    try {
      if (window && typeof window.deleteQuickInfoItem === 'function') {
        await window.deleteQuickInfoItem(id);
      }
    } catch (err) {
      console.warn('Failed to persist quick info delete:', err);
    }

    // Remove from UI
    row.remove();

    this.showNotification('Info deleted successfully!');
  }

  showNotification(message) {
    // Simple notification (you can enhance this)
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new QuickInfoModal();
  });
} else {
  new QuickInfoModal();
}
