// ====================
// PDF Export Utility
// ====================

import { showNotification } from './notificationEngine.js';

/**
 * Export search results to PDF in landscape mode
 * @param {Object} searchData - The search data object containing tab info and decoded data
 * @param {string} searchValue - The UID that was searched
 */
export async function exportSearchResultsToPDF(searchData, searchValue) {
  if (!searchData || !searchValue) {
    showNotification('No data available to export', 'error');
    return;
  }

  try {
    // Load jsPDF library dynamically
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load jsPDF library'));
      });
    }
    
    const { jsPDF } = window.jspdf;
    
    const { tabName, decodedData, docId } = searchData;
    const { members = [], payments = [], quickInfo = [], tabDefaultAmounts = {} } = decodedData;
    
    // Get default amount for this tab
    const tabDefaultAmount = tabDefaultAmounts[docId] || 1;
    
    // Calculate summary statistics
    const totalRequired = members.reduce((sum, member) => {
      const requiredAmount = member.requiredAmount || tabDefaultAmount;
      return sum + requiredAmount;
    }, 0);
    
    const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalOutstanding = Math.max(0, totalRequired - totalCollected);
    const completionPercentage = totalRequired > 0 ? Math.round((totalCollected / totalRequired) * 100) : 0;
    
    // Create PDF in landscape mode
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Page dimensions for landscape A4
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;
    
    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };
    
    // Header Section
    doc.setFillColor(29, 78, 216); // Blue header
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('GPTracker - Payment Search Results', margin, 12);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, 19);
    
    yPosition = 35;
    
    // Tab Information Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Tab Information', margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Tab Name: ${tabName || 'Untitled Tab'}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Search UID: ${searchValue}`, margin, yPosition);
    yPosition += 10;
    
    // Summary Cards Section
    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Summary', margin, yPosition);
    yPosition += 8;
    
    // Draw summary cards in a row
    const cardWidth = (contentWidth - 15) / 4;
    const cardHeight = 20;
    let xPos = margin;
    
    const summaryData = [
      { label: 'Total Required', value: `PHP ${totalRequired.toLocaleString()}`, color: [59, 130, 246] },
      { label: 'Total Collected', value: `PHP ${totalCollected.toLocaleString()}`, color: [34, 197, 94] },
      { label: 'Outstanding', value: `PHP ${totalOutstanding.toLocaleString()}`, color: [239, 68, 68] },
      { label: 'Completion', value: `${completionPercentage}%`, color: completionPercentage >= 100 ? [34, 197, 94] : [234, 179, 8] }
    ];
    
    summaryData.forEach((item, index) => {
      // Card background
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(xPos, yPosition, cardWidth, cardHeight, 2, 2, 'F');
      
      // Card border
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(xPos, yPosition, cardWidth, cardHeight, 2, 2, 'S');
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(item.label, xPos + cardWidth / 2, yPosition + 7, { align: 'center' });
      
      // Value
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text(item.value, xPos + cardWidth / 2, yPosition + 15, { align: 'center' });
      
      xPos += cardWidth + 5;
    });
    
    yPosition += cardHeight + 12;
    
    // Member Progress Section
    if (members.length > 0) {
      checkPageBreak(40);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Member Progress (${members.length} members)`, margin, yPosition);
      yPosition += 8;
      
      // Table header
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(55, 65, 81);
      
      const colWidths = [80, 35, 35, 35, 30, 30, 30];
      const headers = ['Member Name', 'Required', 'Paid', 'Remaining', 'Status', 'Progress', 'Payments'];
      let tableX = margin + 2;
      
      headers.forEach((header, i) => {
        doc.text(header, tableX, yPosition + 5.5);
        tableX += colWidths[i];
      });
      
      yPosition += 8;
      
      // Table rows
      doc.setFont(undefined, 'normal');
      members.forEach((member, index) => {
        checkPageBreak(8);
        
        const memberPayments = payments.filter(p => p.name === member.Name);
        const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);
        const requiredAmount = member.requiredAmount || tabDefaultAmount;
        const progress = requiredAmount > 0 ? Math.min((totalPaid / requiredAmount) * 100, 100) : 0;
        const isPaid = totalPaid >= requiredAmount;
        const amountRemaining = Math.max(0, requiredAmount - totalPaid);
        const status = isPaid ? 'Paid' : progress > 0 ? 'Partial' : 'Pending';
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPosition, contentWidth, 7, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        tableX = margin + 2;
        
        const rowData = [
          member.Name,
          `PHP ${requiredAmount.toLocaleString()}`,
          `PHP ${totalPaid.toLocaleString()}`,
          `PHP ${amountRemaining.toLocaleString()}`,
          status,
          `${Math.round(progress)}%`,
          memberPayments.length.toString()
        ];
        
        rowData.forEach((data, i) => {
          // Truncate long names
          let displayText = data;
          if (i === 0 && data.length > 30) {
            displayText = data.substring(0, 27) + '...';
          }
          doc.text(displayText, tableX, yPosition + 5);
          tableX += colWidths[i];
        });
        
        yPosition += 7;
      });
      
      yPosition += 8;
    }
    
    // Payment History Section
    if (payments.length > 0) {
      checkPageBreak(40);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Payment History (${payments.length} records)`, margin, yPosition);
      yPosition += 8;
      
      // Table header
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(55, 65, 81);
      
      const paymentColWidths = [100, 50, 60, 50];
      const paymentHeaders = ['Member Name', 'Amount', 'Date', 'Time'];
      let paymentTableX = margin + 2;
      
      paymentHeaders.forEach((header, i) => {
        doc.text(header, paymentTableX, yPosition + 5.5);
        paymentTableX += paymentColWidths[i];
      });
      
      yPosition += 8;
      
      // Table rows - show last 20 payments to avoid too many pages
      doc.setFont(undefined, 'normal');
      const displayPayments = payments.slice(-20);
      
      displayPayments.forEach((payment, index) => {
        checkPageBreak(8);
        
        const date = new Date(payment.timestamp);
        
        // Alternating row colors
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPosition, contentWidth, 7, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        paymentTableX = margin + 2;
        
        const paymentRowData = [
          payment.name.length > 35 ? payment.name.substring(0, 32) + '...' : payment.name,
          `PHP ${payment.amount.toLocaleString()}`,
          date.toLocaleDateString(),
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        ];
        
        paymentRowData.forEach((data, i) => {
          doc.text(data, paymentTableX, yPosition + 5);
          paymentTableX += paymentColWidths[i];
        });
        
        yPosition += 7;
      });
      
      if (payments.length > 20) {
        yPosition += 3;
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(`Showing last 20 of ${payments.length} payments`, margin, yPosition);
      }
      
      yPosition += 8;
    }
    
    // Additional Information Section
    if (quickInfo && quickInfo.length > 0) {
      const validInfo = quickInfo.filter(info => info.label && info.value);
      
      if (validInfo.length > 0) {
        checkPageBreak(30);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Additional Information', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        validInfo.forEach(info => {
          checkPageBreak(8);
          
          doc.setFont(undefined, 'bold');
          doc.text(`${info.label}:`, margin, yPosition);
          doc.setFont(undefined, 'normal');
          doc.text(info.value, margin + 60, yPosition);
          yPosition += 6;
        });
      }
    }
    
    // Footer on all pages with legal disclaimer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Page number and branding
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Page ${i} of ${pageCount}`,
        margin,
        pageHeight - 8
      );
      
      // Legal disclaimer and copyright
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      const legalText = 'This document is for informational purposes only. Data accuracy is the responsibility of the tab creator.';
      doc.text(legalText, pageWidth / 2, pageHeight - 12, { align: 'center' });
      
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      const copyrightText = `© ${new Date().getFullYear()} GPTracker - Group Payment Tracker. All Rights Reserved. | Read-Only Export`;
      doc.text(copyrightText, pageWidth / 2, pageHeight - 8, { align: 'center' });
      
      // Export compliance notice
      doc.setFontSize(6);
      doc.setTextColor(156, 163, 175);
      const complianceText = 'Exported data subject to Terms of Service. Unauthorized distribution or modification prohibited.';
      doc.text(complianceText, pageWidth / 2, pageHeight - 4, { align: 'center' });
    }
    
    // Generate filename and save
    const sanitizedTabName = (tabName || 'Untitled').replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `GPTracker_${sanitizedTabName}_${searchValue}_${timestamp}.pdf`;
    
    doc.save(filename);
    
    showNotification('PDF exported successfully!', 'success');
  } catch (error) {
    console.error('PDF export error:', error);
    showNotification('Failed to export PDF. Please try again.', 'error');
  }
}
