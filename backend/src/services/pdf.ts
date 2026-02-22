import { jsPDF } from 'jspdf';

interface DayDetail {
  date: string;
  state: string;
  comment: string | null;
}

interface PdfData {
  month: string;
  clientName: string;
  companyName: string;
  userName: string;
  workedDays: number;
  absentDays: number;
  monthlyComment: string | null;
  dayDetails: DayDetail[];
  validatedAt: string;
  validatorName?: string;
}

export function generateCraPdf(data: PdfData): string {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("Compte-Rendu d'Activité", pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(data.month.charAt(0).toUpperCase() + data.month.slice(1), pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Société :', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyName, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Client :', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, 50, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Consultant :', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.userName, 50, yPos);

  yPos += 15;
  doc.setDrawColor(100, 100, 100);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'FD');

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Jours travaillés : ${data.workedDays}`, 30, yPos);
  doc.text(`Jours d'absence : ${data.absentDays}`, pageWidth / 2 + 10, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Total : ${data.workedDays + data.absentDays} jours`, 30, yPos);

  if (data.monthlyComment) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Commentaire mensuel :', 20, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.monthlyComment, pageWidth - 40);
    doc.text(lines, 20, yPos);
    yPos += lines.length * 5;
  }

  if (data.dayDetails.length > 0) {
    yPos += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Détail des jours :', 20, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setFillColor(230, 230, 230);
    doc.rect(20, yPos - 4, pageWidth - 40, 8, 'F');
    doc.text('Date', 25, yPos);
    doc.text('Statut', 70, yPos);
    doc.text('Commentaire', 100, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');

    for (const day of data.dayDetails) {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const dateFormatted = new Date(day.date).toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short',
      });
      doc.text(dateFormatted, 25, yPos);
      doc.text(day.state === 'worked' ? 'Travaillé' : 'Absent', 70, yPos);
      if (day.comment) {
        const cLines = doc.splitTextToSize(day.comment, 85);
        doc.text(cLines, 100, yPos);
        yPos += Math.max(6, cLines.length * 4);
      } else {
        yPos += 6;
      }
    }
  }

  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, pageWidth - 20, footerY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const validationLine = data.validatorName
    ? `Document validé par ${data.validatorName} le ${data.validatedAt}`
    : `Document validé le ${data.validatedAt}`;
  doc.text(validationLine, pageWidth / 2, footerY + 8, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Ce document a été généré automatiquement par Wavy Services', pageWidth / 2, footerY + 13, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}
