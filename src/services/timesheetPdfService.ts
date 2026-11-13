import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMsToHHMM } from "@/utils/formatMsToHHMM";
import type { Point } from "@/db/schema";

interface TimesheetPdfOptions {
  startDate: Date;
  endDate: Date;
  groupedPoints: [string, Point[]][];
  totalMilliseconds: number;
  hourlyRate?: number;
  totalAReceber?: number;
}

export async function generateAndShareTimesheetPdf({
  startDate,
  endDate,
  groupedPoints,
  totalMilliseconds,
  hourlyRate = 0,
  totalAReceber,
}: TimesheetPdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  // 1. Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 27, 75); // Indigo escuro
  doc.text("FOLHA DE REGISTRO DE PONTO", marginX, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Período: ${format(startDate, "dd/MM/yyyy")} a ${format(endDate, "dd/MM/yyyy")}`,
    marginX,
    22,
  );

  const emissaoText = `Emissão: ${format(new Date(), "dd/MM/yyyy HH:mm")}`;
  doc.text(emissaoText, pageWidth - marginX - doc.getTextWidth(emissaoText), 22);

  // 2. Resumo das Métricas
  const summaryY = 27;
  const summaryHeight = 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, summaryY, pageWidth - marginX * 2, summaryHeight, 2, 2, "FD");

  const colWidth = (pageWidth - marginX * 2) / (hourlyRate > 0 ? 3 : 2);

  // Métrica 1: Total Horas
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL DE HORAS", marginX + 6, summaryY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    totalMilliseconds ? formatMsToHHMM(totalMilliseconds) : "00:00",
    marginX + 6,
    summaryY + 12,
  );

  // Métrica 2: Dias Trabalhados
  const col2X = marginX + colWidth;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("DIAS TRABALHADOS", col2X + 6, summaryY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${groupedPoints.length} dias`, col2X + 6, summaryY + 12);

  // Métrica 3: Valor Estimado (se houver taxa horária)
  if (hourlyRate > 0 && totalAReceber !== undefined) {
    const col3X = marginX + colWidth * 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL ESTIMADO", col3X + 6, summaryY + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(21, 128, 61); // Emerald
    const formattedValor = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(totalAReceber);
    doc.text(formattedValor, col3X + 6, summaryY + 12);
  }

  // 3. Tabela de Registros
  const tableRows = groupedPoints.map(([dayKey, dayPoints]) => {
    const dayDate = new Date(`${dayKey}T00:00:00`);
    const sorted = [...dayPoints].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    let dayMs = 0;
    for (let i = 0; i < sorted.length - 1; i += 2) {
      dayMs += new Date(sorted[i + 1].timestamp).getTime() - new Date(sorted[i].timestamp).getTime();
    }

    const batidasStr = sorted
      .map(
        (p, idx) =>
          `${format(new Date(p.timestamp), "HH:mm")} (${idx % 2 === 0 ? "E" : "S"})`,
      )
      .join("   |   ");

    return [
      format(dayDate, "dd/MM/yyyy"),
      format(dayDate, "EEEE", { locale: ptBR }),
      batidasStr || "--",
      dayMs > 0 ? formatMsToHHMM(dayMs) : "--",
    ];
  });

  autoTable(doc, {
    startY: summaryY + summaryHeight + 5,
    margin: { left: marginX, right: marginX, bottom: 25 },
    head: [["Data", "Dia da Semana", "Batidas Registradas", "Total"]],
    body: tableRows.length > 0 ? tableRows : [["--", "--", "Nenhum ponto registrado", "--"]],
    theme: "grid",
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: "bold" },
      1: { cellWidth: 32 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 20, halign: "right", fontStyle: "bold" },
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      textColor: [30, 41, 59],
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      // Rodapé de cada página
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      const footerText = `Página ${data.pageNumber} • Auto Point`;
      doc.text(footerText, marginX, pageHeight - 10);

      // Linha de assinatura na última página
      if (data.pageNumber === doc.getNumberOfPages()) {
        const signY = pageHeight - 16;
        const lineLen = 65;
        const signX = pageWidth - marginX - lineLen;
        doc.setDrawColor(148, 163, 184);
        doc.line(signX, signY, signX + lineLen, signY);
        doc.text("Assinatura do Colaborador", signX + 10, signY + 4);
      }
    },
  });

  // 4. Compartilhar via Web Share API (Nativo no iPhone / PWA) ou Download Direto
  const pdfBlob = doc.output("blob");
  const fileName = `folha-ponto-${format(startDate, "yyyy-MM-dd")}_a_${format(endDate, "yyyy-MM-dd")}.pdf`;
  const file = new File([pdfBlob], fileName, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Folha de Registro de Ponto",
      });
      return;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.warn("Compartilhamento nativo cancelado ou indisponível:", error);
    }
  }

  // Fallback: Download do arquivo
  const blobUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
