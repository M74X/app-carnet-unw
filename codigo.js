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
  'ENFERMERIA', 'FARMACIA Y BIOQUIMICA',
  'MEDICINA HUMANA', 'NUTRICION Y DIETETICA', 'OBSTETRICIA', 'ODONTOLOGIA',
  'PSICOLOGIA', 'TECNOLOGIA MEDICA EN LABORATORIO CLINICO Y ANATOMIA PATOLOGICA',
  'TECNOLOGIA MEDICA EN TERAPIA FISICA Y REHABILITACION'
];

var GRUPOS_LOCAL01 = ['MAESTRIA', 'SEGUNDA ESPECIALIDAD'];

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

function normalizar(str) {
  return (str || '').toString().trim().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getFechaEntrega() {
  return 'Ya puedes recoger tu carnet';
}

function getLocalBase(carrera, carreraAgrupada) {
  var c  = normalizar(carrera);
  var ca = normalizar(carreraAgrupada);
  for (var i = 0; i < GRUPOS_LOCAL01.length; i++) {
    if (ca === GRUPOS_LOCAL01[i] || ca.indexOf(GRUPOS_LOCAL01[i]) === 0) return 'local01';
  }
  // Se revisan ambas columnas por si una viene mal llenada
  for (var j = 0; j < CARRERAS_SALUD.length; j++) {
    if (c === CARRERAS_SALUD[j] || ca === CARRERAS_SALUD[j]) return 'local01';
  }
  return 'local05';
}

// ─── CONFIGURACIÓN DE HOJAS Y COLUMNAS ────────────────────────────────────────
// Si cambian los nombres en el Excel, solo hay que tocar esta sección.
// Todo se compara normalizado: sin tildes, en mayúsculas y sin espacios sobrantes.

// Hojas donde se busca, en orden de prioridad. Se reconocen por palabra clave,
// así que 'ONLINE 2026-I', 'BASE ONLINE' u 'ONLINE 2026-II' sirven igual.
var HOJAS = [
  { patron: /ONLINE/,            local: function ()  { return 'local01'; } },
  { patron: /BASE CARNE/,        local: function (f) { return getLocalBase(f.carrera, f.carreraAg); } },
  { patron: /\bLN\b|LIMA NORTE/, local: function ()  { return 'localLN'; } },
];

// Nombres aceptados para cada columna. Se usa la primera columna que coincida.
var COLUMNAS = {
  codigo:    ['CODIGO', 'CODIGO DE ESTUDIANTE', 'CODIGO DE ALUMNO', 'ID ESTUDIANTE'],
  nombre:    ['APELLIDOS Y NOMBRES'],
  ap1:       ['PRIMER APELLIDO'],
  ap2:       ['SEGUNDO APELLIDO'],
  nombres:   ['NOMBRES'],
  carrera:   ['CARRERA', 'CARRERA PROFESIONAL', 'PROGRAMA ACADEMICO'],
  carreraAg: ['CARRERA.'],
  estado:    ['ESTADO'],
};

// Filas donde se busca el encabezado (por si el Excel trae filas vacías arriba)
var FILAS_ENCABEZADO = 5;

// ─── BÚSQUEDA ─────────────────────────────────────────────────────────────────

function mapearColumnas(encabezado) {
  var enc = encabezado.map(normalizar);
  var col = {};
  for (var campo in COLUMNAS) {
    col[campo] = -1;
    for (var i = 0; i < enc.length && col[campo] === -1; i++) {
      if (COLUMNAS[campo].indexOf(enc[i]) !== -1) col[campo] = i;
    }
  }
  return col;
}

function validarColumnas(hoja, col) {
  var faltan = [];
  if (col.codigo === -1) faltan.push('código (' + COLUMNAS.codigo.join(' / ') + ')');
  if (col.estado === -1) faltan.push('estado (' + COLUMNAS.estado.join(' / ') + ')');
  if (col.nombre === -1 && col.ap1 === -1 && col.nombres === -1) {
    faltan.push('nombre (' + COLUMNAS.nombre.concat(COLUMNAS.ap1, COLUMNAS.nombres).join(' / ') + ')');
  }
  if (faltan.length) {
    throw new Error('Hoja "' + hoja.getName() + '": no se encontró la columna de ' + faltan.join(', '));
  }
}

function leerFila(fila, col) {
  var f = {};
  for (var campo in col) {
    f[campo] = col[campo] !== -1 ? fila[col[campo]].toString().trim() : '';
  }
  return f;
}

function armarNombre(f) {
  if (f.nombre) return f.nombre;
  return (f.ap1 + ' ' + f.ap2 + ', ' + f.nombres).trim().replace(/^,\s*/, '');
}

function buscarEnHoja(hoja, config, codigoBuscar) {
  var datos = hoja.getDataRange().getValues();

  // Ubicar la fila de encabezado: la primera que tenga columna de código
  var filaEnc = -1, col;
  for (var e = 0; e < Math.min(FILAS_ENCABEZADO, datos.length) && filaEnc === -1; e++) {
    col = mapearColumnas(datos[e]);
    if (col.codigo !== -1) filaEnc = e;
  }
  if (filaEnc === -1) col = mapearColumnas(datos[0] || []);
  validarColumnas(hoja, col);

  // Si el código está repetido, gana la fila ENTREGADO; si no hay, la primera
  var encontrada = null;
  for (var j = filaEnc + 1; j < datos.length; j++) {
    if (datos[j][col.codigo].toString().trim() !== codigoBuscar) continue;
    var f = leerFila(datos[j], col);
    var entregado = normalizar(f.estado) === 'ENTREGADO';
    if (!encontrada || entregado) encontrada = { f: f, entregado: entregado };
    if (entregado) break;
  }
  if (!encontrada) return null;

  return {
    encontrado: true,
    nombre:     armarNombre(encontrada.f),
    listo:      true,
    entregado:  encontrada.entregado,
    local:      config.local(encontrada.f),
    fecha:      getFechaEntrega(),
  };
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

function buscarAlumno(codigo) {
  var codigoBuscar = codigo.toString().trim();
  var hojas        = SpreadsheetApp.getActiveSpreadsheet().getSheets();

  for (var i = 0; i < HOJAS.length; i++) {
    for (var k = 0; k < hojas.length; k++) {
      if (!HOJAS[i].patron.test(normalizar(hojas[k].getName()))) continue;
      var r = buscarEnHoja(hojas[k], HOJAS[i], codigoBuscar);
      if (r) return r;
    }
  }

  return { encontrado: false };
}
