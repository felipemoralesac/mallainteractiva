import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import clsx from 'clsx';
import { ExportImport } from './components/ExportImport';

const DRAG_PORTAL = typeof document !== 'undefined' ? document.body : null;

const STORAGE_KEY = 'malla_uc_multi_plans_v1';
const THEME_STORAGE_KEY = 'malla_theme_v1';
const MENU_VIEWPORT_PADDING = 12;
const MENU_MIN_WIDTH = 240;
const SEMESTER_MIN_WIDTH = 260;
const CARD_FULL_WIDTH = SEMESTER_MIN_WIDTH + 12;

const BUILT_IN_DEFINITIONS = [
  {
    id: 'lic-matematica',
    name: 'Licenciatura en Matemática',
    semesters: [
      {
        title: 'Semestre 1',
        courses: [
          { code: 'MAT1104', name: 'Introducción al Cálculo', credits: 15 },
          { code: 'MAT1304', name: 'Introducción a la Geometría', credits: 15 },
          { code: 'MAT1204', name: 'Introducción al Álgebra', credits: 15 },
          { code: 'MAT0004', name: 'Taller de Matemáticas', credits: 14 },
          { code: 'VRA100C', name: 'Test de Comunicación Escrita', credits: 0 },
          { code: 'VRA2000', name: 'Test de Inglés', credits: 0 }
        ]
      },
      {
        title: 'Semestre 2',
        courses: [
          { code: 'MAT1114', name: 'Cálculo I', credits: 15, prereqs: ['MAT1104'] },
          { code: 'MAT1214', name: 'Introducción al Álgebra Lineal', credits: 15, prereqs: ['MAT1204'] },
          { code: 'IIC1103', name: 'Introducción a la Programación', credits: 15 },
          { code: '', name: 'Formación General', credits: 10 }
        ]
      },
      {
        title: 'Semestre 3',
        courses: [
          { code: 'MAT1124', name: 'Cálculo II', credits: 15, prereqs: ['MAT1114'] },
          { code: 'MAT1224', name: 'Álgebra Lineal', credits: 15, prereqs: ['MAT1214'] },
          { code: 'MAT1314', name: 'Introducción a la Combinatoria', credits: 15, prereqs: ['IIC1103'] },
          { code: 'FIL2001', name: 'Filosofía: ¿Para qué?', credits: 10 }
        ]
      },
      {
        title: 'Semestre 4',
        courses: [
          { code: 'MAT1134', name: 'Cálculo III', credits: 15, prereqs: ['MAT1124'] },
          { code: 'MAT2234', name: 'Álgebra Abstracta I', credits: 15, prereqs: ['MAT1224'] },
          { code: 'EYP2104', name: 'Estadística para Matemáticas', credits: 15, prereqs: ['MAT1314'] },
          { code: '', name: 'Formación General', credits: 10 }
        ]
      },
      {
        title: 'Semestre 5',
        courses: [
          { code: 'MAT2514', name: 'Análisis Real', credits: 15, prereqs: ['MAT1134'] },
          { code: 'MAT2244', name: 'Álgebra Abstracta II', credits: 15, prereqs: ['MAT2234'] },
          { code: 'MAT2704', name: 'Variable Compleja', credits: 15, prereqs: ['MAT1134'] },
          { code: '', name: 'Formación General', credits: 10 }
        ]
      },
      {
        title: 'Semestre 6',
        courses: [
          { code: 'MAT2534', name: 'Teoría de la Integración', credits: 15, prereqs: ['MAT2514'] },
          { code: 'MAT2544', name: 'Topología', credits: 15, prereqs: ['MAT2514'] },
          { code: 'MAT2504', name: 'Ecuaciones Diferenciales Ordinarias', credits: 15, prereqs: ['MAT1134'] },
          { code: '', name: 'Formación General', credits: 10 }
        ]
      },
      {
        title: 'Semestre 7',
        courses: [
          {
            code: '',
            name: 'Optativo de Profundización',
            credits: 15,
            prereqs: ['MAT2514', 'MAT2244', 'MAT2704']
          },
          {
            code: '',
            name: 'Optativo de Profundización',
            credits: 15,
            prereqs: ['MAT2514', 'MAT2244', 'MAT2704']
          },
          {
            code: '',
            name: 'Optativo de Profundización',
            credits: 15,
            prereqs: ['MAT2514', 'MAT2244', 'MAT2704']
          },
          { code: '', name: 'Formación General', credits: 10 }
        ]
      },
      {
        title: 'Semestre 8',
        courses: [
          {
            code: 'MAT3094',
            name: 'Taller de Trabajo Matemático',
            credits: 20,
            prereqs: ['MAT2534', 'MAT2544', 'MAT2504']
          },
          {
            code: '',
            name: 'Optativo de Profundización',
            credits: 15,
            prereqs: ['MAT2534', 'MAT2544', 'MAT2504']
          },
          {
            code: '',
            name: 'Optativo de Profundización',
            credits: 15,
            prereqs: ['MAT2534', 'MAT2544', 'MAT2504']
          },
          { code: '', name: 'Formación General', credits: 10 }
        ]
      }
    ]
  },
  {
    id: 'ped-matematica',
    name: 'Pedagogía en Matemática',
    semesters: [
      {
        title: '1° Semestre',
        courses: [
          { code: 'MAT1104', name: 'Introducción al Cálculo', credits: 12 },
          { code: 'MAT1204', name: 'Introducción al Álgebra', credits: 12 },
          { code: 'MAT1304', name: 'Introducción a la Geometría', credits: 12 },
          { code: 'MAT0004', name: 'Taller de Matemáticas', credits: 14 },
          { code: 'ECM500M', name: 'Introducción a la Enseñanza de la Matemática', credits: 5 },
          { code: 'VRA100C', name: 'Integridad Académica en la UC', credits: 0 }
        ]
      },
      {
        title: '2° Semestre',
        courses: [
          { code: 'MAT1219', name: 'Cálculo I', credits: 15 },
          { code: 'MAT1114', name: 'Álgebra Lineal', credits: 15 },
          { code: 'EDU0311', name: 'Teoría de la Educación', credits: 10 },
          { code: 'FIL2001', name: 'Filosofía: ¿Para qué?', credits: 10 }
        ]
      },
      {
        title: '3° Semestre',
        courses: [
          { code: 'MAT1124', name: 'Cálculo II', credits: 15 },
          { code: 'MAT1134', name: 'Introducción al Manejo y Exploración de Datos', credits: 15 },
          { code: 'EYP1707', name: 'Educación y Sociedad', credits: 15 },
          { code: 'TTF', name: 'Formación Teológica (Electivo UC)', credits: 10 }
        ]
      },
      {
        title: '4° Semestre',
        courses: [
          { code: 'MAT2227', name: 'Cálculo III', credits: 10 },
          { code: 'ECM111M', name: 'Práctica 1: Educación Media en Matemática', credits: 10 },
          { code: 'EDU011M', name: 'Introducción a la Estadística', credits: 5 },
          { code: 'EDU0162', name: 'Desarrollo y Aprendizaje Adolescente', credits: 10 },
          { code: '', name: 'Electivo de Formación General', credits: 10 }
        ]
      },
      {
        title: '5° Semestre',
        courses: [
          { code: 'MAT2507', name: 'Introducción al Análisis', credits: 10 },
          { code: 'ECM201M', name: 'Álgebra I', credits: 10 },
          { code: 'EDU0317', name: 'Diversidad e Inclusión en Educación', credits: 10 },
          { code: '', name: 'Electivo de Formación General', credits: 10 },
          { code: '', name: 'Electivo de Formación General', credits: 10 }
        ]
      },
      {
        title: '6° Semestre',
        courses: [
          { code: 'MAT2237', name: 'Álgebra II', credits: 10 },
          { code: 'EDU0163', name: 'Currículum', credits: 10 },
          { code: 'EDU0300', name: 'Didáctica de la Aritmética del Álgebra y Funciones', credits: 10 },
          { code: 'ECM202M', name: 'Práctica 2: Educación Media en Matemática', credits: 10 },
          { code: '', name: 'Electivo de Formación General', credits: 10 }
        ]
      },
      {
        title: '7° Semestre',
        courses: [
          { code: 'ECM232M', name: 'Geometría Euclidiana', credits: 10 },
          { code: 'EDU0301', name: 'Evaluación en la Educación Media', credits: 10 },
          { code: 'EDU012M', name: 'Didáctica de la Geometría', credits: 10 },
          { code: 'EDU0161', name: 'Práctica 3: Educación Media en Matemática', credits: 10 }
        ]
      },
      {
        title: '8° Semestre',
        courses: [
          { code: 'ECM409M', name: 'Seminario de Investigación Aplicada a la Enseñanza de la Matemática', credits: 10 },
          { code: 'EDU0302', name: 'Estadística y Probabilidad', credits: 10 },
          { code: 'EDU013M', name: 'Gestión de Aulas Heterogéneas', credits: 15 },
          { code: '', name: 'Electivo de Formación General', credits: 10 }
        ]
      },
      {
        title: '9° Semestre',
        courses: [
          { code: '', name: 'Pensamiento Computacional', credits: 0 },
          { code: '', name: 'Didáctica de la Geometría 3D, Análisis y Estadística Inferencial', credits: 0 },
          { code: '', name: 'Práctica Profesional 1: Educación Media en Matemática', credits: 0 },
          { code: '', name: 'Optativo de Profundización', credits: 10 }
        ]
      },
      {
        title: '10° Semestre',
        courses: [
          { code: '', name: 'Historia de la Matemática', credits: 0 },
          { code: '', name: 'Modelación Matemática', credits: 0 },
          { code: '', name: 'Práctica Profesional 2: Educación Media en Matemática', credits: 0 },
          { code: 'EDU556', name: 'Dimensión Ética de la Profesión Docente', credits: 5 }
        ]
      }
    ]
  }
];

