import express from 'express';
import multer from 'multer';
import AppError from '../classes/AppError';

const multerStorage = multer.memoryStorage();

const multerFilter = (req: express.Request, file: any, cb: any) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('No es una imagen, por favor sube solo imagenes!', 400), false);
        // cb(new AppError('Not an image! Please upload only images!', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

export {upload};
