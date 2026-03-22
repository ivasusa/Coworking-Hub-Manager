import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Busboy from 'busboy';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png'];
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseUpload(destDir: string, fieldName: string, maxFiles = 1) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return next();
    }

    ensureDir(destDir);

    let bb: ReturnType<typeof Busboy>;
    try {
      bb = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
    } catch (err) {
      return next(err);
    }

    const savedFiles: Express.Multer.File[] = [];
    let fileCount = 0;
    let pendingWrites = 0;
    let bbFinished = false;
    let done = false;

    function tryFinish() {
      if (done) return;
      if (bbFinished && pendingWrites === 0) {
        done = true;
        console.log(`[upload] calling next(), req.file=${JSON.stringify((req as any).file?.filename)}`);
        if (savedFiles.length === 1) (req as any).file = savedFiles[0];
        if (savedFiles.length > 1) (req as any).files = savedFiles;
        next();
      }
    }

    bb.on('file', (name, stream, info) => {
      console.log(`[upload] file event: name=${name}, expected=${fieldName}, filename=${info.filename}`);
      if (name !== fieldName || fileCount >= maxFiles) {
        stream.resume();
        return;
      }

      const ext = path.extname(info.filename).toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        stream.resume();
        done = true;
        return next(new Error('Only JPG/PNG files are allowed'));
      }

      fileCount++;
      pendingWrites++;
      const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      const filepath = path.join(destDir, filename);
      const writeStream = fs.createWriteStream(filepath);

      stream.pipe(writeStream);

      writeStream.on('error', (err) => {
        pendingWrites--;
        if (!done) { done = true; next(err); }
      });
      writeStream.on('finish', () => {
        savedFiles.push({
          fieldname: name,
          originalname: info.filename,
          encoding: info.encoding,
          mimetype: info.mimeType,
          destination: destDir,
          filename,
          path: filepath,
          size: writeStream.bytesWritten,
          buffer: Buffer.alloc(0),
          stream: stream as any,
        });
        pendingWrites--;
        tryFinish();
      });
    });

    bb.on('field', (name, value) => {
      if (!req.body) req.body = {};
      req.body[name] = value;
    });

    bb.on('finish', () => {
      console.log(`[upload] busboy finish, pendingWrites=${pendingWrites}, savedFiles=${savedFiles.length}`);
      bbFinished = true;
      tryFinish();
    });

    bb.on('error', (err) => {
      if (!done) { done = true; next(err); }
    });

    req.pipe(bb);
  };
}

export const uploadProfile = {
  single: (field: string) => parseUpload(path.join(UPLOADS_ROOT, 'profiles'), field, 1),
};

export const uploadSpaceImages = {
  array: (field: string, maxCount: number) => parseUpload(path.join(UPLOADS_ROOT, 'spaces'), field, maxCount),
};