const DEFINITION_REGISTRY = BUILT_IN_DEFINITIONS.reduce((acc, def) => {
  acc[def.id] = def;
  return acc;
}, {});

const defaultTheme = {
  bg1: '#0f172a',
  bg2: '#111827',
  bg3: '#1e293b',
  panel: 'rgba(15,23,42,0.92)',
  text: '#f1f5f9',
  courseNormal: '#38bdf8',
  courseOptativo: '#f472b6',
  courseGeneral: '#a855f7',
  courseExtra: '#f97316',
  courseApproved: '#34d399'
};

const GENERAL_THEME_FIELDS = [
  { key: 'bg1', label: 'Fondo 1' },
  { key: 'bg2', label: 'Fondo 2' },
  { key: 'bg3', label: 'Fondo acento' },
  { key: 'panel', label: 'Panel' },
  { key: 'text', label: 'Texto' },
  { key: 'courseNormal', label: 'Ramo normal' },
  { key: 'courseOptativo', label: 'Ramo optativo' },
  { key: 'courseGeneral', label: 'Ramo general' },
  { key: 'courseExtra', label: 'Ramo extra' },
  { key: 'courseApproved', label: 'Ramo aprobado' }
];

const ACCENTS_RE = /[\u0300-\u036f]/g;
const NON_CODE_CHARS = /[^A-Z0-9-]/g;
const NEON_COLORS = [
  '#ff1744',
  '#ff6d00',
  '#fdd835',
  '#00e676',
  '#1de9b6',
  '#00b0ff',
  '#d500f9',
  '#ff4081',
  '#76ff03',
  '#f50057'
];

function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function clampChannel(value) {
  return Math.min(255, Math.max(0, value));
}

