function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Consulta de Carnet - UNW')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── CRONOGRAMAS ─────────────────────────────────────────────────────────────

var CRONOGRAMA_LOCAL01 = {
  'MEDICINA HUMANA':                                                      'Lunes 01 de Junio',
  'ENFERMERIA':                                                           'Martes 02 de Junio',
  'FARMACIA Y BIOQUIMICA':                                                'Miércoles 03 de Junio',
  'ODONTOLOGIA':                                                          'Miércoles 03 de Junio',
  'TECNOLOGIA MEDICA EN TERAPIA FISICA Y REHABILITACION':                'Jueves 04 de Junio',
  'TECNOLOGIA MEDICA EN LABORATORIO CLINICO Y ANATOMIA PATOLOGICA':      'Jueves 04 de Junio',
  'OBSTETRICIA':                                                          'Jueves 04 de Junio',
  'PSICOLOGIA':                                                           'Viernes 05 de Junio',
  'NUTRICION Y DIETETICA':                                                'Viernes 05 de Junio',
  'MAESTRIAS':                                                            'Sábado 05 de Junio',
  'SEGUNDA ESPECIALIDAD':                                                 'Sábado 04 de Junio',
};

var CRONOGRAMA_LOCAL05 = {
  'DERECHO Y CIENCIA POLITICA':                                          'Lunes 01 de Junio',
  'INGENIERIA DE SISTEMAS E INFORMATICA':                                'Martes 02 de Junio',
  'ADMINISTRACION EN TURISMO Y HOTELERIA':                               'Miércoles 03 de Junio',
  'ADMINISTRACION Y NEGOCIOS INTERNACIONALES':                           'Miércoles 03 de Junio',
  'CONTABILIDAD Y AUDITORIA':                                            'Miércoles 03 de Junio',
  'ADMINISTRACION Y DIRECCION DE EMPRESAS':                              'Jueves 04 de Junio',
  'INGENIERIA INDUSTRIAL Y DE GESTION EMPRESARIAL':                      'Jueves 04 de Junio',
  'ADMINISTRACION Y MARKETING':                                          'Viernes 05 de Junio',
  'INGENIERIA CIVIL':                                                    'Viernes 05 de Junio',
  'INGENIERIA BIOMEDICA':                                                'Viernes 05 de Junio',
  'ARQUITECTURA':                                                        'Viernes 05 de Junio',
  'COMUNICACION EN MEDIOS DIGITALES':                                    'Viernes 05 de Junio',
};

var CRONOGRAMA_LN = {
  'MEDICINA VETERINARIA':                                                'Lunes 01 de Junio',
  'ENFERMERIA':                                                          'Lunes 01 de Junio',
  'ODONTOLOGIA':                                                         'Lunes 01 de Junio',
  'MEDICINA HUMANA':                                                     'Lunes 01 de Junio',
  'DERECHO Y CIENCIA POLITICA':                                          'Lunes 01 de Junio',
  'INGENIERIA DE SISTEMAS E INFORMATICA':                                'Lunes 01 de Junio',
  'INGENIERIA INDUSTRIAL Y DE GESTION EMPRESARIAL':                      'Lunes 01 de Junio',
  'ADMINISTRACION Y NEGOCIOS INTERNACIONALES':                           'Lunes 01 de Junio',
  'PSICOLOGIA':                                                          'Martes 02 de Junio',
  'TECNOLOGIA MEDICA EN TERAPIA FISICA Y REHABILITACION':                'Martes 02 de Junio',
  'TECNOLOGIA MEDICA EN LABORATORIO CLINICO Y ANATOMIA PATOLOGICA':      'Martes 02 de Junio',
  'NUTRICION Y DIETETICA':                                               'Martes 02 de Junio',
  'OBSTETRICIA':                                                         'Martes 02 de Junio',
  'FARMACIA Y BIOQUIMICA':                                               'Martes 02 de Junio',
};

var CARRERAS_SALUD = [
  'ENFERMERIA', 'FARMACIA Y BIOQUIMICA', 'INGENIERIA BIOMEDICA',
  'MEDICINA HUMANA', 'NUTRICION Y DIETETICA', 'OBSTETRICIA', 'ODONTOLOGIA',
  'PSICOLOGIA', 'TECNOLOGIA MEDICA EN LABORATORIO CLINICO Y ANATOMIA PATOLOGICA',
  'TECNOLOGIA MEDICA EN TERAPIA FISICA Y REHABILITACION'
];

var GRUPOS_LOCAL01 = ['MAESTRIAS', 'SEGUNDA ESPECIALIDAD'];

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

