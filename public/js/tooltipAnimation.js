// Add this to your main.js for JavaScript-based tooltip rotation
function initializeTooltipRotations() {
  const elements = [
    '.member-name',
    '.amount-display', 
    '.info-label.qi-editable',
    '.info-value.qi-editable',
    '.info-row[data-is-protected="true"] .info-value[data-protected="true"]'
  ];

  elements.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      let timeoutId;
      
      element.addEventListener('mouseenter', () => {
        const originalText = element.getAttribute('data-original-tooltip') || 
                           element.title || 
                           getDefaultTooltipText(selector);
        
        element.setAttribute('data-original-tooltip', originalText);
        element.title = originalText;
        
        timeoutId = setTimeout(() => {
          element.title = "Double-click to delete";
        }, 750); // Switch after 0.75 seconds
      });
      
      element.addEventListener('mouseleave', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        const originalText = element.getAttribute('data-original-tooltip');
        if (originalText) {
          element.title = originalText;
        }
      });
    });
  });
}

function getDefaultTooltipText(selector) {
  const tooltips = {
    '.member-name': 'Click to rename',
    '.amount-display': 'Click to edit amount',
    '.info-label.qi-editable': 'Click to edit',
    '.info-value.qi-editable': 'Click to edit',
    '.info-row[data-is-protected="true"] .info-value[data-protected="true"]': 'Click to edit default amount'
  };
  return tooltips[selector] || 'Click to edit';
}

// Call this after DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTooltipRotations);