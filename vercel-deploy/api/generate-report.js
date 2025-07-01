import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from "docx";

const ACTIVITIES = [
  "Zmiana pozycji ciała",
  "Przyjmowanie pozycji siedzącej i wstawanie",
  "Przemieszczanie się w obrębie domu",
  "Pokonywanie przeszkód (schody, krawężniki, nierówności terenu)",
  "Przemieszczanie się poza domem",
  "Korzystanie ze środków transportu indywidualnego lub zbiorowego",
  "Jedzenie",
  "Picie",
  "Ubieranie i rozbieranie się",
  "Mycie i wycieranie poszczególnych części ciała (twarz, ręce, intymne części ciała)",
  "Higiena jamy ustnej",
  "Kąpanie całego ciała",
  "Kontrolowanie zwieraczy – oddawanie moczu",
  "Kontrolowanie zwieraczy – oddawanie stolca",
  "Korzystanie z toalety lub zmiana środków absorpcyjnych",
  "Dbanie o zdrowie (stosowanie leków, przestrzeganie diety, wykonywanie ćwiczeń ruchowych)",
  "Komunikowanie swoich potrzeb",
  "Komunikowanie się z innymi osobami",
  "Robienie zakupów",
  "Przygotowanie posiłków (w tym obsługa sprzętu gospodarstwa domowego)",
  "Wykonywanie prac domowych (sprzątanie, pranie, prasowanie)",
  "Zarządzanie gospodarstwem domowym oraz codziennymi czynnościami (planowanie)",
  "Zarządzanie pieniędzmi",
  "Załatwianie spraw urzędowych",
  "Podejmowanie decyzji",
  "Unikanie zagrożeń (rozpoznawanie i reagowanie na zagrożenia)",
  "Kontrolowanie zachowania (samokontrola w sytuacjach emocjonalnie trudnych)",
  "Podejmowanie złożonych działań (rozwiązywanie złożonych problemów)",
  "Wchodzenie w interakcje międzyludzkie",
  "Nawiązywanie i utrzymywanie relacji społecznych",
  "Organizacja czasu wolnego (rekreacja, wypoczynek, zainteresowania)",
  "Korzystanie z placówek i usług"
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { activities, finalScore } = req.body;

    // Create rows for all 32 activities
    const allRows = [];
    
    // Header row
    allRows.push(
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Nr", bold: true })] })],
            width: { size: 5, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Nazwa czynności", bold: true })] })],
            width: { size: 35, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Stopień niepełnosprawności", bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Rodzaj wsparcia", bold: true })] })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Częstotliwość", bold: true })] })],
            width: { size: 15, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Punkty", bold: true })] })],
            width: { size: 10, type: WidthType.PERCENTAGE }
          }),
        ],
      })
    );

    // Data rows - always 32 rows
    for (let i = 0; i < 32; i++) {
      const activity = activities.find(a => a.activityIndex === i);
      const hasAssessment = activity && activity.assessments && activity.assessments.length > 0 && 
                           activity.assessments.some(a => a.disabilityType && a.supportLevel && a.frequency);
      
      let disabilityText = "Brak";
      let supportText = "Brak";
      let frequencyText = "Brak";
      let pointsText = "Brak";
      
      if (hasAssessment) {
        const validAssessments = activity.assessments.filter(a => a.disabilityType && a.supportLevel && a.frequency);
        if (validAssessments.length > 0) {
          disabilityText = validAssessments.map(a => a.disabilityType).filter(Boolean).join(", ");
          const maxAssessment = validAssessments.reduce((max, curr) => 
            (curr.points > max.points) ? curr : max
          );
          supportText = maxAssessment.supportLevel?.code || "Brak";
          frequencyText = maxAssessment.frequency?.code || "Brak";
          pointsText = activity.maxPoints > 0 ? activity.maxPoints.toString() : "0";
        }
      }

      allRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: (i + 1).toString() })],
            }),
            new TableCell({
              children: [new Paragraph({ text: ACTIVITIES[i] })],
            }),
            new TableCell({
              children: [new Paragraph({ text: disabilityText })],
            }),
            new TableCell({
              children: [new Paragraph({ text: supportText })],
            }),
            new TableCell({
              children: [new Paragraph({ text: frequencyText })],
            }),
            new TableCell({
              children: [new Paragraph({ text: pointsText })],
            }),
          ],
        })
      );
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "FORMULARZ W ZAKRESIE USTALANIA POZIOMU POTRZEBY WSPARCIA",
                bold: true,
                font: "Times New Roman",
                size: 24,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "dla osób zaliczonych do stopnia niepełnosprawności",
                bold: true,
                font: "Times New Roman",
                size: 20,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 300 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Na podstawie rozporządzenia Ministra Rodziny i Polityki Społecznej z dnia 23 listopada 2023 r. (Dz.U. z 2023 r. poz. 2581), ustalam, że opiniowany wymaga wsparcia na poziomie ${finalScore} pkt przez okres 7 lat.`,
                font: "Times New Roman",
                size: 24,
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 200, after: 200 }
          }),

          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: allRows,
          }),

          // Legend
          new Paragraph({
            children: [
              new TextRun({
                text: "LEGENDA:",
                bold: true,
                font: "Times New Roman",
                size: 20,
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 200, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Zdolność samodzielnego wykonania: TAK - osoba wykonuje samodzielnie, NIE - osoba wymaga wsparcia",
                font: "Times New Roman",
                size: 16,
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 50, after: 50 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Rodzaj wsparcia: WT - wsparcie towarzyszące, WC - wsparcie częściowe, WP - wsparcie pełne, WS - wsparcie szczególne",
                font: "Times New Roman",
                size: 16,
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 50, after: 50 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Częstotliwość wsparcia: A - zawsze, B - bardzo często, C - często, D - czasami",
                font: "Times New Roman",
                size: 16,
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 50, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Poziom potrzeby wsparcia: ${finalScore} pkt`,
                bold: true,
                font: "Times New Roman",
                size: 24,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "(na podstawie rozporządzenia Ministra Rodziny i Polityki Społecznej z dnia 23 listopada 2023 r., Dz.U. z 2023 r. poz. 2581)",
                font: "Times New Roman",
                size: 18,
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 200 }
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=raport-potrzeby-wsparcia.docx');
    res.send(buffer);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}