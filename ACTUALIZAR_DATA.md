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

## 3. Sanear el Excel antes de subirlo

1. Guarda el Excel original en `data/archivo/` (no se modifica; queda como respaldo).
2. Genera la copia saneada:

   ```bash
   ~/venv/bin/python scripts/sanitizar.py "data/archivo/<archivo original>.xlsx"
   ```

   Crea `data/carnets_sanitizado_<fecha>.xlsx` con solo las hojas que usa la app, y además:
   - limpia espacios y deja `ESTADO` en mayúsculas;
   - une duplicados de la misma persona (queda la fila `ENTREGADO`);
   - completa `Carrera` desde `Carrera.` cuando viene vacía o con números;
   - deja el código como texto.

3. Revisa `reportes/sanitizacion_<fecha>.xlsx` y pide corregir en el origen lo que el script
   **no** arregla: códigos compartidos por personas distintas y códigos inválidos.

Si cambian los nombres de las hojas, ajusta el diccionario `HOJAS` al inicio de `scripts/sanitizar.py`.

## 4. Pasos para cargar el Excel saneado

1. Abre el Google Sheet vinculado a la app (Apps Script → ⚙️ Configuración del proyecto muestra a cuál está vinculado).
2. **Haz una copia de respaldo**: Archivo → Hacer una copia.
3. Archivo → Importar → Subir → selecciona `data/carnets_sanitizado_<fecha>.xlsx`
   (desde Windows: `\\wsl.localhost\Ubuntu\home\m74x\app-carnet-unw\data\`).
   - Elige **"Insertar hojas nuevas"** (no "Reemplazar hoja de cálculo").
4. **Elimina las hojas viejas** que tengan la misma palabra clave.
   ⚠️ Si quedan dos hojas con `BASE CARNE` (u `ONLINE`), la app busca en ambas y podría mostrar data vieja.
   Renombrar la vieja a `BASE CARNE OLD` **no sirve**: sigue conteniendo la palabra clave.
5. Verifica que los nombres de las hojas cumplan la tabla del punto 1.
6. Prueba en la app:
   - un código de la hoja online,
   - un código de la base con estado `ENTREGADO` y otro `PENDIENTE`,
   - un código inexistente (debe decir "no encontrado").

Si la app muestra **"Error al consultar"**, revisa Apps Script → **Ejecuciones**: el error indica
qué hoja y qué columna falta.

## 5. Cuando cambia el código (no la data)

1. Copia el contenido de `codigo.js` al archivo `.gs` del editor de Apps Script y guarda.
2. Implementar → **Gestionar implementaciones** → ✏️ editar la implementación activa →
   Versión: **Nueva versión** → Implementar.
   Así se mantiene la misma URL de la app.

## 6. Revisar solo los repetidos (opcional)

Genera `reportes/codigos_repetidos_<fecha>.xlsx` con códigos repetidos e inválidos, sin crear
copia saneada:

```bash
~/venv/bin/python scripts/repetidos.py "data/archivo/<archivo original>.xlsx"
```
