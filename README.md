# KALKULATOR POTRZEBY WSPARCIA - PEŁNY KOD I DOKUMENTACJA

## PROMPT PROJEKTU

**Cel projektu:** Stwórz aplikację webową "Kalkulator Potrzeby Wsparcia" do oceny poziomu wsparcia osób niepełnosprawnych zgodnie z rozporządzeniem Ministra Rodziny i Polityki Społecznej z 23 listopada 2023 r.

**Wymagania funkcjonalne:**
1. Ocena 32 czynności życia codziennego z widoczną numeracją 1-32
2. Dla każdej czynności możliwość wyboru:
   - Rodzaju niepełnosprawności (4 typy): Fizyczna, Psychiczna, Intelektualna, Sensoryczna
   - Poziomu wsparcia (4 poziomy): Towarzyszące (0.8), Częściowe (0.9), Pełne (0.99), Szczególne (1.0)
   - Częstotliwości wsparcia (4 poziomy): Czasami (0.5), Często (0.75), Bardzo często (0.95), Zawsze (1.0)
3. Obliczenia: punkty = 4.0 × współczynnik_wsparcia × współczynnik_częstotliwości
4. Wynik końcowy: suma 25 najwyższych wyników z 32 czynności
5. Generowanie raportu DOCX z:
   - Tabelą zawierającą wszystkie 32 czynności
   - Legendą wyjaśniającą kody
   - Podsumowaniem z wynikiem końcowym
6. Walidacja: wszystkie 3 pola muszą być wypełnione
7. System keep-alive bez automatycznego odświeżania strony
8. Wersje: webowa i desktop (portable .bat launcher)

## STRUKTURA PROJEKTU

```
├── client/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── ikony PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── activity-accordion.tsx
│   │   │   ├── assessment-form.tsx
│   │   │   └── ui/ (komponenty shadcn)
│   │   ├── lib/
│   │   │   ├── activities.ts
│   │   │   ├── calculations.ts
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   └── calculator.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── KALKULATOR-PORTABLE.bat
```

## KLUCZOWE PLIKI KODU

### 1. LISTA 32 CZYNNOŚCI (client/src/lib/activities.ts)

```typescript
export const ACTIVITIES = [
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

export const DISABILITY_TYPES = [
  { value: "Fizyczna", label: "Fizyczna" },
  { value: "Psychiczna", label: "Psychiczna" },
  { value: "Intelektualna", label: "Intelektualna" },
  { value: "Sensoryczna", label: "Sensoryczna" }
];

export const SUPPORT_LEVELS = [
  { value: 0.8, label: "Wsparcie towarzyszące", code: "WT" },
  { value: 0.9, label: "Wsparcie częściowe", code: "WC" },
  { value: 0.99, label: "Wsparcie pełne", code: "WP" },
  { value: 1.0, label: "Wsparcie szczególne", code: "WS" }
];

export const FREQUENCIES = [
  { value: 0.5, label: "Czasami", code: "D" },
  { value: 0.75, label: "Często", code: "C" },
  { value: 0.95, label: "Bardzo często", code: "B" },
  { value: 1.0, label: "Zawsze", code: "A" }
];

export const WEIGHT = 4.0;
```

### 2. OBLICZENIA (client/src/lib/calculations.ts)

```typescript
import type { Assessment, ActivityAssessment } from "@shared/schema";
import { WEIGHT } from "./activities";

export function calculateAssessmentPoints(
  supportLevel: number | undefined,
  frequency: number | undefined
): number {
  if (!supportLevel || !frequency) return 0;
  
  const points = WEIGHT * supportLevel * frequency;
  // Round up to 3 decimal places
  return Math.ceil(points * 1000) / 1000;
}

export function calculateActivityMaxPoints(assessments: Assessment[]): number {
  if (assessments.length === 0) return 0;
  
  const pointsArray = assessments.map(a => 
    calculateAssessmentPoints(a.supportLevel?.value, a.frequency?.value)
  );
  
  return Math.max(...pointsArray);
}

export function calculateFinalScore(activities: ActivityAssessment[]): number {
  const allPoints = activities.map(activity => activity.maxPoints);
  const sortedPoints = allPoints.sort((a, b) => b - a);
  const top25Points = sortedPoints.slice(0, 25);
  const sum = top25Points.reduce((acc, curr) => acc + curr, 0);
  
  return Math.ceil(sum);
}

export function getTotalPoints(activities: ActivityAssessment[]): number {
  const allPoints = activities.map(activity => activity.maxPoints);
  const sortedPoints = allPoints.sort((a, b) => b - a);
  const top25Points = sortedPoints.slice(0, 25);
  return top25Points.reduce((acc, curr) => acc + curr, 0);
}
```

