"""Genera una copia saneada del consolidado con solo las hojas que usa la app.

- Deja solo BASE CARNÉ 2026-1 y BASE ONLINE (mismo nombre de hoja)
- Limpia espacios (incluye \\xa0) en encabezados y celdas; ESTADO en mayúsculas
- Elimina filas y columnas completamente vacías, y columnas sin encabezado (salvo RENOMBRAR)
- Carrera vacía o sin letras -> se copia de Carrera.
- Código repetido con el mismo nombre -> queda una fila (ENTREGADO si hay, si no la primera)
- Código repetido con nombres distintos -> se dejan todas y se reportan
- Códigos inválidos (longitud != 10) -> se dejan y se reportan
Todo lo cambiado se registra en reportes/sanitizacion_<fecha>.xlsx

Uso: python scripts/sanitizar.py data/archivo/<original>.xlsx
"""
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

import pandas as pd

if len(sys.argv) != 2:
    sys.exit("Uso: python scripts/sanitizar.py data/archivo/<original>.xlsx")

RAIZ   = Path(__file__).resolve().parent.parent
ORIGEN = Path(sys.argv[1])
HOY    = date.today().isoformat()
SALIDA = RAIZ / "data" / f"carnets_sanitizado_{HOY}.xlsx"
LOG    = RAIZ / "reportes" / f"sanitizacion_{HOY}.xlsx"
LOG.parent.mkdir(exist_ok=True)

HOJAS = {  # hoja -> columna de código
    "BASE CARNÉ 2026-1": "Codigo",
    "BASE ONLINE":       "ID Estudiante",
}

# Columnas con encabezado vacío en el original que sí se conservan, con nombre nuevo.
# pandas las nombra por posición ("Unnamed: <n>", contando desde 0). Las demás "Unnamed" se eliminan.
RENOMBRAR = {
    "BASE CARNÉ 2026-1": {"Unnamed: 13": "ASESOR"},
}


def norm(s):
    if pd.isna(s):
        return ""
    return unicodedata.normalize("NFD", str(s).strip().upper()).encode("ascii", "ignore").decode()


def limpiar_texto(v):
    if isinstance(v, str):
        v = re.sub(r"\s+", " ", v.replace("\xa0", " ")).strip()
        return v or None
    return v


def sanear(df, cod, hoja, log):
    df = df.copy()
    df = df.rename(columns=RENOMBRAR.get(hoja, {}))
    sin_nombre = [c for c in df.columns if str(c).startswith("Unnamed")]
    df = df.drop(columns=sin_nombre)
    df.columns = [limpiar_texto(str(c)) for c in df.columns]
    df.insert(0, "_fila", df.index + 2)
    df = df.apply(lambda s: s.map(limpiar_texto) if s.dtype == object else s)

    # Filas y columnas vacías
    datos = [c for c in df.columns if c != "_fila"]
    df = df[df[datos].notna().any(axis=1)]
    vacias = [c for c in datos if df[c].isna().all()]
    df = df.drop(columns=vacias)

    if "ESTADO" in df.columns:
        df["ESTADO"] = df["ESTADO"].map(lambda x: x.upper() if isinstance(x, str) else x)
    df[cod] = df[cod].map(lambda x: str(x).strip() if pd.notna(x) else x)

    # Carrera mal cargada
    if "Carrera" in df.columns and "Carrera." in df.columns:
        mala = df["Carrera"].map(lambda x: not re.search(r"[A-Za-zÁÉÍÓÚÑáéíóúñ]", str(x)) if pd.notna(x) else True)
        mala &= df["Carrera."].notna()
        corr = df.loc[mala, ["_fila", cod, "Carrera", "Carrera."]].copy()
        corr["Hoja"] = hoja
        log["Carrera corregida"].append(corr.rename(columns={"Carrera": "Carrera antes", "Carrera.": "Carrera ahora"}))
        df.loc[mala, "Carrera"] = df.loc[mala, "Carrera."]

    # Repetidos
    df["_nombre"] = df["Primer Apellido"].map(norm) + "|" + df["Segundo Apellido"].map(norm) + "|" + df["Nombres"].map(norm)
    df["_entregado"] = df.get("ESTADO", pd.Series(index=df.index, dtype=object)).eq("ENTREGADO")
    con_cod = df[cod].notna()
    rep = df[con_cod & df.duplicated(cod, keep=False)]
    quitar = []
    for c, g in rep.groupby(cod):
        if g["_nombre"].nunique() > 1:
            x = g.drop(columns=["_nombre", "_entregado"]).copy()
            x["Hoja"] = hoja
            log["Mismo código, distinto nombre"].append(x)
            continue
        queda = g[g["_entregado"]].index[0] if g["_entregado"].any() else g.index[0]
        fuera = g.drop(index=queda)
        quitar.extend(fuera.index)
        x = fuera.drop(columns=["_nombre", "_entregado"]).copy()
        x["Fila que queda"] = df.at[queda, "_fila"]
        x["Hoja"] = hoja
        log["Duplicados eliminados"].append(x)
    df = df.drop(index=quitar)

    inv = df[df[cod].isna() | (df[cod].str.len() != 10)].drop(columns=["_nombre", "_entregado"]).copy()
    inv["Hoja"] = hoja
    log["Códigos inválidos"].append(inv)

    log["Resumen"].append(pd.DataFrame([
        (hoja, "Filas finales",                         len(df)),
        (hoja, "Columnas sin nombre eliminadas",        len(sin_nombre)),
        (hoja, "Columnas vacías eliminadas",            len(vacias)),
        (hoja, "Duplicados eliminados (mismo nombre)",  len(quitar)),
        (hoja, "Carreras corregidas",                   sum(len(x) for x in log["Carrera corregida"] if (x["Hoja"] == hoja).all())),
        (hoja, "Códigos con nombres distintos",         sum(x[cod].nunique() for x in log["Mismo código, distinto nombre"] if (x["Hoja"] == hoja).all())),
        (hoja, "Códigos inválidos (quedan en la hoja)", len(inv)),
    ], columns=["Hoja", "Indicador", "Cantidad"]))

    return df.drop(columns=["_fila", "_nombre", "_entregado"])


log = {k: [] for k in ["Resumen", "Duplicados eliminados", "Mismo código, distinto nombre", "Carrera corregida", "Códigos inválidos"]}

with pd.ExcelWriter(SALIDA, engine="openpyxl") as xw:
    for hoja, cod in HOJAS.items():
        df = pd.read_excel(ORIGEN, sheet_name=hoja, dtype={cod: str})
        limpio = sanear(df, cod, hoja, log)
        limpio.to_excel(xw, sheet_name=hoja, index=False)
        # Código como texto para que Sheets no lo convierta en número
        ws = xw.book[hoja]
        i = list(limpio.columns).index(cod) + 1
        for (celda,) in ws.iter_rows(min_row=2, min_col=i, max_col=i):
            celda.number_format = "@"

with pd.ExcelWriter(LOG, engine="openpyxl") as xw:
    for nombre, partes in log.items():
        df = pd.concat(partes, ignore_index=True) if partes else pd.DataFrame()
        df = df.rename(columns={"_fila": "Fila en original"})
        df.to_excel(xw, sheet_name=nombre, index=False)

print(pd.concat(log["Resumen"]).to_string(index=False))
print(f"\nListo — {SALIDA.relative_to(RAIZ)}\nRegistro — {LOG.relative_to(RAIZ)}")