function normalizar(str) {
  return (str || '').toString().trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getFechaEntrega(carrera, carreraAgrupada, local) {
  var c = normalizar(carrera);
  var ca = normalizar(carreraAgrupada);
  if (local === 'localLN')  return 'Ya puedes recoger tu carnet';
  if (local === 'local01')  return CRONOGRAMA_LOCAL01[ca] || CRONOGRAMA_LOCAL01[c] || 'Ya puedes recoger tu carnet';
  return CRONOGRAMA_LOCAL05[c] || 'Ya puedes recoger tu carnet';
}

function getLocalBase(carrera, carreraAgrupada) {
  var c  = normalizar(carrera);
  var ca = normalizar(carreraAgrupada);
  for (var i = 0; i < GRUPOS_LOCAL01.length; i++) {
    if (ca === GRUPOS_LOCAL01[i]) return 'local01';
  }
  for (var j = 0; j < CARRERAS_SALUD.length; j++) {
    if (c === CARRERAS_SALUD[j]) return 'local01';
  }
  return 'local05';
}

// ─── BÚSQUEDA ─────────────────────────────────────────────────────────────────
// Columnas esperadas en BASE CARNÉ 2026-1 (después de limpiar):
//   Còdigo | Primer Apellido | Segundo Apellido | Nombres | Carrera | Carrera. | Estado
//
// Columnas esperadas en DATA CARNET UNIVERSITARIO LN (después de limpiar):
//   CODIGO DE ESTUDIANTE | APELLIDOS Y NOMBRES | CARRERA | ESTADO

function buscarEnHojaBase(hoja, codigoBuscar, prefijo) {
  var ultimaFila = hoja.getLastRow();
  var ultimaCol  = hoja.getLastColumn();
  if (ultimaFila < 2) return null;

  // Lee solo las columnas necesarias (rango acotado, no getDataRange completo)
  var datos = hoja.getRange(1, 1, ultimaFila, ultimaCol).getValues();
  var enc   = datos[0];

  // Mapear columnas por nombre
  var col = { codigo: -1, ap1: -1, ap2: -1, nombres: -1, carrera: -1, carreraAg: -1, estado: -1 };
  for (var i = 0; i < enc.length; i++) {
    var h = normalizar(enc[i]);
    if (h === 'CODIGO' || h === 'CODIGO')           col.codigo   = i;
    if (h === 'PRIMER APELLIDO')                    col.ap1      = i;
    if (h === 'SEGUNDO APELLIDO')                   col.ap2      = i;
    if (h === 'NOMBRES')                            col.nombres  = i;
    if (h === 'CARRERA' && col.carrera === -1)      col.carrera  = i;
    if (h === 'CARRERA.')                           col.carreraAg = i;
    if (h === 'ESTADO')                             col.estado   = i;
  }
  if (col.codigo === -1) return null;

  for (var j = 1; j < datos.length; j++) {
    var codigoFila = datos[j][col.codigo].toString().trim();

    // Filtro por prefijo: descarta filas que no empiecen igual (reducción de rango)
    if (codigoFila.substring(0, 6) !== prefijo) continue;

    if (codigoFila === codigoBuscar) {
      var ap1          = col.ap1      !== -1 ? datos[j][col.ap1].toString().trim()      : '';
      var ap2          = col.ap2      !== -1 ? datos[j][col.ap2].toString().trim()      : '';
      var nombres      = col.nombres  !== -1 ? datos[j][col.nombres].toString().trim()  : '';
      var carrera      = col.carrera  !== -1 ? datos[j][col.carrera].toString().trim()  : '';
      var carreraAg    = col.carreraAg !== -1 ? datos[j][col.carreraAg].toString().trim(): '';
      var estado       = col.estado   !== -1 ? normalizar(datos[j][col.estado])         : '';
      var nombre       = (ap1 + ' ' + ap2 + ', ' + nombres).trim().replace(/^,\s*/, '');
      var local        = getLocalBase(carrera, carreraAg);
      var fecha        = getFechaEntrega(carrera, carreraAg, local);
      return { encontrado: true, nombre: nombre, listo: true, entregado: estado === 'ENTREGADO', local: local, fecha: fecha };
    }
  }
  return null;
}

function buscarEnHojaLN(hoja, codigoBuscar, prefijo) {
  var ultimaFila = hoja.getLastRow();
  var ultimaCol  = hoja.getLastColumn();
  if (ultimaFila < 2) return null;

  var datos = hoja.getRange(1, 1, ultimaFila, ultimaCol).getValues();
  var enc   = datos[0];

  var col = { codigo: -1, nombre: -1, carrera: -1, estado: -1 };
  for (var i = 0; i < enc.length; i++) {
    var h = normalizar(enc[i]);
    if (h === 'CODIGO DE ESTUDIANTE')               col.codigo  = i;
    if (h === 'APELLIDOS Y NOMBRES')                col.nombre  = i;
    if (h === 'CARRERA' || h === 'CARRERA PROFESIONAL') col.carrera = i;
    if (h === 'ESTADO')                             col.estado  = i;
  }
  if (col.codigo === -1) return null;

  for (var j = 1; j < datos.length; j++) {
    var codigoFila = datos[j][col.codigo].toString().trim();

    // Filtro por prefijo
    if (codigoFila.substring(0, 6) !== prefijo) continue;

    if (codigoFila === codigoBuscar) {
      var nombre  = col.nombre  !== -1 ? datos[j][col.nombre].toString().trim()  : '';
      var carrera = col.carrera !== -1 ? datos[j][col.carrera].toString().trim() : '';
      var estado  = col.estado  !== -1 ? normalizar(datos[j][col.estado])        : '';
      var fecha   = getFechaEntrega(carrera, '', 'localLN');
      return { encontrado: true, nombre: nombre, listo: true, entregado: estado === 'ENTREGADO', local: 'localLN', fecha: fecha };
    }
  }
  return null;
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

function buscarAlumno(codigo) {
  var ss           = SpreadsheetApp.getActiveSpreadsheet();
  var codigoBuscar = codigo.toString().trim();
  var prefijo      = codigoBuscar.substring(0, 6); // filtro de rango

  var hojaBase = ss.getSheetByName('BASE CARNÉ 2026-1');
  if (hojaBase) {
    var r = buscarEnHojaBase(hojaBase, codigoBuscar, prefijo);
    if (r) return r;
  }

  var hojaLN = ss.getSheetByName('DATA CARNET UNIVERSITARIO LN');
  if (hojaLN) {
    var r2 = buscarEnHojaLN(hojaLN, codigoBuscar, prefijo);
    if (r2) return r2;
  }

  return { encontrado: false };
}