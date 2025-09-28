// backend/src/types/express.d.ts

import * as express from 'express';
import { Multer } from 'multer';

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        /** The name of the form field associated with this file. */
        fieldname: string;
        /** The original filename of the user's file. */
        originalname: string;
        /** The path to the uploaded file. */
        path: string;
        /** The filename of the uploaded file. */
        filename: string;
        /** The size of the file in bytes. */
        size: number;
        /** The mimetype of the file. */
        mimetype: string;
        /** The buffer content of the file. */
        buffer: Buffer;
      }
    }
  }
}