import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';
const MAX_REQUEST_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes max execution budget

const VALID_PERMISSIONS = new Set([
  'Administrador',
  'Gestionar canales',
  'Gestionar roles',
  'Gestionar mensajes',
  'Expulsar miembros',
  'Fijar mensajes',
  'Enviar mensajes',
  'Leer canales',
  'Conectar a voz',
]);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'No hay una GEMINI_API_KEY configurada en el servidor. Configúrala en Settings > Secrets para usar la IA.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isRetryableGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (
    msg.includes('GEMINI_API_KEY') ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('400') ||
    msg.includes('403') ||
    msg.includes('404')
  ) {
    return false;
  }
  return (
    msg.includes('429') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('fetch failed')
  );
}

async function callWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || !isRetryableGeminiError(err)) {
        throw err;
      }
      const delayMs = 450 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function extractAndParseJson<T>(rawText: string): T | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(unfenced) as T;
  } catch {
    const start = unfenced.indexOf('{');
    const end = unfenced.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(unfenced.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sanitizeChannelSlug(rawName: string, type: 'text' | 'voice' | 'announcement'): string {
  const trimmed = rawName
    .trim()
    .replace(/^#+\s*/, '')
    .replace(/[\x00-\x1F\x7F]/g, '');
  if (!trimmed) return type === 'voice' ? 'Sala General' : 'general';
  if (type === 'voice') {
    return trimmed.slice(0, 60);
  }
  const slug = trimmed
    .normalize('NFC')
    .replace(/[A-ZÀ-ÖØ-Þ]/g, (ch) =>
      ch
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    )
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return slug || 'general';
}

function normalizePermissions(perms: unknown): string[] {
  if (!Array.isArray(perms)) return ['Enviar mensajes', 'Leer canales'];
  const cleaned = perms
    .map((p) => String(p).trim())
    .filter((p) => VALID_PERMISSIONS.has(p));
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : ['Enviar mensajes', 'Leer canales'];
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (raw.includes('GEMINI_API_KEY')) {
    return { status: 500, message: raw };
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 403,
      message: 'La clave de Gemini API no es válida o no tiene permisos. Revísala en Settings > Secrets.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Se alcanzó temporalmente el límite de solicitudes de la IA. Intenta de nuevo en unos segundos.',
    };
  }
  if (raw.includes('404') || raw.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: 'El modelo de IA configurado no estuvo disponible. Inténtalo de nuevo.',
    };
  }
  return {
    status: 500,
    message: raw || 'Ocurrió un error al comunicarse con el motor de IA.',
  };
}

interface AssistantHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ServerContextPayload {
  name?: string;
  description?: string;
  existingChannels?: Array<{ name: string; type: string; category: string }>;
  existingRoles?: Array<{ name: string }>;
}

interface UploadedImagePayload {
  mimeType?: string;
  data?: string;
}

interface RawBuildPlan {
  serverName?: string;
  summary?: string;
  serverDescription?: string;
  accentColor?: string;
  categoriesOrder?: string[];
  channels?: Array<{
    name?: string;
    type?: string;
    category?: string;
    topic?: string;
    isPrivate?: boolean;
    starterMessage?: string;
  }>;
  channelUpdates?: Array<{
    currentName?: string;
    newName?: string;
    topic?: string;
    category?: string;
  }>;
  roles?: Array<{
    name?: string;
    color?: string;
    hoist?: boolean;
    permissions?: string[];
  }>;
}

function buildMultimodalContents(
  textPrompt: string,
  images?: UploadedImagePayload[]
) {
  const validParts: Array<
    | { inlineData: { mimeType: string; data: string } }
    | { text: string }
  > = [];

  if (Array.isArray(images)) {
    for (const img of images.slice(0, 4)) {
      const rawData = typeof img?.data === 'string' ? img.data.trim() : '';
      if (!rawData) continue;
      // Handle optional data URL prefix
      const dataUrlMatch = rawData.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      const mimeType = dataUrlMatch
        ? dataUrlMatch[1].toLowerCase()
        : String(img?.mimeType || 'image/jpeg').toLowerCase();
      const base64Data = dataUrlMatch ? dataUrlMatch[2] : rawData;

      if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) continue;
      if (base64Data.length > 4_000_000) continue;

      validParts.push({
        inlineData: {
          mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
          data: base64Data,
        },
      });
    }
  }

  validParts.push({ text: textPrompt });
  return validParts.length === 1 ? textPrompt : { parts: validParts };
}

