const BINDABLE_VAR_FIELDS = new Set(['fontSize','lineHeight','letterSpacing','paragraphSpacing','paragraphIndent']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFontName(value) {
  return isRecord(value) && typeof value.family === 'string' && typeof value.style === 'string';
}

function isUnitValue(value, units) {
  if (!isRecord(value) || typeof value.unit !== 'string' || !units.includes(value.unit)) return false;
  if (value.unit === 'AUTO') return true;
  return isFiniteNumber(value.value);
}

function isBindableVarField(field) {
  return BINDABLE_VAR_FIELDS.has(field);
}

function getViewModelBoundVars(viewModel) {
  return isRecord(viewModel && viewModel.boundVars) ? viewModel.boundVars : {};
}

function validateTextStyleViewModel(value, index) {
  if (!isRecord(value)) throw new Error('styles[' + index + '] must be an object');
  if (typeof value.id !== 'string' || !value.id) throw new Error('styles[' + index + '].id must be a string');
  if (typeof value.name !== 'string') throw new Error('styles[' + index + '].name must be a string');
  if (!isFiniteNumber(value.fontSize)) throw new Error('styles[' + index + '].fontSize must be a number');
  if (!isFontName(value.fontName)) throw new Error('styles[' + index + '].fontName is invalid');
  if (!isUnitValue(value.letterSpacing, ['PIXELS','PERCENT'])) throw new Error('styles[' + index + '].letterSpacing is invalid');
  if (!isUnitValue(value.lineHeight, ['AUTO','PIXELS','PERCENT'])) throw new Error('styles[' + index + '].lineHeight is invalid');
  if (!isFiniteNumber(value.paragraphIndent)) throw new Error('styles[' + index + '].paragraphIndent must be a number');
  if (!isFiniteNumber(value.paragraphSpacing)) throw new Error('styles[' + index + '].paragraphSpacing must be a number');
  if (!isFiniteNumber(value.listSpacing)) throw new Error('styles[' + index + '].listSpacing must be a number');
  if (typeof value.hangingPunctuation !== 'boolean') throw new Error('styles[' + index + '].hangingPunctuation must be a boolean');
  if (typeof value.hangingList !== 'boolean') throw new Error('styles[' + index + '].hangingList must be a boolean');

  const boundVars = {};
  const rawBoundVars = getViewModelBoundVars(value);
  Object.entries(rawBoundVars).forEach(([field, variableId]) => {
    if (isBindableVarField(field) && typeof variableId === 'string') boundVars[field] = variableId;
  });

  return {
    id: value.id,
    name: value.name,
    fontSize: value.fontSize,
    fontName: { family: value.fontName.family, style: value.fontName.style },
    letterSpacing: value.letterSpacing.unit === 'AUTO' ? { unit: 'AUTO' } : { unit: value.letterSpacing.unit, value: value.letterSpacing.value },
    lineHeight: value.lineHeight.unit === 'AUTO' ? { unit: 'AUTO' } : { unit: value.lineHeight.unit, value: value.lineHeight.value },
    paragraphIndent: value.paragraphIndent,
    paragraphSpacing: value.paragraphSpacing,
    textCase: typeof value.textCase === 'string' ? value.textCase : 'ORIGINAL',
    textDecoration: typeof value.textDecoration === 'string' ? value.textDecoration : 'NONE',
    leadingTrim: typeof value.leadingTrim === 'string' ? value.leadingTrim : 'NONE',
    listSpacing: value.listSpacing,
    hangingPunctuation: value.hangingPunctuation,
    hangingList: value.hangingList,
    boundVars,
  };
}

function validateFontMap(value) {
  if (!isRecord(value)) return {};
  const nextFonts = {};
  Object.entries(value).forEach(([family, stylesForFamily]) => {
    if (typeof family === 'string' && Array.isArray(stylesForFamily)) {
      nextFonts[family] = stylesForFamily.filter(style => typeof style === 'string');
    }
  });
  return nextFonts;
}

function validateVariableInfo(value, index) {
  if (!isRecord(value)) throw new Error('variables[' + index + '] must be an object');
  if (typeof value.id !== 'string' || !value.id) throw new Error('variables[' + index + '].id must be a string');
  if (typeof value.name !== 'string') throw new Error('variables[' + index + '].name must be a string');
  return {
    id: value.id,
    name: value.name,
    collectionName: typeof value.collectionName === 'string' ? value.collectionName : '',
  };
}

function validateStylesLoadedMessage(msg) {
  if (!Array.isArray(msg.styles)) throw new Error('styles-loaded message must include a styles array');
  return {
    styles: msg.styles.map(validateTextStyleViewModel),
    fonts: validateFontMap(msg.fonts || {}),
    variables: Array.isArray(msg.variables) ? msg.variables.map(validateVariableInfo) : [],
  };
}

function validateApplyResult(value, index) {
  if (!isRecord(value)) throw new Error('results[' + index + '] must be an object');
  if (typeof value.id !== 'string' || !value.id) throw new Error('results[' + index + '].id must be a string');
  if (typeof value.ok !== 'boolean') throw new Error('results[' + index + '].ok must be a boolean');
  return {
    id: value.id,
    name: typeof value.name === 'string' ? value.name : value.id,
    ok: value.ok,
    error: typeof value.error === 'string' ? value.error : undefined,
  };
}

function validateApplyResultsMessage(msg) {
  if (!Array.isArray(msg.results)) throw new Error('apply-results message must include a results array');
  return msg.results.map(validateApplyResult);
}
