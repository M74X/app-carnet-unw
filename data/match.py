import pandas as pd

# Cargar archivos
df_dni = pd.read_excel("dni.xlsx", sheet_name="2026-I")
df_app = pd.read_excel("sindni.xlsx", sheet_name="APP")

print(df_app.columns.tolist())

# Columna J por posición (índice 9) y columna "codigo" del APP
codigos_dni = set(df_dni.iloc[:, 9].dropna())
codigos_app = set(df_app["Codigo"].dropna())

# Cruces
en_ambas = codigos_dni & codigos_app
solo_dni = codigos_dni - codigos_app
solo_app = codigos_app - codigos_dni

print(f"Match (en ambas): {len(en_ambas)}")
print(f"Solo en 2026-I:   {len(solo_dni)}")
print(f"Solo en APP:      {len(solo_app)}")

# Reporte
resultado = pd.DataFrame({
    "codigo": list(en_ambas | solo_dni | solo_app)
})
resultado["en_2026I"] = resultado["codigo"].isin(codigos_dni)
resultado["en_APP"]   = resultado["codigo"].isin(codigos_app)
resultado["match"]    = resultado["en_2026I"] & resultado["en_APP"]

resultado.sort_values("match", ascending=False).to_excel("reporte_match.xlsx", index=False)
print("Listo — reporte_match.xlsx generado")

print(f"Total en 2026-I: {len(codigos_dni)}")
print(f"Total en APP:    {len(codigos_app)}")