### 3. SCHEMAT DANYCH (shared/schema.ts)

```typescript
import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const assessmentReports = pgTable("assessment_reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assessmentData: jsonb("assessment_data").notNull(),
  finalScore: integer("final_score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const disabilityTypeSchema = z.enum(["Fizyczna", "Psychiczna", "Intelektualna", "Sensoryczna"]).or(z.literal(""));

export const supportLevelSchema = z.object({
  value: z.number(),
  label: z.string(),
  code: z.string()
}).optional();

export const frequencySchema = z.object({
  value: z.number(),
  label: z.string(),
  code: z.string()
}).optional();

export const assessmentSchema = z.object({
  id: z.string(),
  disabilityType: disabilityTypeSchema,
  supportLevel: supportLevelSchema,
  frequency: frequencySchema,
  points: z.number()
});

export const activityAssessmentSchema = z.object({
  activityIndex: z.number(),
  activityName: z.string(),
  assessments: z.array(assessmentSchema),
  maxPoints: z.number()
});

export const reportRequestSchema = z.object({
  activities: z.array(activityAssessmentSchema),
  finalScore: z.number()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReportSchema = createInsertSchema(assessmentReports).pick({
  assessmentData: true,
  finalScore: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DisabilityType = z.infer<typeof disabilityTypeSchema>;
export type SupportLevel = z.infer<typeof supportLevelSchema>;
export type Frequency = z.infer<typeof frequencySchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type ActivityAssessment = z.infer<typeof activityAssessmentSchema>;
export type ReportRequest = z.infer<typeof reportRequestSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type AssessmentReport = typeof assessmentReports.$inferSelect;
```

### 4. GŁÓWNY KOMPONENT KALKULATORA (client/src/pages/calculator.tsx)

```typescript
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calculator as CalculatorIcon, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ActivityAccordion from "@/components/activity-accordion";
import type { ActivityAssessment, Assessment } from "@shared/schema";
import { ACTIVITIES } from "@/lib/activities";
import { calculateFinalScore, getTotalPoints } from "@/lib/calculations";
import { apiRequest } from "@/lib/queryClient";

export default function Calculator() {
  const { toast } = useToast();
  
  const [activities, setActivities] = useState<ActivityAssessment[]>(() =>
    ACTIVITIES.map((name, index) => ({
      activityIndex: index,
      activityName: name,
      assessments: [] as Assessment[],
      maxPoints: 0,
    }))
  );

  const totalPoints = useMemo(() => getTotalPoints(activities), [activities]);
  const finalScore = useMemo(() => calculateFinalScore(activities), [activities]);

  const updateActivity = (index: number, activity: ActivityAssessment) => {
    setActivities(prev => prev.map((a, i) => i === index ? activity : a));
  };

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-report", {
        activities,
        finalScore,
      });
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raport-potrzeby-wsparcia-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Raport wygenerowany",
        description: "Raport został pobrany na Twoje urządzenie.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas generowania raportu.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kalkulator Potrzeby Wsparcia
          </h1>
          <p className="text-gray-600">
            Ocena poziomu potrzeby wsparcia osoby niepełnosprawnej
          </p>
          <p className="text-sm text-gray-500 mt-2">
            zgodnie z rozporządzeniem Ministra Rodziny i Polityki Społecznej z dnia 23 listopada 2023 r.
          </p>
        </header>

        <div className="space-y-4 mb-8">
          {activities.map((activity, index) => (
            <ActivityAccordion
              key={activity.activityIndex}
              activity={activity}
              onUpdate={(updated) => updateActivity(index, updated)}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <CalculatorIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Podsumowanie punktacji
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Suma 25 najwyższych wyników: <span className="font-medium">{totalPoints.toFixed(3)}</span>
              </p>
              <p className="text-2xl font-bold text-blue-600">
                Wynik końcowy: {finalScore} pkt
              </p>
            </div>
            <Button
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending}
              size="lg"
              className="w-full md:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              {generateReportMutation.isPending ? "Generowanie..." : "Generuj raport DOCX"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5. KOMPONENT AKTYWNOŚCI (client/src/components/activity-accordion.tsx)

```typescript
import React from "react";
import { nanoid } from "nanoid";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import AssessmentForm from "./assessment-form";
import type { ActivityAssessment, Assessment } from "@shared/schema";
import { calculateActivityMaxPoints } from "@/lib/calculations";

