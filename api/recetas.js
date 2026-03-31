import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const RUTA_RECETAS = resolve(process.cwd(), "recetas.json");

const CABECERAS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

function enviarJson(res, codigo, datos) {
  Object.entries(CABECERAS_CORS).forEach(([clave, valor]) => {
    res.setHeader(clave, valor);
  });
  res.status(codigo).json(datos);
}

async function obtenerRecetas() {
  const contenido = await readFile(RUTA_RECETAS, "utf-8");
  return JSON.parse(contenido);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return enviarJson(res, 405, {
      error: "Metodo no permitido. Solo se admite GET."
    });
  }

  try {
    const recetas = await obtenerRecetas();
    const { id, dificultad } = req.query;

    if (id !== undefined) {
      const idNumerico = Number.parseInt(id, 10);

      if (Number.isNaN(idNumerico) || idNumerico < 1) {
        return enviarJson(res, 400, {
          error: "El parametro id debe ser un numero entero positivo."
        });
      }

      const receta = recetas.find((item) => item.id === idNumerico);

      if (!receta) {
        return enviarJson(res, 404, {
          error: `No se encontro una receta con id ${idNumerico}.`
        });
      }

      return enviarJson(res, 200, receta);
    }

    if (dificultad !== undefined) {
      const dificultadNormalizada = String(dificultad).trim().toLowerCase();
      const recetasFiltradas = recetas.filter(
        (item) => item.nivelDificultad.toLowerCase() === dificultadNormalizada
      );

      if (recetasFiltradas.length === 0) {
        return enviarJson(res, 404, {
          error: `No se encontraron recetas con dificultad ${dificultad}.`
        });
      }

      return enviarJson(res, 200, recetasFiltradas);
    }

    return enviarJson(res, 200, recetas);
  } catch (error) {
    return enviarJson(res, 500, {
      error: "Ocurrio un error al leer las recetas.",
      detalle: error.message
    });
  }
}
