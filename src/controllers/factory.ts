import catchAsync from '../utils/catchAsync';
import AppError from '../classes/AppError';
import * as mongoose from 'mongoose';
import {Document, QueryPopulateOptions} from 'mongoose';
import APIFeatures from '../utils/APIFeatures';
import {matchedData} from 'express-validator/filter';

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

export const createOne = <T extends Document>(Model: mongoose.Model<T>, express?: boolean) =>
    catchAsync(async (req, res, next) => {
        if (express) {
            req.body = matchedData(req, {locations: ['body']});
        }
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        });
    });

export const getOne = <T extends Document>(
    Model: mongoose.Model<T>,
    popOptions?: QueryPopulateOptions | QueryPopulateOptions[],
    projection?: any,
) =>
    catchAsync(async (req, res, next) => {
        if (req.params.userId) {
            req.params.id = req.params.userId;
        }
        let query = Model.findById(req.params.id, projection);
        if (popOptions) {
            query = query.populate(popOptions);
        }

        const doc = await query;
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json(doc);
        // Decide if is needed
        // res.status(200).json({
        //     status: 'success',
        //     data: doc,
        // });
    });

export const getAll = <T extends Document>(Model: mongoose.Model<T>, long?: boolean) =>
    catchAsync(async (req, res, next) => {
        // To allow role population (hack)
        let populateRole = false;

        console.log('query', req.query);
        const filter = {};
        if (req.query.populateRole) {
            if (req.query.populateRole === 'true') populateRole = true;
            delete req.query.populateRole;
        }

        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        if (populateRole) features.query.populate('role');

        const doc = await features.query;
        if (!long) {
            return res.status(200).json(doc);
        }
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: {
                data: doc,
            },
        });
    });