interface ActivityAccordionProps {
  activity: ActivityAssessment;
  onUpdate: (activity: ActivityAssessment) => void;
}

export default function ActivityAccordion({ activity, onUpdate }: ActivityAccordionProps) {
  const addAssessment = () => {
    const newAssessment: Assessment = {
      id: nanoid(),
      disabilityType: "",
      supportLevel: undefined,
      frequency: undefined,
      points: 0,
    };
    
    const updatedAssessments = [...activity.assessments, newAssessment];
    const maxPoints = calculateActivityMaxPoints(updatedAssessments);
    
    onUpdate({
      ...activity,
      assessments: updatedAssessments,
      maxPoints,
    });
  };

  const updateAssessment = (index: number, assessment: Assessment) => {
    const updatedAssessments = activity.assessments.map((a, i) => 
      i === index ? assessment : a
    );
    const maxPoints = calculateActivityMaxPoints(updatedAssessments);
    
    onUpdate({
      ...activity,
      assessments: updatedAssessments,
      maxPoints,
    });
  };

  const removeAssessment = (index: number) => {
    const updatedAssessments = activity.assessments.filter((_, i) => i !== index);
    const maxPoints = calculateActivityMaxPoints(updatedAssessments);
    
    onUpdate({
      ...activity,
      assessments: updatedAssessments,
      maxPoints,
    });
  };

  const activityNumber = activity.activityIndex + 1;

  return (
    <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm">
      <AccordionItem value="item-1" className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-600 text-white font-semibold min-w-[2rem] justify-center">
              {activityNumber}
            </Badge>
            <span className="font-medium">{activity.activityName}</span>
            {activity.maxPoints > 0 && (
              <Badge variant="secondary" className="ml-auto mr-2">
                {activity.maxPoints.toFixed(3)} pkt
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {activity.assessments.length === 0 ? (
            <p className="text-sm text-gray-500 mb-3">
              Brak ocen dla tej czynności. Dodaj ocenę, aby określić poziom wsparcia.
            </p>
          ) : (
            <div className="space-y-3 mb-3">
              {activity.assessments.map((assessment, index) => (
                <AssessmentForm
                  key={assessment.id}
                  assessment={assessment}
                  onUpdate={(updated) => updateAssessment(index, updated)}
                  onRemove={() => removeAssessment(index)}
                  canRemove={activity.assessments.length > 1}
                />
              ))}
            </div>
          )}
          
          <Button
            onClick={addAssessment}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj ocenę
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### 6. FORMULARZ OCENY (client/src/components/assessment-form.tsx)

```typescript
import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Assessment, DisabilityType, SupportLevel, Frequency } from "@shared/schema";
import { DISABILITY_TYPES, SUPPORT_LEVELS, FREQUENCIES } from "@/lib/activities";
import { calculateAssessmentPoints } from "@/lib/calculations";

interface AssessmentFormProps {
  assessment: Assessment;
  onUpdate: (assessment: Assessment) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function AssessmentForm({ 
  assessment, 
  onUpdate, 
  onRemove, 
  canRemove 
}: AssessmentFormProps) {
  const [showValidationError, setShowValidationError] = useState(false);
  
  const handleDisabilityChange = (value: DisabilityType) => {
    setShowValidationError(false);
    const points = calculateAssessmentPoints(
      assessment.supportLevel?.value, 
      assessment.frequency?.value
    );
    onUpdate({ ...assessment, disabilityType: value, points });
  };

  const handleSupportLevelChange = (value: string) => {
    if (!assessment.disabilityType && value) {
      setShowValidationError(true);
      return;
    }
    
    const level = SUPPORT_LEVELS.find(l => l.value.toString() === value);
    const points = calculateAssessmentPoints(level?.value, assessment.frequency?.value);
    onUpdate({ ...assessment, supportLevel: level, points });
  };

  const handleFrequencyChange = (value: string) => {
    if (!assessment.disabilityType && value) {
      setShowValidationError(true);
      return;
    }
    
    const freq = FREQUENCIES.find(f => f.value.toString() === value);
    const points = calculateAssessmentPoints(assessment.supportLevel?.value, freq?.value);
    onUpdate({ ...assessment, frequency: freq, points });
  };

  const isComplete = assessment.disabilityType && assessment.supportLevel && assessment.frequency;

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      {showValidationError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Proszę najpierw wybrać rodzaj niepełnosprawności
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`disability-${assessment.id}`}>
            Rodzaj niepełnosprawności
          </Label>
          <Select
            value={assessment.disabilityType}
            onValueChange={handleDisabilityChange}
          >
            <SelectTrigger id={`disability-${assessment.id}`}>
              <SelectValue placeholder="Wybierz rodzaj" />
            </SelectTrigger>
            <SelectContent>
              {DISABILITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`support-${assessment.id}`}>
            Poziom wsparcia
          </Label>
          <Select
            value={assessment.supportLevel?.value.toString() || ""}
            onValueChange={handleSupportLevelChange}
          >
            <SelectTrigger id={`support-${assessment.id}`}>
              <SelectValue placeholder="Wybierz poziom" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value.toString()}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`frequency-${assessment.id}`}>
            Częstotliwość
          </Label>
          <Select
            value={assessment.frequency?.value.toString() || ""}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger id={`frequency-${assessment.id}`}>
              <SelectValue placeholder="Wybierz częstotliwość" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq.value} value={freq.value.toString()}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          {assessment.points > 0 && (
            <Badge variant={isComplete ? "default" : "outline"}>
              {assessment.points.toFixed(3)} pkt
            </Badge>
          )}
        </div>
        
        {canRemove && (
          <Button
            onClick={onRemove}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 7. GENEROWANIE RAPORTU DOCX (server/routes.ts)

```typescript
import { Express, Request, Response } from "express";
import { Server } from "http";
import { Document, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, BorderStyle, WidthType } from "docx";
import { reportRequestSchema } from "@shared/schema";
import { ACTIVITIES, SUPPORT_LEVELS, FREQUENCIES } from "../client/src/lib/activities";
import { ACTIVITY_DESCRIPTIONS } from "../client/src/lib/activity-descriptions";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-report", async (req, res) => {
    try {
      // Prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const { activities, finalScore } = reportRequestSchema.parse(req.body);

      // Create rows for all 32 activities
      const allRows = ACTIVITIES.map((activityName, index) => {
        const activityNumber = index + 1;
        const activity = activities.find(a => a.activityIndex === index);
        
        if (!activity || activity.assessments.length === 0) {
          return new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: activityNumber.toString(),
                    font: "Times New Roman",
                    size: 18,
                  })]
                })],
                width: { size: 5, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: activityName,
                    font: "Times New Roman",
                    size: 18,
                  })]
                })],
                width: { size: 40, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "Brak",
                    font: "Times New Roman",
                    size: 18,
                  })]
                })],
                width: { size: 15, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "Brak",
                    font: "Times New Roman",
                    size: 18,
                  })]
                })],
                width: { size: 12, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "Brak",
                    font: "Times New Roman",
                    size: 18,
                  })]
                })],
                width: { size: 12, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: "0",
                    font: "Times New Roman",
                    size: 18,
                  })]
                })],
                width: { size: 8, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
              }),
            ],
          });
        }

        // Get assessment with highest points
        const highestAssessment = activity.assessments.reduce((prev, current) => 
          (current.points > prev.points) ? current : prev
        );

        const disabilityTypes = [...new Set(activity.assessments
          .filter(a => a.disabilityType)
          .map(a => a.disabilityType))].join(", ") || "Brak";

        const supportCode = highestAssessment.supportLevel?.code || "Brak";
        const frequencyCode = highestAssessment.frequency?.code || "Brak";

        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: activityNumber.toString(),
                  font: "Times New Roman",
                  size: 18,
                })]
              })],
              width: { size: 5, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: activityName,
                  font: "Times New Roman",
                  size: 18,
                })]
              })],
              width: { size: 40, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: disabilityTypes,
                  font: "Times New Roman",
                  size: 18,
                })]
              })],
              width: { size: 15, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: supportCode,
                  font: "Times New Roman",
                  size: 18,
                })]
              })],
              width: { size: 12, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: frequencyCode,
                  font: "Times New Roman",
                  size: 18,
                })]
              })],
              width: { size: 12, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: activity.maxPoints.toFixed(3),
                  font: "Times New Roman",
                  size: 18,
                })]
              })],
              width: { size: 8, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
          ],
        });
      });

      const doc = new Document({
        sections: [{
          children: [
            // Title
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

            // Table
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                // Header row
                new TableRow({
                  tableHeader: true,
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Nr",
                          bold: true,
                          font: "Times New Roman",
                          size: 20,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 5, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Nazwa czynności",
                          bold: true,
                          font: "Times New Roman",
                          size: 20,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 40, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Stopień niepełnosprawności",
                          bold: true,
                          font: "Times New Roman",
                          size: 20,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 15, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Rodzaj wsparcia",
                          bold: true,
                          font: "Times New Roman",
                          size: 20,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 12, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Częstotliwość",
                          bold: true,
                          font: "Times New Roman",
                          size: 20,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 12, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({
                          text: "Punkty",
                          bold: true,
                          font: "Times New Roman",
                          size: 20,
                        })],
                        alignment: AlignmentType.CENTER,
                      })],
                      width: { size: 8, type: WidthType.PERCENTAGE },
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    }),
                  ],
                }),
                ...allRows,
              ],
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
              spacing: { before: 300, after: 100 }
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

            // Final score
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
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", "attachment; filename=raport-potrzeby-wsparcia.docx");
      res.send(buffer);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000");
  });

  return httpServer;
}
```

### 8. LAUNCHER DESKTOP (KALKULATOR-PORTABLE.bat)

```batch
@echo off
echo ================================
echo KALKULATOR POTRZEBY WSPARCIA
echo ================================
echo.
echo Uruchamianie aplikacji...
echo.
start https://204757e9-35e4-4d7f-96ab-3ca70748e1a1-00-plpp5yectzpa.picard.replit.dev
echo.
echo Aplikacja otworzy sie w przegladarce.
echo.
echo Jesli aplikacja sie nie otworzyla automatycznie,
echo skopiuj i wklej ten link do przegladarki:
echo https://204757e9-35e4-4d7f-96ab-3ca70748e1a1-00-plpp5yectzpa.picard.replit.dev
echo.
echo ================================
echo Mozesz zamknac to okno
echo ================================
pause
```

### 9. KONFIGURACJA TAILWIND (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./client/index.html",
    "./client/src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  },
  plugins: [tailwindcssAnimate],
};

export default config;
```