function sanitizeBuildPlan(rawPlan: RawBuildPlan, fallbackTitle: string) {
  const serverName = String(rawPlan.serverName || fallbackTitle || 'Servidor IA')
    .trim()
    .slice(0, 80);

  const serverDescription = String(
    rawPlan.serverDescription || rawPlan.summary || 'Comunidad organizada con Primordial IA.'
  )
    .trim()
    .slice(0, 280);

  const summary = String(
    rawPlan.summary || 'Estructura profesional construida y aplicada en tu servidor.'
  )
    .trim()
    .slice(0, 600);

  const accentColor = /^#[0-9a-fA-F]{6}$/.test(String(rawPlan.accentColor || '').trim())
    ? String(rawPlan.accentColor).trim()
    : '#8b5cf6';

  const seenChannels = new Set<string>();
  const channels = (Array.isArray(rawPlan.channels) ? rawPlan.channels : [])
    .slice(0, 16)
    .map((ch) => {
      const chType: 'text' | 'voice' | 'announcement' =
        ch.type === 'voice' || ch.type === 'announcement' ? ch.type : 'text';
      const name = sanitizeChannelSlug(String(ch.name || ''), chType);
      const category =
        String(ch.category || (chType === 'voice' ? 'Canales de voz' : 'Canales de texto'))
          .trim()
          .slice(0, 60) || 'Canales de texto';
      return {
        name,
        type: chType,
        category,
        topic: ch.topic ? String(ch.topic).trim().slice(0, 200) : `Canal ${name}`,
        isPrivate: Boolean(ch.isPrivate),
        starterMessage:
          chType !== 'voice' && ch.starterMessage
            ? String(ch.starterMessage).trim().slice(0, 1800)
            : undefined,
      };
    })
    .filter((ch) => {
      const key = `${ch.type}:${ch.name.toLowerCase()}`;
      if (seenChannels.has(key)) return false;
      seenChannels.add(key);
      return true;
    });

  const categoriesOrder = Array.from(
    new Set([
      ...(Array.isArray(rawPlan.categoriesOrder) ? rawPlan.categoriesOrder : [])
        .map((c) => String(c).trim().slice(0, 60))
        .filter(Boolean),
      ...channels.map((c) => c.category),
    ])
  );

  const seenRoles = new Set<string>();
  const roles = (Array.isArray(rawPlan.roles) ? rawPlan.roles : [])
    .slice(0, 8)
    .map((r) => ({
      name: String(r.name || 'Miembro').trim().slice(0, 40) || 'Miembro',
      color: /^#[0-9a-fA-F]{6}$/.test(String(r.color || '').trim())
        ? String(r.color).trim()
        : '#a855f7',
      hoist: Boolean(r.hoist),
      permissions: normalizePermissions(r.permissions),
    }))
    .filter((r) => {
      const key = r.name.toLowerCase();
      if (seenRoles.has(key)) return false;
      seenRoles.add(key);
      return true;
    });

  const seenUpdates = new Set<string>();
  const channelUpdates = (Array.isArray(rawPlan.channelUpdates) ? rawPlan.channelUpdates : [])
    .slice(0, 24)
    .map((u) => {
      const currentName = String(u.currentName || '').trim().replace(/^#+\s*/, '').slice(0, 60);
      const rawNewName = String(u.newName || '').trim();
      const newName = rawNewName
        ? rawNewName.replace(/^#+\s*/, '').replace(/\s+/g, '-').slice(0, 60)
        : undefined;
      return {
        currentName,
        ...(newName ? { newName } : {}),
        ...(u.topic ? { topic: String(u.topic).trim().slice(0, 200) } : {}),
        ...(u.category ? { category: String(u.category).trim().slice(0, 60) } : {}),
      };
    })
    .filter((u) => {
      if (!u.currentName || (!u.newName && !u.topic && !u.category)) return false;
      const key = u.currentName.toLowerCase();
      if (seenUpdates.has(key)) return false;
      seenUpdates.add(key);
      return true;
    });

  return {
    serverName,
    summary,
    serverDescription,
    accentColor,
    categoriesOrder,
    channels,
    channelUpdates,
    roles,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.post('/api/ai/server-assistant', async (req, res) => {
    req.setTimeout(MAX_REQUEST_TIMEOUT_MS);
    res.setTimeout(MAX_REQUEST_TIMEOUT_MS);

    let aborted = false;
    res.on('close', () => {
      if (!res.writableFinished) {
        aborted = true;
      }
    });

    try {
      const {
        mode,
        prompt,
        history = [],
        serverContext,
        images = [],
      } = req.body as {
        mode?: 'chat' | 'build';
        prompt?: string;
        history?: AssistantHistoryItem[];
        serverContext?: ServerContextPayload;
        images?: UploadedImagePayload[];
      };

      const cleanPrompt = typeof prompt === 'string' ? prompt.trim() : '';
      const hasImages = Array.isArray(images) && images.length > 0;
      if (!cleanPrompt && !hasImages) {
        res.status(400).json({ error: 'Escribe una instrucción o adjunta una imagen para la IA.' });
        return;
      }

      const ai = getGeminiClient();

      if (mode === 'chat') {
        const recentHistory = Array.isArray(history)
          ? history
              .slice(-8)
              .map((h) => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`)
              .join('\n')
          : '';

        const contextSummary = serverContext?.name
          ? `Servidor actual: "${serverContext.name}". Canales: ${
              (serverContext.existingChannels || [])
                .slice(0, 20)
                .map((c) => `#${c.name} (${c.type})`)
                .join(', ') || 'ninguno aún'
            }. Roles: ${
              (serverContext.existingRoles || []).slice(0, 12).map((r) => r.name).join(', ') ||
              'básicos'
            }.`
          : 'El usuario está evaluando crear un nuevo servidor desde cero.';

        const fullTextPrompt = [
          recentHistory ? `Historial reciente:\n${recentHistory}` : '',
          `Contexto: ${contextSummary}`,
          `Petición del usuario: ${cleanPrompt || 'Analiza las imágenes adjuntas y dime cómo aprovecharlas en mi servidor.'}`,
        ]
          .filter(Boolean)
          .join('\n\n');

        const response = await callWithRetry(() =>
          ai.models.generateContent({
            model: MODEL_NAME,
            contents: buildMultimodalContents(fullTextPrompt, images),
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              systemInstruction:
                'Eres Primordial Architect AI, una IA profesional, rápida y creativa experta en comunidades y servidores tipo Discord. En modo CHAT (gratis): responde en español natural, directo y bien estructurado. Si hay imágenes adjuntas, analízalas con precisión (diseño, temática, colores, texto o estructura) para responder o inspirar el servidor. Si el usuario pide prompts, reglas, bienvenidas o anuncios, entrégalos listos para copiar. Si aplica construir algo, sugiere en "suggestedBuildPrompt" una instrucción corta lista para Construir.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: {
                    type: Type.STRING,
                    description: 'Respuesta clara, útil y directa en español.',
                  },
                  suggestedBuildPrompt: {
                    type: Type.STRING,
                    description:
                      'Opcional: instrucción directa lista para usar en modo Construir.',
                  },
                },
                required: ['reply'],
              },
            },
          })
        );

        if (aborted) return;

        const rawText = (response.text ?? '').trim();
        const parsed = extractAndParseJson<{ reply?: string; suggestedBuildPrompt?: string }>(
          rawText
        );

        const finalReply = parsed?.reply?.trim() || rawText;
        if (!finalReply) {
          res.status(502).json({
            error: 'La IA no devolvió contenido en esta respuesta. Inténtalo nuevamente.',
          });
          return;
        }

        res.json({
          mode: 'chat',
          reply: finalReply,
          suggestedBuildPrompt: parsed?.suggestedBuildPrompt?.trim() || undefined,
        });
        return;
      }

      // Build mode: fast low-latency thinking + strict structured schema
      const existingChList = (serverContext?.existingChannels || [])
        .slice(0, 30)
        .map((c) => `${c.category} > ${c.name} (${c.type})`)
        .join('; ');
      const existingRoleList = (serverContext?.existingRoles || [])
        .slice(0, 15)
        .map((r) => r.name)
        .join(', ');

      const buildTextPrompt = [
        `Servidor objetivo: "${serverContext?.name || 'Nuevo Servidor'}".`,
        serverContext?.description ? `Descripción actual: ${serverContext.description}` : '',
        existingChList
          ? `Canales ya existentes (NO repitas nombres exactos): ${existingChList}`
          : 'El servidor es nuevo o está vacío.',
        existingRoleList ? `Roles existentes: ${existingRoleList}` : '',
        `Solicitud del usuario: ${cleanPrompt || 'Usa las imágenes adjuntas como inspiración visual y estructural para construir el servidor completo.'}`,
      ]
        .filter(Boolean)
        .join('\n');

      const buildResponse = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: buildMultimodalContents(buildTextPrompt, images),
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'Eres Primordial Architect AI, IA arquitecta senior de servidores. En modo CONSTRUIR diseña rápido en español: puedes crear canales nuevos en "channels" Y/O modificar canales ya existentes en "channelUpdates" (por ejemplo agregar emojis acorde al nombre o tema de cada canal ya creado, renombrarlos, cambiar topic o categoría). Si el usuario pide modificar canales existentes (p. ej. poner emojis a los canales ya hechos), usa "channelUpdates" con "currentName" exacto de los canales existentes y "newName" con su emoji (ej: "💬-general" o "💬│general" o "🔊 Chat de voz"), y deja "channels" vacío si no pidió canales nuevos. Para canales nuevos usa 3-5 categorías, 6-12 canales ("announcement", "text", "voice"), "starterMessage" bien redactado, y 3-5 roles con colores hex y permisos EXACTOS de: "Administrador", "Gestionar canales", "Gestionar roles", "Gestionar mensajes", "Expulsar miembros", "Fijar mensajes", "Enviar mensajes", "Leer canales", "Conectar a voz".',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                serverName: { type: Type.STRING },
                summary: { type: Type.STRING },
                serverDescription: { type: Type.STRING },
                accentColor: { type: Type.STRING },
                categoriesOrder: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                channels: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ['text', 'voice', 'announcement'] },
                      category: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      isPrivate: { type: Type.BOOLEAN },
                      starterMessage: { type: Type.STRING },
                    },
                    required: ['name', 'type', 'category', 'topic'],
                  },
                },
                channelUpdates: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      currentName: { type: Type.STRING },
                      newName: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      category: { type: Type.STRING },
                    },
                    required: ['currentName', 'newName'],
                  },
                },
                roles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      color: { type: Type.STRING },
                      hoist: { type: Type.BOOLEAN },
                      permissions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['name', 'color', 'permissions'],
                  },
                },
              },
              required: [
                'summary',
                'serverDescription',
                'accentColor',
                'categoriesOrder',
                'channels',
                'roles',
              ],
            },
          },
        })
      );

      if (aborted) return;

      const rawBuild = (buildResponse.text ?? '').trim();
      const rawPlan = extractAndParseJson<RawBuildPlan>(rawBuild);
      if (!rawPlan) {
        res.status(502).json({
          error:
            'No se pudo interpretar la arquitectura generada por la IA. Inténtalo de nuevo (no se gastaron créditos).',
        });
        return;
      }

      const sanitizedPlan = sanitizeBuildPlan(
        rawPlan,
        serverContext?.name || 'Nuevo Servidor IA'
      );

      if (sanitizedPlan.channels.length === 0 && sanitizedPlan.channelUpdates.length === 0) {
        res.status(502).json({
          error:
            'La IA no generó canales válidos para aplicar. Intenta describir con más detalle lo que necesitas (no se gastaron créditos).',
        });
        return;
      }

      res.json({ mode: 'build', plan: sanitizedPlan });
    } catch (err: unknown) {
      if (aborted) return;
      console.error('AI Server Assistant error:', err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Primordial server running on http://0.0.0.0:${PORT}`);
  });
  httpServer.requestTimeout = MAX_REQUEST_TIMEOUT_MS;
  httpServer.headersTimeout = MAX_REQUEST_TIMEOUT_MS + 15000;
  httpServer.keepAliveTimeout = 65000;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
