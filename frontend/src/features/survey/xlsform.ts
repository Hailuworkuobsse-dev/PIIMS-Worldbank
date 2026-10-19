/**
 * Minimal XLSForm import/export.
 *
 * XLSForm structure (simplified):
 *   survey sheet: type | name | label | label::Amharic | required | relevant | constraint | appearance
 *   choices sheet: list_name | name | label | label::Amharic
 *
 * We map:
 *   - `select_one list` → SINGLE with options
 *   - `select_multiple list` → MULTI
 *   - `integer` / `decimal` → NUMERIC / DECIMAL
 *   - `text` → TEXT
 *   - `date` → DATE
 *   - `geopoint` → GPS
 *   - `image` → PHOTO
 *   - `audio` → AUDIO
 *   - `barcode` → BARCODE
 *   - `begin_repeat` / `end_repeat` → repeatable section
 */

import type {
  Question,
  QuestionType,
  Section,
  QuestionOption,
} from "./survey.types";

export interface XlsFormRow {
  type: string;
  name: string;
  label?: string;
  labelAm?: string;
  required?: string;
  relevant?: string;
  constraint?: string;
  appearance?: string;
  calculation?: string;
}

export interface XlsFormChoiceRow {
  list_name: string;
  name: string;
  label?: string;
  labelAm?: string;
}

interface XlsForm {
  survey: XlsFormRow[];
  choices: XlsFormChoiceRow[];
}

/* -------------------------------------------------------------------------
 * Import
 * ------------------------------------------------------------------------- */

export function parseXlsForm(xls: XlsForm): Section[] {
  const sections: Section[] = [];
  const choicesByList: Record<string, QuestionOption[]> = {};

  // Pre-index choices
  for (const c of xls.choices) {
    if (!choicesByList[c.list_name]) choicesByList[c.list_name] = [];
    choicesByList[c.list_name]!.push({
      code: c.name,
      label: c.label ?? c.name,
      labelAm: c.labelAm,
      value: c.name,
      orderNo: choicesByList[c.list_name]!.length,
    });
  }

  // Walk the survey rows
  let currentSection: Section | null = null;
  let order = 0;

  for (const row of xls.survey) {
    const type = row.type.trim();
    if (type === "begin_group" || type === "begin_repeat") {
      const sectionId = crypto.randomUUID();
      currentSection = {
        sectionId,
        versionId: "",
        code: row.name,
        title: row.label ?? row.name,
        titleAm: row.labelAm,
        orderNo: sections.length,
        repeatable: type === "begin_repeat",
        questions: [],
      };
      sections.push(currentSection);
      order = 0;
      continue;
    }
    if (type === "end_group" || type === "end_repeat") {
      currentSection = null;
      continue;
    }

    // Choose target section
    const target =
      currentSection ??
      (() => {
        const s: Section = {
          sectionId: crypto.randomUUID(),
          versionId: "",
          code: "default",
          title: "Default",
          orderNo: sections.length,
          repeatable: false,
          questions: [],
        };
        sections.push(s);
        return s;
      })();

    const parsed = parseQuestionRow(
      row,
      target.sectionId,
      order++,
      choicesByList,
    );
    if (parsed) target.questions.push(parsed);
  }

  return sections;
}

function parseQuestionRow(
  row: XlsFormRow,
  sectionId: string,
  order: number,
  choices: Record<string, QuestionOption[]>,
): Question | null {
  const type = row.type.trim();

  let questionType: QuestionType | null = null;
  let optionsListName: string | null = null;

  if (type === "integer") questionType = "NUMERIC";
  else if (type === "decimal") questionType = "DECIMAL";
  else if (type === "text") questionType = "TEXT";
  else if (type === "date") questionType = "DATE";
  else if (type === "geopoint") questionType = "GPS";
  else if (type === "image") questionType = "PHOTO";
  else if (type === "audio") questionType = "AUDIO";
  else if (type === "barcode") questionType = "BARCODE";
  else if (type === "calculate") questionType = "CALCULATED";
  else if (type.startsWith("select_one ")) {
    questionType = "SINGLE";
    optionsListName = type.slice(11).trim();
  } else if (type.startsWith("select_multiple ")) {
    questionType = "MULTI";
    optionsListName = type.slice(16).trim();
  } else if (type.startsWith("select_one")) {
    questionType = "SINGLE";
  } else if (type.startsWith("select_multiple")) {
    questionType = "MULTI";
  }

  if (!questionType) return null;

  const q: Question = {
    questionId: crypto.randomUUID(),
    sectionId,
    code: row.name,
    type: questionType,
    text: row.label ?? row.name,
    textAm: row.labelAm,
    hint: row.constraint,
    required: row.required === "yes" || row.required === "true",
    orderNo: order,
    calculation: row.calculation,
    options: optionsListName ? (choices[optionsListName] ?? []) : undefined,
    skipLogic: row.relevant
      ? [
          {
            logicId: crypto.randomUUID(),
            questionId: "",
            condition: row.relevant,
            action: "SHOW",
          },
        ]
      : undefined,
  };
  return q;
}

/* -------------------------------------------------------------------------
 * Export
 * ------------------------------------------------------------------------- */

export function toXlsForm(sections: Section[]): XlsForm {
  const survey: XlsFormRow[] = [];
  const choices: XlsFormChoiceRow[] = [];
  let listIndex = 0;

  for (const section of sections) {
    survey.push({
      type: section.repeatable ? "begin_repeat" : "begin_group",
      name: section.code,
      label: section.title,
      labelAm: section.titleAm,
    });
    for (const q of section.questions) {
      const type = toXlsType(q.type);
      let xlsType = type;
      if ((q.type === "SINGLE" || q.type === "MULTI") && q.options) {
        const listName = `list_${listIndex++}`;
        xlsType = `${type} ${listName}`;
        for (const opt of q.options) {
          choices.push({
            list_name: listName,
            name: opt.code,
            label: opt.label,
            labelAm: opt.labelAm,
          });
        }
      }
      survey.push({
        type: xlsType,
        name: q.code,
        label: q.text,
        labelAm: q.textAm,
        required: q.required ? "yes" : "",
        relevant: q.skipLogic?.[0]?.condition,
        constraint: q.hint,
        calculation: q.calculation,
      });
    }
    survey.push({
      type: section.repeatable ? "end_repeat" : "end_group",
      name: "",
    });
  }

  return { survey, choices };
}

function toXlsType(t: QuestionType): string {
  switch (t) {
    case "SINGLE":
      return "select_one";
    case "MULTI":
      return "select_multiple";
    case "NUMERIC":
      return "integer";
    case "DECIMAL":
      return "decimal";
    case "DATE":
      return "date";
    case "TEXT":
      return "text";
    case "GPS":
      return "geopoint";
    case "PHOTO":
      return "image";
    case "AUDIO":
      return "audio";
    case "BARCODE":
      return "barcode";
    case "CALCULATED":
      return "calculate";
    case "MATRIX":
    case "RANKING":
      return "text";
  }
}