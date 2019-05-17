/**
 * Module dependencies.
 */
const http = require('http');
const debug = require('debug')('sevenforoneapi:server');
const mongoose = require('mongoose');

module.exports = app => {
    /**
     * Create HTTP Server
     */
    const server = http.createServer(app);

    const port = normalizePort(process.env.PORT || '3000');
    /**
     * Listen on provided port, on all network interfaces.
     */
    app.set('port', port);

    /**
     * Normalize a port into a number, string, or false.
     */
    function normalizePort(val) {
        let port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        } else if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */
    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        const bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
        const addr = server.address();
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    }
    server.on('error', onError);
    server.on('listening', onListening);
    server.on('close', () => console.log('closing'))

    console.log(app.config.database)
    mongoose.connect(app.config.database.mongoURI, {useNewUrlParser: true, useCreateIndex: true})
        .then((result) => {
            console.log('Mongo is Connected');

            app.utils.logger.info(`The API is already running, on the ${port}`)
            server.listen(port);
        })
        .catch((err) => {
            app.utils.logger.error('Cannot be established a connection with the MongoDb server!',{ metadata:{ boot: true}});
            process.exit();
        })
    process.on('SIGINT', () => {
        app.utils.logger.error('The signal has been interrupt!');
        mongoose.connection.close(() =>{
            app.utils.logger.info('Interrupt Signal, the mongo connection has been close!');
        })
    })
};
