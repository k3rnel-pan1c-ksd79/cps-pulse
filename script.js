(() => {
  'use strict';

  /**
   * CPS Pulse
   * A dependency-free click-speed test. The clock is driven by performance.now()
   * and a single requestAnimationFrame loop so measurements remain precise.
   */

  const CONFIG = Object.freeze({
    storageKey: 'cps-pulse:state:v1',
    sessionKey: 'cps-pulse:session-record:v1',
    durations: [1, 5, 10, 15, 30, 60, 100],
    maxResults: 12,
    maxHistoryItems: 18,
    maxEffectParticles: 44,
    sampleInterval: 110
  });

  const byId = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const hasDialogSupport = typeof HTMLDialogElement !== 'undefined';

  const dom = {
    root: document.documentElement,
    body: document.body,
    app: byId('app'),
    loader: byId('appLoader'),
    loaderMessage: byId('loaderMessage'),
    welcome: byId('welcomeScreen'),
    welcomeEnter: byId('welcomeEnter'),
    durationButtons: Array.from(document.querySelectorAll('[data-duration]')),
    durationSelect: byId('durationSelect'),
    start: byId('startBtn'),
    restart: byId('restartBtn'),
    stop: byId('stopBtn'),
    clickArea: byId('clickArea'),
    clickStage: byId('clickStage'),
    clickEffects: byId('clickEffects'),
    clickCount: byId('clickCount'),
    clickPadStatus: byId('clickPadStatus'),
    clickPadHint: byId('clickPadHint'),
    testStatus: byId('testStatus'),
    testStatusDot: byId('testStatusDot'),
    timeRemaining: byId('timeRemaining'),
    elapsedTime: byId('elapsedTime'),
    currentCps: byId('currentCps'),
    currentCpsTrend: byId('currentCpsTrend'),
    averageCps: byId('averageCps'),
    maxCps: byId('maxCps'),
    historicRecord: byId('historicRecord'),
    sessionRecord: byId('sessionRecord'),
    maxSpeed: byId('maxSpeedValue') || byId('maxSpeed'),
    minSpeed: byId('minSpeedValue') || byId('minSpeed'),
    progress: byId('testProgress'),
    progressFill: byId('progressFill'),
    chart: byId('cpsChart'),
    chartWrap: byId('chartWrap'),
    chartEmpty: byId('chartEmptyState'),
    clickHistory: byId('clickHistory'),
    clickHistoryEmpty: byId('clickHistoryEmpty'),
    historyCount: byId('historyCount'),
    historyScroll: byId('historyScroll'),
    sessionBadge: byId('sessionBadge'),
    performanceLevel: byId('performanceLevel'),
    performanceLevelBar: byId('performanceLevelBar'),
    recentResults: byId('recentResultsList'),
    recentResultsEmpty: byId('recentResultsEmpty'),
    clearRecentResults: byId('clearRecentResultsButton'),
    theme: byId('themeBtn'),
    sound: byId('soundBtn'),
    fullscreen: byId('fullscreenBtn'),
    language: byId('languageSelect'),
    settings: byId('settingsBtn'),
    settingsModal: byId('settingsModal'),
    settingsForm: byId('settingsForm'),
    closeSettings: byId('closeSettingsButton'),
    themeInputs: Array.from(document.querySelectorAll('input[name="theme"]')),
    reduceMotion: byId('reduceMotionToggle'),
    particles: byId('particlesToggle'),
    soundSetting: byId('soundSettingToggle'),
    haptics: byId('hapticsToggle'),
    defaultDuration: byId('defaultDurationSelect'),
    settingsLanguage: byId('settingsLanguageSelect'),
    resetStoredData: byId('resetStoredDataButton'),
    resultsModal: byId('resultsModal'),
    resultSummary: byId('resultSummary'),
    closeResults: byId('closeResultsButton'),
    resultRestart: byId('resultRestartButton'),
    resultCps: byId('resultCps'),
    resultClicks: byId('resultClicks'),
    resultAverage: byId('resultAverageCps'),
    resultPeak: byId('resultPeakCps'),
    resultDuration: byId('resultDuration'),
    resultsKicker: byId('resultsKicker'),
    resultsMessage: byId('resultsMessage'),
    newRecordBadge: byId('newRecordBadge'),
    share: byId('shareBtn'),
    copy: byId('copyBtn'),
    keyboardHelp: byId('keyboardHelpButton'),
    keyboardModal: byId('keyboardHelpModal'),
    closeKeyboardHelp: byId('closeKeyboardHelpButton'),
    keyboardHelpDone: byId('keyboardHelpDoneButton'),
    toastContainer: byId('toastContainer'),
    toastTemplate: byId('toastTemplate'),
    clickHistoryTemplate: byId('clickHistoryItemTemplate'),
    recentResultTemplate: byId('recentResultTemplate'),
    particleField: byId('particleField'),
    cursorGlow: byId('cursorGlow'),
    announcer: byId('gameAnnouncer'),
    year: byId('currentYear'),
    themeColor: document.querySelector('meta[name="theme-color"]')
  };

  const COPY = {
    es: {
      'welcome.eyebrow': 'PRECISIÓN · VELOCIDAD · RITMO',
      'welcome.copy': 'Mide tus clicks por segundo y supera tu mejor marca en una experiencia hecha para la velocidad.',
      'welcome.featureOne': '7 duraciones',
      'welcome.featureTwo': 'Métricas en vivo',
      'welcome.featureThree': 'Récords guardados',
      'welcome.enter': 'Entrar al test',
      'welcome.note': 'También puedes pulsar Enter',
      'dashboard.eyebrow': 'ENTRENA TU VELOCIDAD',
      'dashboard.title': 'Click. Rompe tu límite.',
      'dashboard.toStart': 'para empezar',
      'duration.kicker': 'CONFIGURACIÓN',
      'duration.title': 'Elige tu duración',
      'duration.seconds': 'seg',
      'status.ready': 'Listo para comenzar',
      'timer.label': 'TIEMPO RESTANTE',
      'pad.waiting': 'EN ESPERA',
      'pad.clicks': 'CLICKS',
      'pad.hint': 'Pulsa comenzar',
      'pad.help': 'Cuando el test esté activo, haz clic o toca esta zona tan rápido como puedas.',
      'controls.start': 'Comenzar',
      'controls.restart': 'Reiniciar',
      'controls.stop': 'Detener',
      'stats.currentCps': 'CPS ACTUAL',
      'stats.clicksPerSecond': 'clicks por segundo',
      'stats.elapsed': 'TRANSCURRIDO',
      'stats.seconds': 'segundos',
      'stats.average': 'CPS PROMEDIO',
      'stats.averageUnit': 'ritmo global',
      'stats.peak': 'CPS MÁXIMO',
      'stats.peakUnit': 'pico instantáneo',
      'stats.record': 'RÉCORD',
      'stats.recordUnit': 'mejor histórico',
      'chart.kicker': 'RITMO EN VIVO',
      'chart.title': 'Evolución del CPS',
      'chart.legend': 'CPS',
      'chart.empty': 'Tu ritmo aparecerá aquí',
      'session.kicker': 'ESTA SESIÓN',
      'session.title': 'Tu rendimiento',
      'session.badge': 'EN CALMA',
      'session.record': 'Récord de sesión',
      'session.maxSpeed': 'Velocidad máxima',
      'session.minSpeed': 'Velocidad mínima',
      'session.level': 'Nivel',
      'history.kicker': 'SECUENCIA',
      'history.title': 'Historial de clics',
      'history.events': 'eventos',
      'history.empty': 'Esperando el primer click…',
      'recent.kicker': 'GUARDADO LOCALMENTE',
      'recent.title': 'Últimos intentos',
      'recent.clear': 'Limpiar historial',
      'recent.empty': 'Tus resultados aparecerán aquí al completar un test.',
      'footer.tagline': 'Hecho para perseguir el siguiente click.',
      'settings.kicker': 'PERSONALIZA TU ARENA',
      'settings.title': 'Configuración',
      'settings.appearance': 'Apariencia',
      'settings.dark': 'Oscuro',
      'settings.light': 'Claro',
      'settings.motion': 'Animaciones completas',
      'settings.motionHelp': 'Reduce el movimiento si lo prefieres.',
      'settings.particles': 'Partículas y efectos',
      'settings.particlesHelp': 'Activa la respuesta visual en cada click.',
      'settings.feedback': 'Respuesta',
      'settings.sound': 'Sonidos',
      'settings.soundHelp': 'Clicks, controles y nuevos récords.',
      'settings.haptics': 'Vibración táctil',
      'settings.hapticsHelp': 'Solo en dispositivos compatibles.',
      'settings.defaults': 'Preferencias de test',
      'settings.defaultDuration': 'Duración predeterminada',
      'settings.language': 'Idioma',
      'settings.data': 'Datos locales',
      'settings.dataHelp': 'Puedes eliminar tu récord, resultados y preferencias guardadas en este navegador.',
      'settings.resetData': 'Restablecer datos',
      'settings.cancel': 'Cancelar',
      'settings.save': 'Guardar cambios',
      'results.complete': 'TEST COMPLETADO',
      'results.title': 'Tu pulso final',
      'results.defaultMessage': 'Cada click cuenta. ¿Listo para superar tu marca?',
      'results.newRecord': 'Nuevo récord personal',
      'results.clicks': 'Clicks totales',
      'results.average': 'CPS promedio',
      'results.peak': 'Pico de CPS',
      'results.duration': 'Duración',
      'results.again': 'Intentar de nuevo',
      'results.share': 'Compartir',
      'results.copy': 'Copiar',
      'keyboard.kicker': 'ACCESIBILIDAD',
      'keyboard.title': 'Atajos de teclado',
      'keyboard.space': 'Comenzar un test o hacer click durante un test.',
      'keyboard.restart': 'Reiniciar el test actual.',
      'keyboard.sound': 'Activar o desactivar sonido.',
      'keyboard.fullscreen': 'Alternar pantalla completa.',
      'keyboard.escape': 'Cerrar ventanas o detener el test.',
      'keyboard.done': 'Entendido'
    },
    en: {
      'welcome.eyebrow': 'PRECISION · SPEED · RHYTHM',
      'welcome.copy': 'Measure your clicks per second and beat your best score in an experience made for speed.',
      'welcome.featureOne': '7 durations',
      'welcome.featureTwo': 'Live metrics',
      'welcome.featureThree': 'Saved records',
      'welcome.enter': 'Enter the test',
      'welcome.note': 'You can also press Enter',
      'dashboard.eyebrow': 'TRAIN YOUR SPEED',
      'dashboard.title': 'Click. Break your limit.',
      'dashboard.toStart': 'to start',
      'duration.kicker': 'SETUP',
      'duration.title': 'Choose your duration',
      'duration.seconds': 'sec',
      'status.ready': 'Ready to begin',
      'timer.label': 'TIME LEFT',
      'pad.waiting': 'WAITING',
      'pad.clicks': 'CLICKS',
      'pad.hint': 'Press start',
      'pad.help': 'While the test is active, click or tap this area as fast as you can.',
      'controls.start': 'Start',
      'controls.restart': 'Restart',
      'controls.stop': 'Stop',
      'stats.currentCps': 'CURRENT CPS',
      'stats.clicksPerSecond': 'clicks per second',
      'stats.elapsed': 'ELAPSED',
      'stats.seconds': 'seconds',
      'stats.average': 'AVERAGE CPS',
      'stats.averageUnit': 'overall pace',
      'stats.peak': 'PEAK CPS',
      'stats.peakUnit': 'instant peak',
      'stats.record': 'RECORD',
      'stats.recordUnit': 'all-time best',
      'chart.kicker': 'LIVE PACE',
      'chart.title': 'CPS evolution',
      'chart.legend': 'CPS',
      'chart.empty': 'Your pace will appear here',
      'session.kicker': 'THIS SESSION',
      'session.title': 'Your performance',
      'session.badge': 'AT EASE',
      'session.record': 'Session record',
      'session.maxSpeed': 'Maximum speed',
      'session.minSpeed': 'Minimum speed',
      'session.level': 'Level',
      'history.kicker': 'SEQUENCE',
      'history.title': 'Click history',
      'history.events': 'events',
      'history.empty': 'Waiting for the first click…',
      'recent.kicker': 'SAVED LOCALLY',
      'recent.title': 'Recent attempts',
      'recent.clear': 'Clear history',
      'recent.empty': 'Your results will appear here after you complete a test.',
      'footer.tagline': 'Made to chase the next click.',
      'settings.kicker': 'CUSTOMIZE YOUR ARENA',
      'settings.title': 'Settings',
      'settings.appearance': 'Appearance',
      'settings.dark': 'Dark',
      'settings.light': 'Light',
      'settings.motion': 'Full animations',
      'settings.motionHelp': 'Reduce motion if you prefer.',
      'settings.particles': 'Particles and effects',
      'settings.particlesHelp': 'Enable visual response on every click.',
      'settings.feedback': 'Feedback',
      'settings.sound': 'Sounds',
      'settings.soundHelp': 'Clicks, controls and new records.',
      'settings.haptics': 'Touch vibration',
      'settings.hapticsHelp': 'Only on supported devices.',
      'settings.defaults': 'Test preferences',
      'settings.defaultDuration': 'Default duration',
      'settings.language': 'Language',
      'settings.data': 'Local data',
      'settings.dataHelp': 'You can erase your record, results and preferences stored in this browser.',
      'settings.resetData': 'Reset data',
      'settings.cancel': 'Cancel',
      'settings.save': 'Save changes',
      'results.complete': 'TEST COMPLETE',
      'results.title': 'Your final pulse',
      'results.defaultMessage': 'Every click counts. Ready to beat your score?',
      'results.newRecord': 'New personal record',
      'results.clicks': 'Total clicks',
      'results.average': 'Average CPS',
      'results.peak': 'Peak CPS',
      'results.duration': 'Duration',
      'results.again': 'Try again',
      'results.share': 'Share',
      'results.copy': 'Copy',
      'keyboard.kicker': 'ACCESSIBILITY',
      'keyboard.title': 'Keyboard shortcuts',
      'keyboard.space': 'Start a test or click while a test is running.',
      'keyboard.restart': 'Restart the current test.',
      'keyboard.sound': 'Turn sound on or off.',
      'keyboard.fullscreen': 'Toggle fullscreen.',
      'keyboard.escape': 'Close windows or stop the test.',
      'keyboard.done': 'Got it'
    }
  };

  const dynamicCopy = {
    es: {
      ready: 'Listo para comenzar',
      running: '¡Dale, no pares!',
      stopped: 'Test detenido',
      complete: '¡Tiempo terminado!',
      waiting: 'EN ESPERA',
      active: 'A TODA VELOCIDAD',
      stoppedPad: 'PAUSADO',
      finished: 'FINALIZADO',
      padHint: 'Haz click tan rápido como puedas',
      restartHint: 'Listo para otro intento',
      newRecord: '¡Nuevo récord personal!',
      testStarted: 'Test iniciado. ¡Haz click rápido!',
      testStopped: 'Test detenido. Tu resultado está listo.',
      themeDark: 'Tema oscuro activado',
      themeLight: 'Tema claro activado',
      soundOn: 'Sonido activado',
      soundOff: 'Sonido desactivado',
      settingsSaved: 'Configuración guardada',
      copied: 'Resultado copiado al portapapeles',
      copyFailed: 'No se pudo copiar automáticamente',
      shared: 'Resultado compartido',
      shareFallback: 'Resultado copiado para compartir',
      fullOn: 'Pantalla completa activada',
      fullOff: 'Pantalla completa cerrada',
      durationLocked: 'Detén o reinicia el test para cambiar la duración',
      historyCleared: 'Historial de resultados eliminado',
      dataReset: 'Datos locales restablecidos',
      noResult: 'Completa un test para compartir tu resultado',
      recordMessage: 'Tu ritmo rompió tu mejor marca. Sigue así.',
      resultMessage: 'Buen intento. El próximo pulso puede ser tu récord.',
      stoppedMessage: 'Este intento se detuvo antes de tiempo. Cuando quieras, vuelve a intentarlo.',
      level: ['Warm up', 'Ágil', 'Rápido', 'Élite', 'Imparable'],
      session: ['EN CALMA', 'EN MARCHA', 'EN RITMO', 'MODO BESTIA']
    },
    en: {
      ready: 'Ready to begin',
      running: 'Go, do not stop!',
      stopped: 'Test stopped',
      complete: 'Time is up!',
      waiting: 'WAITING',
      active: 'FULL SPEED',
      stoppedPad: 'PAUSED',
      finished: 'FINISHED',
      padHint: 'Click as fast as you can',
      restartHint: 'Ready for another attempt',
      newRecord: 'New personal record!',
      testStarted: 'Test started. Click fast!',
      testStopped: 'Test stopped. Your result is ready.',
      themeDark: 'Dark theme activated',
      themeLight: 'Light theme activated',
      soundOn: 'Sound enabled',
      soundOff: 'Sound disabled',
      settingsSaved: 'Settings saved',
      copied: 'Result copied to clipboard',
      copyFailed: 'Could not copy automatically',
      shared: 'Result shared',
      shareFallback: 'Result copied to share',
      fullOn: 'Fullscreen enabled',
      fullOff: 'Fullscreen closed',
      durationLocked: 'Stop or restart the test to change duration',
      historyCleared: 'Result history cleared',
      dataReset: 'Local data reset',
      noResult: 'Complete a test before sharing your result',
      recordMessage: 'Your pace broke your personal best. Keep it up.',
      resultMessage: 'Nice attempt. Your next pulse could be a record.',
      stoppedMessage: 'This attempt ended early. Try again whenever you are ready.',
      level: ['Warm up', 'Swift', 'Fast', 'Elite', 'Unstoppable'],
      session: ['AT EASE', 'STARTING UP', 'IN RHYTHM', 'BEAST MODE']
    }
  };

  const defaults = Object.freeze({
    theme: 'dark',
    language: 'es',
    sound: false,
    reduceMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    particles: true,
    haptics: true,
    duration: 5,
    historicRecord: 0,
    results: [],
    stats: { totalClicks: 0, completedTests: 0 }
  });

  const readStoredData = () => {
    try {
      const raw = window.localStorage.getItem(CONFIG.storageKey);
      if (!raw) return { ...defaults, stats: { ...defaults.stats }, results: [] };
      const parsed = JSON.parse(raw);
      const duration = CONFIG.durations.includes(Number(parsed.duration)) ? Number(parsed.duration) : defaults.duration;
      return {
        ...defaults,
        ...parsed,
        duration,
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        language: parsed.language === 'en' ? 'en' : 'es',
        sound: Boolean(parsed.sound),
        reduceMotion: Boolean(parsed.reduceMotion),
        particles: parsed.particles !== false,
        haptics: parsed.haptics !== false,
        historicRecord: Number.isFinite(Number(parsed.historicRecord)) ? Number(parsed.historicRecord) : 0,
        results: Array.isArray(parsed.results) ? parsed.results.slice(0, CONFIG.maxResults).filter(isValidResult) : [],
        stats: {
          totalClicks: Number(parsed.stats && parsed.stats.totalClicks) || 0,
          completedTests: Number(parsed.stats && parsed.stats.completedTests) || 0
        }
      };
    } catch (error) {
      return { ...defaults, stats: { ...defaults.stats }, results: [] };
    }
  };

  function isValidResult(result) {
    return result && Number.isFinite(Number(result.cps)) && Number.isFinite(Number(result.clicks)) && CONFIG.durations.includes(Number(result.duration));
  }

  const saved = readStoredData();
  const sessionRecord = readSessionRecord();
  const state = {
    settings: saved,
    status: 'idle',
    startAt: 0,
    elapsed: 0,
    clicks: 0,
    clickTimes: [],
    samples: [],
    lastSampleAt: 0,
    lastClickAt: 0,
    currentCps: 0,
    averageCps: 0,
    peakCps: 0,
    minCps: 0,
    maxSpeed: 0,
    minSpeed: 0,
    runId: 0,
    finalResult: null,
    sessionRecord,
    lastActiveElement: null,
    audioContext: null,
    lastHoverTone: 0,
    pointer: { x: window.innerWidth / 2, y: window.innerHeight / 2, queued: false },
    particleNodes: 0,
    chartQueued: false
  };

  let timerFrame = 0;
  let cursorFrame = 0;

  function readSessionRecord() {
    try {
      return Math.max(0, Number(window.sessionStorage.getItem(CONFIG.sessionKey)) || 0);
    } catch (error) {
      return 0;
    }
  }

  function persistState() {
    try {
      window.localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        theme: state.settings.theme,
        language: state.settings.language,
        sound: state.settings.sound,
        reduceMotion: state.settings.reduceMotion,
        particles: state.settings.particles,
        haptics: state.settings.haptics,
        duration: state.settings.duration,
        historicRecord: state.settings.historicRecord,
        results: state.settings.results,
        stats: state.settings.stats
      }));
    } catch (error) {
      // Storage can be unavailable in privacy modes. The test remains usable.
    }
  }

  function persistSessionRecord() {
    try {
      window.sessionStorage.setItem(CONFIG.sessionKey, String(state.sessionRecord));
    } catch (error) {
      // Session storage is an enhancement, not a requirement for gameplay.
    }
  }

  function language() {
    return state.settings.language;
  }

  function label(key) {
    return dynamicCopy[language()][key] || key;
  }

  function formatNumber(value, digits = 2) {
    const locale = language() === 'es' ? 'es-AR' : 'en-US';
    return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value) || 0);
  }

  function formatTime(milliseconds) {
    return (Math.max(0, milliseconds) / 1000).toFixed(2).padStart(5, '0');
  }

  function setText(element, value) {
    if (!element) return;
    const next = String(value);
    if (element.textContent !== next) element.textContent = next;
  }

  function setMetric(element, value, digits = 2) {
    if (!element) return;
    const next = typeof value === 'string' ? value : formatNumber(value, digits);
    if (element.dataset.value === next) return;
    element.dataset.value = next;
    element.textContent = next;
    element.classList.remove('is-updating');
    // Reflow only the updated number to restart its small odometer animation.
    void element.offsetWidth;
    element.classList.add('is-updating');
  }

  function updateStaticLanguage() {
    const dictionary = COPY[language()];
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = dictionary[element.dataset.i18n];
      if (value) element.textContent = value;
    });

    // These display headings contain a highlighted word, so they retain a small
    // presentational span instead of being flattened by the generic text pass.
    const dashboardTitle = byId('dashboardTitle');
    const welcomeTitle = byId('welcomeTitle');
    if (dashboardTitle) {
      dashboardTitle.innerHTML = language() === 'es' ? 'Click. <span>Rompe tu límite.</span>' : 'Click. <span>Break your limit.</span>';
    }
    if (welcomeTitle) {
      welcomeTitle.innerHTML = language() === 'es' ? 'Tu pulso empieza <span>aquí.</span>' : 'Your pulse starts <span>here.</span>';
    }

    dom.root.lang = language();
    document.title = language() === 'es' ? 'CPS Pulse — Clicks por segundo' : 'CPS Pulse — Clicks Per Second';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', language() === 'es' ? 'CPS Pulse: un test de clicks por segundo premium, rápido y preciso.' : 'CPS Pulse: a premium, fast and precise clicks per second test.');
    if (dom.language) dom.language.value = language();
    if (dom.settingsLanguage) dom.settingsLanguage.value = language();
    if (dom.defaultDuration) dom.defaultDuration.value = String(state.settings.duration);

    const defaultDurationOptions = dom.defaultDuration ? Array.from(dom.defaultDuration.options) : [];
    defaultDurationOptions.forEach((option) => {
      const seconds = Number(option.value);
      option.textContent = seconds + ' ' + (language() === 'es' ? (seconds === 1 ? 'segundo' : 'segundos') : (seconds === 1 ? 'second' : 'seconds'));
    });

    if (dom.theme) {
      const dark = state.settings.theme === 'dark';
      dom.theme.setAttribute('aria-label', dark ? (language() === 'es' ? 'Cambiar a tema claro' : 'Switch to light theme') : (language() === 'es' ? 'Cambiar a tema oscuro' : 'Switch to dark theme'));
      dom.theme.dataset.tooltip = language() === 'es' ? 'Cambiar tema' : 'Change theme';
    }
    if (dom.sound) {
      const soundState = state.settings.sound;
      dom.sound.setAttribute('aria-label', soundState ? (language() === 'es' ? 'Desactivar sonido' : 'Disable sound') : (language() === 'es' ? 'Activar sonido' : 'Enable sound'));
      dom.sound.dataset.tooltip = language() === 'es' ? 'Sonido' : 'Sound';
    }
    if (dom.fullscreen) dom.fullscreen.dataset.tooltip = language() === 'es' ? 'Pantalla completa' : 'Fullscreen';
    if (dom.settings) dom.settings.dataset.tooltip = language() === 'es' ? 'Configuración' : 'Settings';
    if (dom.clickArea) dom.clickArea.setAttribute('aria-label', language() === 'es' ? 'Área de click del test CPS' : 'CPS test click area');
    if (dom.progress) dom.progress.setAttribute('aria-label', language() === 'es' ? 'Progreso del test' : 'Test progress');
    if (dom.chart) dom.chart.setAttribute('aria-label', language() === 'es' ? 'Gráfico de evolución de clicks por segundo' : 'Clicks per second evolution chart');
    const languageControl = document.querySelector('label[for="languageSelect"]');
    const durationGroup = byId('durationOptions');
    const runControls = document.querySelector('.run-controls');
    const historyScroll = dom.historyScroll;
    const shortcuts = dom.keyboardHelp;
    if (languageControl) languageControl.setAttribute('aria-label', language() === 'es' ? 'Idioma' : 'Language');
    if (dom.language) dom.language.setAttribute('aria-label', language() === 'es' ? 'Seleccionar idioma' : 'Select language');
    if (durationGroup) durationGroup.setAttribute('aria-label', language() === 'es' ? 'Duración del test' : 'Test duration');
    if (runControls) runControls.setAttribute('aria-label', language() === 'es' ? 'Controles del test' : 'Test controls');
    if (historyScroll) historyScroll.setAttribute('aria-label', language() === 'es' ? 'Lista de clicks recientes' : 'Recent click list');
    if (shortcuts) {
      shortcuts.setAttribute('aria-label', language() === 'es' ? 'Ver atajos de teclado' : 'View keyboard shortcuts');
      shortcuts.dataset.tooltip = language() === 'es' ? 'Atajos de teclado' : 'Keyboard shortcuts';
    }
    const brand = document.querySelector('.brand');
    const topbarNav = document.querySelector('.topbar-actions');
    const welcomeFeatures = document.querySelector('.welcome-features');
    if (brand) brand.setAttribute('aria-label', language() === 'es' ? 'CPS Pulse, ir al contenido principal' : 'CPS Pulse, go to main content');
    if (topbarNav) topbarNav.setAttribute('aria-label', language() === 'es' ? 'Controles de la aplicación' : 'Application controls');
    if (welcomeFeatures) welcomeFeatures.setAttribute('aria-label', language() === 'es' ? 'Características del test' : 'Test features');

    updateDurationUI();
    updateStatusUI();
    // Reformat all live numbers when the locale changes (for example 0,70 → 0.70).
    updateMetrics(true);
    renderRecentResults();
  }

  function applyTheme(theme, announce = false) {
    state.settings.theme = theme === 'light' ? 'light' : 'dark';
    dom.root.dataset.theme = state.settings.theme;
    dom.body.classList.toggle('theme-light', state.settings.theme === 'light');
    dom.body.classList.toggle('theme-dark', state.settings.theme !== 'light');
    if (dom.themeColor) dom.themeColor.setAttribute('content', state.settings.theme === 'light' ? '#edf2ff' : '#080b18');
    if (dom.theme) {
      dom.theme.setAttribute('aria-pressed', String(state.settings.theme === 'light'));
      dom.theme.classList.toggle('is-active', state.settings.theme === 'light');
    }
    dom.themeInputs.forEach((input) => { input.checked = input.value === state.settings.theme; });
    if (announce) toast(label(state.settings.theme === 'dark' ? 'themeDark' : 'themeLight'), 'info');
    queueChartRender();
  }

  function applyMotionSettings() {
    dom.root.dataset.reducedMotion = String(state.settings.reduceMotion);
    dom.root.dataset.particles = String(state.settings.particles);
    if (state.settings.reduceMotion || !state.settings.particles) {
      clearEffectParticles();
      if (dom.particleField) dom.particleField.replaceChildren();
    } else {
      seedAmbientParticles();
    }
  }

  function applySoundState(announce = false) {
    if (!dom.sound) return;
    dom.sound.setAttribute('aria-pressed', String(state.settings.sound));
    dom.sound.classList.toggle('is-active', state.settings.sound);
    if (dom.soundSetting) dom.soundSetting.checked = state.settings.sound;
    if (announce) toast(label(state.settings.sound ? 'soundOn' : 'soundOff'), state.settings.sound ? 'success' : 'info');
  }

  function syncSettingsForm() {
    dom.themeInputs.forEach((input) => { input.checked = input.value === state.settings.theme; });
    if (dom.reduceMotion) dom.reduceMotion.checked = state.settings.reduceMotion;
    if (dom.particles) dom.particles.checked = state.settings.particles;
    if (dom.soundSetting) dom.soundSetting.checked = state.settings.sound;
    if (dom.haptics) dom.haptics.checked = state.settings.haptics;
    if (dom.defaultDuration) dom.defaultDuration.value = String(state.settings.duration);
    if (dom.settingsLanguage) dom.settingsLanguage.value = language();
  }

  function updateDurationUI() {
    const duration = state.settings.duration;
    dom.durationButtons.forEach((button) => {
      const selected = Number(button.dataset.duration) === duration;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = state.status === 'running';
    });
    if (dom.durationSelect) {
      dom.durationSelect.replaceChildren(document.createTextNode(String(duration) + ' '));
      const small = document.createElement('small');
      small.textContent = language() === 'es' ? 'seg' : 'sec';
      dom.durationSelect.append(small);
    }
  }

  function updateControls() {
    const running = state.status === 'running';
    const finished = state.status === 'finished' || state.status === 'stopped';
    if (dom.start) {
      dom.start.disabled = running;
      dom.start.classList.toggle('is-hidden', running);
    }
    if (dom.stop) dom.stop.disabled = !running;
    if (dom.restart) dom.restart.disabled = !running && !finished;
    if (dom.clickArea) {
      dom.clickArea.disabled = !running;
      dom.clickArea.classList.toggle('is-running', running);
      dom.clickArea.classList.toggle('is-finished', finished);
    }
    updateDurationUI();
  }

  function updateStatusUI() {
    let status = label('ready');
    let padStatus = label('waiting');
    let padHint = language() === 'es' ? 'Pulsa comenzar' : 'Press start';

    if (state.status === 'running') {
      status = label('running');
      padStatus = label('active');
      padHint = label('padHint');
    } else if (state.status === 'finished') {
      status = label('complete');
      padStatus = label('finished');
      padHint = label('restartHint');
    } else if (state.status === 'stopped') {
      status = label('stopped');
      padStatus = label('stoppedPad');
      padHint = label('restartHint');
    }

    setText(dom.testStatus, status);
    setText(dom.clickPadStatus, padStatus);
    setText(dom.clickPadHint, padHint);
    if (dom.testStatusDot) dom.testStatusDot.dataset.state = state.status;
  }

  function updateMetrics(force = false) {
    const durationMs = state.settings.duration * 1000;
    const elapsedSeconds = state.elapsed / 1000;
    state.averageCps = elapsedSeconds > 0 ? state.clicks / elapsedSeconds : 0;
    state.currentCps = rollingCps(state.elapsed);
    state.peakCps = Math.max(state.peakCps, state.currentCps);

    setMetric(dom.clickCount, state.clicks, 0);
    setMetric(dom.timeRemaining, formatTime(durationMs - state.elapsed), 2);
    setMetric(dom.elapsedTime, formatTime(state.elapsed), 2);
    setMetric(dom.currentCps, state.currentCps, 2);
    setMetric(dom.averageCps, state.averageCps, 2);
    setMetric(dom.maxCps, state.peakCps, 2);
    setMetric(dom.historicRecord, state.settings.historicRecord, 2);
    setMetric(dom.sessionRecord, state.sessionRecord, 2);
    setMetric(dom.maxSpeed, state.maxSpeed, 2);
    setMetric(dom.minSpeed, state.minSpeed, 2);

    if (dom.currentCpsTrend) {
      const trend = state.currentCps > state.averageCps + 0.2 ? '↑' : state.currentCps + 0.2 < state.averageCps ? '↓' : '•';
      setText(dom.currentCpsTrend, trend);
      dom.currentCpsTrend.dataset.trend = trend === '↑' ? 'up' : trend === '↓' ? 'down' : 'flat';
    }
    const progress = durationMs ? (state.elapsed / durationMs) * 100 : 0;
    if (dom.progressFill) dom.progressFill.style.width = clamp(progress, 0, 100) + '%';
    if (dom.progress) dom.progress.setAttribute('aria-valuenow', String(Math.round(clamp(progress, 0, 100))));
    updatePerformanceLevel(state.status === 'finished' ? state.averageCps : Math.max(state.averageCps, state.currentCps));
    if (force) queueChartRender();
  }

  function rollingCps(now) {
    if (!state.clickTimes.length || now <= 0) return 0;
    const windowStart = Math.max(0, now - 1000);
    const events = state.clickTimes.filter((time) => time >= windowStart && time <= now).length;
    const denominator = Math.min(1000, Math.max(120, now - windowStart));
    return events / (denominator / 1000);
  }

  function updatePerformanceLevel(score) {
    const normalized = clamp((Number(score) || 0) / 20, 0, 1);
    const index = normalized < 0.15 ? 0 : normalized < 0.32 ? 1 : normalized < 0.55 ? 2 : normalized < 0.8 ? 3 : 4;
    const sessionIndex = normalized < 0.1 ? 0 : normalized < 0.35 ? 1 : normalized < 0.65 ? 2 : 3;
    if (dom.performanceLevel) setText(dom.performanceLevel, label('level')[index]);
    if (dom.sessionBadge) setText(dom.sessionBadge, label('session')[sessionIndex]);
    if (dom.performanceLevelBar) {
      const percent = Math.round(normalized * 100);
      dom.performanceLevelBar.setAttribute('aria-valuenow', String(percent));
      const fill = dom.performanceLevelBar.querySelector('span');
      if (fill) fill.style.width = percent + '%';
    }
  }

  function setDuration(value) {
    const duration = Number(value);
    if (!CONFIG.durations.includes(duration)) return;
    if (state.status === 'running') {
      toast(label('durationLocked'), 'warning');
      return;
    }
    state.settings.duration = duration;
    resetRun(false);
    persistState();
    syncSettingsForm();
    playTone('button');
  }

  function resetRun(showNotice = false) {
    cancelAnimationFrame(timerFrame);
    timerFrame = 0;
    state.runId += 1;
    state.status = 'idle';
    state.startAt = 0;
    state.elapsed = 0;
    state.clicks = 0;
    state.clickTimes = [];
    state.samples = [];
    state.lastSampleAt = 0;
    state.lastClickAt = 0;
    state.currentCps = 0;
    state.averageCps = 0;
    state.peakCps = 0;
    state.minCps = 0;
    state.maxSpeed = 0;
    state.minSpeed = 0;
    state.finalResult = null;
    clearClickHistory();
    clearEffectParticles();
    if (dom.clickArea) dom.clickArea.classList.remove('is-clicked', 'is-new-record');
    updateStatusUI();
    updateControls();
    updateMetrics(true);
    if (showNotice) toast(label('restartHint'), 'info');
  }

  function startTest() {
    if (state.status === 'running') return;
    closeModal(dom.resultsModal);
    resetRun(false);
    state.status = 'running';
    state.startAt = performance.now();
    state.lastSampleAt = 0;
    state.runId += 1;
    updateStatusUI();
    updateControls();
    updateMetrics(true);
    playTone('start');
    announce(label('testStarted'));
    toast(label('testStarted'), 'success', 2200);
    if (dom.clickArea) dom.clickArea.focus({ preventScroll: true });
    const run = state.runId;
    timerFrame = requestAnimationFrame((now) => tick(now, run));
  }

  function tick(now, run) {
    if (state.status !== 'running' || run !== state.runId) return;
    const durationMs = state.settings.duration * 1000;
    state.elapsed = clamp(now - state.startAt, 0, durationMs);
    if (!state.lastSampleAt || state.elapsed - state.lastSampleAt >= CONFIG.sampleInterval) {
      addSample(state.elapsed);
      state.lastSampleAt = state.elapsed;
    }
    updateMetrics();
    if (state.elapsed >= durationMs) {
      finishTest(true);
      return;
    }
    timerFrame = requestAnimationFrame((next) => tick(next, run));
  }

  function addSample(at) {
    const current = rollingCps(at);
    const average = at > 0 ? state.clicks / (at / 1000) : 0;
    state.samples.push({ at, cps: current, average });
    const maxSamples = Math.max(42, Math.ceil((state.settings.duration * 1000) / CONFIG.sampleInterval) + 4);
    if (state.samples.length > maxSamples) state.samples.splice(0, state.samples.length - maxSamples);
    if (state.samples.length > 1 && dom.chartEmpty) dom.chartEmpty.classList.add('is-hidden');
    queueChartRender();
  }

  function registerClick(event) {
    if (state.status !== 'running') return;
    const now = performance.now();
    const relative = clamp(now - state.startAt, 0, state.settings.duration * 1000);
    if (relative >= state.settings.duration * 1000) return;

    state.clicks += 1;
    state.clickTimes.push(relative);
    if (state.lastClickAt) {
      const interval = relative - state.lastClickAt;
      if (interval > 18) {
        const speed = clamp(1000 / interval, 0, 60);
        state.maxSpeed = Math.max(state.maxSpeed, speed);
        state.minSpeed = state.minSpeed === 0 ? speed : Math.min(state.minSpeed, speed);
      }
    }
    state.lastClickAt = relative;
    state.elapsed = relative;
    addSample(relative);
    appendClickHistory(relative);
    createClickFeedback(event);
    updateMetrics();
    playTone('click');
  }

  function finishTest(completed) {
    if (state.status !== 'running') return;
    cancelAnimationFrame(timerFrame);
    timerFrame = 0;
    const durationMs = state.settings.duration * 1000;
    if (completed) state.elapsed = durationMs;
    state.status = completed ? 'finished' : 'stopped';
    addSample(state.elapsed);
    state.averageCps = state.elapsed ? state.clicks / (state.elapsed / 1000) : 0;
    state.currentCps = rollingCps(state.elapsed);
    state.peakCps = Math.max(state.peakCps, state.currentCps);
    const isRecord = completed && state.clicks > 0 && state.averageCps > state.settings.historicRecord;
    const isSessionRecord = completed && state.averageCps > state.sessionRecord;

    if (completed) {
      state.settings.stats.totalClicks += state.clicks;
      state.settings.stats.completedTests += 1;
      state.sessionRecord = Math.max(state.sessionRecord, state.averageCps);
      if (isRecord) state.settings.historicRecord = state.averageCps;
      persistSessionRecord();
      state.finalResult = {
        cps: state.averageCps,
        clicks: state.clicks,
        duration: state.settings.duration,
        peak: state.peakCps,
        date: Date.now(),
        newRecord: isRecord
      };
      state.settings.results.unshift(state.finalResult);
      state.settings.results = state.settings.results.slice(0, CONFIG.maxResults);
      persistState();
      renderRecentResults();
    } else {
      state.finalResult = {
        cps: state.averageCps,
        clicks: state.clicks,
        duration: state.settings.duration,
        peak: state.peakCps,
        date: Date.now(),
        newRecord: false,
        stopped: true
      };
    }

    updateStatusUI();
    updateControls();
    updateMetrics(true);
    if (dom.clickArea) dom.clickArea.classList.toggle('is-new-record', isRecord);
    if (completed) {
      playTone(isRecord ? 'record' : 'success');
      announce(isRecord ? label('newRecord') : label('complete'));
      toast(isRecord ? label('newRecord') : label('complete'), isRecord ? 'success' : 'info');
      if (isRecord) launchConfetti();
      launchFinishBurst();
    } else {
      playTone('fail');
      announce(label('testStopped'));
      toast(label('testStopped'), 'warning');
    }
    setTimeout(() => showResults(state.finalResult), completed ? 500 : 250);
  }

  function stopTest() {
    if (state.status === 'running') finishTest(false);
  }

  function restartTest() {
    playTone('button');
    startTest();
  }

  function appendClickHistory(relative) {
    if (!dom.clickHistory) return;
    if (dom.clickHistoryEmpty) dom.clickHistoryEmpty.hidden = true;
    const fragment = dom.clickHistoryTemplate && dom.clickHistoryTemplate.content
      ? dom.clickHistoryTemplate.content.cloneNode(true)
      : document.createDocumentFragment();
    let item = fragment.querySelector ? fragment.querySelector('.click-history-item') : null;
    if (!item) {
      item = document.createElement('li');
      item.className = 'click-history-item';
      item.innerHTML = '<span class="click-history-item__pulse" aria-hidden="true"></span><time class="click-history-item__time"></time><span class="click-history-item__label"></span><strong class="click-history-item__cps"></strong>';
      fragment.append(item);
    }
    const position = state.clicks;
    const clickCps = rollingCps(relative);
    const time = item.querySelector('time');
    const labelNode = item.querySelector('.click-history-item__label');
    const cps = item.querySelector('.click-history-item__cps');
    if (time) time.textContent = '+' + formatTime(relative);
    if (labelNode) labelNode.textContent = (language() === 'es' ? 'Click ' : 'Click ') + String(position);
    if (cps) cps.textContent = formatNumber(clickCps, 1) + ' CPS';
    dom.clickHistory.prepend(fragment);
    while (dom.clickHistory.children.length > CONFIG.maxHistoryItems) dom.clickHistory.lastElementChild.remove();
    if (dom.historyCount) setText(dom.historyCount, state.clicks);
  }

  function clearClickHistory() {
    if (!dom.clickHistory) return;
    dom.clickHistory.replaceChildren();
    if (dom.clickHistoryEmpty) {
      dom.clickHistoryEmpty.hidden = false;
      dom.clickHistory.append(dom.clickHistoryEmpty);
    }
    if (dom.historyCount) setText(dom.historyCount, 0);
    if (dom.chartEmpty) dom.chartEmpty.classList.remove('is-hidden');
  }

  function renderRecentResults() {
    if (!dom.recentResults) return;
    dom.recentResults.replaceChildren();
    const results = state.settings.results;
    if (!results.length) {
      if (dom.recentResultsEmpty) {
        dom.recentResultsEmpty.hidden = false;
        dom.recentResults.append(dom.recentResultsEmpty);
      }
      if (dom.clearRecentResults) dom.clearRecentResults.disabled = true;
      return;
    }
    if (dom.clearRecentResults) dom.clearRecentResults.disabled = false;
    results.forEach((result, index) => {
      const fragment = dom.recentResultTemplate && dom.recentResultTemplate.content
        ? dom.recentResultTemplate.content.cloneNode(true)
        : document.createDocumentFragment();
      let item = fragment.querySelector ? fragment.querySelector('.recent-result-item') : null;
      if (!item) {
        item = document.createElement('li');
        item.className = 'recent-result-item';
        item.innerHTML = '<span class="recent-result-item__rank"></span><div class="recent-result-item__score"><strong></strong><small>CPS</small></div><div class="recent-result-item__meta"><span class="recent-result-item__clicks"></span><time class="recent-result-item__date"></time></div><span class="recent-result-item__duration"></span>';
        fragment.append(item);
      }
      const rank = item.querySelector('.recent-result-item__rank');
      const score = item.querySelector('.recent-result-item__score strong');
      const clicks = item.querySelector('.recent-result-item__clicks');
      const date = item.querySelector('.recent-result-item__date');
      const duration = item.querySelector('.recent-result-item__duration');
      if (rank) rank.textContent = String(index + 1).padStart(2, '0');
      if (score) score.textContent = formatNumber(result.cps, 2);
      if (clicks) clicks.textContent = String(result.clicks) + (language() === 'es' ? ' clicks' : ' clicks');
      if (date) {
        const locale = language() === 'es' ? 'es-AR' : 'en-US';
        date.textContent = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(result.date));
        date.dateTime = new Date(result.date).toISOString();
      }
      if (duration) duration.textContent = result.duration + ' ' + (language() === 'es' ? 'seg' : 'sec');
      if (result.newRecord) item.classList.add('is-record');
      dom.recentResults.append(fragment);
    });
  }

  function showResults(result) {
    if (!result) return;
    setMetric(dom.resultCps, result.cps, 2);
    setMetric(dom.resultClicks, result.clicks, 0);
    setMetric(dom.resultAverage, result.cps, 2);
    setMetric(dom.resultPeak, result.peak, 2);
    setMetric(dom.resultDuration, result.duration, 0);
    if (dom.newRecordBadge) dom.newRecordBadge.hidden = !result.newRecord;
    if (dom.resultsKicker) setText(dom.resultsKicker, result.stopped ? label('stopped') : result.newRecord ? label('newRecord') : COPY[language()]['results.complete']);
    if (dom.resultsMessage) {
      setText(dom.resultsMessage, result.stopped ? label('stoppedMessage') : result.newRecord ? label('recordMessage') : label('resultMessage'));
    }
    if (dom.resultSummary) dom.resultSummary.classList.toggle('is-record', Boolean(result.newRecord));
    openModal(dom.resultsModal, dom.resultRestart);
  }

  function resultText() {
    const result = state.finalResult;
    if (!result) return '';
    if (language() === 'es') return 'Logré ' + formatNumber(result.cps, 2) + ' CPS con ' + result.clicks + ' clicks en ' + result.duration + ' segundos en CPS Pulse. ¿Puedes superarme?';
    return 'I scored ' + formatNumber(result.cps, 2) + ' CPS with ' + result.clicks + ' clicks in ' + result.duration + ' seconds on CPS Pulse. Can you beat me?';
  }

  async function copyResult() {
    const text = resultText();
    if (!text) {
      toast(label('noResult'), 'warning');
      return false;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.append(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) throw new Error('Copy command failed');
      }
      playTone('success');
      toast(label('copied'), 'success');
      return true;
    } catch (error) {
      toast(label('copyFailed'), 'warning');
      return false;
    }
  }

  async function shareResult() {
    const text = resultText();
    if (!text) {
      toast(label('noResult'), 'warning');
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CPS Pulse', text });
        playTone('success');
        toast(label('shared'), 'success');
      } else {
        const copied = await copyResult();
        if (copied) toast(label('shareFallback'), 'info');
      }
    } catch (error) {
      // A native share sheet can be cancelled intentionally; it is not an error for the user.
      if (error && error.name !== 'AbortError') toast(label('copyFailed'), 'warning');
    }
  }

  function createClickFeedback(event) {
    if (!dom.clickArea) return;
    const rect = dom.clickArea.getBoundingClientRect();
    const x = event && Number.isFinite(event.clientX) ? event.clientX - rect.left : rect.width / 2;
    const y = event && Number.isFinite(event.clientY) ? event.clientY - rect.top : rect.height / 2;
    dom.clickArea.style.setProperty('--click-x', clamp(x, 0, rect.width) + 'px');
    dom.clickArea.style.setProperty('--click-y', clamp(y, 0, rect.height) + 'px');
    dom.clickArea.classList.remove('is-clicked');
    void dom.clickArea.offsetWidth;
    dom.clickArea.classList.add('is-clicked');
    window.setTimeout(() => dom.clickArea && dom.clickArea.classList.remove('is-clicked'), 210);
    if (state.settings.particles && !state.settings.reduceMotion) {
      createRipple(x, y);
      createEffectParticles(x, y);
    }
    if (state.settings.haptics && navigator.vibrate) navigator.vibrate(8);
  }

  function createRipple(x, y) {
    if (!dom.clickEffects) return;
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.setProperty('--x', x + 'px');
    ripple.style.setProperty('--y', y + 'px');
    dom.clickEffects.append(ripple);
    window.setTimeout(() => ripple.remove(), 800);
  }

  function createEffectParticles(x, y) {
    if (!dom.clickEffects || state.particleNodes >= CONFIG.maxEffectParticles) return;
    const amount = 8;
    for (let index = 0; index < amount; index += 1) {
      const particle = document.createElement('span');
      const angle = (Math.PI * 2 * index) / amount + Math.random() * 0.35;
      const distance = 36 + Math.random() * 82;
      particle.className = 'click-particle';
      particle.style.setProperty('--x', x + 'px');
      particle.style.setProperty('--y', y + 'px');
      particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
      particle.style.setProperty('--size', 3 + Math.random() * 5 + 'px');
      particle.style.setProperty('--delay', Math.random() * 80 + 'ms');
      dom.clickEffects.append(particle);
      state.particleNodes += 1;
      window.setTimeout(() => {
        particle.remove();
        state.particleNodes = Math.max(0, state.particleNodes - 1);
      }, 900);
    }
  }

  function clearEffectParticles() {
    if (dom.clickEffects) dom.clickEffects.replaceChildren();
    state.particleNodes = 0;
  }

  function launchFinishBurst() {
    if (!state.settings.particles || state.settings.reduceMotion || !dom.clickStage) return;
    const rect = dom.clickStage.getBoundingClientRect();
    createEffectParticles(rect.width / 2, rect.height / 2);
    window.setTimeout(() => createEffectParticles(rect.width * 0.35, rect.height * 0.42), 100);
    window.setTimeout(() => createEffectParticles(rect.width * 0.65, rect.height * 0.45), 180);
  }

  function launchConfetti() {
    const anchor = byId('resultsConfettiAnchor') || dom.clickStage;
    if (!anchor || state.settings.reduceMotion) return;
    const colors = ['#68e7ff', '#b986ff', '#ff5cce', '#ffe26f', '#91ffb6'];
    for (let index = 0; index < 42; index += 1) {
      const piece = document.createElement('span');
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95;
      const travel = 90 + Math.random() * 190;
      piece.className = 'confetti-piece';
      piece.style.setProperty('--tx', Math.cos(angle) * travel + 'px');
      piece.style.setProperty('--ty', Math.sin(angle) * travel + 100 + 'px');
      piece.style.setProperty('--rotate', Math.round(Math.random() * 720 - 360) + 'deg');
      piece.style.setProperty('--color', colors[index % colors.length]);
      piece.style.setProperty('--delay', Math.random() * 180 + 'ms');
      anchor.append(piece);
      window.setTimeout(() => piece.remove(), 1800);
    }
  }

  function seedAmbientParticles() {
    if (!dom.particleField || state.settings.reduceMotion || !state.settings.particles || dom.particleField.childElementCount) return;
    const count = window.matchMedia('(max-width: 700px)').matches ? 12 : 22;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('span');
      particle.className = 'ambient-particle';
      particle.style.setProperty('--x', Math.round(Math.random() * 100) + '%');
      particle.style.setProperty('--y', Math.round(Math.random() * 100) + '%');
      particle.style.setProperty('--size', (1 + Math.random() * 3.5).toFixed(1) + 'px');
      particle.style.setProperty('--duration', (8 + Math.random() * 14).toFixed(1) + 's');
      particle.style.setProperty('--delay', (-Math.random() * 12).toFixed(1) + 's');
      fragment.append(particle);
    }
    dom.particleField.append(fragment);
  }

  function updateCursor(event) {
    if (event.pointerType === 'touch') return;
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    if (state.pointer.queued) return;
    state.pointer.queued = true;
    cursorFrame = requestAnimationFrame(() => {
      state.pointer.queued = false;
      dom.root.style.setProperty('--mouse-x', state.pointer.x + 'px');
      dom.root.style.setProperty('--mouse-y', state.pointer.y + 'px');
      if (dom.cursorGlow) {
        dom.cursorGlow.style.transform = 'translate3d(' + state.pointer.x + 'px, ' + state.pointer.y + 'px, 0) translate(-50%, -50%)';
      }
    });
  }

  function attachTilt() {
    if (state.settings.reduceMotion) return;
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch' || state.settings.reduceMotion) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--tilt-x', ((0.5 - y) * 3.2).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', ((x - 0.5) * 3.2).toFixed(2) + 'deg');
        card.style.setProperty('--shine-x', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--shine-y', (y * 100).toFixed(1) + '%');
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
      });
    });
  }

  function setupReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || state.settings.reduceMotion) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  function queueChartRender() {
    if (state.chartQueued) return;
    state.chartQueued = true;
    requestAnimationFrame(() => {
      state.chartQueued = false;
      renderChart();
    });
  }

  function renderChart() {
    const canvas = dom.chart;
    if (!canvas || !canvas.getContext) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(rect.width * ratio);
    const height = Math.floor(rect.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    const padding = { top: 16, right: 16, bottom: 25, left: 32 };
    const drawWidth = rect.width - padding.left - padding.right;
    const drawHeight = rect.height - padding.top - padding.bottom;
    const styles = getComputedStyle(dom.root);
    const grid = styles.getPropertyValue('--chart-grid').trim() || 'rgba(146, 167, 255, 0.13)';
    const cyan = styles.getPropertyValue('--accent-cyan').trim() || '#68e7ff';
    const violet = styles.getPropertyValue('--accent-violet').trim() || '#b986ff';
    const muted = styles.getPropertyValue('--text-muted').trim() || '#94a1c8';
    context.lineWidth = 1;
    context.strokeStyle = grid;
    context.font = '10px system-ui, sans-serif';
    context.fillStyle = muted;
    for (let line = 0; line <= 4; line += 1) {
      const y = padding.top + (drawHeight * line) / 4;
      context.beginPath();
      context.moveTo(padding.left, y);
      context.lineTo(rect.width - padding.right, y);
      context.stroke();
    }
    const samples = state.samples;
    if (samples.length < 2) return;
    const duration = state.settings.duration * 1000;
    const peak = Math.max(4, ...samples.map((sample) => sample.cps), state.peakCps) * 1.15;
    const point = (sample) => ({
      x: padding.left + (sample.at / duration) * drawWidth,
      y: padding.top + drawHeight - clamp(sample.cps / peak, 0, 1) * drawHeight
    });
    const first = point(samples[0]);
    const gradient = context.createLinearGradient(0, padding.top, 0, padding.top + drawHeight);
    gradient.addColorStop(0, 'rgba(104, 231, 255, 0.32)');
    gradient.addColorStop(1, 'rgba(104, 231, 255, 0)');
    context.beginPath();
    context.moveTo(first.x, padding.top + drawHeight);
    samples.forEach((sample) => {
      const current = point(sample);
      context.lineTo(current.x, current.y);
    });
    const last = point(samples[samples.length - 1]);
    context.lineTo(last.x, padding.top + drawHeight);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    context.beginPath();
    samples.forEach((sample, index) => {
      const current = point(sample);
      if (!index) context.moveTo(current.x, current.y);
      else context.lineTo(current.x, current.y);
    });
    const stroke = context.createLinearGradient(padding.left, 0, rect.width - padding.right, 0);
    stroke.addColorStop(0, cyan);
    stroke.addColorStop(1, violet);
    context.strokeStyle = stroke;
    context.lineWidth = 2.4;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.shadowColor = cyan;
    context.shadowBlur = 12;
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = cyan;
    context.beginPath();
    context.arc(last.x, last.y, 3.6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = muted;
    context.fillText('0', 8, padding.top + drawHeight + 3);
    context.fillText(formatNumber(peak, 0), 2, padding.top + 8);
  }

  function toast(message, type = 'info', timeout = 3600) {
    if (!dom.toastContainer) return;
    const fragment = dom.toastTemplate && dom.toastTemplate.content
      ? dom.toastTemplate.content.cloneNode(true)
      : document.createDocumentFragment();
    let element = fragment.querySelector ? fragment.querySelector('.toast') : null;
    if (!element) {
      element = document.createElement('article');
      element.className = 'toast';
      element.innerHTML = '<span class="toast__icon"></span><div class="toast__content"><strong class="toast__title"></strong><p class="toast__message"></p></div><button class="toast__close" type="button" aria-label="Close">×</button>';
      fragment.append(element);
    }
    const title = element.querySelector('.toast__title');
    const content = element.querySelector('.toast__message');
    const icon = element.querySelector('.toast__icon');
    const close = element.querySelector('.toast__close');
    element.classList.add('toast--' + type);
    if (title) setText(title, type === 'success' ? 'CPS Pulse' : type === 'warning' ? (language() === 'es' ? 'Atención' : 'Heads up') : 'CPS Pulse');
    if (content) setText(content, message);
    if (icon) icon.textContent = type === 'success' ? '✓' : type === 'warning' ? '!' : '✦';
    const closeToast = () => {
      element.classList.add('is-leaving');
      window.setTimeout(() => element.remove(), 240);
    };
    if (close) close.addEventListener('click', closeToast, { once: true });
    dom.toastContainer.append(fragment);
    requestAnimationFrame(() => element.classList.add('is-visible'));
    window.setTimeout(closeToast, timeout);
  }

  function announce(message) {
    if (!dom.announcer) return;
    dom.announcer.textContent = '';
    window.setTimeout(() => { dom.announcer.textContent = message; }, 20);
  }

  function openModal(modal, returnFocus) {
    if (!modal) return;
    state.lastActiveElement = document.activeElement;
    modal.dataset.returnFocus = returnFocus && returnFocus.id ? returnFocus.id : '';
    if (hasDialogSupport && typeof modal.showModal === 'function') {
      if (!modal.open) modal.showModal();
    } else {
      modal.setAttribute('open', '');
      modal.classList.add('is-open');
    }
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) window.setTimeout(() => focusable.focus(), 50);
  }

  function closeModal(modal) {
    if (!modal) return;
    if (hasDialogSupport && typeof modal.close === 'function' && modal.open) modal.close();
    else {
      modal.removeAttribute('open');
      modal.classList.remove('is-open');
      restoreModalFocus(modal);
    }
  }

  function restoreModalFocus(modal) {
    const target = modal.dataset.returnFocus ? byId(modal.dataset.returnFocus) : state.lastActiveElement;
    if (target && typeof target.focus === 'function' && document.contains(target)) target.focus({ preventScroll: true });
  }

  function getAudioContext() {
    if (!state.settings.sound) return null;
    if (state.audioContext) return state.audioContext;
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) return null;
    try {
      state.audioContext = new Constructor();
      return state.audioContext;
    } catch (error) {
      return null;
    }
  }

  function playTone(kind) {
    if (!state.settings.sound) return;
    const audio = getAudioContext();
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const now = audio.currentTime;
    const tones = {
      click: [440, 0.045, 'triangle', 0.042],
      button: [520, 0.065, 'sine', 0.035],
      hover: [700, 0.028, 'sine', 0.014],
      start: [360, 0.16, 'sine', 0.06],
      success: [620, 0.22, 'sine', 0.07],
      record: [740, 0.31, 'triangle', 0.09],
      fail: [180, 0.15, 'sine', 0.045]
    };
    const spec = tones[kind] || tones.button;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = spec[2];
    oscillator.frequency.setValueAtTime(spec[0], now);
    if (kind === 'record') oscillator.frequency.exponentialRampToValueAtTime(1280, now + spec[1]);
    if (kind === 'success' || kind === 'start') oscillator.frequency.linearRampToValueAtTime(spec[0] * 1.3, now + spec[1]);
    if (kind === 'fail') oscillator.frequency.exponentialRampToValueAtTime(95, now + spec[1]);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(spec[3], now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec[1]);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + spec[1] + 0.02);
  }

  function handleFullscreen() {
    const active = Boolean(document.fullscreenElement);
    dom.body.classList.toggle('is-fullscreen', active);
    if (dom.fullscreen) {
      dom.fullscreen.classList.toggle('is-active', active);
      dom.fullscreen.setAttribute('aria-pressed', String(active));
      dom.fullscreen.setAttribute('aria-label', active ? (language() === 'es' ? 'Salir de pantalla completa' : 'Exit fullscreen') : (language() === 'es' ? 'Activar pantalla completa' : 'Enter fullscreen'));
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await (dom.app || document.documentElement).requestFullscreen();
        toast(label('fullOn'), 'info');
      } else {
        await document.exitFullscreen();
        toast(label('fullOff'), 'info');
      }
      playTone('button');
    } catch (error) {
      toast(language() === 'es' ? 'La pantalla completa no está disponible aquí' : 'Fullscreen is not available here', 'warning');
    }
  }

  function hideWelcome() {
    if (!dom.welcome || dom.welcome.hidden) return;
    dom.welcome.classList.add('is-leaving');
    window.setTimeout(() => {
      dom.welcome.hidden = true;
      dom.welcome.classList.remove('is-leaving');
      if (dom.start) dom.start.focus({ preventScroll: true });
    }, state.settings.reduceMotion ? 0 : 340);
    playTone('button');
  }

  function clearStoredResults() {
    state.settings.results = [];
    persistState();
    renderRecentResults();
    toast(label('historyCleared'), 'info');
  }

  function resetStoredData() {
    const prompt = language() === 'es' ? '¿Restablecer todos tus datos locales? Esta acción no se puede deshacer.' : 'Reset all of your local data? This cannot be undone.';
    if (!window.confirm(prompt)) return;
    try {
      window.localStorage.removeItem(CONFIG.storageKey);
      window.sessionStorage.removeItem(CONFIG.sessionKey);
    } catch (error) {
      // The UI state below remains a useful fallback even if storage is blocked.
    }
    state.settings = { ...defaults, stats: { ...defaults.stats }, results: [] };
    state.sessionRecord = 0;
    applyTheme(state.settings.theme);
    applyMotionSettings();
    applySoundState();
    updateStaticLanguage();
    resetRun(false);
    renderRecentResults();
    syncSettingsForm();
    closeModal(dom.settingsModal);
    toast(label('dataReset'), 'success');
  }

  function saveSettings(form) {
    const data = new FormData(form);
    const nextDuration = Number(data.get('defaultDuration'));
    state.settings.theme = data.get('theme') === 'light' ? 'light' : 'dark';
    state.settings.reduceMotion = data.get('reduceMotion') === 'on';
    state.settings.particles = data.get('particles') === 'on';
    state.settings.sound = data.get('sound') === 'on';
    state.settings.haptics = data.get('haptics') === 'on';
    state.settings.language = data.get('language') === 'en' ? 'en' : 'es';
    state.settings.duration = CONFIG.durations.includes(nextDuration) ? nextDuration : defaults.duration;
    applyTheme(state.settings.theme);
    applyMotionSettings();
    applySoundState();
    updateStaticLanguage();
    resetRun(false);
    persistState();
    syncSettingsForm();
    closeModal(dom.settingsModal);
    playTone('success');
    toast(label('settingsSaved'), 'success');
  }

  function bindEvents() {
    dom.durationButtons.forEach((button) => button.addEventListener('click', () => setDuration(button.dataset.duration)));
    if (dom.start) dom.start.addEventListener('click', startTest);
    if (dom.restart) dom.restart.addEventListener('click', restartTest);
    if (dom.stop) dom.stop.addEventListener('click', stopTest);
    if (dom.clickArea) {
      dom.clickArea.addEventListener('pointerdown', (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        event.preventDefault();
        registerClick(event);
      });
    }
    if (dom.theme) dom.theme.addEventListener('click', () => {
      applyTheme(state.settings.theme === 'dark' ? 'light' : 'dark', true);
      persistState();
      playTone('button');
      updateStaticLanguage();
    });
    if (dom.sound) dom.sound.addEventListener('click', () => {
      state.settings.sound = !state.settings.sound;
      applySoundState(true);
      persistState();
      if (state.settings.sound) playTone('button');
    });
    if (dom.language) dom.language.addEventListener('change', (event) => {
      state.settings.language = event.target.value === 'en' ? 'en' : 'es';
      updateStaticLanguage();
      syncSettingsForm();
      persistState();
      queueChartRender();
    });
    if (dom.fullscreen) dom.fullscreen.addEventListener('click', toggleFullscreen);
    if (dom.settings) dom.settings.addEventListener('click', () => {
      syncSettingsForm();
      openModal(dom.settingsModal, dom.settings);
      playTone('button');
    });
    if (dom.settingsForm) dom.settingsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const submitter = event.submitter;
      if (submitter && submitter.value === 'save') saveSettings(dom.settingsForm);
      else closeModal(dom.settingsModal);
    });
    if (dom.resetStoredData) dom.resetStoredData.addEventListener('click', resetStoredData);
    if (dom.closeSettings) dom.closeSettings.addEventListener('click', () => closeModal(dom.settingsModal));
    if (dom.closeResults) dom.closeResults.addEventListener('click', () => closeModal(dom.resultsModal));
    if (dom.resultRestart) dom.resultRestart.addEventListener('click', restartTest);
    if (dom.share) dom.share.addEventListener('click', shareResult);
    if (dom.copy) dom.copy.addEventListener('click', copyResult);
    if (dom.clearRecentResults) dom.clearRecentResults.addEventListener('click', clearStoredResults);
    if (dom.keyboardHelp) dom.keyboardHelp.addEventListener('click', () => openModal(dom.keyboardModal, dom.keyboardHelp));
    if (dom.closeKeyboardHelp) dom.closeKeyboardHelp.addEventListener('click', () => closeModal(dom.keyboardModal));
    if (dom.keyboardHelpDone) dom.keyboardHelpDone.addEventListener('click', () => closeModal(dom.keyboardModal));
    if (dom.welcomeEnter) dom.welcomeEnter.addEventListener('click', hideWelcome);
    [dom.settingsModal, dom.resultsModal, dom.keyboardModal].filter(Boolean).forEach((modal) => {
      modal.addEventListener('close', () => restoreModalFocus(modal));
      modal.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeModal(modal);
      });
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(modal);
      });
    });

    document.addEventListener('pointermove', updateCursor, { passive: true });
    document.addEventListener('fullscreenchange', handleFullscreen);
    window.addEventListener('resize', queueChartRender, { passive: true });
    window.addEventListener('keydown', handleKeyboard);
    document.querySelectorAll('button, select, .duration-option').forEach((control) => {
      control.addEventListener('pointerenter', () => {
        const now = performance.now();
        if (state.settings.sound && now - state.lastHoverTone > 120) {
          state.lastHoverTone = now;
          playTone('hover');
        }
      }, { passive: true });
    });
  }

  function handleKeyboard(event) {
    const target = event.target;
    const editable = target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    const modalOpen = [dom.settingsModal, dom.resultsModal, dom.keyboardModal].some((modal) => modal && modal.open);
    if (event.key === 'Escape') {
      const activeModal = [dom.keyboardModal, dom.settingsModal, dom.resultsModal].find((modal) => modal && modal.open);
      if (activeModal) {
        event.preventDefault();
        closeModal(activeModal);
      } else if (state.status === 'running') {
        event.preventDefault();
        stopTest();
      }
      return;
    }
    if (editable || modalOpen || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Enter' && dom.welcome && !dom.welcome.hidden) {
      event.preventDefault();
      hideWelcome();
      return;
    }
    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      if (dom.welcome && !dom.welcome.hidden) hideWelcome();
      else if (state.status === 'running') registerClick({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
      else startTest();
      return;
    }
    if (event.repeat) return;
    if (event.key.toLowerCase() === 'r') restartTest();
    if (event.key.toLowerCase() === 's') {
      state.settings.sound = !state.settings.sound;
      applySoundState(true);
      persistState();
    }
    if (event.key.toLowerCase() === 'f') toggleFullscreen();
  }

  function bootLoader() {
    const showWelcome = () => {
      if (!dom.loader) {
        if (dom.welcome) dom.welcome.hidden = false;
        return;
      }
      if (dom.loaderMessage) setText(dom.loaderMessage, language() === 'es' ? 'Arena lista. Preparados para el pulso.' : 'Arena ready. Prepare for the pulse.');
      dom.loader.classList.add('is-complete');
      window.setTimeout(() => {
        dom.loader.hidden = true;
        if (dom.welcome) {
          dom.welcome.hidden = false;
          requestAnimationFrame(() => dom.welcome.classList.add('is-visible'));
        }
      }, state.settings.reduceMotion ? 0 : 720);
    };
    if (document.readyState === 'complete') window.setTimeout(showWelcome, 380);
    else window.addEventListener('load', () => window.setTimeout(showWelcome, 380), { once: true });
  }

  function initialize() {
    if (dom.year) setText(dom.year, new Date().getFullYear());
    applyTheme(state.settings.theme);
    applyMotionSettings();
    applySoundState();
    updateStaticLanguage();
    syncSettingsForm();
    resetRun(false);
    renderRecentResults();
    seedAmbientParticles();
    attachTilt();
    setupReveal();
    bindEvents();
    handleFullscreen();
    queueChartRender();
    bootLoader();
  }

  initialize();
})();
