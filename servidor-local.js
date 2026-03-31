import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import handlerRecetas from "./api/recetas.js";

const PUERTO = process.env.PORT || 3000;
const RAIZ = process.cwd();

const TIPOS_MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function crearRespuestaNode(res) {
  return {
    setHeader(nombre, valor) {
      res.setHeader(nombre, valor);
    },
    status(codigo) {
      res.statusCode = codigo;
      return this;
    },
    json(datos) {
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      res.end(JSON.stringify(datos));
      return this;
    }
  };
}

async function servirArchivo(ruta, res) {
  try {
    const rutaAbsoluta = resolve(RAIZ, ruta);
    const contenido = await readFile(rutaAbsoluta);
    const extension = extname(rutaAbsoluta).toLowerCase();
    const tipo = TIPOS_MIME[extension] || "application/octet-stream";

    res.statusCode = 200;
    res.setHeader("Content-Type", tipo);
    res.end(contenido);
  } catch {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Recurso no encontrado." }));
  }
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);

  if (url.pathname === "/api/recetas") {
    const query = Object.fromEntries(url.searchParams.entries());
    const reqApi = { method: req.method, query };
    const resApi = crearRespuestaNode(res);
    await handlerRecetas(reqApi, resApi);
    return;
  }

  if (url.pathname === "/") {
    await servirArchivo("index.html", res);
    return;
  }

  await servirArchivo(url.pathname.slice(1), res);
});

servidor.listen(PUERTO, () => {
  console.log(`Servidor local listo en http://localhost:${PUERTO}`);
});
