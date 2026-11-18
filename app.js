import {
  DAYS,SHORT_DAYS,teacherDisplayName,groupName,groupSchedule,teacherSchedule,
  groupDictionary,buildWeekBoard,splitPairVariants,activeForWeek,splitRooms,iekDateParts
} from './data-model.mjs';
import {
  SCHEDULE_MODES,MODE_LABELS,THEMES,pairTime,slideGroups,initialSlide,
  weekMonday,dayDate,boardParity,visibleGroups
} from './schedule-core.mjs';
import {LANGUAGES,translate,formatDate,formatDateRange} from './i18n.js';

const app=document.querySelector('#app');
const shell=document.querySelector('.shell');
const overlayRoot=document.querySelector('#overlay-root');
const nav=document.querySelector('#bottom-nav');
const syncStatus=document.querySelector('#sync-status');
const refreshButton=document.querySelector('#refresh');
const toast=document.querySelector('#toast');
const STORAGE={group:'iek-rasp-group',teacher:'iek-rasp-teacher',mode:'iek-rasp-mode',theme:'iek-rasp-theme',language:'iek-rasp-language'};
const REFRESH_MS=15*60*1000;

function saved(key,fallback='') {try{return localStorage.getItem(key)??fallback}catch{return fallback}}
function save(key,value){try{localStorage.setItem(key,String(value))}catch{ /* private mode */ }}
function savedNumber(key){const value=Number(saved(key));return Number.isInteger(value)&&value>0?value:null}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

const state={
  data:null,page:'home',groupId:savedNumber(STORAGE.group),teacherId:savedNumber(STORAGE.teacher),
  mode:SCHEDULE_MODES.includes(saved(STORAGE.mode))?saved(STORAGE.mode):'three',
  theme:THEMES.some(t=>t.id===saved(STORAGE.theme))?saved(STORAGE.theme):'light',
  language:LANGUAGES.find(language=>language.id===saved(STORAGE.language))?.id??'ru',
  slides:{home:0,teachers:0},slideDirection:1,
  overlay:null,selectionQuery:'',inspected:null,details:new Map(),loading:false,installEvent:null,
  lastRequest:0,lastTodayKey:'',toastTimer:null
};
state.slides.home=state.slides.teachers=initialSlide(state.mode);
const icons={
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></svg>',
  chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 5 7 7-7 7"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 5-7 7 7 7"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>'
};

function applyTheme(){
  document.documentElement.dataset.theme=state.theme;
  const color=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]').content=color;
}
applyTheme();

function t(key,values){return translate(state.language,key,values)}
function msg(key,values){return esc(t(key,values))}
function applyLanguage(){
  document.documentElement.lang=state.language==='ru-pre'?'ru-petr1708':state.language;
  document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=t(node.dataset.i18n)});
  nav.setAttribute('aria-label',t('Основные разделы'));
  refreshButton.title=t('Проверить обновления');
  updateStatus();
}
applyLanguage();

