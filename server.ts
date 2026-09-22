import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { ragPipeline } from './server/rag/pipeline.js';
import { EVALUATION_DATASET, RAGEvaluator } from './server/rag/evaluator.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize RAG knowledge base
  await ragPipeline.initialize();

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Knowledge Base Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    try {
      const stats = ragPipeline.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Chat / Query Endpoint
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { query, history = [], selectedProperty, role, mode, customSystemInstruction } = req.body;
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query parameter is required.' });
      }

      const response = await ragPipeline.query(
        query.trim(),
        history,
        selectedProperty,
        { role, mode, customSystemInstruction }
      );
      res.json(response);
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ error: err.message || 'Error executing RAG query' });
    }
  });

  // 4. Document Management Endpoints
  app.get('/api/documents', (req: Request, res: Response) => {
    try {
      const docs = ragPipeline.getDocuments();
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/documents/:id', (req: Request, res: Response) => {
    try {
      const doc = ragPipeline.getDocument(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/documents/:id/chunks', (req: Request, res: Response) => {
    try {
      const chunks = ragPipeline.getDocumentChunks(req.params.id);
      res.json(chunks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(
    '/api/documents/upload',
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file provided' });
        }

        const propertyName = req.body.property_name;
        const documentType = req.body.document_type;

        const docMeta = await ragPipeline.uploadDocument(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          { property_name: propertyName, document_type: documentType }
        );

        res.status(201).json(docMeta);
      } catch (err: any) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'Document ingestion failed' });
      }
    }
  );

  app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const success = await ragPipeline.deleteDocument(req.params.id);
      if (!success) return res.status(404).json({ error: 'Document not found' });
      res.json({ message: 'Document deleted successfully', id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/documents/:id/reindex', async (req: Request, res: Response) => {
    try {
      const result = await ragPipeline.reindexDocument(req.params.id);
      if (!result) return res.status(404).json({ error: 'Document not found' });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Evaluation Benchmark Suite Endpoints
  app.get('/api/evaluation/cases', (req: Request, res: Response) => {
    res.json(EVALUATION_DATASET);
  });

  app.post('/api/evaluation/run', async (req: Request, res: Response) => {
    try {
      const results = [];
      const startTime = Date.now();

      for (const testCase of EVALUATION_DATASET) {
        const ragRes = await ragPipeline.query(
          testCase.question,
          [],
          testCase.property_context
        );
        const evalResult = RAGEvaluator.evaluateCase(testCase, ragRes);
        results.push(evalResult);
      }

      const passedCount = results.filter((r) => r.passed).length;
      const totalCount = results.length;
      const passRate = (passedCount / totalCount) * 100;
      const avgLatencyMs = Math.round(
        results.reduce((acc, r) => acc + r.latency_ms, 0) / totalCount
      );

      res.json({
        summary: {
          totalTests: totalCount,
          passed: passedCount,
          failed: totalCount - passedCount,
          passRate: `${passRate.toFixed(1)}%`,
          avgLatencyMs,
          totalDurationMs: Date.now() - startTime,
        },
        results,
      });
    } catch (err: any) {
      console.error('Evaluation run error:', err);
      res.status(500).json({ error: err.message || 'Evaluation run failed' });
    }
  });

  // 6. User Feedback Endpoint (Helpful / Unhelpful)
  app.post('/api/feedback', (req: Request, res: Response) => {
    const { query, answer, feedback, messageId } = req.body;
    console.log(`[RAG Feedback] Msg: ${messageId} | Feedback: ${feedback} | Query: "${query}"`);
    res.json({ status: 'recorded' });
  });

  // Vite middleware for frontend serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Real Estate RAG Knowledge Assistant running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