function adjustColor(hex, amount) {
  if (!hex) return hex;
  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map((ch) => ch + ch).join('');
  }
  const num = parseInt(color, 16);
  const r = clampChannel((num >> 16) + amount);
  const g = clampChannel(((num >> 8) & 0xff) + amount);
  const b = clampChannel((num & 0xff) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

function lighten(hex, amount = 20) {
  return adjustColor(hex, amount);
}
function darken(hex, amount = 20) {
  return adjustColor(hex, -amount);
}

function stripAccents(str = '') {
  return str.normalize('NFD').replace(ACCENTS_RE, '');
}

function baseCodeFromName(name) {
  const cleaned = stripAccents(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ');
  const parts = cleaned
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'CUR';
  const segment = parts.map((p) => p.slice(0, 2)).join('');
  return (segment || 'CUR').slice(0, 6);
}

function ensureUniqueCode(code, used) {
  let candidate = code || 'CUR';
  let counter = 1;
  while (used.has(candidate)) {
    candidate = `${code}${counter++}`;
  }
  used.add(candidate);
  return candidate;
}

function normalizeCodeInput(rawCode, name, used) {
  const cleaned = stripAccents((rawCode || '').toString().toUpperCase())
    .replace(NON_CODE_CHARS, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  if (cleaned) {
    return ensureUniqueCode(cleaned, used);
  }
  return ensureUniqueCode(baseCodeFromName(name), used);
}

function normalizeKey(value) {
  return stripAccents((value || '').toString())
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function splitPrereqTokens(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return value.toString().split(/[\n\r,;|]+/);
}

function sanitizeCode(rawCode) {
  return stripAccents((rawCode || '').toString().toUpperCase())
    .replace(NON_CODE_CHARS, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function collectExistingCodes(courses, skipId) {
  const set = new Set();
  Object.values(courses).forEach((course) => {
    if (course && course.id !== skipId && course.code) {
      set.add(sanitizeCode(course.code));
    }
  });
  return set;
}

function generateUniqueCode(name, courses) {
  const used = collectExistingCodes(courses);
  return normalizeCodeInput('', name, used);
}

function uniquePlanName(base, plans) {
  const fallback = base && base.trim() ? base.trim() : 'Nueva malla';
  const existing = new Set(
    Object.values(plans || {})
      .map((p) => (p?.name || '').trim().toLowerCase())
      .filter(Boolean)
  );
  if (!existing.has(fallback.toLowerCase())) return fallback;
  let counter = 2;
  let candidate = `${fallback} ${counter}`;
  while (existing.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${fallback} ${counter}`;
  }
  return candidate;
}

function buildCodeResolver(courses) {
  const map = {};
  Object.values(courses).forEach((course) => {
    if (!course) return;
    const code = sanitizeCode(course.code);
    const nameKey = normalizeKey(course.name);
    const codeKey = normalizeKey(code);
    if (codeKey) map[codeKey] = code;
    if (nameKey) map[nameKey] = code;
  });
  return map;
}

function resolvePrereqInput(input, courses, fallback = []) {
  const tokens = splitPrereqTokens(input);
  if (!tokens.length) {
    return Array.isArray(fallback) ? [...fallback] : [];
  }
  const resolver = buildCodeResolver(courses);
  const result = new Set();
  tokens.forEach((token) => {
    const trimmed = token.trim();
    if (!trimmed) return;
    const sanitized = sanitizeCode(trimmed);
    const byCode = sanitized ? resolver[normalizeKey(sanitized)] : null;
    const byKey = resolver[normalizeKey(trimmed)];
    const chosen = byCode || byKey || sanitized;
    if (chosen) result.add(chosen);
  });
  if (!result.size && Array.isArray(fallback)) {
    fallback.forEach((code) => {
      const sanitized = sanitizeCode(code);
      if (sanitized) result.add(sanitized);
    });
  }
  return Array.from(result);
}

function parseCourseLine(line) {
  const segments = line.split(',').map((seg) => seg.trim());
  return {
    name: segments[0] || '',
    credits: segments[1] || '',
    prereqInput: segments[2] || '',
    codeInput: segments[3] || ''
  };
}

function gatherPrereqHighlights(course, coursesByCode) {
  if (!course) return [];
  const depthByCode = new Map();
  const stack = [];
  const maxDepth = NEON_COLORS.length - 1;

  const register = (code, depth) => {
    const normalized = sanitizeCode(code);
    if (!normalized) return;
    const current = depthByCode.get(normalized);
    if (current !== undefined && current <= depth) return;
    const cappedDepth = Math.min(depth, maxDepth);
    depthByCode.set(normalized, cappedDepth);
    stack.push({ code: normalized, depth: Math.min(cappedDepth + 1, maxDepth) });
  };

  const prereqs = Array.isArray(course.prereqs) ? course.prereqs : [];
  prereqs.forEach((code) => register(code, 0));

  while (stack.length) {
    const { code, depth } = stack.pop();
    const target = coursesByCode[code];
    if (!target) continue;
    const nested = Array.isArray(target.prereqs) ? target.prereqs : [];
    nested.forEach((child) => register(child, Math.min(depth, maxDepth)));
  }

  return Array.from(depthByCode.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([code, depth]) => ({
      code,
      depth,
      color: NEON_COLORS[depth % NEON_COLORS.length]
    }));
}

function gatherDependents(course, coursesByCode) {
  if (!course) return [];
  const targetCode = sanitizeCode(course.code);
  if (!targetCode) return [];
  const result = [];
  Object.values(coursesByCode).forEach((candidate) => {
    if (!candidate || candidate.code === course.code) return;
    const prereqs = Array.isArray(candidate.prereqs)
      ? candidate.prereqs.map(sanitizeCode).filter(Boolean)
      : [];
    if (prereqs.includes(targetCode)) {
      result.push(sanitizeCode(candidate.code));
    }
  });
  return Array.from(new Set(result));
}

function buildPlanFromDefinition(definition) {
  if (!definition) return buildEmptyPlan();
  const courses = {};
  const usedCodes = new Set();
  const semesters = (definition.semesters || []).map((sem, si) => {
    const ids = (sem.courses || []).map((course, ci) => {
      const id = `c-${si}-${ci}`;
      const name = course.name || 'Nuevo ramo';
      const credits = Number(course.credits) || 0;
      let code = '';
      if (course.code !== undefined) {
        code = normalizeCodeInput(course.code, name, usedCodes);
      }
      const type = course.type
        ? course.type
        : name.includes('OPTATIVO')
        ? 'optativo'
        : name.toUpperCase().includes('FORMACIÓN') ||
          name.toUpperCase().includes('INTEGRIDAD') ||
          name.toUpperCase().includes('INGLÉS') ||
          name.toUpperCase().includes('ESPAÑOL')
        ? 'general'
        : 'normal';
      const prereqs = Array.isArray(course.prereqs)
        ? course.prereqs.map(sanitizeCode).filter(Boolean)
        : [];
      courses[id] = {
        id,
        code,
        name,
        credits,
        type,
        completed: false,
        prereqs
      };
      return id;
    });
    return { id: `sem-${si + 1}`, title: sem.title || `Semestre ${si + 1}`, courseIds: ids };
  });
  return {
    courses,
    semesters,
    semesterOrder: semesters.map((s) => s.id)
  };
}

function buildEmptyPlan(semesterCount = 2) {
  const semesters = Array.from({ length: semesterCount }, (_, idx) => ({
    id: `sem-${idx + 1}`,
    title: `Semestre ${idx + 1}`,
    courseIds: []
  }));
  return {
    courses: {},
    semesters,
    semesterOrder: semesters.map((s) => s.id)
  };
}

function buildDefaultData(definition) {
  if (definition) return buildPlanFromDefinition(definition);
  return buildEmptyPlan();
}

function normalizeData(raw, definition) {
  const defaults = buildDefaultData(definition);
  if (!raw || !raw.courses) {
    return defaults;
  }
  const usedCodes = new Set();
  const nextCourses = {};
  const keyToCode = {};

  Object.entries(raw.courses).forEach(([id, course]) => {
    if (!course) return;
    const fallback = defaults.courses[id] || {};
    const name = (course.name || fallback.name || 'Nuevo ramo').toString();
    const credits =
      Number(course.credits !== undefined ? course.credits : fallback.credits) || 0;
    const type =
      course.type ||
      fallback.type ||
      (name.includes('OPTATIVO')
        ? 'optativo'
        : name.includes('FORMACIÓN') ||
          name.includes('INTEGRIDAD') ||
          name.includes('INGLÉS') ||
          name.includes('ESPAÑOL')
        ? 'general'
        : 'normal');
    const proposedCodeRaw = course.code !== undefined ? course.code : fallback.code;
    let code = '';
    if (proposedCodeRaw) {
      code = normalizeCodeInput(proposedCodeRaw, name, usedCodes);
    }

    const normalizedCourse = {
      id,
      code,
      name,
      credits,
      type,
      completed: Boolean(course.completed),
      prereqs: []
    };

    nextCourses[id] = normalizedCourse;

    if (code) {
      keyToCode[normalizeKey(code)] = code;
    }
    const nameKey = normalizeKey(name);
    if (nameKey && !keyToCode[nameKey]) {
      keyToCode[nameKey] = code || fallback.code || '';
    }
  });

  Object.values(defaults.courses).forEach((course) => {
    const codeKey = normalizeKey(course.code);
    const nameKey = normalizeKey(course.name);
    if (codeKey && !keyToCode[codeKey]) keyToCode[codeKey] = course.code;
    if (nameKey && !keyToCode[nameKey]) keyToCode[nameKey] = course.code;
  });

  Object.entries(nextCourses).forEach(([id, course]) => {
    const original = raw.courses[id] || {};
    const fallback = defaults.courses[id];
    const fallbackPrereqs = Array.isArray(fallback?.prereqs) ? [...fallback.prereqs] : [];
    const resolved = resolvePrereqInput(original.prereqs, nextCourses, fallbackPrereqs);
    course.prereqs = resolved;
    resolved.forEach((code) => {
      const key = normalizeKey(code);
      if (key && !keyToCode[key]) keyToCode[key] = code;
    });
  });

  const validIds = new Set(Object.keys(nextCourses));
  const nextSemesters =
    Array.isArray(raw.semesters) && raw.semesters.length ? raw.semesters : defaults.semesters;
  const sanitizedSemesters = nextSemesters.map((sem) => ({
    ...sem,
    courseIds: (sem.courseIds || []).filter((cid) => validIds.has(cid))
  }));

  const nextOrder =
    Array.isArray(raw.semesterOrder) && raw.semesterOrder.length
      ? raw.semesterOrder
      : defaults.semesterOrder;

  return {
    courses: nextCourses,
    semesters: sanitizedSemesters,
    semesterOrder: nextOrder
  };
}

function initializeMallaState() {
  const plans = BUILT_IN_DEFINITIONS.reduce((acc, def) => {
    acc[def.id] = {
      id: def.id,
      name: def.name,
      data: buildPlanFromDefinition(def),
      definitionId: def.id
    };
    return acc;
  }, {});
  let selectedId = BUILT_IN_DEFINITIONS[0]?.id || null;
  if (typeof window !== 'undefined') {
    try {
      const storedRaw = localStorage.getItem(STORAGE_KEY);
      if (storedRaw) {
        const parsed = JSON.parse(storedRaw);
        if (parsed?.plans && typeof parsed.plans === 'object') {
          Object.entries(parsed.plans).forEach(([id, plan]) => {
            if (!plan || typeof plan !== 'object') return;
            const name =
              typeof plan.name === 'string' && plan.name.trim()
                ? plan.name.trim()
                : plans[id]?.name || 'Malla sin título';
            const storedDefId =
              typeof plan.definitionId === 'string'
                ? plan.definitionId
                : DEFINITION_REGISTRY[id]
                ? id
                : null;
            const definition = storedDefId ? DEFINITION_REGISTRY[storedDefId] : null;
            const normalized = normalizeData(plan.data, definition);
            plans[id] = {
              id,
              name,
              data: normalized,
              definitionId: definition ? storedDefId : null
            };
          });
        }
        if (parsed?.selectedId && plans[parsed.selectedId]) {
          selectedId = parsed.selectedId;
        }
      }
    } catch (err) {
      console.warn('No se pudo leer el almacenamiento de mallas', err);
    }
  }
  return { selectedId, plans };
}

export default function App() {
  const [mallaState, setMallaState] = useState(() => initializeMallaState());
  const currentPlan = mallaState.plans[mallaState.selectedId] || null;
  const currentDefinition = currentPlan?.definitionId
    ? DEFINITION_REGISTRY[currentPlan.definitionId]
    : null;
  const [data, setData] = useState(() => normalizeData(currentPlan?.data, currentDefinition));
  const [showTools, setShowTools] = useState(true);
  const [bulkText, setBulkText] = useState('');
  const [filter, setFilter] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const [highlightMap, setHighlightMap] = useState({});
  const [availableMap, setAvailableMap] = useState({});
  const [actionMenu, setActionMenu] = useState(null);
  const [menuInfo, setMenuInfo] = useState(null);
  const gridRef = useRef(null);
  const menuRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...defaultTheme, ...parsed };
        }
      } catch {}
    }
    return defaultTheme;
  });
  const [courseColorPicker, setCourseColorPicker] = useState(defaultTheme.courseNormal);
  const [colorScope, setColorScope] = useState('selected');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({ max: 0, value: 0, viewport: 0 });

  useEffect(() => {
    const plan = mallaState.plans[mallaState.selectedId];
    const definition = plan?.definitionId ? DEFINITION_REGISTRY[plan.definitionId] : null;
    const normalized = normalizeData(plan?.data, definition);
    setData(normalized);
    setSelectedCourses([]);
    setActionMenu(null);
    setMenuInfo(null);
    setTooltip(null);
    setHighlightMap({});
    setAvailableMap({});
  }, [mallaState.selectedId]);

  useEffect(() => {
    setMallaState((prev) => {
      const selectedId = prev.selectedId;
      if (!selectedId) return prev;
      const plan = prev.plans[selectedId];
      if (!plan || plan.data === data) return prev;
      return {
        ...prev,
        plans: {
          ...prev.plans,
          [selectedId]: { ...plan, data }
        }
      };
    });
  }, [data]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!showThemeModal) return;
    const handle = (ev) => {
      if (ev.key === 'Escape') {
        setShowThemeModal(false);
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [showThemeModal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      selectedId: mallaState.selectedId,
      plans: Object.fromEntries(
        Object.entries(mallaState.plans).map(([id, plan]) => [
          id,
          { name: plan.name, data: plan.data, definitionId: plan.definitionId || null }
        ])
      )
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [mallaState]);

  useEffect(() => {
    setCourseColorPicker(theme.courseNormal);
  }, [theme.courseNormal]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    }
    const root = document.documentElement;
    root.style.setProperty('--panel', theme.panel);
    root.style.setProperty('--course-text', theme.text);
    root.style.setProperty('--bg1', theme.bg1);
    root.style.setProperty('--bg2', theme.bg2);
    root.style.setProperty('--bg3', theme.bg3);
    root.style.setProperty('--course-normal', theme.courseNormal);
    root.style.setProperty('--course-normal-soft', lighten(theme.courseNormal, 35));
    root.style.setProperty('--course-optativo', theme.courseOptativo);
    root.style.setProperty('--course-optativo-soft', lighten(theme.courseOptativo, 35));
    root.style.setProperty('--course-general', theme.courseGeneral);
    root.style.setProperty('--course-general-soft', lighten(theme.courseGeneral, 35));
    root.style.setProperty('--course-extra', theme.courseExtra);
    root.style.setProperty('--course-extra-soft', lighten(theme.courseExtra, 35));
    root.style.setProperty('--course-approved', theme.courseApproved);
    root.style.setProperty('--course-approved-soft', lighten(theme.courseApproved, 30));
  }, [theme]);

  const coursesByCode = useMemo(() => {
    const map = {};
    Object.values(data.courses).forEach((course) => {
      if (!course) return;
      const code = sanitizeCode(course.code);
      if (code) map[code] = course;
    });
    return map;
  }, [data.courses]);

  useEffect(() => {
    setSelectedCourses((prev) => prev.filter((id) => data.courses[id]));
  }, [data.courses]);

  const courseOptions = useMemo(
    () =>
      data.semesters
        .flatMap((sem) =>
          sem.courseIds.map((id) => {
            const course = data.courses[id];
            if (!course) return null;
            const typeLabel = course.type ? ` (${course.type})` : '';
            return { id, label: `${sem.title}: ${course.name}${typeLabel}` };
          })
        )
        .filter(Boolean),
    [data.semesters, data.courses]
  );

  useEffect(() => {
    const handleClick = (ev) => {
      if (ev.target.closest('[data-course-menu]') || ev.target.closest('.floating-menu')) return;
      setActionMenu(null);
      setMenuInfo(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    updateScrollMetrics();
  }, [updateScrollMetrics, data.semesters.length, showTools, currentPlan]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => updateScrollMetrics();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollMetrics]);

  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;
    const handleScroll = () => {
      const left = Math.round(container.scrollLeft);
      setScrollMetrics((prev) => (prev.value === left ? prev : { ...prev, value: left }));
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [gridRef]);

  const planOptions = useMemo(
    () => Object.keys(mallaState.plans).map((id) => mallaState.plans[id]).filter(Boolean),
    [mallaState.plans]
  );
  const planCount = planOptions.length;

  const handleSelectPlan = useCallback((id) => {
    setMallaState((prev) => {
      if (!id || !prev.plans[id] || prev.selectedId === id) return prev;
      return { ...prev, selectedId: id };
    });
  }, []);

  const handleCreatePlan = useCallback((definitionId = null) => {
    const definition = definitionId ? DEFINITION_REGISTRY[definitionId] : null;
    setMallaState((prev) => {
      const id = uid('plan-');
      const baseName = definition ? definition.name : 'Nueva malla';
      const uniqueName = uniquePlanName(baseName, prev.plans);
      const dataPayload = buildDefaultData(definition);
      return {
        selectedId: id,
        plans: {
          ...prev.plans,
          [id]: { id, name: uniqueName, data: dataPayload, definitionId: definition ? definitionId : null }
        }
      };
    });
  }, []);

  const handleRenamePlan = useCallback(() => {
    if (!currentPlan) return;
    const proposed = window.prompt('Nuevo nombre para la malla', currentPlan.name || '');
    if (proposed === null) return;
    const trimmed = proposed.trim();
    if (!trimmed) return;
    setMallaState((prev) => {
      const plan = prev.plans[currentPlan.id];
      if (!plan) return prev;
      if (plan.name === trimmed) return prev;
      const others = { ...prev.plans };
      delete others[currentPlan.id];
      const finalName = Object.values(others).some(
        (p) => (p?.name || '').trim().toLowerCase() === trimmed.toLowerCase()
      )
        ? uniquePlanName(trimmed, others)
        : trimmed;
      return {
        ...prev,
        plans: { ...prev.plans, [currentPlan.id]: { ...plan, name: finalName } }
      };
    });
  }, [currentPlan]);

  const handleDuplicatePlan = useCallback(() => {
    if (!currentPlan) return;
    const definition = currentPlan.definitionId ? DEFINITION_REGISTRY[currentPlan.definitionId] : null;
    const cloned = JSON.parse(JSON.stringify(data));
    setMallaState((prev) => {
      const id = uid('plan-');
      const baseName = `${currentPlan.name || 'Malla'} (copia)`;
      const name = uniquePlanName(baseName, prev.plans);
      return {
        selectedId: id,
        plans: {
          ...prev.plans,
          [id]: {
            id,
            name,
            definitionId: currentPlan.definitionId || null,
            data: normalizeData(cloned, definition)
          }
        }
      };
    });
  }, [currentPlan, data]);

  const handleDeletePlan = useCallback(() => {
    if (!currentPlan) return;
    if (planCount <= 1) {
      window.alert('Debes conservar al menos una malla.');
      return;
    }
    if (!window.confirm(`¿Eliminar la malla "${currentPlan.name}"? Esta acción no se puede deshacer.`)) return;
    setMallaState((prev) => {
      if (!prev.plans[currentPlan.id]) return prev;
      const nextPlans = { ...prev.plans };
      delete nextPlans[currentPlan.id];
      const nextIds = Object.keys(nextPlans);
      return {
        selectedId: nextIds[0] || null,
        plans: nextPlans
      };
    });
  }, [currentPlan, planCount]);

  const handleThemeModalClose = useCallback(() => setShowThemeModal(false), []);

  const replaceData = (incoming) => {
    setActionMenu(null);
    setMenuInfo(null);
    setTooltip(null);
    setHighlightMap({});
    setAvailableMap({});
    setData(normalizeData(incoming, currentDefinition));
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    setData((prev) => {
      const srcIdx = prev.semesters.findIndex((s) => s.id === source.droppableId);
      const dstIdx = prev.semesters.findIndex((s) => s.id === destination.droppableId);
      if (srcIdx === -1 || dstIdx === -1) return prev;
      if (srcIdx === dstIdx) {
        const semester = prev.semesters[srcIdx];
        const updatedIds = [...semester.courseIds];
        updatedIds.splice(source.index, 1);
        updatedIds.splice(destination.index, 0, draggableId);
        const newSemesters = prev.semesters.map((s, i) =>
          i === srcIdx ? { ...s, courseIds: updatedIds } : s
        );
        return { ...prev, semesters: newSemesters, semesterOrder: newSemesters.map((s) => s.id) };
      }
      const src = { ...prev.semesters[srcIdx], courseIds: [...prev.semesters[srcIdx].courseIds] };
      const dst = { ...prev.semesters[dstIdx], courseIds: [...prev.semesters[dstIdx].courseIds] };
      src.courseIds.splice(source.index, 1);
      dst.courseIds.splice(destination.index, 0, draggableId);
      const newSemesters = prev.semesters.map((s, i) => (i === srcIdx ? src : i === dstIdx ? dst : s));
      return { ...prev, semesters: newSemesters, semesterOrder: newSemesters.map((s) => s.id) };
    });
  };

  const toggleApprove = (id) => {
    setActionMenu(null);
    setMenuInfo(null);
    setTooltip((prev) => (prev?.courseId === id ? null : prev));
    setHighlightMap({});
    setAvailableMap({});
    setData((prev) => {
      const course = prev.courses[id];
      if (!course) return prev;
      return {
        ...prev,
        courses: {
          ...prev.courses,
          [id]: { ...course, completed: !course.completed }
        }
      };
    });
  };

  const updateCourse = (id, fields) => {
    setActionMenu(null);
    setMenuInfo(null);
    setHighlightMap({});
    setAvailableMap({});
    setTooltip((prev) => (prev?.courseId === id ? null : prev));
    setData((prev) => {
      const course = prev.courses[id];
      if (!course) return prev;
      const nextCourses = { ...prev.courses };
      let workingCourses = nextCourses;
      const updated = { ...course };

      if (Object.prototype.hasOwnProperty.call(fields, 'name')) {
        const nextName = (fields.name || '').trim() || course.name;
        updated.name = nextName;
        updated.type = nextName.includes('OPTATIVO')
          ? 'optativo'
          : nextName.includes('FORMACIÓN') ||
            nextName.includes('INTEGRIDAD') ||
            nextName.includes('INGLÉS') ||
            nextName.includes('ESPAÑOL')
          ? 'general'
          : 'normal';
      }

      if (Object.prototype.hasOwnProperty.call(fields, 'credits')) {
        updated.credits = Number(fields.credits) || 0;
      }

      if (Object.prototype.hasOwnProperty.call(fields, 'code')) {
        const desired = sanitizeCode(fields.code);
        if (!desired) {
          alert('La sigla no puede quedar vacía.');
          return prev;
        }
        const existing = collectExistingCodes(prev.courses, id);
        if (existing.has(desired)) {
          alert('La sigla ya está en uso. Elige otra diferente.');
          return prev;
        }
        const previousCode = sanitizeCode(course.code);
        if (previousCode !== desired) {
          updated.code = desired;
          Object.values(nextCourses).forEach((c) => {
            if (!Array.isArray(c.prereqs)) return;
            c.prereqs = c.prereqs.map((code) => (sanitizeCode(code) === previousCode ? desired : code));
          });
        }
        workingCourses = { ...nextCourses, [id]: updated };
      }

      if (Object.prototype.hasOwnProperty.call(fields, 'prereqs')) {
        if (workingCourses === nextCourses) {
          workingCourses = { ...nextCourses, [id]: updated };
        }
        updated.prereqs = resolvePrereqInput(fields.prereqs, workingCourses, []);
      }

      nextCourses[id] = updated;
      return { ...prev, courses: nextCourses };
    });
  };

  const removeCourse = (id) =>
    setData((prev) => {
      const nextCourses = { ...prev.courses };
      const removed = nextCourses[id];
      delete nextCourses[id];
      const nextSemesters = prev.semesters.map((sem) => ({
        ...sem,
        courseIds: sem.courseIds.filter((cid) => cid !== id)
      }));
      if (removed) {
        const removedCode = sanitizeCode(removed.code);
        if (removedCode) {
          setHighlightMap({});
          setAvailableMap({});
        }
        setTooltip((prevTooltip) => (prevTooltip?.courseId === id ? null : prevTooltip));
      }
      setActionMenu(null);
      setMenuInfo(null);
      return { ...prev, courses: nextCourses, semesters: nextSemesters, semesterOrder: nextSemesters.map((s) => s.id) };
    });

  const addCourseManual = (rawLine, semIndex = 0, manualType = 'normal') => {
    const cleaned = (rawLine || '').trim();
    if (!cleaned) return;
    setData((prev) => {
      if (!prev.semesters.length) return prev;
      const { name, credits, prereqInput, codeInput } = parseCourseLine(cleaned);
      const targetName = name || 'Nuevo ramo';
      const nextCourses = { ...prev.courses };
      const proposedCode = codeInput ? sanitizeCode(codeInput) : generateUniqueCode(targetName, nextCourses);

      if (!proposedCode) {
        alert('No se pudo generar una sigla válida para el nuevo ramo.');
        return prev;
      }

      if (codeInput) {
        const existing = collectExistingCodes(prev.courses);
        if (existing.has(proposedCode)) {
          alert(`La sigla ${proposedCode} ya existe. Intenta con otra.`);
          return prev;
        }
      }

      const id = uid('c-');
      const normalizedManual = (manualType || '').toLowerCase();
      const autodetected = targetName.includes('OPTATIVO')
        ? 'optativo'
        : targetName.includes('FORMACIÓN') ||
          targetName.includes('INTEGRIDAD') ||
          targetName.includes('INGLÉS') ||
          targetName.includes('ESPAÑOL')
        ? 'general'
        : 'normal';
      const acceptedTypes = new Set(['normal', 'optativo', 'general', 'extra']);
      const type = acceptedTypes.has(normalizedManual) ? normalizedManual : autodetected;
      const prereqs = resolvePrereqInput(prereqInput, nextCourses, []);

      nextCourses[id] = {
        id,
        code: proposedCode,
        name: targetName,
        credits: Number(credits) || 0,
        type,
        completed: false,
        prereqs
      };
      const targetIndex = Math.min(Math.max(semIndex, 0), prev.semesters.length - 1);
      const nextSemesters = prev.semesters.map((s, si) =>
        si === targetIndex ? { ...s, courseIds: [...s.courseIds, id] } : s
      );
      return { ...prev, courses: nextCourses, semesters: nextSemesters, semesterOrder: nextSemesters.map((s) => s.id) };
    });
    setBulkText('');
  };

  const addBulk = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const skipped = [];
    setData((prev) => {
      if (!prev.semesters.length) return prev;
      const nextCourses = { ...prev.courses };
      const nextSemesters = prev.semesters.map((s, index) =>
        index === 0 ? { ...s, courseIds: [...s.courseIds] } : { ...s }
      );
      const target = nextSemesters[0];
      const usedCodes = collectExistingCodes(nextCourses);

      lines.forEach((line) => {
        const { name, credits, prereqInput, codeInput } = parseCourseLine(line);
        const targetName = name || 'Nuevo ramo';

        let code;
        if (codeInput) {
          const sanitized = sanitizeCode(codeInput);
          if (!sanitized) {
            skipped.push(`${targetName} (sigla inválida)`);
            return;
          }
          if (usedCodes.has(sanitized)) {
            skipped.push(`${targetName} (sigla duplicada)`);
            return;
          }
          code = sanitized;
          usedCodes.add(code);
        } else {
          code = normalizeCodeInput('', targetName, usedCodes);
        }

        const id = uid('c-');
        const type = targetName.includes('OPTATIVO')
          ? 'optativo'
          : targetName.includes('FORMACIÓN') ||
            targetName.includes('INTEGRIDAD') ||
            targetName.includes('INGLÉS') ||
            targetName.includes('ESPAÑOL')
          ? 'general'
          : 'normal';
        const prereqs = resolvePrereqInput(prereqInput, nextCourses, []);

        nextCourses[id] = {
          id,
          code,
          name: targetName,
          credits: Number(credits) || 0,
          type,
          completed: false,
          prereqs
        };
        target.courseIds.push(id);
      });

      if (skipped.length) {
        setTimeout(
          () => alert(`Algunos ramos no se agregaron:\n- ${skipped.join('\n- ')}`),
          0
        );
      }

      return { ...prev, courses: nextCourses, semesters: nextSemesters, semesterOrder: nextSemesters.map((s) => s.id) };
    });
    setBulkText('');
  };

  const addSemester = () => {
    setData((prev) => {
      const nextSemesters = [
        ...prev.semesters,
        { id: uid('sem-'), title: '', courseIds: [] }
      ];
      const renumbered = nextSemesters.map((sem, idx) => ({
        ...sem,
        title: `Semestre ${idx + 1}`
      }));
      return {
        ...prev,
        semesters: renumbered,
        semesterOrder: renumbered.map((s) => s.id)
      };
    });
  };

  const removeSemester = () => {
    setData((prev) => {
      if (prev.semesters.length <= 1) return prev;
      const removed = prev.semesters[prev.semesters.length - 1];
      const nextCourses = { ...prev.courses };
      removed.courseIds.forEach((id) => {
        delete nextCourses[id];
      });
      const remaining = prev.semesters
        .slice(0, -1)
        .map((sem, idx) => ({ ...sem, title: `Semestre ${idx + 1}` }));
      return {
        ...prev,
        courses: nextCourses,
        semesters: remaining,
        semesterOrder: remaining.map((s) => s.id)
      };
    });
  };

  const moveCourseToSemester = (courseId, targetIdx) => {
    setData((prev) => {
      const fromIdx = prev.semesters.findIndex((sem) => sem.courseIds.includes(courseId));
      if (fromIdx === -1 || targetIdx < 0 || targetIdx >= prev.semesters.length || targetIdx === fromIdx)
        return prev;
      const nextSemesters = prev.semesters.map((sem, idx) => {
        if (idx === fromIdx) {
          return { ...sem, courseIds: sem.courseIds.filter((id) => id !== courseId) };
        }
        if (idx === targetIdx) {
          return { ...sem, courseIds: [...sem.courseIds, courseId] };
        }
        return sem;
      });
      return {
        ...prev,
        semesters: nextSemesters,
        semesterOrder: nextSemesters.map((s) => s.id)
      };
    });
    setActionMenu(null);
    setMenuInfo(null);
  };

  const getBaseColor = useCallback(
    (course) => {
      if (course.customColor) return course.customColor;
      if (course.completed) return theme.courseApproved;
      if (course.type === 'optativo') return theme.courseOptativo;
      if (course.type === 'general') return theme.courseGeneral;
      if (course.type === 'extra') return theme.courseExtra;
      return theme.courseNormal;
    },
    [theme.courseApproved, theme.courseGeneral, theme.courseNormal, theme.courseOptativo, theme.courseExtra]
  );

  const getIdsForScope = useCallback(
    (scope) => {
      switch (scope) {
        case 'all':
          return Object.keys(data.courses);
        case 'type:optativo':
          return Object.values(data.courses)
            .filter((c) => c?.type === 'optativo')
            .map((c) => c.id);
        case 'type:general':
          return Object.values(data.courses)
            .filter((c) => c?.type === 'general')
            .map((c) => c.id);
        case 'type:extra':
          return Object.values(data.courses)
            .filter((c) => c?.type === 'extra')
            .map((c) => c.id);
        case 'type:normal':
          return Object.values(data.courses)
            .filter(
              (c) => c && c.type !== 'optativo' && c.type !== 'general' && c.type !== 'extra'
            )
            .map((c) => c.id);
        case 'selected':
        default:
          return selectedCourses;
      }
    },
    [data.courses, selectedCourses]
  );

  const applyColorToCourses = useCallback((color, ids) => {
    if (!ids.length) return;
    setData((prev) => {
      const nextCourses = { ...prev.courses };
      ids.forEach((id) => {
        if (nextCourses[id]) {
          nextCourses[id] = { ...nextCourses[id], customColor: color };
        }
      });
      return { ...prev, courses: nextCourses };
    });
  }, []);

  const clearColorFromCourses = useCallback((ids) => {
    if (!ids.length) return;
    setData((prev) => {
      const nextCourses = { ...prev.courses };
      ids.forEach((id) => {
        if (nextCourses[id]) {
          const course = { ...nextCourses[id] };
          delete course.customColor;
          nextCourses[id] = course;
        }
      });
      return { ...prev, courses: nextCourses };
    });
  }, []);

  const handleApplyCourseColor = useCallback(() => {
    const ids = getIdsForScope(colorScope);
    if (!ids.length) {
      alert('Selecciona al menos un ramo o cambia el ámbito.');
      return;
    }
    applyColorToCourses(courseColorPicker, ids);
  }, [applyColorToCourses, courseColorPicker, colorScope, getIdsForScope]);

  const handleClearCourseColor = useCallback(() => {
    const ids = getIdsForScope(colorScope);
    if (!ids.length) {
      alert('Selecciona al menos un ramo o cambia el ámbito.');
      return;
    }
    clearColorFromCourses(ids);
  }, [clearColorFromCourses, colorScope, getIdsForScope]);

  const updateTheme = useCallback((key, value) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetTheme = useCallback(() => setTheme({ ...defaultTheme }), []);

  const planSelectValue = mallaState.selectedId || '';
  const planTitle = currentPlan?.name || 'Malla Interactiva UC';

  const creditsOfSemester = (sem) =>
    sem.courseIds.reduce((total, id) => total + (data.courses[id]?.credits || 0), 0);
  const creditsApproved = Object.values(data.courses).reduce(
    (total, course) => total + (course.completed ? course.credits : 0),
    0
  );
  const totalCredits = useMemo(
    () =>
      Object.values(data.courses).reduce((sum, course) => sum + (Number(course?.credits) || 0), 0),
    [data.courses]
  );
  const avance = totalCredits ? ((creditsApproved / totalCredits) * 100).toFixed(1) : '0.0';
  const totalApprovedCount = Object.values(data.courses).filter((c) => c.completed).length;
  const semestersCompleted = data.semesters.filter((sem) =>
    sem.courseIds.every((cid) => data.courses[cid]?.completed)
  ).length;
  const totalCreditsDisplay = totalCredits || '—';

  const activeCourse = actionMenu ? data.courses[actionMenu] : null;

  const gridStyle = useMemo(
    () => ({
      scrollBehavior: 'smooth'
    }),
    []
  );

  const maxSliderValue = scrollMetrics.max;
  const sliderStep = Math.max(1, Math.round(CARD_FULL_WIDTH));

  const approxStart = useMemo(() => {
    if (!data.semesters.length) return 0;
    return Math.min(
      data.semesters.length,
      Math.floor(scrollMetrics.value / CARD_FULL_WIDTH) + 1
    );
  }, [scrollMetrics.value, data.semesters.length]);

  const approxVisibleCount = useMemo(() => {
    if (!data.semesters.length) return 0;
    if (!scrollMetrics.viewport) return data.semesters.length;
    return Math.max(1, Math.round(scrollMetrics.viewport / CARD_FULL_WIDTH));
  }, [scrollMetrics.viewport, data.semesters.length]);

  const approxEnd = useMemo(() => {
    if (!data.semesters.length) return 0;
    return Math.min(data.semesters.length, approxStart + approxVisibleCount - 1);
  }, [data.semesters.length, approxStart, approxVisibleCount]);

  const handleSliderInput = useCallback(
    (event) => {
      const target = Number(event.target.value);
      if (gridRef.current) {
        gridRef.current.scrollLeft = target;
      }
      setScrollMetrics((prev) => (prev.value === target ? prev : { ...prev, value: target }));
    },
    []
  );

  useLayoutEffect(() => {
    if (!menuInfo || !menuRef.current) return;
    const menuHeight = menuRef.current.offsetHeight;
    const menuWidth = menuRef.current.offsetWidth;
    const viewportBottom = window.scrollY + window.innerHeight - MENU_VIEWPORT_PADDING;
    const viewportTop = window.scrollY + MENU_VIEWPORT_PADDING;
    const viewportLeft = window.scrollX + MENU_VIEWPORT_PADDING;
    const viewportRight =
      window.scrollX + window.innerWidth - menuWidth - MENU_VIEWPORT_PADDING;

    const desiredTop = Math.min(menuInfo.y, viewportBottom - menuHeight);
    const clampedTop = Math.max(viewportTop, desiredTop);
    const desiredLeft = Math.min(menuInfo.x, viewportRight);
    const clampedLeft = Math.max(viewportLeft, desiredLeft);

    if (clampedTop !== menuInfo.y || clampedLeft !== menuInfo.x) {
      setMenuInfo((info) => (info ? { ...info, y: clampedTop, x: clampedLeft } : info));
    }
  }, [menuInfo, actionMenu]);

  const handleMenuClose = () => {
    setActionMenu(null);
    setMenuInfo(null);
  };

  return (
    <div className='app'>
      <div className='header'>
        <div className='header-left'>
          <h1>{planTitle}</h1>
          <div className='plan-controls'>
            <label className='plan-select'>
              <span>Malla actual</span>
              <select value={planSelectValue} onChange={(e) => handleSelectPlan(e.target.value)}>
                {planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>
            <button className='small' onClick={handleRenamePlan} disabled={!currentPlan}>
              Renombrar
            </button>
            <button className='small' onClick={handleDuplicatePlan} disabled={!currentPlan}>
              Duplicar
            </button>
            <button
              className='small danger'
              onClick={handleDeletePlan}
              disabled={!currentPlan || planCount <= 1}
            >
              Eliminar
            </button>
          </div>
          <div className='plan-add'>
            <span>Agregar malla:</span>
            <button className='small secondary' onClick={() => handleCreatePlan(null)}>
              Vacía
            </button>
            {BUILT_IN_DEFINITIONS.map((def) => (
              <button
                key={def.id}
                className='small secondary'
                onClick={() => handleCreatePlan(def.id)}
              >
                {def.name}
              </button>
            ))}
          </div>
        </div>
        <div className='stats'>
          <div>
            <span className='stat-label'>Progreso</span>
            <strong>{avance}%</strong>
          </div>
          <div>
            <span className='stat-label'>Créditos aprobados</span>
            <strong>{creditsApproved}</strong> / {totalCreditsDisplay}
          </div>
          <div>
            <span className='stat-label'>Ramos aprobados</span>
            <strong>{totalApprovedCount}</strong>
          </div>
          <div>
            <span className='stat-label'>Créditos totales del plan</span>
            <strong>{totalCreditsDisplay}</strong>
          </div>
          <div>
            <span className='stat-label'>Semestres completos</span>
            <strong>{semestersCompleted}</strong> / {data.semesters.length}
          </div>
          {maxSliderValue > 0 && (
            <div className='slider-wrapper'>
              <span className='stat-label'>Vista</span>
              <input
                type='range'
                min='0'
                max={maxSliderValue}
                step={sliderStep}
                value={scrollMetrics.value}
                onChange={handleSliderInput}
              />
              <small>
                {data.semesters.length ? `${approxStart} - ${approxEnd}` : '0 - 0'} /{' '}
                {data.semesters.length}
              </small>
            </div>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className='main'>
          <div className='grid' ref={gridRef} style={gridStyle}>
            {data.semesters.map((sem) => (
              <Droppable droppableId={sem.id} key={sem.id}>
                {(prov, snapshot) => (
                  <div
                    className={clsx('semester', snapshot.isDraggingOver && 'drag-over')}
                    ref={prov.innerRef}
                    {...prov.droppableProps}
                  >
                    <div className='sem-title'>{sem.title}</div>
                    {sem.courseIds
                      .filter(
                        (id) =>
                          !filter ||
                          data.courses[id]?.name.toLowerCase().includes(filter.toLowerCase())
                      )
                      .map((cid, idx) => {
                        const c = data.courses[cid];
                        if (!c) return null;
                        const locked = (Array.isArray(c.prereqs) ? c.prereqs : []).some((code) => {
                          const normalized = sanitizeCode(code);
                          const target = coursesByCode[normalized];
                          return !target || !target.completed;
                        });
                        const courseCode = sanitizeCode(c.code);
                        const highlightColor = courseCode ? highlightMap[courseCode] : undefined;
                        const availableColor = courseCode ? availableMap[courseCode] : undefined;
                        const highlightStyle = {};
                        if (highlightColor) highlightStyle['--glow-color'] = highlightColor;
                        if (availableColor) highlightStyle['--available-color'] = availableColor;
                        return (
                          <Draggable draggableId={c.id} index={idx} key={c.id}>
                            {(prov2, snapshot2) => {
                              const baseColor = getBaseColor(c);
                              const dragStyle = {
                                ...prov2.draggableProps.style,
                                ...highlightStyle,
                                '--course-base': baseColor,
                                '--course-base-soft': lighten(baseColor, 32),
                                '--course-border': darken(baseColor, 22)
                              };
                              const content = (
                                <div
                                  ref={prov2.innerRef}
                                  {...prov2.draggableProps}
                                  {...prov2.dragHandleProps}
                                  className={clsx(
                                    'course',
                                    c.type === 'optativo' && 'optativo',
                                    c.type === 'general' && 'general',
                                    c.type === 'extra' && 'extra',
                                    locked && 'locked',
                                    c.completed && 'approved',
                                    highlightColor && 'highlighted',
                                    availableColor && 'available',
                                    snapshot2.isDragging && 'dragging'
                                  )}
                                  style={dragStyle}
                                  onClick={() => toggleApprove(c.id)}
                                  onMouseEnter={() => {
                                    const highlights = gatherPrereqHighlights(c, coursesByCode);
                                    const dependents = gatherDependents(c, coursesByCode);
                                    if (!highlights.length && !dependents.length) {
                                      setTooltip(null);
                                      setHighlightMap({});
                                      setAvailableMap({});
                                      return;
                                    }
                                    const nextMap = {};
                                    highlights.forEach((item) => {
                                      nextMap[item.code] = item.color;
                                    });
                                    setHighlightMap(nextMap);
                                    const nextAvailable = {};
                                    dependents.forEach((code) => {
                                      const normalized = sanitizeCode(code);
                                      if (normalized) nextAvailable[normalized] = '#34d399';
                                    });
                                    setAvailableMap(nextAvailable);
                                    if (highlights.length) {
                                      const display = highlights.map((item) => item.code);
                                      setTooltip({
                                        courseId: c.id,
                                        text: `Requiere: ${display.join(', ')}`
                                      });
                                    } else {
                                      setTooltip({ courseId: c.id, text: 'Requiere: ---' });
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    setTooltip(null);
                                    setHighlightMap({});
                                    setAvailableMap({});
                                  }}
                                >
                                  <div className='left'>
                                    <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{c.name}</div>
                                    <div className='meta'>
                                      <span>{c.credits} créditos</span>
                                      {c.code && <span className='code-chip'>{c.code}</span>}
                                    </div>
                                  </div>
                                  <div className='course-actions'>
                                    <button
                                      className='icon-button'
                                      data-course-menu='true'
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        const isSame = actionMenu === c.id;
                                        if (isSame) {
                                          setActionMenu(null);
                                          setMenuInfo(null);
                                          return;
                                        }
                                        const rect = ev.currentTarget.getBoundingClientRect();
                                        const maxX =
                                          window.scrollX + window.innerWidth - MENU_MIN_WIDTH - MENU_VIEWPORT_PADDING;
                                        const initialX =
                                          rect.right + MENU_VIEWPORT_PADDING + window.scrollX;
                                        const x = Math.min(initialX, maxX);
                                        const y = Math.max(
                                          rect.top + window.scrollY - MENU_VIEWPORT_PADDING,
                                          window.scrollY + MENU_VIEWPORT_PADDING
                                        );
                                        setMenuInfo({ x, y });
                                        setActionMenu(c.id);
                                      }}
                                    >
                                      ⋮
                                    </button>
                                  </div>
                                  {tooltip?.courseId === c.id && (
                                    <div className='tooltip'>{tooltip.text}</div>
                                  )}
                                </div>
                              );
                              if (snapshot2.isDragging && DRAG_PORTAL) {
                                return createPortal(content, DRAG_PORTAL);
                              }
                              return content;
                            }}
                          </Draggable>
                        );
                      })}
                    {prov.placeholder}
                    <div className='creditos-small'>{creditsOfSemester(sem)} / 60 créditos</div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      <div className='dock'>
        <div className='panel'>
          <button className='small' onClick={() => setShowTools((s) => !s)}>
            {showTools ? 'Ocultar herramientas' : 'Mostrar herramientas'}
          </button>
          <div style={{ minWidth: 12 }} />
          <div style={{ display: showTools ? 'flex' : 'none', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <textarea
                className='bulk-input'
                placeholder={'Nombre, créditos, prereqs, sigla\nEj: Álgebra II, 10, MAT402, ALG210'}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
                  gap: 6,
                  marginTop: 6
                }}
              >
                <button
                  className='small'
                  onClick={() => addCourseManual(bulkText.split('\n')[0] || '', 0, 'normal')}
                >
                  + Ramo normal
                </button>
                <button
                  className='small'
                  onClick={() => addCourseManual(bulkText.split('\n')[0] || '', 0, 'optativo')}
                >
                  + Optativo
                </button>
                <button
                  className='small'
                  onClick={() => addCourseManual(bulkText.split('\n')[0] || '', 0, 'general')}
                >
                  + General
                </button>
                <button
                  className='small'
                  onClick={() => addCourseManual(bulkText.split('\n')[0] || '', 0, 'extra')}
                >
                  + Extra
                </button>
                <button className='small' onClick={addBulk}>
                  + Agregar en lote
                </button>
              </div>
              <div className='helper-text'>
                Formato: Nombre, créditos, prereqs (siglas opcional), sigla (opcional).
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input
                placeholder='Buscar...'
                style={{ padding: 6, borderRadius: 6 }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  className='small'
                  onClick={() => {
                    const q = filter.toLowerCase();
                    const ids = Object.keys(data.courses).filter((id) =>
                      data.courses[id].name.toLowerCase().includes(q)
                    );
                    if (ids.length) {
                      alert('Encontrados: ' + ids.length);
                    } else alert('No encontrado');
                  }}
                >
                  Buscar
                </button>
                <button className='small' onClick={() => setFilter('')}>
                  Limpiar
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ExportImport data={data} setData={replaceData} planName={currentPlan?.name} />
              <button
                className='small'
                onClick={() => {
                  if (window.confirm('Reiniciar malla?')) replaceData(buildDefaultData(currentDefinition));
                }}
              >
                Reiniciar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className='small' onClick={addSemester}>
                + Semestre
              </button>
              <button
                className='small'
                onClick={removeSemester}
                disabled={data.semesters.length <= 1}
                style={
                  data.semesters.length <= 1 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined
                }
              >
                − Semestre
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className='small secondary' onClick={() => setShowThemeModal(true)}>
                Colores y estilos...
              </button>
            </div>
          </div>
        </div>
      </div>

      {showThemeModal && DRAG_PORTAL &&
        createPortal(
          <div className='modal-overlay' onClick={handleThemeModalClose}>
            <div className='theme-modal' onClick={(e) => e.stopPropagation()}>
              <div className='theme-modal-header'>
                <h2>Colores y estilos</h2>
                <button className='close-button' onClick={handleThemeModalClose} aria-label='Cerrar'>
                  ×
                </button>
              </div>
              <div className='theme-modal-content'>
                <section className='theme-modal-section'>
                  <h3>Paleta general</h3>
                  <div className='theme-grid'>
                    {GENERAL_THEME_FIELDS.map((field) => (
                      <div className='theme-row' key={field.key}>
                        <label>{field.label}</label>
                        <input
                          type='color'
                          value={theme[field.key]}
                          onChange={(e) => updateTheme(field.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className='theme-row buttons'>
                    <button className='small secondary' onClick={resetTheme}>
                      Restaurar tema
                    </button>
                  </div>
                </section>
                <section className='theme-modal-section'>
                  <h3>Colores de ramos</h3>
                  <div className='theme-grid'>
                    <div className='theme-row'>
                      <label>Color</label>
                      <input
                        type='color'
                        value={courseColorPicker}
                        onChange={(e) => setCourseColorPicker(e.target.value)}
                      />
                    </div>
                    <div className='theme-row'>
                      <label>Ámbito</label>
                      <select
                        className='scope-select'
                        value={colorScope}
                        onChange={(e) => setColorScope(e.target.value)}
                      >
                        <option value='selected'>Seleccionados</option>
                        <option value='all'>Todos</option>
                        <option value='type:normal'>Tipo normal</option>
                        <option value='type:optativo'>Tipo optativo</option>
                        <option value='type:general'>Tipo general</option>
                        <option value='type:extra'>Tipo extra</option>
                      </select>
                    </div>
                    <div className='theme-row'>
                      <label>Ramos</label>
                      <select
                        multiple
                        className='course-select'
                        size={8}
                        value={selectedCourses}
                        onChange={(e) =>
                          setSelectedCourses(Array.from(e.target.selectedOptions).map((opt) => opt.value))
                        }
                      >
                        {courseOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className='theme-row buttons'>
                    <button className='small' onClick={handleApplyCourseColor}>
                      Aplicar
                    </button>
                    <button className='small secondary' onClick={handleClearCourseColor}>
                      Limpiar color
                    </button>
                  </div>
                </section>
              </div>
              <div className='theme-modal-footer'>
                <button className='small secondary' onClick={handleThemeModalClose}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          DRAG_PORTAL
        )}

      {activeCourse && menuInfo &&
        createPortal(
          <div className='menu-overlay' onClick={handleMenuClose}>
            <div
              className='floating-menu'
              data-course-menu='true'
              ref={menuRef}
              style={{ top: menuInfo.y, left: menuInfo.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className='menu-title'>{activeCourse.name}</div>
              <button
                onClick={() => {
                  const n = prompt('Nuevo nombre', activeCourse.name);
                  if (n) updateCourse(activeCourse.id, { name: n });
                }}
              >
                Editar nombre
              </button>
              <button
                onClick={() => {
                  const cr = prompt('Créditos', activeCourse.credits);
                  if (cr !== null) updateCourse(activeCourse.id, { credits: Number(cr) });
                }}
              >
                Editar créditos
              </button>
              <button
                onClick={() => {
                  const sigla = prompt('Nueva sigla', activeCourse.code || '');
                  if (sigla !== null) updateCourse(activeCourse.id, { code: sigla });
                }}
              >
                Editar sigla
              </button>
              <button
                onClick={() => {
                  const current = Array.isArray(activeCourse.prereqs)
                    ? activeCourse.prereqs.join(', ')
                    : '';
                  const input = prompt('Prerequisitos (siglas separadas por coma)', current);
                  if (input !== null) updateCourse(activeCourse.id, { prereqs: input });
                }}
              >
                Editar requisitos
              </button>
              <div className='menu-subtitle'>Cambiar tipo</div>
              <div className='move-grid type-grid'>
                {['normal', 'optativo', 'general', 'extra'].map((type) => {
                  const isCurrent = (activeCourse.type || 'normal') === type;
                  return (
                    <button
                      key={type}
                      disabled={isCurrent}
                      onClick={() => updateCourse(activeCourse.id, { type })}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  );
                })}
              </div>
              <div className='menu-subtitle'>Mover a semestre</div>
              <div className='move-grid'>
                {data.semesters.map((sem, idx) => {
                  const isCurrent = sem.courseIds.includes(activeCourse.id);
                  return (
                    <button
                      key={sem.id}
                      disabled={isCurrent}
                      onClick={() => moveCourseToSemester(activeCourse.id, idx)}
                    >
                      {sem.title || `Sem ${idx + 1}`}
                    </button>
                  );
                })}
              </div>
              <button
                className='danger'
                onClick={() => {
                  if (window.confirm('Eliminar ramo?')) removeCourse(activeCourse.id);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
