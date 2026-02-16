/**
 * PDF Export Service for FinTrack Cloud
 * Uses jsPDF and AutoTable to generate professional bank-statement style reports.
 */

export async function exportTransactionsToPDF(transactions, dateRange, userInfo) {
    // initialize jsPDF (Lazy load from window)
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // ==========================================
    // 1. BRANDING HERO
    // ==========================================
    // Header Background
    doc.setFillColor(102, 126, 234); // Royal Blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo / Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FinTrack Cloud", 15, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Personal Financial Statement", 15, 28);

    // Export Details (Right Aligned in Header)
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 20, { align: 'right' });
    doc.text(`User: ${userInfo.email}`, pageWidth - 15, 28, { align: 'right' });

    // ==========================================
    // 2. SUMMARY SECTION
    // ==========================================
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        if (t.amount < 0) totalIncome += Math.abs(t.amount);
        else totalExpense += t.amount;
    });

    const netBalance = totalIncome - totalExpense;

    const startY = 45; // Start below header

    // Draw Summary Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250); // Light Grey
    doc.roundedRect(15, startY, pageWidth - 30, 25, 3, 3, 'FD');

    // Summary Title
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text("PERIOD SUMMARY", 20, startY + 8);

    // Values Row
    const thirdWidth = (pageWidth - 30) / 3;

    // Income
    doc.setTextColor(16, 185, 129); // Green
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`+ Rs.${totalIncome.toFixed(2)}`, 20, startY + 18);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Total Income", 20, startY + 23);

    // Expense
    doc.setTextColor(239, 68, 68); // Red
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`- Rs.${totalExpense.toFixed(2)}`, 20 + thirdWidth, startY + 18);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Total Expense", 20 + thirdWidth, startY + 23);

    // Net Balance
    const balanceColor = netBalance >= 0 ? [102, 126, 234] : [239, 68, 68];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs.${netBalance.toFixed(2)}`, 20 + (thirdWidth * 2), startY + 18);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Net Balance", 20 + (thirdWidth * 2), startY + 23);

    // ==========================================
    // 3. TRANSACTION TABLE
    // ==========================================

    // Format data for AutoTable
    const tableData = transactions.map(t => [
        t.date.toDate().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }),
        t.description || '-',
        t.category,
        t.payment_source,
        t.amount < 0 ? `+ ${Math.abs(t.amount).toFixed(2)}` : `- ${t.amount.toFixed(2)}`
    ]);

    doc.autoTable({
        startY: startY + 35,
        head: [['Date', 'Description', 'Category', 'Method', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [102, 126, 234], // Primary Blue
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 30 }, // Date
            1: { cellWidth: 'auto' }, // Desc
            2: { cellWidth: 30 }, // Cat
            3: { cellWidth: 30 }, // Method
            4: { cellWidth: 30, halign: 'right' } // Amount
        },
        alternateRowStyles: {
            fillColor: [245, 247, 255]
        },
        // Custom styling for Amount column (Color coding)
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 4) {
                const rawVal = tableData[data.row.index][4];
                if (rawVal.includes('+')) {
                    data.cell.styles.textColor = [16, 185, 129]; // Green
                } else {
                    data.cell.styles.textColor = [239, 68, 68]; // Red
                }
            }
        }
    });

    // ==========================================
    // 4. FOOTER
    // ==========================================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - FinTrack Cloud`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Save File
    const fileName = `FinTrack_Statement_${dateRange}.pdf`;
    doc.save(fileName);
}
