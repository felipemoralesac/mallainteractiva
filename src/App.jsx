import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import clsx from 'clsx';
import { ExportImport } from './components/ExportImport';

const DRAG_PORTAL = typeof document !== 'undefined' ? document.body : null;

const STORAGE_KEY = 'malla_uc_pedmat_v3_full';
const TOTAL_CREDITOS = 500;

const SEMESTRES = [
  {title:'Semestre I', courses:[
    {code:'MAT101', name:'INTRODUCCIÓN AL ÁLGEBRA', credits:12},
    {code:'DAT101', name:'INTRODUCCIÓN AL MANEJO Y EXPLORACIÓN DE DATOS', credits:12},
    {code:'MAT102', name:'INTRODUCCIÓN A LA GEOMETRÍA', credits:12},
    {code:'MAT0004', name:'MAT0004 - TALLER DE MATEMÁTICAS', credits:14},
    {code:'VRA100C', name:'INTEGRIDAD ACADÉMICA EN LA UC (VRA100C)', credits:0}
  ]},
  {title:'Semestre II', courses:[
    {code:'MAT201', name:'CÁLCULO I', credits:15},
    {code:'MAT202', name:'ÁLGEBRA LINEAL', credits:15},
    {code:'EDU210', name:'INTRODUCCIÓN A LA ENSEÑANZA DE LA MATEMÁTICA', credits:10},
    {code:'FIL205', name:'FILOSOFÍA: ¿PARA QUÉ?', credits:10},
    {code:'TEO200', name:'FORMACIÓN TEOLÓGICA (ELECTIVO)', credits:10}
  ]},
  {title:'Semestre III', courses:[
    {code:'MAT301', name:'CÁLCULO II', credits:15},
    {code:'MAT302', name:'INTRODUCCIÓN AL ANÁLISIS', credits:15},
    {code:'EDU310', name:'DESARROLLO Y APRENDIZAJE DEL ADOLESCENTE', credits:15},
    {code:'PRA100', name:'PRÁCTICA 1: EDUCACIÓN MEDIA EN MATEMÁTICA', credits:5}
  ]},
  {title:'Semestre IV', courses:[
    {code:'MAT401', name:'CÁLCULO III', credits:10},
    {code:'MAT402', name:'ÁLGEBRA I', credits:10},
    {code:'EDU420', name:'CURRÍCULUM Y EVALUACIÓN EN LA EDUCACIÓN MEDIA', credits:10},
    {code:'EDU421', name:'DIVERSIDAD E INCLUSIÓN EN EDUCACIÓN', credits:10},
    {code:'GEN200', name:'FORMACIÓN GENERAL (ELECTIVO)', credits:10}
  ]},
  {title:'Semestre V', courses:[
    {code:'MAT501', name:'ÁLGEBRA II', credits:10},
    {code:'EDU510', name:'DIDÁCTICA DE LA ARITMÉTICA DEL ÁLGEBRA Y FUNCIONES', credits:10},
    {code:'EDU511', name:'INTRODUCCIÓN AL ANÁLISIS DE LA ENSEÑANZA', credits:10},
    {code:'GEN300', name:'FORMACIÓN GENERAL (ELECTIVO)', credits:20}
  ]},
  {title:'Semestre VI', courses:[
    {code:'MAT601', name:'GEOMETRÍA EUCLIDIANA', credits:10},
    {code:'EDU610', name:'TEORÍA DE LA EDUCACIÓN', credits:10},
    {code:'EDU611', name:'EDUCACIÓN Y SOCIEDAD', credits:10},
    {code:'GEN310', name:'FORMACIÓN GENERAL (ELECTIVO)', credits:10}
  ]},
  {title:'Semestre VII', courses:[
    {code:'MAT701', name:'ESTADÍSTICA Y PROBABILIDAD', credits:10},
    {code:'MAT702', name:'MODELACIÓN MATEMÁTICA', credits:10},
    {code:'EDU710', name:'DIDÁCTICA DE LA GEOMETRÍA Y DE LA ESTADÍSTICA', credits:10},
    {code:'EDU711', name:'GESTIÓN DE AULAS HETEROGÉNEAS', credits:10},
    {code:'GEN400', name:'FORMACIÓN GENERAL (ELECTIVO)', credits:5}
  ]},
  {title:'Semestre VIII', courses:[
    {code:'EDU810', name:'DIDÁCTICA DE LA GEOMETRÍA 3D, ANÁLISIS Y ESTADÍSTICA INFERENCIAL', credits:10},
    {code:'EDU811', name:'SEMINARIO DE INVESTIGACIÓN APLICADA A LA ENSEÑANZA/APRENDIZAJE DE LA MATEMÁTICA', credits:10},
    {code:'ECM409M', name:'ECM409M - SEMINARIO', credits:10},
    {code:'GEN410', name:'FORMACIÓN GENERAL (ELECTIVO)', credits:10}
  ]},
  {title:'Semestre IX', courses:[
    {code:'PRA200', name:'PRÁCTICA PROFESIONAL 1: EDUCACIÓN MEDIA EN MATEMÁTICA', credits:20},
    {code:'INF900', name:'PENSAMIENTO COMPUTACIONAL', credits:10},
    {code:'OPT901', name:'OPTATIVO DE PROFUNDIZACIÓN', credits:10}
  ]},
  {title:'Semestre X', courses:[
    {code:'PRA300', name:'PRÁCTICA PROFESIONAL 2: EDUCACIÓN MEDIA EN MATEMÁTICA', credits:20},
    {code:'MAT901', name:'HISTORIA DE LA MATEMÁTICA', credits:10},
    {code:'EDU910', name:'DIMENSIÓN ÉTICA DE LA PROFESIÓN DOCENTE', credits:10}
  ]}
];

