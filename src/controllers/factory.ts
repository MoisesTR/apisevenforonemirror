import catchAsync from '../utils/catchAsync';
import AppError from '../classes/AppError';
import * as mongoose from 'mongoose';
import {Document, QueryPopulateOptions} from 'mongoose';
import APIFeatures from '../utils/APIFeatures';

export const deleteOne = <T extends Document>(Model: mongoose.Model<T>) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

export const updateOne = <T extends Document>(Model: mongoose.Model<T>) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

export const createOne = <T extends Document>(Model: mongoose.Model<T>) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

export const getOne = <T extends Document>(Model: mongoose.Model<T>, popOptions: QueryPopulateOptions | QueryPopulateOptions[]) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) {
            query = query.populate(popOptions);
        }
        const doc = await query;
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

export const getAll = <T extends Document>(Model: mongoose.Model<T>) =>
    catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews on tour (hack)
        let filter = {};
        if (req.params.tourId) {
            filter = {tour: req.params.tourId};
        }

        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const doc = await features.query;

        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc,
            },
        });
    });
