// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  reports;
  currentUserId;
  currentReportId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.reports = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createReport(insertReport) {
    const id = this.currentReportId++;
    const report = { ...insertReport, id };
    this.reports.set(id, report);
    return report;
  }
  async getReports() {
    return Array.from(this.reports.values());
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var assessmentReports = pgTable("assessment_reports", {
  id: serial("id").primaryKey(),
  assessmentData: jsonb("assessment_data").notNull(),
  finalScore: integer("final_score").notNull(),
  createdAt: text("created_at").notNull()
});
var disabilityTypeSchema = z.enum(["Fizyczna", "Psychiczna", "Intelektualna", "Sensoryczna"]).or(z.literal(""));
var supportLevelSchema = z.object({
  value: z.number(),
  label: z.string()
});
var frequencySchema = z.object({
  value: z.number(),
  label: z.string()
});
var assessmentSchema = z.object({
  id: z.string(),
  disabilityType: disabilityTypeSchema,
  supportLevel: supportLevelSchema,
  frequency: frequencySchema,
  points: z.number()
});
var activityAssessmentSchema = z.object({
  activityIndex: z.number(),
  activityName: z.string(),
  assessments: z.array(assessmentSchema),
  maxPoints: z.number()
});
var reportRequestSchema = z.object({
  activities: z.array(activityAssessmentSchema),
  finalScore: z.number()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertReportSchema = createInsertSchema(assessmentReports).pick({
  assessmentData: true,
  finalScore: true,
  createdAt: true
});

// server/routes.ts
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";

// client/src/lib/activities.ts
var ACTIVITIES = [
  "Zmiana pozycji cia\u0142a",
  "Poruszanie si\u0119 w znanym \u015Brodowisku",
  "Poruszanie si\u0119 w nieznanym \u015Brodowisku",
  "Si\u0119ganie, chwytanie i manipulowanie przedmiotami",
  "Przemieszczanie si\u0119 \u015Brodkami transportu",
  "Klasyfikacja docieraj\u0105cych bod\u017Ac\xF3w",
  "Przekazywanie informacji innym osobom",
  "Prowadzenie rozmowy",
  "Opanowanie nowej umiej\u0119tno\u015Bci praktycznej",
  "Koncentrowanie si\u0119 na czynno\u015Bci",
  "Korzystanie z urz\u0105dze\u0144 informacyjno-komunikacyjnych",
  "Mycie i osuszanie ca\u0142ego cia\u0142a",
  "Mycie i osuszanie r\u0105k i twarzy",
  "Piel\u0119gnowanie poszczeg\xF3lnych cz\u0119\u015Bci cia\u0142a",
  "Troska o w\u0142asne zdrowie",
  "Korzystanie z toalety",
  "Ubieranie si\u0119",
  "Jedzenie i picie",
  "Stosowanie zalecanych \u015Brodk\xF3w terapeutycznych",
  "Realizowanie wybor\xF3w i decyzji",
  "Pozostawanie w domu samemu",
  "Nawi\u0105zywanie kontakt\xF3w",
  "Kontrolowanie w\u0142asnych zachowa\u0144 i emocji",
  "Utrzymywanie kontakt\xF3w z bliskimi",
  "Tworzenie bliskich relacji",
  "Kupowanie produkt\xF3w",
  "Przygotowywanie posi\u0142k\xF3w",
  "Dbanie o dom, ubranie i obuwie",
  "Dokonywanie transakcji finansowych",
  "Rekreacja i organizacja czasu wolnego",
  "Za\u0142atwianie spraw urz\u0119dowych",
  "Realizowanie codziennego harmonogramu"
];
var SUPPORT_LEVELS = [
  { value: 0, label: "Nie wybrano", code: "" },
  { value: 0.8, label: "Towarzysz\u0105ce (0.8)", code: "WT" },
  { value: 0.9, label: "Cz\u0119\u015Bciowe (0.9)", code: "WC" },
  { value: 0.99, label: "Pe\u0142ne (0.99)", code: "WP" },
  { value: 1, label: "Szczeg\xF3lne (1.0)", code: "WS" }
];
var FREQUENCIES = [
  { value: 0, label: "Nie wybrano", code: "" },
  { value: 0.5, label: "Czasami (0.5)", code: "D" },
  { value: 0.75, label: "Cz\u0119sto (0.75)", code: "C" },
  { value: 0.95, label: "Bardzo cz\u0119sto (0.95)", code: "B" },
  { value: 1, label: "Zawsze (1.0)", code: "A" }
];

// client/src/lib/activity-descriptions.ts
var ACTIVITY_DESCRIPTIONS = [
  "Ocenie podlega zdolno\u015B\u0107 osoby do dokonywania dowolnej zmiany pozycji swojego cia\u0142a w przestrzeni, w tym zdolno\u015Bci do przyjmowania i powrotu do pozycji stoj\u0105cej, siedz\u0105cej lub le\u017C\u0105cej oraz przyjmowania, i powrotu do, spoczynkowej pozycji cia\u0142a.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do chodzenia i poruszania si\u0119 w obr\u0119bie mieszkania lub domu, z uwzgl\u0119dnieniem wchodzenia i schodzenia ze schod\xF3w, docierania do wszystkich pomieszcze\u0144 w zamieszkiwanym mieszkaniu lub domu oraz poruszania si\u0119 w bezpo\u015Brednim otoczeniu mieszkania lub domu.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do poruszania si\u0119 w mieszkaniu lub domu innej osoby, budynkach u\u017Cyteczno\u015Bci publicznej i na zewn\u0105trz tych budynk\xF3w oraz zdolno\u015Bci do pokonywania barier architektonicznych i omijania przeszk\xF3d zlokalizowanych w nieznanym jej \u015Brodowisku.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do precyzyjnego u\u017Cywania r\u0119ki, w tym do chwytania, manipulowania, wypuszczania i odstawiania przedmiot\xF3w na miejsce w domu i poza nim, wykonywania precyzyjnych ruch\xF3w palcami r\u0105k oraz zdolno\u015Bci do omijania przeszk\xF3d podczas wykonywania tych czynno\u015Bci.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do przemieszczania si\u0119 r\xF3\u017Cnymi \u015Brodkami transportu jako pasa\u017Cer podczas przejazdu samochodem oraz korzystania ze \u015Brodk\xF3w transportu publicznego, takich jak w szczeg\xF3lno\u015Bci taks\xF3wka, autobus, poci\u0105g, samolot, w tym r\xF3wnie\u017C podczas du\u017Cego nat\u0119\u017Cenia ruchu.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do rozumienia znaczenia bod\u017Ac\xF3w, komunikat\xF3w oraz informacji docieraj\u0105cych do tej osoby r\xF3\u017Cnymi kana\u0142ami komunikacji, na przyk\u0142ad przez przekaz m\xF3wiony, pisany lub gesty, zdolno\u015Bci do identyfikacji \u017Ar\xF3d\u0142a docieraj\u0105cego bod\u017Aca oraz oceny bod\u017Aca pod wzgl\u0119dem jego bezpiecze\u0144stwa dla osoby.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do logicznego, zwi\u0119z\u0142ego i zrozumia\u0142ego przekazania innym osobom posiadanych informacji za pomoc\u0105 dowolnego kana\u0142u komunikacji, w szczeg\xF3lno\u015Bci przez mow\u0119, gesty lub pismo, w tym r\xF3wnie\u017C informacji dotycz\u0105cych w\u0142asnych potrzeb, dolegliwo\u015Bci lub samopoczucia.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do inicjowania, kontynuowania i zako\u0144czenia rozmowy lub wymiany informacji z jedn\u0105 osob\u0105 oraz z wi\u0119cej ni\u017C jedn\u0105 osob\u0105, w tym zdolno\u015Bci do wprowadzania nowych temat\xF3w i pogl\u0105d\xF3w lub nawi\u0105zywania do temat\xF3w poruszanych przez innych, za pomoc\u0105 powszechnie obowi\u0105zuj\u0105cego w spo\u0142ecze\u0144stwie sposobu komunikacji.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do opanowania, podj\u0119cia i przeprowadzenia do ko\u0144ca nieposiadanej wcze\u015Bniej, nowej umiej\u0119tno\u015Bci praktycznej, zwi\u0105zanej z codziennym funkcjonowaniem lub opanowania nowego zachowania.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do celowego skupienia uwagi na wykonywaniu okre\u015Blonej czynno\u015Bci, skierowania uwagi na okre\u015Blony bodziec i utrzymywania jej w czasie, w tym r\xF3wnie\u017C zdolno\u015Bci do przerzutno\u015Bci i podzielno\u015Bci uwagi.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do korzystania z technologii, wykorzystywanych do rozwi\u0105zywania problem\xF3w, u\u0142atwienia codziennego funkcjonowania, usprawnienia pracy albo edukacji oraz zwi\u0119kszenia wydajno\u015Bci i jako\u015Bci us\u0142ug, w tym w szczeg\xF3lno\u015Bci umiej\u0119tno\u015Bci korzystania z radia, telewizora, komputera, Internetu, telefonu kom\xF3rkowego.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do umycia ca\u0142ego cia\u0142a, z u\u017Cyciem wody i odpowiednich \u015Brodk\xF3w czyszcz\u0105cych, w szczeg\xF3lno\u015Bci myd\u0142a lub p\u0142ynu do k\u0105pieli oraz osuszenia ca\u0142ego cia\u0142a z u\u017Cyciem r\u0119cznika, w domu i poza domem.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do umycia r\u0105k i twarzy przy u\u017Cyciu wody oraz odpowiednich \u015Brodk\xF3w czyszcz\u0105cych, takich jak na przyk\u0142ad myd\u0142o lub \u017Cel do mycia twarzy oraz osuszeniu r\u0105k i twarzy z u\u017Cyciem r\u0119cznika w domu i poza domem.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do piel\u0119gnowania cz\u0119\u015Bci cia\u0142a, w szczeg\xF3lno\u015Bci sk\xF3ry cia\u0142a i g\u0142owy, z\u0119b\xF3w, paznokci d\u0142oni i st\xF3p, genitali\xF3w, kt\xF3re wymagaj\u0105 wi\u0119cej odpowiednich zabieg\xF3w piel\u0119gnacyjnych, innych ni\u017C mycie i suszenie.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do dbania o toalet\u0119, w tym w szczeg\xF3lno\u015Bci o higien\u0119 w zakresie oddawania moczu i stolca, z uwzgl\u0119dnieniem dbania o higien\u0119 podczas menstruacji u kobiet oraz utrzymywania czysto\u015Bci po wykonaniu tych czynno\u015Bci.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do ubierania i rozbierania si\u0119, zak\u0142adania i zdejmowania nakrycia g\u0142owy, obuwia, r\u0119kawiczek, okular\xF3w oraz innych akcesori\xF3w, w domu i poza domem.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do dbania o swoje zdrowie poprzez przestrzeganie zalece\u0144 lekarskich, w tym zalece\u0144 dotycz\u0105cych trybu \u017Cycia oraz przyjmowania lek\xF3w zgodnie z zaleceniem lekarskim, rozpoznawania objaw\xF3w choroby i w\u0142a\u015Bciwego reagowania na nie.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do unikania niebezpiecze\u0144stw i zagro\u017Ce\u0144 oraz unikania krzywdy podczas wykonywania r\xF3\u017Cnorodnych czynno\u015Bci w domu i poza nim.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do przygotowywania prostych posi\u0142k\xF3w, to jest takich, kt\xF3re nie wymagaj\u0105 gotowania, oraz posi\u0142k\xF3w, kt\xF3re wymagaj\u0105 gotowania, w tym zdolno\u015B\u0107 do planowania posi\u0142k\xF3w zgodnie z w\u0142a\u015Bciwymi zasadami \u017Cywienia.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do spo\u017Cywania pokarm\xF3w podanych w spos\xF3b kulturowo i spo\u0142ecznie przyj\u0119ty oraz do picia p\u0142yn\xF3w.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do planowania, organizowania i wykonywania czynno\u015Bci zwi\u0105zanych z bie\u017C\u0105cym sprz\u0105taniem miejsca zamieszkania, praniem oraz prasowaniem odzie\u017Cy i innych rzeczy.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do planowania i dokonywania zakup\xF3w towar\xF3w i us\u0142ug codziennego u\u017Cytku oraz do dokonywania p\u0142atno\u015Bci za towary i us\u0142ugi r\xF3\u017Cnymi sposobami.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do planowania, organizowania i nadzorowania prac zwi\u0105zanych z utrzymaniem miejsca zamieszkania oraz do korzystania z us\u0142ug innych os\xF3b.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do nawi\u0105zywania, utrzymywania i rozwijania wi\u0119zi z cz\u0142onkami rodziny, z uwzgl\u0119dnieniem wi\u0119zi partnerskich i wi\u0119zi mi\u0119dzy rodzicami a dzie\u0107mi.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do nawi\u0105zywania, utrzymywania i ko\u0144czenia kontakt\xF3w z innymi osobami w odpowiednim kontek\u015Bcie spo\u0142ecznym w spos\xF3b spo\u0142ecznie i kulturowo w\u0142a\u015Bciwy oraz zdolno\u015B\u0107 do utrzymywania odpowiedniego dystansu spo\u0142ecznego.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do zachowywania si\u0119 w spos\xF3b odpowiadaj\u0105cy oczekiwaniom i wymaganiom wyst\u0119puj\u0105cym w okre\u015Blonych sytuacjach spo\u0142ecznych oraz zdolno\u015B\u0107 do dostosowywania swojego zachowania do oczekiwa\u0144 spo\u0142ecznych.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do bycia odpowiedzialnym za w\u0142asne dzia\u0142ania oraz do rozumienia i stosowania si\u0119 do zasad spo\u0142ecznych dotycz\u0105cych zachowa\u0144 oraz zdolno\u015B\u0107 do kierowania w\u0142asnym zachowaniem.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do podejmowania decyzji dotycz\u0105cych codziennego \u017Cycia oraz zdolno\u015B\u0107 do planowania i realizowania swoich dzia\u0142a\u0144.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do radzenia sobie z obowi\u0105zkami, ze stresem zwi\u0105zanym z wykonywaniem zada\u0144 oraz z innymi obci\u0105\u017Ceniami psychicznymi, w tym zdolno\u015B\u0107 do radzenia sobie z niepowodzeniami i pora\u017Ckami.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do wykonywania pracy, w tym w szczeg\xF3lno\u015Bci do uzyskiwania, utrzymywania i ko\u0144czenia pracy zgodnie z wymogami tej pracy, a tak\u017Ce zdolno\u015B\u0107 do wsp\xF3\u0142pracy z innymi pracownikami oraz prze\u0142o\u017Conymi i do wykonywania pracy zgodnie z jej zakresem.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do uczestniczenia w \u017Cyciu spo\u0142eczno\u015Bci lokalnej oraz korzystania z us\u0142ug dost\u0119pnych w spo\u0142eczno\u015Bci lokalnej, w tym w szczeg\xF3lno\u015Bci us\u0142ug dost\u0119pnych w instytucjach publicznych i niepublicznych.",
  "Ocenie podlega zdolno\u015B\u0107 osoby do uczestniczenia w r\xF3\u017Cnego rodzaju formach rekreacji i wypoczynku, dost\u0119pnych w miejscu zamieszkania osoby oraz poza miejscem zamieszkania."
];

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/generate-report", async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const { activities, finalScore } = reportRequestSchema.parse(req.body);
      const getSupportCode = (value) => {
        if (value === 0) return "";
        const level = SUPPORT_LEVELS.find((l) => l.value === value);
        return level ? level.code : "";
      };
      const getFrequencyCode = (value) => {
        if (value === 0) return "";
        const freq = FREQUENCIES.find((f) => f.value === value);
        return freq ? freq.code : "";
      };
      const tableRows = [];
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Lp.", bold: true, size: 16 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 800, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Czynno\u015B\u0107 zwi\u0105zana z obszarami codziennego funkcjonowania", bold: true, size: 16 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 3e3, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Rodzaj niepe\u0142nosprawno\u015Bci", bold: true, size: 16 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 1500, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Zdolno\u015B\u0107 samodzielnego wykonania", bold: true, size: 16 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 1200, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Rodzaj wsparcia", bold: true, size: 16 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 1e3, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Cz\u0119stotliwo\u015B\u0107", bold: true, size: 16 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 1200, type: WidthType.DXA }
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: "Punkty", bold: true, size: 16 })],
                alignment: AlignmentType.CENTER
              })],
              width: { size: 1200, type: WidthType.DXA }
            })
          ]
        })
      );
      for (let i = 0; i < ACTIVITIES.length; i++) {
        const activity = activities.find((a) => a.activityName === ACTIVITIES[i]);
        const activityNumber = i + 1;
        const description = ACTIVITY_DESCRIPTIONS[i] || "";
        if (activity && activity.assessments.length > 0) {
          activity.assessments.forEach((assessment, assessmentIndex) => {
            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: assessmentIndex === 0 ? activityNumber.toString() : "", size: 16 })],
                      alignment: AlignmentType.CENTER
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: assessmentIndex === 0 ? ACTIVITIES[i] : "", size: 16 })],
                      alignment: AlignmentType.LEFT
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: assessment.disabilityType || "", size: 16 })],
                      alignment: AlignmentType.CENTER
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "NIE", size: 16 })],
                      alignment: AlignmentType.CENTER
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: getSupportCode(assessment.supportLevel.value), size: 16 })],
                      alignment: AlignmentType.CENTER
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: getFrequencyCode(assessment.frequency.value), size: 16 })],
                      alignment: AlignmentType.CENTER
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: assessment.points.toFixed(3), size: 16 })],
                      alignment: AlignmentType.CENTER
                    })]
                  })
                ]
              })
            );
          });
        } else {
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: activityNumber.toString(), size: 16 })],
                    alignment: AlignmentType.CENTER
                  })]
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: ACTIVITIES[i], size: 16 })],
                    alignment: AlignmentType.LEFT
                  })]
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "", size: 16 })],
                    alignment: AlignmentType.CENTER
                  })]
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "TAK", size: 16 })],
                    alignment: AlignmentType.CENTER
                  })]
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "", size: 16 })],
                    alignment: AlignmentType.CENTER
                  })]
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "", size: 16 })],
                    alignment: AlignmentType.CENTER
                  })]
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text: "0,000", size: 16 })],
                    alignment: AlignmentType.CENTER
                  })]
                })
              ]
            })
          );
        }
      }
      const doc = new Document({
        sections: [{
          children: [
            // Title at the top
            new Paragraph({
              children: [
                new TextRun({
                  text: "FORMULARZ W ZAKRESIE USTALANIA POZIOMU POTRZEBY WSPARCIA",
                  bold: true,
                  font: "Times New Roman",
                  size: 24
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "dla os\xF3b zaliczonych do stopnia niepe\u0142nosprawno\u015Bci",
                  bold: true,
                  font: "Times New Roman",
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 300 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Na podstawie rozporz\u0105dzenia Ministra Rodziny i Polityki Spo\u0142ecznej z dnia 23 listopada 2023 r. (Dz.U. z 2023 r. poz. 2581), ustalam, \u017Ce opiniowany wymaga wsparcia na poziomie ${finalScore} pkt przez okres 7 lat.`,
                  font: "Times New Roman",
                  size: 24
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Powy\u017Csze orzeczenie jest niezgodne z opini\u0105 Wojew\xF3dzkiego Zespo\u0142u do Spraw Orzekania o Niepe\u0142nosprawno\u015Bci z dnia \u2026\u2026\u2026\u2026\u2026\u2026.",
                  font: "Times New Roman",
                  size: 24
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Poni\u017Cej przedstawiam dokonany przeze mnie szczeg\xF3\u0142owy raport potrzeby wsparcia:",
                  bold: true,
                  font: "Times New Roman",
                  size: 24
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { before: 200, after: 300 }
            }),
            // TABLE - MAIN CONTENT - 7 COLUMNS
            new Table({
              rows: tableRows,
              width: { size: 9800, type: WidthType.DXA },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" }
              }
            }),
            // Legend after table
            new Paragraph({
              children: [
                new TextRun({
                  text: "LEGENDA:",
                  bold: true,
                  font: "Times New Roman",
                  size: 18
                })
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Zdolno\u015B\u0107 samodzielnego wykonania: TAK - osoba wykonuje samodzielnie, NIE - osoba wymaga wsparcia",
                  font: "Times New Roman",
                  size: 16
                })
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 50, after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Rodzaj wsparcia: WT - wsparcie towarzysz\u0105ce, WC - wsparcie cz\u0119\u015Bciowe, WP - wsparcie pe\u0142ne, WS - wsparcie szczeg\xF3lne",
                  font: "Times New Roman",
                  size: 16
                })
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 50, after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Cz\u0119stotliwo\u015B\u0107 wsparcia: A - zawsze, B - bardzo cz\u0119sto, C - cz\u0119sto, D - czasami",
                  font: "Times New Roman",
                  size: 16
                })
              ],
              alignment: AlignmentType.LEFT,
              spacing: { before: 50, after: 100 }
            }),
            // Final score
            new Paragraph({
              children: [
                new TextRun({
                  text: `Poziom potrzeby wsparcia: ${finalScore} pkt`,
                  bold: true,
                  font: "Times New Roman",
                  size: 24
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "(na podstawie rozporz\u0105dzenia Ministra Rodziny i Polityki Spo\u0142ecznej z dnia 23 listopada 2023 r., Dz.U. z 2023 r. poz. 2581)",
                  font: "Times New Roman",
                  size: 18
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 200 }
            })
          ]
        }]
      });
      await storage.createReport({
        assessmentData: { activities, finalScore },
        finalScore,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const buffer = await Packer.toBuffer(doc);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", 'attachment; filename="raport-potrzeby-wsparcia.docx"');
      res.send(buffer);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
setInterval(() => {
  console.log("Keep-alive ping:", (/* @__PURE__ */ new Date()).toISOString());
}, 5 * 60 * 1e3);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
