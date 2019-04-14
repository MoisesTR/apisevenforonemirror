const {Schema, model } = require('mongoose');
const fs    = require('fs');
const path  = require('path');
const basename = path.basename(__filename);

module.exports = app => {
    const db = {models:{}, model, Schema};

    const dir = path.join(__dirname, 'models');
    fs.readdirSync(dir)
        .filter(file => {
            return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
        })
        .forEach(filename => {
            const modelDir = path.join(dir, filename);
            const modelo = require(modelDir)(Schema, db.model);
            db.models[path.basename(filename, '.js')] = modelo;
        });
    //
    // db.models.Role.findAll()
    //     .then(roles => {
    //         if (roles.length() === 0)
    //             console.log('no hay roles')
    //     })

    return db;
};