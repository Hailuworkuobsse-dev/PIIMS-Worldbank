/**
 * Safe XLSForm-style condition evaluator — no eval().
 * Supports: ${field}, comparisons, and/or/not, selected(), count-selected()
 */
type Token =
  | { type: 'IDENT'; value: string }
  | { type: 'FIELD'; value: string }
  | { type: 'NUMBER'; value: number }
  | { type: 'STRING'; value: string }
  | { type: 'OP'; value: '=' | '!=' | '>' | '<' | '>=' | '<=' }
  | { type: 'LPAREN' } | { type: 'RPAREN' } | { type: 'COMMA' };

export class SkipLogicError extends Error {
  constructor(message: string) { super(message); this.name = 'SkipLogicError'; }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i]!;
    if (/\s/.test(c)) { i++; continue; }
    if (c === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (c === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }
    if (c === ',') { tokens.push({ type: 'COMMA' }); i++; continue; }

    if (c === '$' && input[i + 1] === '{') {
      const end = input.indexOf('}', i + 2);
      if (end === -1) throw new SkipLogicError(`Unclosed field ref at ${i}`);
      tokens.push({ type: 'FIELD', value: input.slice(i + 2, end).trim() });
      i = end + 1;
      continue;
    }

    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      let val = '';
      while (j < input.length && input[j] !== quote) {
        if (input[j] === '\\' && j + 1 < input.length) { val += input[j + 1]; j += 2; }
        else { val += input[j]; j++; }
      }
      if (j >= input.length) throw new SkipLogicError('Unterminated string');
      tokens.push({ type: 'STRING', value: val });
      i = j + 1;
      continue;
    }

    if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let j = i;
      if (input[j] === '-') j++;
      while (j < input.length && /[0-9.]/.test(input[j]!)) j++;
      tokens.push({ type: 'NUMBER', value: Number(input.slice(i, j)) });
      i = j;
      continue;
    }

    if (c === '!') {
      if (input[i + 1] === '=') { tokens.push({ type: 'OP', value: '!=' }); i += 2; continue; }
      throw new SkipLogicError(`Unexpected '!' at ${i}`);
    }
    if (c === '=') { tokens.push({ type: 'OP', value: '=' }); i++; continue; }
    if (c === '>') {
      if (input[i + 1] === '=') { tokens.push({ type: 'OP', value: '>=' }); i += 2; continue; }
      tokens.push({ type: 'OP', value: '>' }); i++; continue;
    }
    if (c === '<') {
      if (input[i + 1] === '=') { tokens.push({ type: 'OP', value: '<=' }); i += 2; continue; }
      tokens.push({ type: 'OP', value: '<' }); i++; continue;
    }

    if (/[a-zA-Z_-]/.test(c)) {
      let j = i;
      while (j < input.length && /[a-zA-Z0-9_-]/.test(input[j]!)) j++;
      tokens.push({ type: 'IDENT', value: input.slice(i, j) });
      i = j;
      continue;
    }

    throw new SkipLogicError(`Unexpected '${c}' at ${i}`);
  }
  return tokens;
}

type Operand =
  | { kind: 'FIELD'; name: string }
  | { kind: 'STRING'; value: string }
  | { kind: 'NUMBER'; value: number }
  | { kind: 'SELECTED'; field: string; value: string }
  | { kind: 'COUNT_SELECTED'; field: string };

type Node =
  | { kind: 'AND'; left: Node; right: Node }
  | { kind: 'OR'; left: Node; right: Node }
  | { kind: 'NOT'; child: Node }
  | { kind: 'CMP'; op: string; left: Operand; right: Operand }
  | { kind: 'OPERAND'; operand: Operand };

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}
  parse(): Node {
    const n = this.parseOr();
    if (this.pos < this.tokens.length) throw new SkipLogicError('Unexpected trailing tokens');
    return n;
  }
  private parseOr(): Node {
    let left = this.parseAnd();
    while (this.matchIdent('or')) left = { kind: 'OR', left, right: this.parseAnd() };
    return left;
  }
  private parseAnd(): Node {
    let left = this.parseNot();
    while (this.matchIdent('and')) left = { kind: 'AND', left, right: this.parseNot() };
    return left;
  }
  private parseNot(): Node {
    if (this.matchIdent('not')) return { kind: 'NOT', child: this.parseNot() };
    return this.parsePrimary();
  }
  private parsePrimary(): Node {
    if (this.peek()?.type === 'LPAREN') {
      this.consume('LPAREN');
      const n = this.parseOr();
      this.consume('RPAREN');
      return n;
    }
    const left = this.parseOperand();
    if (this.peek()?.type === 'OP') {
      const op = (this.consume('OP') as { value: string }).value;
      const right = this.parseOperand();
      return { kind: 'CMP', op, left, right };
    }
    return { kind: 'OPERAND', operand: left };
  }
  private parseOperand(): Operand {
    const t = this.next();
    if (!t) throw new SkipLogicError('Unexpected end');
    if (t.type === 'FIELD') return { kind: 'FIELD', name: t.value };
    if (t.type === 'STRING') return { kind: 'STRING', value: t.value };
    if (t.type === 'NUMBER') return { kind: 'NUMBER', value: t.value };
    if (t.type === 'IDENT') {
      if (t.value === 'selected') {
        this.consume('LPAREN');
        const f = this.next();
        if (!f || f.type !== 'FIELD') throw new SkipLogicError('selected() needs field');
        this.consume('COMMA');
        const v = this.next();
        if (!v || (v.type !== 'STRING' && v.type !== 'NUMBER')) throw new SkipLogicError('selected() needs value');
        this.consume('RPAREN');
        return { kind: 'SELECTED', field: f.value, value: String(v.value) };
      }
      if (t.value === 'count-selected') {
        this.consume('LPAREN');
        const f = this.next();
        if (!f || f.type !== 'FIELD') throw new SkipLogicError('count-selected() needs field');
        this.consume('RPAREN');
        return { kind: 'COUNT_SELECTED', field: f.value };
      }
      throw new SkipLogicError(`Unknown identifier: ${t.value}`);
    }
    throw new SkipLogicError(`Unexpected token ${t.type}`);
  }
  private peek() { return this.tokens[this.pos]; }
  private next() { return this.tokens[this.pos++]; }
  private consume(kind: Token['type']) {
    const t = this.next();
    if (!t || t.type !== kind) throw new SkipLogicError(`Expected ${kind}`);
    return t;
  }
  private matchIdent(name: string): boolean {
    const t = this.peek();
    if (t?.type === 'IDENT' && t.value === name) { this.pos++; return true; }
    return false;
  }
}