function showToast(text){
  toast.textContent=text;toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer=setTimeout(()=>toast.classList.remove('visible'),2800);
}
function currentTodayKey(){const p=iekDateParts();return `${p.year}-${p.month}-${p.day}`}
function groupById(){return state.data?.groups?.find(group=>Number(group.id)===state.groupId)}
function teacherById(){return state.data?.teachers?.find(teacher=>teacher.id===state.teacherId)}
function groupTitle(id){
  const group=groupDictionary(state.data).get(Number(id));
  if(!group)return t('Неизвестная группа');
  if(!Number.isFinite(Number(group.course))||!String(group.shortName??'').trim())return t('Группа №{number}',{number:group.id});
  const date=iekDateParts(weekMonday());
  return groupName(group,date.year,date.month);
}
function weekLabel(){const parity=boardParity(state.data);return t(parity===0?'Чётная неделя':parity===1?'Нечётная неделя':'Чётность не установлена')}
function weekSummary(){
  const dates=formatDateRange(state.language,dayDate(1),dayDate(6),{timeZone:'UTC',day:'numeric',month:'long'});
  return `<div class="week-summary">
    <span class="week-icon" aria-hidden="true">${icons.calendar}</span>
    <div><strong>${esc(dates)}</strong><span>${esc(weekLabel())}</span></div>
  </div>`;
}
function timestamp(value){
  if(!value||!Number.isFinite(new Date(value).getTime()))return t('нет данных');
  return formatDate(state.language,new Date(value),{timeZone:'Asia/Irkutsk',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
}
function updateStatus(error=''){
  if(!state.data){syncStatus.className='sync-line '+(error?'error':'');syncStatus.querySelector('span').textContent=error||t('Получаем данные расписания…');return}
  const age=Date.now()-new Date(state.data.generatedAt).getTime();
  const missing=(state.data.meta?.groupErrors||0)+(state.data.meta?.teacherErrors||0);
  const stale=!Number.isFinite(age)||age>3*60*60*1000||missing>0||state.data.initialized===false;
  syncStatus.className=`sync-line ${stale?'stale':'ok'}`;
  syncStatus.querySelector('span').textContent=`${t(stale?'Проверьте актуальность':'Обновлено')}: ${timestamp(state.data.generatedAt)} · ${t('Иркутск')}${missing?' · '+t('неполные данные'):''}`;
}
async function loadData(silent=false,showResult=false){
  if(state.loading)return;
  state.loading=true;state.lastRequest=Date.now();
  if(!silent)syncStatus.querySelector('span').textContent=t('Обновляем расписание…');
  try{
    const response=await fetch('./data/schedule.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    if(!data||!Array.isArray(data.groups)||!Array.isArray(data.groupLessons)||!Array.isArray(data.teachers)||!data.teacherSchedules){throw new Error(t('Некорректный формат расписания'))}
    const previous=state.data?.generatedAt;
    state.data=data;
    if(state.groupId&&!data.groups.some(g=>Number(g.id)===state.groupId&&g.visible!==false)){
      state.groupId=null;try{localStorage.removeItem(STORAGE.group)}catch{}
      state.overlay=null;state.inspected=null;state.selectionQuery='';
    }
    if(state.teacherId&&!data.teachers.some(t=>t.id===state.teacherId))state.teacherId=null;
    updateStatus();render();
    if(showResult)showToast(t(previous===data.generatedAt?'Новых данных пока нет':'Расписание обновлено'));
  }catch(error){
    if(!state.data){
      updateStatus(t('Не удалось загрузить: {error}',{error:error.message}));
      app.innerHTML=`<section class="panel"><h1 class="page-title">${msg('Расписание недоступно')}</h1><p class="panel-desc">${msg('Не удалось получить данные. Проверьте интернет-соединение или повторите попытку.')}</p><button type="button" data-action="refresh-data" class="wide-button">${msg('Попробовать снова')} ${icons.chevron}</button></section>`;
    }else{
      updateStatus();
      if(showResult)showToast(t('Нет соединения — показано сохранённое расписание'));
    }
  }finally{state.loading=false}
}

function modeControls(){
  return `<div class="mode-switch" role="group" aria-label="${msg('Режим отображения')}">${SCHEDULE_MODES.map(mode=>`<button type="button" class="mode-button" data-action="mode" data-mode="${mode}" aria-pressed="${state.mode===mode}">${msg(MODE_LABELS[mode])}</button>`).join('')}</div>`;
}

function renderHome(){
  const group=groupById();
  const lessons=groupSchedule(state.data,state.groupId);
  return `
    <section class="intro">
      <div><h1 class="page-title">${msg('Моё расписание')}</h1>
        <p class="intro-sub">${msg('Учебная группа')} <strong>${esc(groupTitle(group.id))}</strong></p>
      </div>
      ${weekSummary()}
    </section>
    ${renderSchedule(lessons,'group')}`;
}

function renderTeachers(){
  const teacher=teacherById();
  const lessons=teacher?teacherSchedule(state.data,teacher.id):[];
  return `
    <div class="intro">
      <h1 class="page-title">${msg('Преподаватели')}</h1>
      ${teacher?weekSummary():''}
    </div>
    <section class="panel teacher-panel">
      <button type="button" class="select-button" data-action="teacher-picker"><span>${esc(teacher?teacherDisplayName(teacher.name):t('Выбрать преподавателя'))}</span>${icons.chevron}</button>
    </section>
    ${teacher?renderSchedule(lessons,'teacher'):''}`;
}

function renderSettings(){
  const group=groupById();
  return `
    <div class="page-head"><h1 class="page-title">${msg('Настройки')}</h1></div>
    <div class="settings-grid">
      <section class="panel">
        <h2>${msg('Моя группа')}</h2>
        <button type="button" class="select-button" data-action="group-picker"><span>${esc(group?groupTitle(group.id):t('Выберите группу'))}</span>${icons.chevron}</button>
      </section>
      <section class="panel">
        <h2><label for="language">${msg('Язык')}</label></h2>
        <select class="language-select" id="language">${LANGUAGES.map(language=>`<option value="${language.id}" ${state.language===language.id?'selected':''}>${msg(language.name)}</option>`).join('')}</select>
      </section>
      <section class="panel theme-panel">
        <h2>${msg('Тема приложения')}</h2>
        <div class="theme-options">${THEMES.map(theme=>`<button type="button" class="theme-option" data-action="theme" data-theme="${theme.id}" title="${msg(theme.description)}" aria-pressed="${state.theme===theme.id}"><span class="theme-swatch ${theme.id}" aria-hidden="true"><b></b></span><strong>${msg(theme.name)}</strong></button>`).join('')}</div>
      </section>
      <section class="panel">
        <h2>${msg('О приложении')}</h2>
        <div class="about-copy">
          <p><strong>${msg('Разработано: Купряков Е.И.')}</strong></p>
          <p>${msg('Приложение неофициальное и не имеет никакого отношения к ГБПОУ ИЭК.')}</p>
          <p>${msg('Все данные берутся из открытых API ГБПОУ ИЭК.')}</p>
        </div>
        <footer class="about-copyright">${msg('© {year} Купряков Е.И.',{year:2026})}</footer>
      </section>
      <section class="panel">
        <h2>${msg('Установка приложения')}</h2>
        ${state.installEvent?`<button class="wide-button" type="button" data-action="install">${msg('Установить приложение')} ${icons.chevron}</button>`:`<p class="install-hint">${msg('Через меню браузера: «Установить приложение» или «На экран Домой».')}</p>`}
      </section>
    </div>`;
}

function slideControls(groups,index){
  const today=iekDateParts().weekday;
  const prev=(index-1+groups.length)%groups.length,next=(index+1)%groups.length;
  const ranges=groups.map((days,i)=>`<button type="button" class="slide-group" data-action="slide" data-slide="${i}" aria-label="${days.map(day=>msg(DAYS[day-1])).join(', ')}${days.includes(today)?', '+msg('включая сегодня'):''}" aria-pressed="${i===index}">
    ${msg(SHORT_DAYS[days[0]-1])}–${msg(SHORT_DAYS[days.at(-1)-1])}${days.includes(today)?'<span class="today-dot" aria-hidden="true"></span>':''}
  </button>`).join('');
  return `<div class="slider-head"><button type="button" class="slider-arrow" data-action="slide" data-slide="${prev}" data-direction="previous" aria-label="${msg('Предыдущие дни')}">${icons.left}</button><div class="slide-indicators" role="group" aria-label="${msg('Выбор дней недели')}">${ranges}</div><button type="button" class="slider-arrow" data-action="slide" data-slide="${next}" data-direction="next" aria-label="${msg('Следующие дни')}">${icons.chevron}</button></div>`;
}

function renderSchedule(lessons,context){
  const parity=boardParity(state.data);
  const board=buildWeekBoard(lessons,parity);
  const groups=slideGroups(state.mode);
  const index=Math.max(0,Math.min(groups.length-1,state.slides[state.page]||0));
  const days=groups[index];
  state.details=new Map();
  let counter=0;

  const renderItem=(item,day,pair,weekSpecific=false)=>{
    const id=++counter;
    state.details.set(id,{item,context,day,pair});
    const title=item.subject||item.edit?.subject||t('Занятие');
    const room=splitRooms(item.room).join(' / ')||'—';
    const teacher=(item.teacher||t('Не указан')).replace(/\s*\/\/\s*/g,' / ');
    const group=context==='teacher'?groupTitle(item.groupId):'';
    const subtitle=context==='teacher'?`${group} · ${teacher}`:teacher;
    const isEven=Number(item.typeWeek)===0;
    const week=weekSpecific?t(isEven?'Чётная':'Нечётная'):'';
    const described=`${title}. ${subtitle}. ${t('Кабинет {room}',{room})}.${week?` ${t(isEven?'Чётная неделя':'Нечётная неделя')}.`:''}`;
    return `<button type="button" class="lesson-variant ${weekSpecific?'has-parity':''} ${item.active?'is-active':'is-dimmed'}" data-action="lesson-detail" data-detail="${id}" aria-label="${esc(described)}" title="${esc(described)}">
      <span class="lesson-subject">${esc(title)}</span>
      <span class="lesson-teacher">${esc(teacher)}</span>
      <span class="lesson-meta">
        <span class="lesson-room">${icons.pin}<span>${esc(room)}</span></span>
        ${context==='teacher'?`<span class="teacher-group">${esc(group)}</span>`:''}
        ${week?`<span class="lesson-week">${esc(week)}</span>`:''}
      </span>
    </button>`;
  };
  const renderPair=({pair,entries},day)=>{
    const times=pairTime(day,pair);
    const {common,even,odd,hasAlternatives}=splitPairVariants(entries);
    const regular=common.map(item=>renderItem(item,day,pair)).join('');
    const alternating=hasAlternatives?[
      ...even.map(item=>renderItem(item,day,pair,true)),
      ...odd.map(item=>renderItem(item,day,pair,true))
    ].join(''):'';
    return `<div class="pair-row ${entries.some(item=>item.active)?'has-now':''}">
      <div class="pair-aside"><strong>${msg('{number} пара',{number:pair})}</strong><span class="pair-time">${times?`${times[0]}<br>${times[1]}`:'—'}</span></div>
      <div class="pair-body">${entries.length?`<div class="lesson-variants">${regular}${alternating}</div>`:`<span class="no-pair">${msg('Нет занятий')}</span>`}</div>
    </div>`;
  };
  const today=iekDateParts().weekday;
  const renderDay=(dayNumber)=>{
    const day=board[dayNumber-1];
    const date=formatDate(state.language,dayDate(dayNumber),{timeZone:'UTC',day:'numeric',month:'short'});
    const extraPairs=[...new Set(day.extra.map(e=>e.pair))].sort((a,b)=>a-b);
    const extras=extraPairs.map(pair=>({pair,entries:day.extra.filter(item=>item.pair===pair).map(item=>({...item,active:activeForWeek(item,parity)}))}));
    const rows=[...day.rows,...extras].map(row=>{
      const pair=renderPair(row,dayNumber);
      return dayNumber===2&&row.pair===2
        ? `${pair}<p class="class-hour">${msg('Классный час')}</p>`
        : pair;
    });
    return `<section class="day-card ${dayNumber===today?'is-today':''}">
      <div class="day-heading"><div><h2>${msg(DAYS[dayNumber-1])}</h2><span class="day-date">${esc(date)}</span></div>${dayNumber===today?`<span class="today-label">${msg('Сегодня')}</span>`:''}</div>
      <div class="day-slots">${rows.join('')}</div>
    </section>`;
  };
  const slideClass=state.slideDirection>0?'slide-forward':'slide-back';
  return `<div class="schedule-toolbar">${modeControls()}${state.mode==='week'?'':slideControls(groups,index)}</div>
    <div class="${state.mode==='week'?'':'slide-stage '+slideClass}" ${state.mode==='week'?'':`tabindex="0" aria-label="${msg('Перелистывайте дни свайпом вправо или влево')}"`}>
      <div class="days days--${state.mode}">${days.map(renderDay).join('')}</div>
    </div>`;
}

function renderGroupOptions(query=''){
  const q=query.trim().toLocaleLowerCase('ru');
  const groups=visibleGroups(state.data).filter(g=>g.label.toLocaleLowerCase('ru').includes(q));
  if(!groups.length)return `<div class="teacher-empty"><strong>${msg(state.data.groups.length?'Ничего не найдено':'Список групп пока недоступен')}</strong></div>`;
  return [...new Set(groups.map(group=>group.course))].map(course=>`<section class="group-section"><h3>${msg('{number} курс',{number:course})}</h3><div class="group-buttons">${groups.filter(g=>g.course===course).map(g=>`<button type="button" class="group-choice" data-action="choose-group" data-group="${g.id}"><span>${esc(g.label)}</span>${icons.chevron}</button>`).join('')}</div></section>`).join('');
}
function renderGroupPicker(){
  const firstTime=!groupById();
  const fields=`
    <label class="field" for="group-search">${msg('Поиск группы')}</label><input id="group-search" class="search-input onboard-search" type="search" autocomplete="off" placeholder="${msg('Например, ТИТО или КСК')}" value="${esc(state.selectionQuery)}">
    <div class="group-list" id="group-results">${renderGroupOptions(state.selectionQuery)}</div>`;
  if(firstTime)return `<section class="onboard-panel">
    <div class="onboard-intro">
      <span class="onboard-icon" aria-hidden="true">${icons.calendar}</span>
      <h1 class="page-title">${msg('Расписание занятий')}</h1>
    </div>
    <div class="onboard-fields"><h2>${msg('Выберите группу')}</h2>${fields}</div>
  </section>`;
  return `<div class="modal-backdrop" data-action="close-overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="group-picker-title">
    <div class="dialog-title"><h2 id="group-picker-title">${msg('Выберите группу')}</h2><button type="button" class="icon-button" data-action="close-overlay" aria-label="${msg('Закрыть')}">×</button></div>
    ${fields}
  </section></div>`;
}
function renderTeacherOptions(query=''){
  const q=query.trim().toLocaleLowerCase('ru').replace(/[.\s]/g,'');
  const teachers=state.data.teachers.filter(t=>t.name).map(t=>({id:t.id,label:teacherDisplayName(t.name)}))
    .filter(t=>t.label.toLocaleLowerCase('ru').replace(/[.\s]/g,'').includes(q))
    .sort((a,b)=>a.label.localeCompare(b.label,'ru'));
  if(!teachers.length)return `<div class="teacher-empty"><strong>${msg('Ничего не найдено')}</strong></div>`;
  return teachers.map(t=>`<button type="button" class="teacher-choice" data-action="choose-teacher" data-teacher="${t.id}">${esc(t.label)}</button>`).join('');
}
function renderTeacherPicker(){
  return `<div class="modal-backdrop" data-action="close-overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="teacher-picker-title"><div class="dialog-title"><h2 id="teacher-picker-title">${msg('Выберите преподавателя')}</h2><button type="button" class="icon-button" data-action="close-overlay" aria-label="${msg('Закрыть')}">×</button></div>
    <label class="field" for="teacher-search">${msg('Поиск преподавателя')}</label><input type="search" id="teacher-search" class="search-input dialog-search" placeholder="${msg('Введите фамилию')}" autocomplete="off" value="${esc(state.selectionQuery)}">
    <div class="teacher-options" id="teacher-results">${renderTeacherOptions(state.selectionQuery)}</div>
  </section></div>`;
}
function renderDetail(){
  const {item,context,day,pair}=state.inspected;
  const dateMode=t(item.typeWeek==null?'Каждую неделю':Number(item.typeWeek)===0?'Чётная неделя':'Нечётная неделя');
  const room=splitRooms(item.room).join(' / ')||t('Не указана');
  const current=t(boardParity(state.data)==null?'Чётность неизвестна':item.active?'Сейчас актуально':'На другой неделе');
  const times=pairTime(day,pair);
  const values=[
    ['День',t(DAYS[day-1])],['Пара',String(pair)],['Время',times?times.join(' — '):t('Уточняется')],
    ['Предмет',item.subject||item.edit?.subject||t('Занятие')],
    ['Преподаватель',item.teacher||t('Не указан')],
    ...(context==='teacher'?[['Группа',groupTitle(item.groupId)]]:[]),
    ['Аудитория',room],['Чётность',`${dateMode} · ${current}`]
  ];
  return `<div class="modal-backdrop" data-action="close-overlay"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-title"><div class="dialog-title"><h2 id="lesson-title">${msg('Занятие')}</h2><button type="button" class="icon-button" data-action="close-overlay" aria-label="${msg('Закрыть')}">×</button></div>
    <dl class="detail-fields">${values.map(([label,value])=>`<div class="detail-field"><dt>${msg(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
    ${item.edit?`<div class="detail-edit">${msg('В API есть информация об изменении занятия. Дата действия изменения не подтверждена.')}</div>`:''}
  </section></div>`;
}
function renderOverlay(){
  const active=document.activeElement;
  const searchId=overlayRoot.contains(active)&&active.matches('input[type="search"]')?active.id:null;
  overlayRoot.innerHTML=state.overlay==='group'?renderGroupPicker():state.overlay==='teacher'?renderTeacherPicker():state.overlay==='detail'&&state.inspected?renderDetail():'';
  const dialog=overlayRoot.querySelector('.dialog');
  shell.inert=Boolean(dialog);
  document.body.classList.toggle('has-dialog',Boolean(dialog));
  const focusTarget=searchId?document.getElementById(searchId):dialog?.querySelector('.icon-button');
  focusTarget?.focus({preventScroll:true});
}
let dialogTrigger=null;
function closeOverlay(){
  state.overlay=null;state.inspected=null;state.selectionQuery='';
  renderOverlay();
  (dialogTrigger?.isConnected?dialogTrigger:app).focus({preventScroll:true});
  dialogTrigger=null;
}
function render(){
  if(!state.data)return;
  state.lastTodayKey=currentTodayKey();
  const selectedGroup=groupById();
  nav.classList.toggle('is-hidden',!selectedGroup);
  nav.querySelectorAll('[data-page]').forEach(button=>{
    const active=button.dataset.page===state.page;
    button.classList.toggle('is-current',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  const search=app.querySelector('#group-search');
  const wasSearching=search&&document.activeElement===search;
  app.innerHTML=selectedGroup?(state.page==='home'?renderHome():state.page==='teachers'?renderTeachers():renderSettings()):renderGroupPicker();
  if(wasSearching)app.querySelector('#group-search')?.focus({preventScroll:true});
  renderOverlay();
}
function setPage(page){
  if(!['home','teachers','settings'].includes(page))return;
  state.page=page;state.overlay=null;state.inspected=null;
  render();window.scrollTo({top:0,behavior:'instant'});
  app.focus({preventScroll:true});
}
function changeSlide(index,focusSelector){
  const groups=slideGroups(state.mode);
  if(groups.length<2)return;
  const next=(index+groups.length)%groups.length;
  state.slideDirection=next>=state.slides[state.page]?1:-1;
  state.slides[state.page]=next;
  render();
  if(focusSelector)app.querySelector(focusSelector)?.focus({preventScroll:true});
}

nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-page]');
  if(button)setPage(button.dataset.page);
});
app.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='mode'){
    state.mode=button.dataset.mode;save(STORAGE.mode,state.mode);
    state.slides.home=state.slides.teachers=initialSlide(state.mode);
    state.slideDirection=1;render();
    app.querySelector('.mode-button[aria-pressed="true"]')?.focus({preventScroll:true});
  }
  if(action==='slide')changeSlide(Number(button.dataset.slide),button.dataset.direction?`.slider-arrow[data-direction="${button.dataset.direction}"]`:'.slide-group[aria-pressed="true"]');
  if(action==='group-picker'||action==='teacher-picker'){
    dialogTrigger=button;
    state.overlay=action==='group-picker'?'group':'teacher';state.selectionQuery='';renderOverlay();
  }
  if(action==='lesson-detail'){
    dialogTrigger=button;
    state.inspected=state.details.get(Number(button.dataset.detail))||null;
    state.overlay=state.inspected?'detail':null;renderOverlay();
  }
  if(action==='theme'){
    const theme=button.dataset.theme;
    if(THEMES.some(t=>t.id===theme)){
      state.theme=theme;save(STORAGE.theme,theme);
      applyTheme();render();
      app.querySelector('.theme-option[aria-pressed="true"]')?.focus({preventScroll:true});
    }
  }
  if(action==='install'&&state.installEvent){
    const prompt=state.installEvent;state.installEvent=null;
    prompt.prompt();render();
  }
  if(action==='refresh-data')loadData(true,true);
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');
  if(!button)return;
  if(button.dataset.action==='close-overlay'&&(event.target===button||button.tagName==='BUTTON'))closeOverlay();
  if(button.dataset.action==='choose-group'){
    state.groupId=Number(button.dataset.group);save(STORAGE.group,state.groupId);
    state.selectionQuery='';dialogTrigger=null;
    setPage('home');showToast(t('Ваша группа: {name}',{name:groupTitle(state.groupId)}));
  }
  if(button.dataset.action==='choose-teacher'){
    state.teacherId=Number(button.dataset.teacher);save(STORAGE.teacher,state.teacherId);
    state.selectionQuery='';dialogTrigger=null;state.slides.teachers=initialSlide(state.mode);
    setPage('teachers');
  }
});
document.addEventListener('input',event=>{
  if(event.target.id==='group-search'){
    state.selectionQuery=event.target.value;
    document.querySelector('#group-results').innerHTML=renderGroupOptions(state.selectionQuery);
  }
  if(event.target.id==='teacher-search'){
    state.selectionQuery=event.target.value;
    const results=overlayRoot.querySelector('#teacher-results');if(results)results.innerHTML=renderTeacherOptions(state.selectionQuery);
  }
});
app.addEventListener('change',event=>{
  if(event.target.id!=='language')return;
  const language=LANGUAGES.find(option=>option.id===event.target.value);
  if(!language||language.id===state.language)return;
  state.language=language.id;
  save(STORAGE.language,language.id);
  clearTimeout(state.toastTimer);
  toast.classList.remove('visible');
  toast.textContent='';
  applyLanguage();
  render();
  app.querySelector('#language')?.focus({preventScroll:true});
});
refreshButton.addEventListener('click',()=>loadData(true,true));
document.addEventListener('keydown',event=>{
  if(state.overlay&&event.key==='Escape'){closeOverlay();return}
  if(state.overlay&&event.key==='Tab'){
    const controls=overlayRoot.querySelectorAll('.dialog button, .dialog input');
    const first=controls[0],last=controls[controls.length-1];
    if((event.shiftKey&&event.target===first)||(!event.shiftKey&&event.target===last)){
      event.preventDefault();
      (event.shiftKey?last:first).focus();
    }
  }
  if(['ArrowLeft','ArrowRight'].includes(event.key)&&!state.overlay&&event.target.closest('.slide-stage')){
    event.preventDefault();changeSlide(state.slides[state.page]+(event.key==='ArrowLeft'?-1:1),'.slide-stage');
  }
});
let swipe=null;
app.addEventListener('touchstart',event=>{
  if(!event.target.closest('.slide-stage')||event.touches.length!==1)return;
  swipe={x:event.touches[0].clientX,y:event.touches[0].clientY};
},{passive:true});
app.addEventListener('touchcancel',()=>{swipe=null},{passive:true});
app.addEventListener('touchend',event=>{
  if(!swipe||!event.changedTouches.length)return;
  const dx=event.changedTouches[0].clientX-swipe.x,dy=event.changedTouches[0].clientY-swipe.y;
  swipe=null;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)changeSlide(state.slides[state.page]+(dx<0?1:-1));
},{passive:true});
function refreshIfDue(){
  if(document.hidden)return;
  const today=currentTodayKey();
  if(state.data&&today!==state.lastTodayKey){
    state.slides.home=state.slides.teachers=initialSlide(state.mode);render();
  }
  if(state.data&&Date.now()-state.lastRequest>=REFRESH_MS)loadData(true);
}
document.addEventListener('visibilitychange',refreshIfDue);
window.addEventListener('online',()=>{if(state.data)loadData(true)});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.installEvent=event;if(state.page==='settings')render()});
window.addEventListener('appinstalled',()=>{state.installEvent=null;showToast(t('Приложение установлено'));if(state.page==='settings')render()});
setInterval(refreshIfDue,60000);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
loadData();