### 10. PACKAGE.JSON

```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --bundle --platform=node --target=node20 --outfile=dist/server.js --external:fsevents --external:lightningcss --external:esbuild --external:vite --external:tailwindcss --external:autoprefixer --external:typescript --external:@tailwindcss/vite --external:rollup --external:@types/node --external:terser --external:sharp --external:argon2 --external:bcrypt --external:cpu-features --external:ssh2",
    "start": "NODE_ENV=production node dist/server.js",
    "typecheck": "tsc --noEmit",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@neondatabase/serverless": "^0.9.5",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-hover-card": "^1.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.1",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.1",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@tanstack/react-query": "^5.59.20",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "docx": "^9.0.2",
    "drizzle-orm": "^0.36.1",
    "drizzle-zod": "^0.5.1",
    "embla-carousel-react": "^8.3.0",
    "express": "^4.21.1",
    "express-session": "^1.18.1",
    "framer-motion": "^11.11.13",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.454.0",
    "nanoid": "^5.0.8",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.2",
    "react-icons": "^5.3.0",
    "react-resizable-panels": "^2.1.6",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.4",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.6",
    "wouter": "^3.3.5",
    "zod": "^3.23.8",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.0.0-alpha.30",
    "@types/express": "^5.0.0",
    "@types/express-session": "^1.18.0",
    "@types/node": "^22.9.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.28.1",
    "esbuild": "^0.24.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.14",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

## INSTRUKCJE URUCHOMIENIA

### WERSJA ONLINE (PRODUKCYJNA)
1. Otwórz przeglądarkę
2. Wejdź na: https://204757e9-35e4-4d7f-96ab-3ca70748e1a1-00-plpp5yectzpa.picard.replit.dev

### WERSJA DESKTOP PORTABLE
1. Pobierz plik KALKULATOR-PORTABLE.bat
2. Uruchom go (podwójne kliknięcie)
3. Aplikacja otworzy się w przeglądarce

### WERSJA DEWELOPERSKA
```bash
# Wymagania: Node.js 20+, PostgreSQL
git clone [repository-url]
cd kalkulator-potrzeby-wsparcia
npm install
npm run dev
# Aplikacja dostępna pod: http://localhost:5000
```

## PODSUMOWANIE

Aplikacja spełnia wszystkie wymagania:
- ✓ 32 czynności z numeracją 1-32
- ✓ Wybór niepełnosprawności, wsparcia i częstotliwości
- ✓ Obliczenia według wzoru ministerialnego
- ✓ Suma 25 najwyższych wyników
- ✓ Generowanie raportów DOCX z legendą
- ✓ Walidacja formularzy
- ✓ System keep-alive bez przerywania pracy
- ✓ Wersje web i desktop

Data utworzenia: Czerwiec 2025