const PREREQS = {
  'MAT301': ['MAT201'],
  'MAT401': ['MAT301'],
  'MAT302': ['MAT401'],
  'MAT402': ['MAT101'],
  'MAT501': ['MAT402'],
  'PRA200': ['PRA100'],
  'PRA300': ['PRA200']
};

function uid(p=''){return p+Math.random().toString(36).slice(2,9);}

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

const THEME_STORAGE_KEY = 'malla_theme_v1';

const defaultTheme = {
  bg1: '#030712',
  bg2: '#020617',
  bg3: '#1a2235',
  panel: 'rgba(11,17,29,0.92)',
  text: '#e2e8f0',
  courseNormal: '#1d4ed8',
  courseOptativo: '#0ea5e9',
  courseGeneral: '#7c3aed',
  courseExtra: '#f97316',
  courseApproved: '#22c55e'
};

function clampChannel(value){ return Math.min(255, Math.max(0, value)); }

function adjustColor(hex, amount){
  if(!hex) return hex;
  let color = hex.replace('#','');
  if(color.length===3){ color = color.split('').map(ch=> ch+ch).join(''); }
  const num = parseInt(color,16);
  const r = clampChannel((num >> 16) + amount);
  const g = clampChannel(((num >> 8) & 0xff) + amount);
  const b = clampChannel((num & 0xff) + amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function lighten(hex, amount=20){ return adjustColor(hex, amount); }
function darken(hex, amount=20){ return adjustColor(hex, -amount); }

function stripAccents(str=''){
  return str.normalize('NFD').replace(ACCENTS_RE,'');
}

function baseCodeFromName(name){
  const cleaned = stripAccents(name || '').toUpperCase().replace(/[^A-Z0-9\s]/g,' ');
  const parts = cleaned.trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return 'CUR';
  const segment = parts.map(p=>p.slice(0,2)).join('');
  return (segment || 'CUR').slice(0,6);
}

function ensureUniqueCode(code, used){
  let candidate = code || 'CUR';
  let counter = 1;
  while(used.has(candidate)){
    candidate = `${code}${counter++}`;
  }
  used.add(candidate);
  return candidate;
}

function normalizeCodeInput(rawCode, name, used){
  const cleaned = stripAccents((rawCode || '').toString().toUpperCase())
    .replace(NON_CODE_CHARS,'')
    .replace(/-{2,}/g,'-')
    .replace(/^-|-$/g,'');
  if(cleaned){
    return ensureUniqueCode(cleaned, used);
  }
  return ensureUniqueCode(baseCodeFromName(name), used);
}

function normalizeKey(value){
  return stripAccents((value || '').toString()).toUpperCase().replace(/[^A-Z0-9]/g,'');
}

function splitPrereqTokens(value){
  if(Array.isArray(value)) return value;
  if(value===undefined || value===null) return [];
  return value.toString().split(/[\n\r,;|]+/);
}

function sanitizeCode(rawCode){
  return stripAccents((rawCode || '').toString().toUpperCase())
    .replace(NON_CODE_CHARS,'')
    .replace(/-{2,}/g,'-')
    .replace(/^-|-$/g,'');
}

function collectExistingCodes(courses, skipId){
  const set = new Set();
  Object.values(courses).forEach(course=>{
    if(course && course.id!==skipId && course.code){
      set.add(sanitizeCode(course.code));
    }
  });
  return set;
}

function generateUniqueCode(name, courses){
  const used = collectExistingCodes(courses);
  return normalizeCodeInput('', name, used);
}

function buildCodeResolver(courses){
  const map = {};
  Object.values(courses).forEach(course=>{
    if(!course) return;
    const code = sanitizeCode(course.code);
    const nameKey = normalizeKey(course.name);
    const codeKey = normalizeKey(code);
    if(codeKey) map[codeKey] = code;
    if(nameKey) map[nameKey] = code;
  });
  return map;
}

function resolvePrereqInput(input, courses, fallback=[]){
  const tokens = splitPrereqTokens(input);
  if(!tokens.length){
    return Array.isArray(fallback) ? [...fallback] : [];
  }
  const resolver = buildCodeResolver(courses);
  const result = new Set();
  tokens.forEach(token=>{
    const trimmed = token.trim();
    if(!trimmed) return;
    const sanitized = sanitizeCode(trimmed);
    const byCode = sanitized ? resolver[normalizeKey(sanitized)] : null;
    const byKey = resolver[normalizeKey(trimmed)];
    const chosen = byCode || byKey || sanitized;
    if(chosen) result.add(chosen);
  });
  if(!result.size && Array.isArray(fallback)){
    fallback.forEach(code=>{
      const sanitized = sanitizeCode(code);
      if(sanitized) result.add(sanitized);
    });
  }
  return Array.from(result);
}

function parseCourseLine(line){
  const segments = line.split(',').map(seg=>seg.trim());
  return {
    name: segments[0] || '',
    credits: segments[1] || '',
    prereqInput: segments[2] || '',
    codeInput: segments[3] || ''
  };
}

function gatherPrereqHighlights(course, coursesByCode){
  if(!course) return [];
  const depthByCode = new Map();
  const stack = [];
  const maxDepth = NEON_COLORS.length - 1;

  const register = (code, depth)=>{
    const normalized = sanitizeCode(code);
    if(!normalized) return;
    const current = depthByCode.get(normalized);
    if(current !== undefined && current <= depth) return;
    const cappedDepth = Math.min(depth, maxDepth);
    depthByCode.set(normalized, cappedDepth);
    stack.push({code: normalized, depth: Math.min(cappedDepth + 1, maxDepth)});
  };

  const prereqs = Array.isArray(course.prereqs)? course.prereqs : [];
  prereqs.forEach(code=> register(code, 0));

  while(stack.length){
    const {code, depth} = stack.pop();
    const target = coursesByCode[code];
    if(!target) continue;
    const nested = Array.isArray(target.prereqs)? target.prereqs : [];
    nested.forEach(child=> register(child, Math.min(depth, maxDepth)));
  }

  return Array.from(depthByCode.entries())
    .sort((a,b)=> a[1]-b[1])
    .map(([code, depth])=>({
      code,
      depth,
      color: NEON_COLORS[depth % NEON_COLORS.length]
    }));
}

function gatherDependents(course, coursesByCode){
  if(!course) return [];
  const targetCode = sanitizeCode(course.code);
  if(!targetCode) return [];
  const result = [];
  Object.values(coursesByCode).forEach(candidate=>{
    if(!candidate || candidate.code === course.code) return;
    const prereqs = Array.isArray(candidate.prereqs)? candidate.prereqs.map(sanitizeCode).filter(Boolean) : [];
    if(prereqs.includes(targetCode)){
      result.push(sanitizeCode(candidate.code));
    }
  });
  return Array.from(new Set(result));
}

function buildInitial(){
  const courses={};
  const usedCodes = new Set();
  const semesters = SEMESTRES.map((s,si)=>{
    const ids = s.courses.map((c,ci)=>{
      const id = `c-${si}-${ci}`;
      const name = c.name, credits = c.credits;
      const code = normalizeCodeInput(c.code, name, usedCodes);
      const type = name.includes('OPTATIVO')? 'optativo' : (name.includes('FORMACIÓN')||name.includes('INTEGRIDAD')||name.includes('INGLÉS')||name.includes('ESPAÑOL')? 'general':'normal');
      const prereqs = PREREQS[code] ? [...PREREQS[code]] : [];
      courses[id] = {id, code, name, credits, type, completed:false, prereqs};
      return id;
    });
    return {id:`sem-${si+1}`, title:s.title, courseIds:ids};
  });
  return {courses, semesters, semesterOrder: semesters.map(s=>s.id)};
}

function normalizeData(raw){
  if(!raw || !raw.courses) return buildInitial();
  const defaults = buildInitial();
  const usedCodes = new Set();
  const nextCourses = {};
  const keyToCode = {};

  Object.entries(raw.courses).forEach(([id, course])=>{
    if(!course) return;
    const name = course.name || defaults.courses[id]?.name || 'Nuevo ramo';
    const credits = Number(course.credits) || 0;
    const type = course.type || (name.includes('OPTATIVO')? 'optativo' : (name.includes('FORMACIÓN')||name.includes('INTEGRIDAD')||name.includes('INGLÉS')||name.includes('ESPAÑOL')? 'general':'normal'));
    const proposedCode = course.code || defaults.courses[id]?.code || '';
    const code = normalizeCodeInput(proposedCode, name, usedCodes);

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

    keyToCode[normalizeKey(code)] = code;
    keyToCode[normalizeKey(name)] = code;
  });

  Object.values(defaults.courses).forEach(course=>{
    const codeKey = normalizeKey(course.code);
    const nameKey = normalizeKey(course.name);
    if(codeKey && !keyToCode[codeKey]) keyToCode[codeKey] = course.code;
    if(nameKey && !keyToCode[nameKey]) keyToCode[nameKey] = course.code;
  });

  Object.entries(nextCourses).forEach(([id, course])=>{
    const original = raw.courses[id] || {};
    const fallback = PREREQS[course.code] ? [...PREREQS[course.code]] : [];
    const resolved = resolvePrereqInput(original.prereqs, nextCourses, fallback);
    course.prereqs = resolved;
    resolved.forEach(code=>{
      const key = normalizeKey(code);
      if(key && !keyToCode[key]) keyToCode[key] = code;
    });
  });

  const validIds = new Set(Object.keys(nextCourses));
  const nextSemesters = Array.isArray(raw.semesters) && raw.semesters.length ? raw.semesters : defaults.semesters;
  const sanitizedSemesters = nextSemesters.map(sem=>({
    ...sem,
    courseIds: (sem.courseIds || []).filter(cid=> validIds.has(cid))
  }));

  const nextOrder = Array.isArray(raw.semesterOrder) && raw.semesterOrder.length ? raw.semesterOrder : defaults.semesterOrder;

  return {courses:nextCourses, semesters:sanitizedSemesters, semesterOrder:nextOrder};
}

export default function App(){
  const [data,setData] = useState(()=>{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ try{return normalizeData(JSON.parse(raw));}catch{} }
    return buildInitial();
  });
  const [showTools,setShowTools] = useState(true);
  const [bulkText,setBulkText] = useState('');
  const [filter,setFilter] = useState('');
  const [tooltip,setTooltip] = useState(null);
  const [highlightMap,setHighlightMap] = useState({});
  const [availableMap,setAvailableMap] = useState({});
  const [actionMenu,setActionMenu] = useState(null);
  const [menuInfo,setMenuInfo] = useState(null);
  const gridRef = useRef(null);
  const menuRef = useRef(null);
  const [theme,setTheme] = useState(()=>{
    if(typeof window !== 'undefined'){
      try{
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if(stored){
          const parsed = JSON.parse(stored);
          return {...defaultTheme, ...parsed};
        }
      }catch{}
    }
    return defaultTheme;
  });
  const [courseColorPicker,setCourseColorPicker] = useState('#1d4ed8');
  const [colorScope,setColorScope] = useState('selected');
  const [selectedCourses,setSelectedCourses] = useState([]);
  useEffect(()=>{ setCourseColorPicker(theme.courseNormal); },[theme.courseNormal]);
  const replaceData = (incoming)=>{
    setActionMenu(null);
    setMenuInfo(null);
    setTooltip(null);
    setHighlightMap({});
    setAvailableMap({});
    setData(normalizeData(incoming));
  };
  useEffect(()=>{
    if(typeof window !== 'undefined'){
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    }
    const root=document.documentElement;
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
  },[theme]);

  const coursesByCode = useMemo(()=>{
    const map = {};
    Object.values(data.courses).forEach(course=>{
      if(!course) return;
      const code = sanitizeCode(course.code);
      if(code) map[code] = course;
    });
    return map;
  },[data.courses]);
  useEffect(()=>{ setSelectedCourses(prev=> prev.filter(id=> data.courses[id])); },[data.courses]);
  const courseOptions = useMemo(()=> data.semesters.flatMap(sem=> sem.courseIds.map(id=> {
    const course = data.courses[id];
    if(!course) return null;
    const typeLabel = course.type? ` (${course.type})` : '';
    return {id, label:`${sem.title}: ${course.name}${typeLabel}`};
  })).filter(Boolean),[data.semesters,data.courses]);
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); },[data]);
  useEffect(()=>{
    const handleClick=(ev)=>{
      if(ev.target.closest('[data-course-menu]') || ev.target.closest('.floating-menu')) return;
      setActionMenu(null);
      setMenuInfo(null);
    };
    document.addEventListener('click',handleClick);
    return ()=> document.removeEventListener('click',handleClick);
  },[]);

  const onDragEnd=(r)=>{
    const {destination,source,draggableId}=r; if(!destination) return;
    if(destination.droppableId===source.droppableId && destination.index===source.index) return;
    setData(prev=>{
      const srcIdx=prev.semesters.findIndex(s=>s.id===source.droppableId);
      const dstIdx=prev.semesters.findIndex(s=>s.id===destination.droppableId);
      if(srcIdx===-1 || dstIdx===-1) return prev;
      if(srcIdx===dstIdx){
        const semester = prev.semesters[srcIdx];
        const updatedIds=[...semester.courseIds];
        updatedIds.splice(source.index,1);
        updatedIds.splice(destination.index,0,draggableId);
        const newSems=prev.semesters.map((s,i)=> i===srcIdx? {...s,courseIds:updatedIds}:s);
        return {...prev, semesters:newSems, semesterOrder:newSems.map(s=>s.id)};
      }
      const src={...prev.semesters[srcIdx]}, dst={...prev.semesters[dstIdx]};
      src.courseIds=[...src.courseIds]; dst.courseIds=[...dst.courseIds];
      src.courseIds.splice(source.index,1);
      dst.courseIds.splice(destination.index,0,draggableId);
      const newSems=prev.semesters.map((s,i)=> i===srcIdx?src : i===dstIdx?dst : s);
      return {...prev, semesters:newSems, semesterOrder:newSems.map(s=>s.id)};
    });
  };

  const toggleApprove=(id)=>{
    setActionMenu(null);
    setMenuInfo(null);
    setTooltip(prev=> prev?.courseId===id? null : prev);
    setHighlightMap({});
    setAvailableMap({});
    setData(prev=>{
      const course = prev.courses[id]; if(!course) return prev;
      return {...prev, courses:{...prev.courses, [id]:{...course, completed:!course.completed}}};
    });
  };
  const updateCourse=(id,fields)=>{
    setActionMenu(null);
    setMenuInfo(null);
    setHighlightMap({});
    setAvailableMap({});
    setTooltip(prev=> prev?.courseId===id? null : prev);
    setData(prev=>{
      const course = prev.courses[id]; if(!course) return prev;
      const nextCourses = {...prev.courses};
      let workingCourses = nextCourses;
      const updated = {...course};

      if(Object.prototype.hasOwnProperty.call(fields,'name')){
        const nextName = (fields.name || '').trim() || course.name;
        updated.name = nextName;
        updated.type = nextName.includes('OPTATIVO')? 'optativo' : (nextName.includes('FORMACIÓN')||nextName.includes('INTEGRIDAD')||nextName.includes('INGLÉS')||nextName.includes('ESPAÑOL')? 'general':'normal');
      }

      if(Object.prototype.hasOwnProperty.call(fields,'credits')){
        updated.credits = Number(fields.credits) || 0;
      }

      if(Object.prototype.hasOwnProperty.call(fields,'code')){
        const desired = sanitizeCode(fields.code);
        if(!desired){
          alert('La sigla no puede quedar vacía.');
          return prev;
        }
        const existing = collectExistingCodes(prev.courses, id);
        if(existing.has(desired)){
          alert('La sigla ya está en uso. Elige otra diferente.');
          return prev;
        }
        const previousCode = sanitizeCode(course.code);
        if(previousCode !== desired){
          updated.code = desired;
          Object.values(nextCourses).forEach(c=>{
            if(!Array.isArray(c.prereqs)) return;
            c.prereqs = c.prereqs.map(code=> sanitizeCode(code) === previousCode ? desired : code);
          });
        }
        workingCourses = {...nextCourses, [id]:updated};
      }

      if(Object.prototype.hasOwnProperty.call(fields,'prereqs')){
        if(workingCourses === nextCourses){
          workingCourses = {...nextCourses, [id]:updated};
        }
        updated.prereqs = resolvePrereqInput(fields.prereqs, workingCourses, []);
      }

      nextCourses[id] = updated;
      return {...prev, courses:nextCourses};
    });
  };
  const removeCourse=(id)=> setData(prev=>{
    const nextC={...prev.courses};
    const removed = nextC[id];
    delete nextC[id];
    const nextS=prev.semesters.map(s=>({...s,courseIds:s.courseIds.filter(x=>x!==id)}));
    if(removed){
      const removedCode = sanitizeCode(removed.code);
      if(removedCode){
        setHighlightMap({});
        setAvailableMap({});
      }
      setTooltip(prevTooltip=> prevTooltip?.courseId===id? null : prevTooltip);
    }
    setActionMenu(null);
    setMenuInfo(null);
    return {...prev,courses:nextC,semesters:nextS, semesterOrder: nextS.map(s=>s.id)};
  });
  const getIdsForScope = useCallback((scope)=>{
    switch(scope){
      case 'all':
        return Object.keys(data.courses);
      case 'type:optativo':
        return Object.values(data.courses).filter(c=> c?.type==='optativo').map(c=>c.id);
      case 'type:general':
        return Object.values(data.courses).filter(c=> c?.type==='general').map(c=>c.id);
      case 'type:extra':
        return Object.values(data.courses).filter(c=> c?.type==='extra').map(c=>c.id);
      case 'type:normal':
        return Object.values(data.courses).filter(c=> c && c.type!=='optativo' && c.type!=='general' && c.type!=='extra').map(c=>c.id);
      case 'selected':
      default:
        return selectedCourses;
    }
  },[data.courses, selectedCourses]);

  const applyColorToCourses = useCallback((color, ids)=>{
    if(!ids.length) return;
    setData(prev=>{
      const nextCourses = {...prev.courses};
      ids.forEach(id=>{
        if(nextCourses[id]){ nextCourses[id] = {...nextCourses[id], customColor:color}; }
      });
      return {...prev, courses:nextCourses};
    });
  },[]);

  const clearColorFromCourses = useCallback((ids)=>{
    if(!ids.length) return;
    setData(prev=>{
      const nextCourses = {...prev.courses};
      ids.forEach(id=>{
        if(nextCourses[id]){
          const course = {...nextCourses[id]};
          delete course.customColor;
          nextCourses[id] = course;
        }
      });
      return {...prev, courses:nextCourses};
    });
  },[]);

  const handleApplyCourseColor = useCallback(()=>{
    const ids = getIdsForScope(colorScope);
    if(!ids.length){ alert('Selecciona al menos un ramo o cambia el ámbito.'); return; }
    applyColorToCourses(courseColorPicker, ids);
  },[applyColorToCourses, courseColorPicker, colorScope, getIdsForScope]);

  const handleClearCourseColor = useCallback(()=>{
    const ids = getIdsForScope(colorScope);
    if(!ids.length){ alert('Selecciona al menos un ramo o cambia el ámbito.'); return; }
    clearColorFromCourses(ids);
  },[clearColorFromCourses, colorScope, getIdsForScope]);

  const updateTheme = useCallback((key,value)=>{ setTheme(prev=>({...prev,[key]:value})); },[]);
  const resetTheme = useCallback(()=> setTheme({...defaultTheme}),[]);

  const getBaseColor = useCallback((course)=>{
    if(course.customColor) return course.customColor;
    if(course.completed) return theme.courseApproved;
    if(course.type==='optativo') return theme.courseOptativo;
    if(course.type==='general') return theme.courseGeneral;
    return theme.courseNormal;
  },[theme.courseApproved, theme.courseGeneral, theme.courseNormal, theme.courseOptativo]);

  const addCourseManual=(rawLine, semIndex=0, manualType='normal')=>{
    const cleaned = (rawLine || '').trim();
    if(!cleaned) return;
    setData(prev=>{
      if(!prev.semesters.length) return prev;
      const {name, credits, prereqInput, codeInput} = parseCourseLine(cleaned);
      const targetName = name || 'Nuevo ramo';
      const nextCourses = {...prev.courses};
      const proposedCode = codeInput ? sanitizeCode(codeInput) : generateUniqueCode(targetName, nextCourses);

      if(!proposedCode){
        alert('No se pudo generar una sigla válida para el nuevo ramo.');
        return prev;
      }

      if(codeInput){
        const existing = collectExistingCodes(prev.courses);
        if(existing.has(proposedCode)){
          alert(`La sigla ${proposedCode} ya existe. Intenta con otra.`);
          return prev;
        }
      }

      const id=uid('c-');
      const normalizedManual = (manualType || '').toLowerCase();
      const autodetected = targetName.includes('OPTATIVO')? 'optativo' : (targetName.includes('FORMACIÓN')||targetName.includes('INTEGRIDAD')||targetName.includes('INGLÉS')||targetName.includes('ESPAÑOL')? 'general':'normal');
      const acceptedTypes = new Set(['normal','optativo','general','extra']);
      const type = acceptedTypes.has(normalizedManual)? normalizedManual : autodetected;
      const prereqs = resolvePrereqInput(prereqInput, nextCourses, []);

      nextCourses[id] = {id, code:proposedCode, name:targetName, credits:Number(credits)||0, type, completed:false, prereqs};
      const targetIndex = Math.min(Math.max(semIndex,0), prev.semesters.length-1);
      const nextSemesters = prev.semesters.map((s,si)=> si===targetIndex? {...s,courseIds:[...s.courseIds,id]}:s);
      return {...prev,courses:nextCourses,semesters:nextSemesters, semesterOrder: nextSemesters.map(s=>s.id)};
    });
    setBulkText('');
  };
  const addBulk=()=>{
    const lines = bulkText.split('\n').map(l=>l.trim()).filter(Boolean); if(!lines.length) return;
    const skipped = [];
    setData(prev=>{
      if(!prev.semesters.length) return prev;
      const nextCourses = {...prev.courses};
      const nextSemesters = prev.semesters.map((s, index)=> index===0 ? {...s, courseIds:[...s.courseIds]} : {...s});
      const target = nextSemesters[0];
      const usedCodes = collectExistingCodes(nextCourses);

      lines.forEach(line=>{
        const {name, credits, prereqInput, codeInput} = parseCourseLine(line);
        const targetName = name || 'Nuevo ramo';

        let code;
        if(codeInput){
          const sanitized = sanitizeCode(codeInput);
          if(!sanitized){
            skipped.push(`${targetName} (sigla inválida)`);
            return;
          }
          if(usedCodes.has(sanitized)){
            skipped.push(`${targetName} (sigla duplicada)`);
            return;
          }
          code = sanitized;
          usedCodes.add(code);
        }else{
          code = normalizeCodeInput('', targetName, usedCodes);
        }

        const id=uid('c-');
        const type = targetName.includes('OPTATIVO')? 'optativo' : (targetName.includes('FORMACIÓN')||targetName.includes('INTEGRIDAD')||targetName.includes('INGLÉS')||targetName.includes('ESPAÑOL')? 'general':'normal');
        const prereqs = resolvePrereqInput(prereqInput, nextCourses, []);

        nextCourses[id] = {id, code, name:targetName, credits:Number(credits)||0, type, completed:false, prereqs};
        target.courseIds.push(id);
      });

      if(skipped.length){
        setTimeout(()=> alert(`Algunos ramos no se agregaron:\n- ${skipped.join('\n- ')}`), 0);
      }

      return {...prev, courses:nextCourses, semesters:nextSemesters, semesterOrder: nextSemesters.map(s=>s.id)};
    });
    setBulkText('');
  };

  const addSemester=()=>{
    setData(prev=>{
      const nextSemesters = [...prev.semesters, {id:uid('sem-'), title:'', courseIds:[]}];
      const renumbered = nextSemesters.map((sem,idx)=>({...sem, title:`Semestre ${idx+1}`}));
      return {...prev, semesters:renumbered, semesterOrder: renumbered.map(s=>s.id)};
    });
  };

  const removeSemester=()=>{
    setData(prev=>{
      if(prev.semesters.length<=1) return prev;
      const removed = prev.semesters[prev.semesters.length-1];
      const nextCourses = {...prev.courses};
      removed.courseIds.forEach(id=>{ delete nextCourses[id]; });
      const remaining = prev.semesters.slice(0,-1).map((sem,idx)=>({...sem, title:`Semestre ${idx+1}`}));
      return {...prev, courses:nextCourses, semesters:remaining, semesterOrder: remaining.map(s=>s.id)};
    });
  };

  const moveCourseToSemester=(courseId,targetIdx)=>{
    setData(prev=>{
      const fromIdx = prev.semesters.findIndex(sem=> sem.courseIds.includes(courseId));
      if(fromIdx===-1 || targetIdx<0 || targetIdx>=prev.semesters.length || targetIdx===fromIdx) return prev;
      const nextSemesters = prev.semesters.map((sem,idx)=>{
        if(idx===fromIdx){
          return {...sem, courseIds: sem.courseIds.filter(id=> id!==courseId)};
        }
        if(idx===targetIdx){
          return {...sem, courseIds:[...sem.courseIds, courseId]};
        }
        return sem;
      });
      return {...prev, semesters:nextSemesters, semesterOrder: nextSemesters.map(s=>s.id)};
    });
    setActionMenu(null);
    setMenuInfo(null);
  };

  const creditsOfSemester = (sem)=> sem.courseIds.reduce((a,id)=> a + (data.courses[id]?.credits||0),0);
  const creditsApproved = Object.values(data.courses).reduce((a,c)=> a + (c.completed? c.credits:0),0);
  const avance = ((creditsApproved / TOTAL_CREDITOS) * 100).toFixed(1);
  const totalApprovedCount = Object.values(data.courses).filter(c=>c.completed).length;
  const semestersCompleted = data.semesters.filter(s=> s.courseIds.every(cid=> data.courses[cid]?.completed)).length;
  const activeCourse = actionMenu ? data.courses[actionMenu] : null;
  const handleMenuClose = ()=>{ setActionMenu(null); setMenuInfo(null); };

  const isLocked = (course)=>{
    const req = Array.isArray(course.prereqs) ? course.prereqs : [];
    if(!req.length) return false;
    return !req.every(code=>{
      const normalized = sanitizeCode(code);
      const target = coursesByCode[normalized];
      return target ? target.completed : false;
    });
  };

  const gridStyle = useMemo(()=>({gridTemplateColumns:`repeat(${data.semesters.length}, minmax(220px, 1fr))`}),[data.semesters.length]);
  useLayoutEffect(()=>{
    if(!menuInfo || !menuRef.current) return;
    const menuHeight = menuRef.current.offsetHeight;
    const viewportBottom = window.scrollY + window.innerHeight - 12;
    const viewportTop = window.scrollY + 12;
    const desiredTop = Math.min(menuInfo.y, viewportBottom - menuHeight);
    const clampedTop = Math.max(viewportTop, desiredTop);
    if(clampedTop !== menuInfo.y){
      setMenuInfo(info=> info ? {...info, y: clampedTop} : info);
    }
  },[menuInfo, actionMenu]);

  return (<div className='app'>
    <div className='header'>
      <div><h2>Malla Interactiva - Pedagogía en Matemática UC</h2></div>
      <div className='stats'>
        <div>Progreso: <strong>{avance}%</strong></div>
        <div>Créditos aprobados: <strong>{creditsApproved}</strong> / {TOTAL_CREDITOS}</div>
        <div>Ramos aprobados: <strong>{totalApprovedCount}</strong></div>
        <div>Semestres completados: <strong>{semestersCompleted}</strong> / {data.semesters.length}</div>
      </div>
    </div>

    <DragDropContext onDragEnd={onDragEnd}>
      <div className='main'>
        <div className='grid' ref={gridRef} style={gridStyle}>
          {data.semesters.map((sem)=> (
            <Droppable droppableId={sem.id} key={sem.id}>
              {(prov, snapshot)=>(
                <div className={clsx('semester', snapshot.isDraggingOver && 'drag-over')} ref={prov.innerRef} {...prov.droppableProps}>
                  <div className='sem-title'>{sem.title}</div>
                  {sem.courseIds
                    .filter(id=> !filter || data.courses[id]?.name.toLowerCase().includes(filter.toLowerCase()))
                    .map((cid,idx)=>{
                      const c = data.courses[cid]; if(!c) return null;
                      const locked = isLocked(c);
                      const courseCode = sanitizeCode(c.code);
                      const highlightColor = courseCode ? highlightMap[courseCode] : undefined;
                      const availableColor = courseCode ? availableMap[courseCode] : undefined;
                      const highlightStyle = {};
                      if(highlightColor) highlightStyle['--glow-color'] = highlightColor;
                      if(availableColor) highlightStyle['--available-color'] = availableColor;
                      return (
                        <Draggable draggableId={c.id} index={idx} key={c.id}>
                          {(prov2, snapshot)=>{
                            const baseColor = getBaseColor(c);
                            const dragStyle = {
                              ...prov2.draggableProps.style,
                              ...highlightStyle,
                              '--course-base': baseColor,
                              '--course-base-soft': lighten(baseColor, 32),
                              '--course-border': darken(baseColor, 22)
                            };
                            const content = (
                            <div ref={prov2.innerRef} {...prov2.draggableProps} {...prov2.dragHandleProps}
                              className={clsx('course', c.type==='optativo'&&'optativo', c.type==='general'&&'general', c.type==='extra'&&'extra', locked&&'locked', c.completed&&'approved', highlightColor&&'highlighted', availableColor&&'available', snapshot.isDragging && 'dragging')}
                              style={dragStyle}
                              onClick={()=> toggleApprove(c.id)}
                              onMouseEnter={()=> {
                                const highlights = gatherPrereqHighlights(c, coursesByCode);
                                const dependents = gatherDependents(c, coursesByCode);
                                if(!highlights.length && !dependents.length){
                                  setTooltip(null);
                                  setHighlightMap({});
                                  setAvailableMap({});
                                  return;
                                }
                                const nextMap = {};
                                highlights.forEach(item=>{ nextMap[item.code] = item.color; });
                                setHighlightMap(nextMap);
                                const nextAvailable = {};
                                dependents.forEach(code=>{ const normalized = sanitizeCode(code); if(normalized) nextAvailable[normalized] = '#3ef7bd'; });
                                setAvailableMap(nextAvailable);
                                if(highlights.length){
                                  const display = highlights.map(item=> item.code);
                                  setTooltip({courseId: c.id, text: `Requiere: ${display.join(', ')}`});
                                }else{
                                  setTooltip({courseId: c.id, text: 'Requiere: ---'});
                                }
                              }}
                              onMouseLeave={()=> {
                                setTooltip(null);
                                setHighlightMap({});
                                setAvailableMap({});
                              }}
                            >
                              <div className='left'>
                                <div style={{fontWeight:600,lineHeight:1.2}}>{c.name}</div>
                                <div className='meta'>
                                  <span>{c.credits} créditos</span>
                                  {c.code && <span className='code-chip'>{c.code}</span>}
                                </div>
                              </div>
                              <div className='course-actions'>
                                <button
                                  className='icon-button'
                                  data-course-menu='true'
                                  onClick={(ev)=>{
                                    ev.stopPropagation();
                                    const isSame = actionMenu === c.id;
                                    if(isSame){
                                      setActionMenu(null);
                                      setMenuInfo(null);
                                      return;
                                    }
                                    const rect = ev.currentTarget.getBoundingClientRect();
                                    const x = Math.min(rect.right + 12 + window.scrollX, window.scrollX + window.innerWidth - 220);
                                    const y = Math.max(rect.top + window.scrollY - 10, window.scrollY + 12);
                                    setMenuInfo({x, y});
                                    setActionMenu(c.id);
                                  }}
                                >⋮</button>
                              </div>
                              {tooltip?.courseId === c.id && <div className='tooltip'>{tooltip.text}</div>}
                            </div>
                          );
                            if(snapshot.isDragging && DRAG_PORTAL){
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
        <button className='small' onClick={()=> setShowTools(s=>!s)}>{showTools? 'Ocultar herramientas':'Mostrar herramientas'}</button>
        <div style={{minWidth:12}}/>
        <div style={{display: showTools? 'flex':'none', gap:8, alignItems:'center'}}>
          <div style={{display:'flex',flexDirection:'column'}}>
            <textarea
              className='bulk-input'
              placeholder={'Nombre, créditos, prereqs, sigla\nEj: Álgebra II, 10, MAT402, ALG210'}
              value={bulkText}
              onChange={(e)=> setBulkText(e.target.value)}
            />
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:6,marginTop:6}}>
              <button className='small' onClick={()=> addCourseManual((bulkText.split('\n')[0]||''), 0, 'normal')}>+ Ramo normal</button>
              <button className='small' onClick={()=> addCourseManual((bulkText.split('\n')[0]||''), 0, 'optativo')}>+ Optativo</button>
              <button className='small' onClick={()=> addCourseManual((bulkText.split('\n')[0]||''), 0, 'general')}>+ General</button>
              <button className='small' onClick={()=> addCourseManual((bulkText.split('\n')[0]||''), 0, 'extra')}>+ Extra</button>
              <button className='small' onClick={addBulk}>+ Agregar en lote</button>
            </div>
            <div className='helper-text'>Formato: Nombre, créditos, prereqs (siglas opcional), sigla (opcional).</div>
          </div>

          <div style={{display:'flex',flexDirection:'column'}}>
            <input placeholder='Buscar...' style={{padding:6,borderRadius:6}} value={filter} onChange={(e)=> setFilter(e.target.value)} />
            <div style={{display:'flex',gap:8,marginTop:6}}>
              <button className='small' onClick={()=>{const q=filter.toLowerCase(); const ids = Object.keys(data.courses).filter(id=> data.courses[id].name.toLowerCase().includes(q)); if(ids.length){ alert('Encontrados: '+ids.length);} else alert('No encontrado');}}>Buscar</button>
              <button className='small' onClick={()=> setFilter('')}>Limpiar</button>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <ExportImport data={data} setData={replaceData} />
            <button className='small' onClick={()=>{ if(window.confirm('Reiniciar malla?')) replaceData(buildInitial()); }}>Reiniciar</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <button className='small' onClick={addSemester}>+ Semestre</button>
            <button className='small' onClick={removeSemester} disabled={data.semesters.length<=1} style={data.semesters.length<=1?{opacity:0.4,cursor:'not-allowed'}:undefined}>− Semestre</button>
          </div>
          <details className='theme-section'>
            <summary className='theme-title'>Colores generales</summary>
            <div className='theme-row'>
              <label>Fondo 1</label>
              <input type='color' value={theme.bg1} onChange={(e)=> updateTheme('bg1', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Fondo 2</label>
              <input type='color' value={theme.bg2} onChange={(e)=> updateTheme('bg2', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Fondo acento</label>
              <input type='color' value={theme.bg3} onChange={(e)=> updateTheme('bg3', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Panel</label>
              <input type='color' value={theme.panel} onChange={(e)=> updateTheme('panel', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Texto</label>
              <input type='color' value={theme.text} onChange={(e)=> updateTheme('text', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Ramo normal</label>
              <input type='color' value={theme.courseNormal} onChange={(e)=> updateTheme('courseNormal', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Ramo optativo</label>
              <input type='color' value={theme.courseOptativo} onChange={(e)=> updateTheme('courseOptativo', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Ramo general</label>
              <input type='color' value={theme.courseGeneral} onChange={(e)=> updateTheme('courseGeneral', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Ramo extra</label>
              <input type='color' value={theme.courseExtra} onChange={(e)=> updateTheme('courseExtra', e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Ramo aprobado</label>
              <input type='color' value={theme.courseApproved} onChange={(e)=> updateTheme('courseApproved', e.target.value)} />
            </div>
            <div className='theme-row buttons'>
              <button className='small' onClick={resetTheme}>Restaurar tema</button>
            </div>
          </details>
          <details className='theme-section'>
            <summary className='theme-title'>Colores de ramos</summary>
            <div className='theme-row'>
              <label>Color</label>
              <input type='color' value={courseColorPicker} onChange={(e)=> setCourseColorPicker(e.target.value)} />
            </div>
            <div className='theme-row'>
              <label>Ámbito</label>
              <select className='scope-select' value={colorScope} onChange={(e)=> setColorScope(e.target.value)}>
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
              <select multiple className='course-select' size={6} value={selectedCourses} onChange={(e)=> setSelectedCourses(Array.from(e.target.selectedOptions).map(opt=> opt.value))}>
                {courseOptions.map(opt=> (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className='theme-row buttons'>
              <button className='small' onClick={handleApplyCourseColor}>Aplicar</button>
              <button className='small' onClick={handleClearCourseColor}>Limpiar color</button>
            </div>
          </details>
        </div>
      </div>
    </div>

    {activeCourse && menuInfo && createPortal(
      <div className='menu-overlay' onClick={handleMenuClose}>
        <div className='floating-menu' data-course-menu='true' ref={menuRef} style={{top: menuInfo.y, left: menuInfo.x}} onClick={(e)=>e.stopPropagation()}>
          <div className='menu-title'>{activeCourse.name}</div>
          <button onClick={()=>{const n=prompt('Nuevo nombre',activeCourse.name); if(n) updateCourse(activeCourse.id,{name:n});}}>Editar nombre</button>
          <button onClick={()=>{const cr=prompt('Créditos',activeCourse.credits); if(cr!==null) updateCourse(activeCourse.id,{credits:Number(cr)});}}>Editar créditos</button>
          <button onClick={()=>{const sigla=prompt('Nueva sigla',activeCourse.code||''); if(sigla!==null) updateCourse(activeCourse.id,{code:sigla});}}>Editar sigla</button>
          <button onClick={()=>{const current = Array.isArray(activeCourse.prereqs)? activeCourse.prereqs.join(', '):''; const input = prompt('Prerequisitos (siglas separadas por coma)', current); if(input!==null) updateCourse(activeCourse.id,{prereqs:input});}}>Editar requisitos</button>
          <div className='menu-subtitle'>Cambiar tipo</div>
          <div className='move-grid type-grid'>
            {['normal','optativo','general','extra'].map(t=>{
              const isCurrent = (activeCourse.type||'normal')===t;
              return (
                <button key={t} disabled={isCurrent} onClick={()=> updateCourse(activeCourse.id,{type:t})}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
              );
            })}
          </div>
          <div className='menu-subtitle'>Mover a semestre</div>
          <div className='move-grid'>
            {data.semesters.map((sem,idx)=>{
              const isCurrent = sem.courseIds.includes(activeCourse.id);
              return (
                <button key={sem.id} disabled={isCurrent} onClick={()=> moveCourseToSemester(activeCourse.id, idx)}>
                  {sem.title || `Sem ${idx+1}`}
                </button>
              );
            })}
          </div>
          <button className='danger' onClick={()=>{ if(window.confirm('Eliminar ramo?')) removeCourse(activeCourse.id);}}>Eliminar</button>
        </div>
      </div>,
      document.body
    )}
  </div>);
}
