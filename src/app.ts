import dotenv    from 'dotenv';
import path from 'path';
dotenv.config({path: path.resolve(__dirname,'..','.env')});
import Server  from './server';
const server = Server.instance;
const app = server.app;
console.log(path.resolve(__dirname,'..','.env'))

server.basicMiddlewares();
// server.app.use()


server.dbCore.connect(server.logger,() => {
        server.start((port: number) => {

                server.logger.info(`The API is already running, on the ${port}`, {port});
        })
})
// app.locals.baseDir = path.resolve(__dirname,'..');
// app.express = express;
//         .then('services/jwt.ts')
//         .then('libs/middlewares.js')
//         .then('libs/routes.js')
//         .then('libs/paypalClient.js')
//         .then('libs/error-middlewares.js')
//         .then('libs/boot.js')
//         .into(app);
