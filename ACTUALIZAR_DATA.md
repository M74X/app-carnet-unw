# Cómo actualizar la data de la app

La app lee la data **en vivo** desde el Google Sheet al que está vinculado el proyecto de Apps Script.
Actualizar la data **no requiere tocar el código ni volver a implementar**.

## 1. Qué hojas usa la app

La app reconoce las hojas por palabra clave en el nombre (sin importar tildes ni mayúsculas):

| La hoja debe contener | Uso | Sede que se muestra |
|---|---|---|
| `ONLINE` | Alumnos virtuales | Local 01 — Av. Arequipa |
| `BASE CARNE` | Base principal (Lima Centro) | Local 01 (salud, maestrías, 2da especialidad) o Local 05 — Lince (resto) |
| `LN` o `LIMA NORTE` | Lima Norte | Lima Norte |

Cualquier otra hoja (`LOCAL 1`, `LOCAL 5`, `DATA OFICIAL`, `TD`, etc.) se ignora.

## 2. Columnas necesarias

La fila de encabezado puede estar en cualquiera de las primeras 5 filas. Nombres aceptados:

| Dato | Nombres válidos | ¿Obligatorio? |
|---|---|---|
| Código | `Codigo`, `Código de Estudiante`, `Código de Alumno`, `ID Estudiante` | Sí |
| Estado | `ESTADO` (valores `ENTREGADO` / `PENDIENTE`) | Sí |
| Nombre | `Apellidos y Nombres` **o** `Primer Apellido` + `Segundo Apellido` + `Nombres` | Sí |
| Carrera | `Carrera`, `Carrera Profesional`, `Programa Académico` | Solo en `BASE CARNE` |
| Carrera agrupada | `Carrera.` | Solo en `BASE CARNE` |

Si cambian un nombre de columna u hoja, se agrega el nombre nuevo en la sección
**CONFIGURACIÓN DE HOJAS Y COLUMNAS** de `codigo.js` (listas `HOJAS` y `COLUMNAS`).

## 3. Pasos para cargar un Excel nuevo

1. Abre el Google Sheet vinculado a la app (Apps Script → ⚙️ Configuración del proyecto muestra a cuál está vinculado).
2. **Haz una copia de respaldo**: Archivo → Hacer una copia.
3. Archivo → Importar → Subir → selecciona el `.xlsx`.
   - Elige **"Insertar hojas nuevas"** (no "Reemplazar hoja de cálculo").
4. **Elimina las hojas viejas** que tengan la misma palabra clave.
   ⚠️ Si quedan dos hojas con `BASE CARNE` (u `ONLINE`), la app busca en ambas y podría mostrar data vieja.
   Renombrar la vieja a `BASE CARNE OLD` **no sirve**: sigue conteniendo la palabra clave.
5. Elimina las hojas importadas que la app no usa y que tienen datos personales (DNI, teléfonos, correos),
   salvo que las necesites en ese Sheet.
6. Verifica que los nombres de las hojas cumplan la tabla del punto 1.
7. Prueba en la app:
   - un código de la hoja online,
   - un código de la base con estado `ENTREGADO` y otro `PENDIENTE`,
   - un código inexistente (debe decir "no encontrado").

Si la app muestra **"Error al consultar"**, revisa Apps Script → **Ejecuciones**: el error indica
qué hoja y qué columna falta.

## 4. Cuando cambia el código (no la data)

1. Copia el contenido de `codigo.js` al archivo `.gs` del editor de Apps Script y guarda.
2. Implementar → **Gestionar implementaciones** → ✏️ editar la implementación activa →
   Versión: **Nueva versión** → Implementar.
   Así se mantiene la misma URL de la app.

## 5. Revisar calidad de la data (opcional, local)

`reportes/repetidos.py` genera un Excel con códigos repetidos y códigos inválidos
(ambos quedan fuera del repo por `.gitignore`). Antes de correrlo, ajusta la variable
`ARCHIVO` con el nombre del Excel nuevo en `data/`.