export type AnswerMap = Record<string, string | number | string[] | null | undefined>;

function evalOperand(op: Operand, ctx: AnswerMap): string | number | string[] | null {
  switch (op.kind) {
    case 'FIELD': return ctx[op.name] ?? null;
    case 'STRING': return op.value;
    case 'NUMBER': return op.value;
    case 'SELECTED': {
      const v = ctx[op.field];
      return Array.isArray(v) ? (v.includes(op.value) ? 1 : 0) : (v === op.value ? 1 : 0);
    }
    case 'COUNT_SELECTED': {
      const v = ctx[op.field];
      return Array.isArray(v) ? v.length : (v == null ? 0 : 1);
    }
  }
}

function compare(a: string | number | string[] | null, b: string | number | string[] | null, op: string): boolean {
  const na = typeof a === 'number' ? a : (a == null ? null : Number(a));
  const nb = typeof b === 'number' ? b : (b == null ? null : Number(b));
  const bothNumeric = na != null && nb != null && !isNaN(na) && !isNaN(nb);

  if (bothNumeric) {
    switch (op) {
      case '=': return na === nb;
      case '!=': return na !== nb;
      case '>': return na > nb;
      case '<': return na < nb;
      case '>=': return na >= nb;
      case '<=': return na <= nb;
    }
  }

  const sa = a == null ? '' : String(a);
  const sb = b == null ? '' : String(b);
  switch (op) {
    case '=': return sa === sb;
    case '!=': return sa !== sb;
    case '>': return sa > sb;
    case '<': return sa < sb;
    case '>=': return sa >= sb;
    case '<=': return sa <= sb;
  }
  return false;
}

function evalNode(n: Node, ctx: AnswerMap): boolean {
  switch (n.kind) {
    case 'AND': return evalNode(n.left, ctx) && evalNode(n.right, ctx);
    case 'OR': return evalNode(n.left, ctx) || evalNode(n.right, ctx);
    case 'NOT': return !evalNode(n.child, ctx);
    case 'CMP': return compare(evalOperand(n.left, ctx), evalOperand(n.right, ctx), n.op);
    case 'OPERAND': {
      const v = evalOperand(n.operand, ctx);
      if (typeof v === 'number') return v !== 0;
      if (Array.isArray(v)) return v.length > 0;
      if (v == null || v === '') return false;
      return String(v).toLowerCase() !== 'false';
    }
  }
}

export function evaluateCondition(condition: string, ctx: AnswerMap): boolean {
  if (!condition.trim()) return true;
  try {
    const tokens = tokenize(condition);
    const ast = new Parser(tokens).parse();
    return evalNode(ast, ctx);
  } catch (err) {
    // Fail safe: malformed condition → show the question
    console.warn('[skipLogic] eval failed:', (err as Error).message, condition);
    return true;
  }
}

export function computeVisibility(
  questions: Array<{ questionId: string; skipLogic?: Array<{ condition: string; action: string; targetQuestionId?: string }> }>,
  ctx: AnswerMap
): { visible: Set<string>; required: Set<string> } {
  const visible = new Set(questions.map((q) => q.questionId));
  const required = new Set<string>();

  for (const q of questions) {
    if (!q.skipLogic) continue;
    for (const rule of q.skipLogic) {
      const ok = evaluateCondition(rule.condition, ctx);
      if (rule.action === 'SKIP' || rule.action === 'HIDE') {
        if (ok && rule.targetQuestionId) visible.delete(rule.targetQuestionId);
      } else if (rule.action === 'SHOW') {
        if (ok && rule.targetQuestionId) visible.add(rule.targetQuestionId);
      } else if (rule.action === 'REQUIRE') {
        if (ok) required.add(q.questionId);
      }
    }
  }
  return { visible, required };
}